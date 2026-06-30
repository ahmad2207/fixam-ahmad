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
  ArrowRight, ChevronRight, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  delivered: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  confirmed: { pill: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  shipped:   { pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
  cancelled: { pill: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500' },
  pending:   { pill: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500' },
};

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [allOrders, allItems, allUsers, allProducts, allBatches, activeReservationRows] =
    await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems),
      db.select({ id: users.id, createdAt: users.createdAt }).from(users),
      db.select({ id: products.id, name: products.name, stock: products.stock, imageUrl: products.imageUrl, costPrice: products.costPrice }).from(products),
      db.select({ quantityAvailable: inventoryBatches.quantityAvailable, costPrice: inventoryBatches.costPrice }).from(inventoryBatches),
      db
        .select({ id: stockReservations.id, productId: stockReservations.productId, quantity: stockReservations.quantity, expiresAt: stockReservations.expiresAt, productName: products.name })
        .from(stockReservations)
        .leftJoin(products, eq(stockReservations.productId, products.id))
        .where(eq(stockReservations.status, 'active')),
    ]);

  const paidOrders      = allOrders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status));
  const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');
  const inTransitOrders = allOrders.filter((o) => ['confirmed', 'shipped'].includes(o.status));
  const offlineOrders   = allOrders.filter((o) => o.saleType === 'pos' || o.saleType === 'offline');
  const pendingOrders   = allOrders.filter((o) => o.status === 'pending');

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
  const grossProfit   = totalSales - estimatedCOGS;
  const profitMargin  = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const productsSold  = paidItems.reduce((s, i) => s + i.quantity, 0);
  const newCustomers  = allUsers.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;
  const inventoryValue = allBatches.reduce((s, b) => s + Number(b.costPrice) * b.quantityAvailable, 0);
  const lowStockProducts = allProducts.filter((p) => p.stock < 10).slice(0, 5);
  const recentOrders  = allOrders.slice(0, 6);

  const activeReservations = activeReservationRows.map((r) => ({
    id: r.id,
    productName: r.productName ?? 'Unknown product',
    quantity: r.quantity,
    expiresAt: r.expiresAt.toISOString(),
  }));

  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Link
          href="/admin/analytics"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition shadow-sm"
        >
          <BarChart3 className="h-4 w-4" /> Analytics
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
            accentBg: 'bg-primary/10',
            accentText: 'text-primary',
            border: 'border-l-4 border-l-primary',
          },
          {
            label: 'Total Settled',
            value: formatCurrency(totalSettled),
            sub: `${deliveredOrders.length} delivered`,
            icon: CreditCard,
            accentBg: 'bg-emerald-50',
            accentText: 'text-emerald-600',
            border: 'border-l-4 border-l-emerald-500',
          },
          {
            label: 'Gross Profit',
            value: formatCurrency(grossProfit),
            sub: `${profitMargin.toFixed(1)}% margin`,
            icon: PiggyBank,
            accentBg: profitMargin >= 20 ? 'bg-emerald-50' : 'bg-amber-50',
            accentText: profitMargin >= 20 ? 'text-emerald-600' : 'text-amber-600',
            border: profitMargin >= 20 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-400',
          },
          {
            label: 'Amount Owed',
            value: formatCurrency(totalOwed),
            sub: `${inTransitOrders.length} in transit`,
            icon: Clock,
            accentBg: 'bg-amber-50',
            accentText: 'text-amber-600',
            border: 'border-l-4 border-l-amber-400',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={cn('bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow', kpi.border)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{kpi.label}</p>
                  <p className="text-2xl font-black text-foreground leading-none">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{kpi.sub}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', kpi.accentBg)}>
                  <Icon className={cn('h-5 w-5', kpi.accentText)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Secondary Metrics Row ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-border">
          {[
            { label: 'Total Orders',    value: allOrders.length.toLocaleString(),  href: '/admin/orders',    icon: ShoppingCart, color: 'text-primary',      bg: 'bg-primary/10' },
            { label: 'Products Sold',   value: productsSold.toLocaleString(),       href: '/admin/orders',    icon: Package,      color: 'text-violet-600',   bg: 'bg-violet-50' },
            { label: 'New Customers',   value: `${newCustomers}`,                   href: '/admin/customers', icon: Users,        color: 'text-blue-600',     bg: 'bg-blue-50', sub: 'last 30 days' },
            { label: 'Inventory Value', value: formatCurrency(inventoryValue),      href: '/admin/inventory', icon: Warehouse,    color: 'text-emerald-600',  bg: 'bg-emerald-50' },
            { label: 'Offline Sales',   value: formatCurrency(offlineSales),        href: '/admin/orders',    icon: Store,        color: 'text-amber-600',    bg: 'bg-amber-50' },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href} className="group flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', m.bg)}>
                  <Icon className={cn('h-4 w-4', m.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{m.label}</p>
                  <p className="text-base font-black text-foreground leading-tight">{m.value}</p>
                  {(m as any).sub && <p className="text-[10px] text-muted-foreground">{(m as any).sub}</p>}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary ml-auto flex-shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Charts ── */}
      <DashboardChartsClient
        totalRevenue={totalSales}
        estimatedCOGS={estimatedCOGS}
        grossProfit={grossProfit}
        activeReservations={activeReservations}
      />

      {/* ── Bottom Row: Recent Orders + Low Stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders */}
        <div className={cn('bg-card rounded-2xl border border-border shadow-sm overflow-hidden', lowStockProducts.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Latest {recentOrders.length} transactions</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-3">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Customer</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const style = STATUS_STYLES[order.status] ?? { pill: 'bg-secondary text-muted-foreground border-border', dot: 'bg-gray-400' };
                    return (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold text-primary hover:underline font-mono">
                            {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8).toUpperCase()}`}
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
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize', style.pill)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 hidden md:table-cell">
                          <span className="text-xs font-medium text-muted-foreground capitalize bg-muted/60 px-2 py-0.5 rounded-md">{order.saleType}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-card rounded-2xl border border-red-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Stock Alerts</h2>
                <p className="text-[11px] text-muted-foreground">{lowStockProducts.length} need restocking</p>
              </div>
            </div>
            <div className="divide-y divide-border flex-1">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                  <Link href={`/admin/inventory/${p.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[55%]">
                    {p.name}
                  </Link>
                  <span className={cn(
                    'text-[11px] font-bold px-2.5 py-1 rounded-full border',
                    p.stock === 0
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200',
                  )}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link href="/admin/inventory" className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                View inventory <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Product',  href: '/admin/products/new', icon: Package,      color: 'bg-primary/10 text-primary' },
            { label: 'View Orders',  href: '/admin/orders',        icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
            { label: 'Manage Stock', href: '/admin/inventory',     icon: Warehouse,    color: 'bg-amber-50 text-amber-600' },
            { label: 'Customers',    href: '/admin/customers',     icon: Users,        color: 'bg-emerald-50 text-emerald-600' },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href}
                className="group flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-primary/40 hover:shadow-sm transition-all">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', a.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-foreground flex-1">{a.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
