import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, users, products, categories } from '@/db/schema';
import { eq, and, gte, lt, desc, count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const range = searchParams.get('range') ?? '30d';
  const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '6m' ? 180 : range === '1y' ? 365 : 30;

  const now = new Date();
  const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const priorStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [allOrders, priorOrders, allOrdersForOffline, allItems, allUsers, allProducts, allCategories] = await Promise.all([
    db.select().from(orders).where(gte(orders.createdAt, rangeStart)).orderBy(desc(orders.createdAt)),
    db.select({
      id: orders.id,
      total: orders.total,
      status: orders.status,
      userId: orders.userId,
      createdAt: orders.createdAt,
    }).from(orders).where(and(gte(orders.createdAt, priorStart), lt(orders.createdAt, rangeStart))),
    db.select({
      id: orders.id,
      total: orders.total,
      saleType: orders.saleType,
      createdAt: orders.createdAt,
    }).from(orders).where(gte(orders.createdAt, sixMonthsAgo)),
    db.select().from(orderItems),
    db.select().from(users),
    db.select().from(products),
    db.select().from(categories),
  ]);

  // Revenue from all paid orders (confirmed, shipped, delivered)
  const paidOrders = allOrders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status));
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = allOrders.length;
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;

  // New customers in range
  const newCustomers = allUsers.filter((u) => new Date(u.createdAt) >= rangeStart).length;

  // Prior period metrics for % comparisons
  const priorPaidOrders = priorOrders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status));
  const priorRevenue = priorPaidOrders.reduce((s, o) => s + Number(o.total), 0);
  const priorTotalOrders = priorOrders.length;
  const priorAvgOrderValue = priorPaidOrders.length > 0 ? priorRevenue / priorPaidOrders.length : 0;
  const priorNewCustomers = allUsers.filter((u) => {
    const d = new Date(u.createdAt);
    return d >= priorStart && d < rangeStart;
  }).length;
  const priorConversionRate = priorTotalOrders > 0 ? (priorPaidOrders.length / priorTotalOrders) * 100 : 0;

  function pctChange(current: number, prior: number) {
    if (prior === 0) return current > 0 ? 100 : 0;
    return ((current - prior) / prior) * 100;
  }

  // Daily revenue
  const dailyMap: Record<string, { date: string; revenue: number; orderCount: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[key] = { date: key, revenue: 0, orderCount: 0 };
  }
  paidOrders.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyMap[key]) {
      dailyMap[key].revenue += Number(o.total);
      dailyMap[key].orderCount += 1;
    }
  });
  const dailyRevenue = Object.values(dailyMap);

  // Status breakdown
  const statusMap: Record<string, number> = {};
  allOrders.forEach((o) => {
    const s = o.status.charAt(0).toUpperCase() + o.status.slice(1);
    statusMap[s] = (statusMap[s] ?? 0) + 1;
  });
  const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  allItems.filter((i) => paidOrderIds.has(i.orderId)).forEach((item) => {
    const key = item.productId ?? item.productName;
    if (!productSales[key]) productSales[key] = { name: item.productName, quantity: 0, revenue: 0 };
    productSales[key].quantity += item.quantity;
    productSales[key].revenue += Number(item.price) * item.quantity;
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Category breakdown
  const catMap: Record<string, { name: string; value: number }> = {};
  allProducts.forEach((p) => {
    const cat = allCategories.find((c) => c.id === p.categoryId);
    const name = cat?.name ?? 'Uncategorized';
    catMap[name] = catMap[name] ?? { name, value: 0 };
    catMap[name].value += 1;
  });
  const categoryBreakdown = Object.values(catMap);

  // Low stock
  const lowStockProducts = allProducts.filter((p) => p.stock < 10).map((p) => ({ name: p.name, stock: p.stock }));

  // Gross profit: revenue minus estimated COGS
  const { grossProfit, estimatedCOGS } = (() => {
    const paidItemsInRange = allItems.filter((i) => paidOrderIds.has(i.orderId));
    let cogs = 0;
    for (const item of paidItemsInRange) {
      if (item.productId) {
        const product = allProducts.find((p) => p.id === item.productId);
        if (product && (product as any).costPrice) {
          cogs += Number((product as any).costPrice) * item.quantity;
        }
      }
    }
    return { estimatedCOGS: cogs, grossProfit: totalRevenue - cogs };
  })();
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Online vs Offline — last 6 months
  const onlineVsOffline = (() => {
    const months: { month: string; online: number; offline: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({ month: monthKey, online: 0, offline: 0 });
    }
    allOrdersForOffline.forEach((o) => {
      const oDate = new Date(o.createdAt);
      const monthsAgo =
        (now.getFullYear() - oDate.getFullYear()) * 12 + (now.getMonth() - oDate.getMonth());
      if (monthsAgo >= 0 && monthsAgo < 6) {
        const entry = months[5 - monthsAgo];
        if (entry) {
          if (o.saleType === 'pos' || o.saleType === 'offline') {
            entry.offline += Number(o.total);
          } else {
            entry.online += Number(o.total);
          }
        }
      }
    });
    return months;
  })();

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    avgOrderValue,
    newCustomers,
    conversionRate,
    dailyRevenue,
    statusBreakdown,
    topProducts,
    categoryBreakdown,
    lowStockProducts,
    grossProfit,
    estimatedCOGS,
    profitMargin,
    onlineVsOffline,
    prior: {
      totalRevenue: priorRevenue,
      totalOrders: priorTotalOrders,
      avgOrderValue: priorAvgOrderValue,
      newCustomers: priorNewCustomers,
      conversionRate: priorConversionRate,
      grossProfit: priorPaidOrders.reduce((s, o) => s + Number(o.total), 0),
    },
    pctChange: {
      totalRevenue: pctChange(totalRevenue, priorRevenue),
      totalOrders: pctChange(totalOrders, priorTotalOrders),
      avgOrderValue: pctChange(avgOrderValue, priorAvgOrderValue),
      newCustomers: pctChange(newCustomers, priorNewCustomers),
      conversionRate: pctChange(conversionRate, priorConversionRate),
    },
  });
}
