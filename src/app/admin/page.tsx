export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { orders, orderItems, users, products, inventoryBatches, stockReservations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { DashboardChartsClient } from '@/components/admin/DashboardChartsClient';
import { CreditCard, PiggyBank, Clock, Wallet, ShoppingCart, Package, Users, Warehouse, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const paidOrders = allOrders.filter((o) =>
    ['confirmed', 'shipped', 'delivered'].includes(o.status),
  );
  const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');
  const inTransitOrders = allOrders.filter((o) =>
    ['confirmed', 'shipped'].includes(o.status),
  );
  const offlineOrders = allOrders.filter(
    (o) => o.saleType === 'pos' || o.saleType === 'offline',
  );

  const totalSales = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalSettled = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOwed = inTransitOrders.reduce((s, o) => s + Number(o.total), 0);
  const offlineSales = offlineOrders.reduce((s, o) => s + Number(o.total), 0);

  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const paidItems = allItems.filter((i) => paidOrderIds.has(i.orderId));
  let estimatedCOGS = 0;
  for (const item of paidItems) {
    if (item.productId) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) estimatedCOGS += Number(product.costPrice) * item.quantity;
    }
  }
  const grossProfit = totalSales - estimatedCOGS;
  const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  const productsSold = paidItems.reduce((s, i) => s + i.quantity, 0);
  const newCustomers = allUsers.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;
  const inventoryValue = allBatches.reduce(
    (s, b) => s + Number(b.costPrice) * b.quantityAvailable,
    0,
  );

  const lowStockProducts = allProducts.filter((p) => p.stock < 10).slice(0, 5);
  const recentOrders = allOrders.slice(0, 5);

  const activeReservations = activeReservationRows.map((r) => ({
    id: r.id,
    productName: r.productName ?? 'Unknown product',
    quantity: r.quantity,
    expiresAt: r.expiresAt.toISOString(),
  }));

  const primaryKpis = [
    {
      label: 'Total Sales',
      value: formatCurrency(totalSales),
      sub: `${paidOrders.length} orders`,
      subColor: 'text-muted-foreground',
      icon: Wallet,
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      label: 'Total Settled',
      value: formatCurrency(totalSettled),
      sub: 'Delivered & paid',
      subColor: 'text-success font-medium',
      icon: CreditCard,
      iconBg: 'bg-success/10 text-success',
    },
    {
      label: 'Gross Profit',
      value: formatCurrency(grossProfit),
      sub: `${profitMargin.toFixed(1)}% margin`,
      subColor: profitMargin >= 20 ? 'text-success font-semibold' : 'text-warning font-semibold',
      icon: PiggyBank,
      iconBg: 'bg-success/10 text-success',
    },
    {
      label: 'Total Owed',
      value: formatCurrency(totalOwed),
      sub: 'Outstanding',
      subColor: 'text-warning font-medium',
      icon: Clock,
      iconBg: 'bg-warning/10 text-warning',
    },
  ];

  const miniMetrics = [
    { label: 'Total Orders', value: allOrders.length.toLocaleString(), href: '/admin/orders', icon: ShoppingCart, iconColor: 'text-primary' },
    { label: 'Products Sold', value: productsSold.toLocaleString(), href: '/admin/orders', icon: Package, iconColor: 'text-primary' },
    { label: 'New Customers (30d)', value: newCustomers.toLocaleString(), href: '/admin/customers', icon: Users, iconColor: 'text-warning' },
    { label: 'Inventory Value', value: formatCurrency(inventoryValue), href: '/admin/inventory', icon: Warehouse, iconColor: 'text-muted-foreground' },
    { label: 'Offline Sales', value: formatCurrency(offlineSales), href: '/admin/orders', icon: Store, iconColor: 'text-muted-foreground' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Admin</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className={cn('text-xs', kpi.subColor)}>{kpi.sub}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', kpi.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {miniMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className="bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className={cn('h-4 w-4', m.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{m.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="mb-8">
        <DashboardChartsClient
          totalRevenue={totalSales}
          estimatedCOGS={estimatedCOGS}
          grossProfit={grossProfit}
          activeReservations={activeReservations}
        />
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-card mb-6 border border-destructive/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <h2 className="font-semibold text-foreground">Low Stock Alerts</h2>
            </div>
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1">
                <Link
                  href={`/admin/inventory/${p.id}`}
                  className="font-medium hover:text-primary truncate max-w-[60%]"
                >
                  {p.name}
                </Link>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.stock === 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary hover:underline font-mono"
                      >
                        {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {order.shippingFullName || order.guestEmail || '—'}
                    </td>
                    <td className="py-2 font-medium text-foreground">{formatCurrency(Number(order.total))}</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'delivered'  ? 'bg-success/10 text-success' :
                        order.status === 'confirmed'  ? 'bg-blue-100 text-blue-700' :
                        order.status === 'shipped'    ? 'bg-indigo-100 text-indigo-700' :
                        order.status === 'cancelled'  ? 'bg-destructive/10 text-destructive' :
                        'bg-secondary text-secondary-foreground'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground capitalize">{order.saleType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
