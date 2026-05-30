import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get('range') ?? '30d';
  const now = new Date();

  let days: number;
  let bucketType: 'daily' | 'weekly' | 'monthly';

  switch (range) {
    case '7d':  days = 7;   bucketType = 'daily';   break;
    case '30d': days = 30;  bucketType = 'daily';   break;
    case '90d': days = 90;  bucketType = 'weekly';  break;
    case '6m':  days = 180; bucketType = 'monthly'; break;
    case '1y':  days = 365; bucketType = 'monthly'; break;
    default:    days = 30;  bucketType = 'daily';
  }

  const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const allOrders = await db
    .select({
      id: orders.id,
      total: orders.total,
      saleType: orders.saleType,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(gte(orders.createdAt, rangeStart));

  // Only count paid orders
  const paidOrders = allOrders.filter((o) =>
    ['confirmed', 'shipped', 'delivered'].includes(o.status),
  );

  type Bucket = { label: string; online: number; offline: number };
  const buckets: Bucket[] = [];

  if (bucketType === 'daily') {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      buckets.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        online: 0,
        offline: 0,
      });
    }
    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const daysAgo = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
      const idx = days - 1 - daysAgo;
      if (idx >= 0 && idx < buckets.length) {
        const bucket = buckets[idx];
        if (o.saleType === 'pos' || o.saleType === 'offline') {
          bucket.offline += Number(o.total);
        } else {
          bucket.online += Number(o.total);
        }
      }
    });
  } else if (bucketType === 'weekly') {
    const weeks = Math.ceil(days / 7);
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      buckets.push({
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        online: 0,
        offline: 0,
      });
    }
    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const daysAgo = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
      const weekIdx = buckets.length - 1 - Math.floor(daysAgo / 7);
      if (weekIdx >= 0 && weekIdx < buckets.length) {
        const bucket = buckets[weekIdx];
        if (o.saleType === 'pos' || o.saleType === 'offline') {
          bucket.offline += Number(o.total);
        } else {
          bucket.online += Number(o.total);
        }
      }
    });
  } else {
    // monthly
    const months = range === '1y' ? 12 : 6;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: months === 12 ? '2-digit' : undefined }),
        online: 0,
        offline: 0,
      });
    }
    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const monthsAgo =
        (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      const idx = buckets.length - 1 - monthsAgo;
      if (idx >= 0 && idx < buckets.length) {
        const bucket = buckets[idx];
        if (o.saleType === 'pos' || o.saleType === 'offline') {
          bucket.offline += Number(o.total);
        } else {
          bucket.online += Number(o.total);
        }
      }
    });
  }

  const totalOnline = buckets.reduce((s, b) => s + b.online, 0);
  const totalOffline = buckets.reduce((s, b) => s + b.offline, 0);

  return NextResponse.json({ data: buckets, totalOnline, totalOffline });
}
