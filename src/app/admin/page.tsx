export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { orders, orderItems, users, products, inventoryBatches, stockReservations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { DashboardChartsClient } from '@/components/admin/DashboardChartsClient';
import {
  CreditCard, PiggyBank, Clock, Wallet, ShoppingCart,
  Package, Users, Warehouse, Store, TrendingUp, AlertTriangle,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  delivered:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  confirmed:  'bg-blue-50 text-blue-700 border border-blue-200',
  shipped:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
  cancelled:  'bg-red-50 text-red-700 border border-red-200',
  pending:    'bg-amber-50 text-amber-700 border border-amber-200',
};

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [allOrders, allItems, allUsers, allProducts, allBatches, activeReservationRows] =
    await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems),
      db.select({ id: users.id, createdAt: users.createdAt }).from(users),
      db.select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        imageUrl: products.imageUrl,
        costPrice: products.costPrice,
      }).from(products),
      db.select({
        quantityAvailable: inventoryBatches.quantityAvailable,
        costPrice: inventoryBatches.costPrice,
      }).from(inventoryBatches),
      db
        .select({
          id: stockReservations.id,
          productId: stockReservations.productId,
          quantity: stockReservations.quantity,
          expiresAt: stockReservations.expiresAt,
          productName: products.name,
        })
        .from(stockReservations)
        .leftJoin(products, eq(stockReservations.productId, products.id))
        .where(eq(stockReservations.status, 'active')),
    ]);

  // ── KPI calculations ──────────────────────────────────────────
  const paidOrders       = allOrders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status));
  const deliveredOrders  = allOrders.filter((o) => o.status === 'delivered');
  const inTransitOrders  = allOrders.filter((o) => ['confirmed', 'shipped'].includes(o.status));
  const offlineOrders    = allOrders.filter((o) => o.saleType === 'pos' || o.saleType === 'offline');
  const pendingOrders    = allOrders.filter((o) => o.status === 'pending');

  const totalSales   = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalSettled = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOwed    = inTransitOrders.reduce((s, o) => s + Number(o.total), 0);
  const offlineSales = offlineOrders.reduce((s, o) => s + Number(o.total), 0);

  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const paidItems    = allItems.filter((i) => paidOrderIds.has(i.orderId));
  let estimatedCOGS  = 0;
  for (const item of paidItems) {
    if (item.productId) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) estimatedCOGS += Number(product.costPrice) * item.quantity;
    }
  }
  const grossProfit  = totalSales - estimatedCOGS;
  const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  const productsSold    = paidItems.reduce((s, i) => s + i.quantity, 0);
  const newCustomers    = allUsers.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;
  const inventoryValue  = allBatches.reduce((s, b) => s + Number(b.costPrice) * b.quantityAvailable, 0);
  const lowStockProducts = allProducts.filter((p) => p.stock < 10).slice(0, 5);
  const recentOrders    = allOrders.slice(0, 5);

  const activeReservations = activeReservationRows.map((r) => ({
    id: r.id,
    productName: r.productName ?? 'Unknown product',
    quantity: r.quantity,
    expiresAt: r.expiresAt.toISOString(),
  }));

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your store today.</p>
        </div>
        <Link
          href="/admin/analytics"
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
        >
          <TrendingUp className="h-4 w-4" />
          Analytics
        </Link>
      </div>

      {/* ── Primary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Sales',
            value: formatCurrency(totalSales),
            sub: `${paidOrders.length} paid orders`,
            icon: Wallet,
            accent: 'bg-primary/10 text-primary',
            border: 'border-primary/15',
          },
          {
            label: 'Total Settled',
            value: formatCurrency(totalSettled),
            sub: `${deliveredOrders.length} delivered`,
            icon: CreditCard,
            accent: 'bg-emerald-50 text-emerald-600',
            border: 'border-emerald-100',
          },
          {
            label: 'Gross Profit',
            value: formatCurrency(grossProfit),
            sub: `${profitMargin.toFixed(1)}% margin`,
            icon: PiggyBank,
            accent: profitMargin >= 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
            border: profitMargin >= 20 ? 'border-emerald-100' : 'border-amber-100',
          },
          {
            label: 'Total Owed',
            value: formatCurrency(totalOwed),
            sub: `${inTransitOrders.length} in transit`,
            icon: Clock,
            accent: 'bg-amber-50 text-amber-600',
            border: 'border-amber-100',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={cn('bg-card rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow', kpi.border)}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{kpi.label}</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground leading-none">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', kpi.accent)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mini Metric Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Orders',      value: allOrders.length.toLocaleString(),   href: '/admin/orders',    icon: ShoppingCart, color: 'text-primary bg-primary/10' },
          { label: 'Products Sold',     value: productsSold.toLocaleString(),        href: '/admin/orders',    icon: Package,      color: 'text-primary bg-primary/10' },
          { label: 'New Customers',     value: `${newCustomers} / 30d`,              href: '/admin/customers', icon: Users,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Inventory Value',   value: formatCurrency(inventoryValue),       href: '/admin/inventory', icon: Warehouse,    color: 'text-slate-600 bg-slate-100' },
          { label: 'Offline Sales',     value: formatCurrency(offlineSales),         href: '/admin/orders',    icon: Store,        color: 'text-slate-600 bg-slate-100' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className="group bg-card rounded-xl p-4 border border-border hover:border-primary/30 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', m.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted-foreground truncate">{m.label}</p>
                <p className="text-base font-bold text-foreground leading-tight truncate">{m.value}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <DashboardChartsClient
        totalRevenue={totalSales}
        estimatedCOGS={estimatedCOGS}
        grossProfit={grossProfit}
        activeReservations={activeReservations}
      />

      {/* ── Bottom Row: Low Stock + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-card rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Low Stock</h2>
                  <p className="text-[11px] text-muted-foreground">{lowStockProducts.length} products need restocking</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <Link
                    href={`/admin/inventory/${p.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[55%]"
                  >
                    {p.name}
                  </Link>
                  <span className={cn(
                    'text-[11px] font-semibold px-2.5 py-1 rounded-full',
                    p.stock === 0
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200',
                  )}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/30">
              <Link href="/admin/inventory" className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                View all inventory <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className={cn(
          'bg-card rounded-2xl border border-border shadow-sm overflow-hidden',
          lowStockProducts.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3',
        )}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
                <p className="text-[11px] text-muted-foreground">Last {recentOrders.length} orders</p>
              </div>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Customer</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm font-semibold text-primary hover:underline font-mono"
                        >
                          {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-foreground font-medium truncate max-w-[120px] block">
                          {order.shippingFullName || order.guestEmail || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(Number(order.total))}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={cn(
                          'inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize',
                          STATUS_STYLES[order.status] ?? 'bg-secondary text-secondary-foreground border border-border',
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground capitalize">{order.saleType}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Product',    href: '/admin/products/new',   icon: Package,      color: 'bg-primary/10 text-primary' },
          { label: 'View Orders',    href: '/admin/orders',          icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: 'Manage Stock',   href: '/admin/inventory',       icon: Warehouse,    color: 'bg-amber-50 text-amber-600' },
          { label: 'Customers',      href: '/admin/customers',       icon: Users,        color: 'bg-emerald-50 text-emerald-600' },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', a.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">{a.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary ml-auto transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
