export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { profiles, orders, addresses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { Users, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';
import CustomersClient, { type CustomerRow } from './CustomersClient';

export default async function AdminCustomersPage() {
  const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));

  const customersWithStats: CustomerRow[] = await Promise.all(
    allProfiles.map(async (profile) => {
      const [orderData, addrData] = await Promise.all([
        db
          .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, status: orders.status, createdAt: orders.createdAt })
          .from(orders)
          .where(eq(orders.userId, profile.userId))
          .orderBy(desc(orders.createdAt)),
        db.select().from(addresses).where(eq(addresses.userId, profile.userId)).limit(1),
      ]);
      const totalOrders = orderData.length;
      const totalSpent = orderData.reduce((sum, o) => sum + Number(o.total), 0);
      return {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        totalOrders,
        totalSpent,
        createdAt: profile.createdAt,
        primaryAddress: addrData[0] ? { city: addrData[0].city, state: addrData[0].state } : null,
        recentOrders: orderData.slice(0, 8).map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
        })),
      };
    })
  );

  const stats = {
    total: customersWithStats.length,
    active: customersWithStats.filter((c) => c.totalOrders > 0).length,
    totalRevenue: customersWithStats.reduce((s, c) => s + c.totalSpent, 0),
    avgOrder: customersWithStats.reduce((s, c) => s + c.totalOrders, 0) > 0
      ? customersWithStats.reduce((s, c) => s + c.totalSpent, 0) / customersWithStats.reduce((s, c) => s + c.totalOrders, 0)
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
