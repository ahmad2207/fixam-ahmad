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
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>

      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active (have orders)</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Order Value</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.avgOrder)}</p>
          </div>
        </div>
      </div>

      <CustomersClient customers={customersWithStats} />
    </div>
  );
}
