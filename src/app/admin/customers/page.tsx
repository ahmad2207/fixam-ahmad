export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { profiles, orders, addresses } from '@/db/schema';
import { desc, inArray } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { Users, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';
import CustomersClient, { type CustomerRow } from './CustomersClient';

export default async function AdminCustomersPage() {
  const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));

  const userIds = allProfiles.map((p) => p.userId);

  const [allOrders, allAddresses] = userIds.length > 0
    ? await Promise.all([
        db
          .select({
            userId: orders.userId,
            id: orders.id,
            orderNumber: orders.orderNumber,
            total: orders.total,
            status: orders.status,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(inArray(orders.userId, userIds))
          .orderBy(desc(orders.createdAt)),
        db
          .select({ userId: addresses.userId, city: addresses.city, state: addresses.state })
          .from(addresses)
          .where(inArray(addresses.userId, userIds)),
      ])
    : [[], []];

  // Group orders by userId (already sorted desc by createdAt)
  const ordersByUser = new Map<string, typeof allOrders>();
  for (const o of allOrders) {
    if (!o.userId) continue;
    if (!ordersByUser.has(o.userId)) ordersByUser.set(o.userId, []);
    ordersByUser.get(o.userId)!.push(o);
  }

  // First address per userId
  const addressByUser = new Map<string, { city: string; state: string }>();
  for (const a of allAddresses) {
    if (a.userId && !addressByUser.has(a.userId)) {
      addressByUser.set(a.userId, { city: a.city, state: a.state });
    }
  }

  const customersWithStats: CustomerRow[] = allProfiles.map((profile) => {
    const userOrders = ordersByUser.get(profile.userId) ?? [];
    const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const addr = addressByUser.get(profile.userId) ?? null;
    return {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      totalOrders: userOrders.length,
      totalSpent,
      createdAt: profile.createdAt,
      primaryAddress: addr,
      recentOrders: userOrders.slice(0, 8).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  });

  const stats = {
    total: customersWithStats.length,
    active: customersWithStats.filter((c) => c.totalOrders > 0).length,
    totalRevenue: customersWithStats.reduce((s, c) => s + c.totalSpent, 0),
    avgOrder:
      customersWithStats.reduce((s, c) => s + c.totalOrders, 0) > 0
        ? customersWithStats.reduce((s, c) => s + c.totalSpent, 0) /
          customersWithStats.reduce((s, c) => s + c.totalOrders, 0)
        : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{stats.total} registered customers</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers',  value: stats.total,                        icon: Users,       color: 'bg-primary/10 text-primary',      border: 'border-primary/15' },
          { label: 'Active Customers', value: stats.active,                       icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600',  border: 'border-emerald-100' },
          { label: 'Total Revenue',    value: formatCurrency(stats.totalRevenue), icon: TrendingUp,  color: 'bg-amber-50 text-amber-600',      border: 'border-amber-100' },
          { label: 'Avg Order Value',  value: formatCurrency(stats.avgOrder),     icon: DollarSign,  color: 'bg-blue-50 text-blue-600',        border: 'border-blue-100' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-card rounded-2xl p-5 border shadow-sm ${border}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <CustomersClient customers={customersWithStats} />
    </div>
  );
}
