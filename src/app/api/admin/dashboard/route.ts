import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, users, products, inventoryBatches } from '@/db/schema';
import { gte, eq, inArray, sum, count, and, lt, desc, sql } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [allOrders, allItems, allUsers, allProducts, allBatches] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db.select({ id: users.id, createdAt: users.createdAt }).from(users),
    db.select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      imageUrl: products.imageUrl,
      costPrice: products.costPrice,
      price: products.price,
    }).from(products),
    db.select({
      quantityAvailable: inventoryBatches.quantityAvailable,
      costPrice: inventoryBatches.costPrice,
    }).from(inventoryBatches),
  ]);

  const paidOrders = allOrders.filter((o) =>
    ['confirmed', 'shipped', 'delivered'].includes(o.status),
  );
  const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');
  const inTransitOrders = allOrders.filter((o) =>
    ['confirmed', 'shipped'].includes(o.status),
  );
  const offlineOrders = allOrders.filter((o) =>
    o.saleType === 'pos' || o.saleType === 'offline',
  );

  const totalSales = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalSettled = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOwed = inTransitOrders.reduce((s, o) => s + Number(o.total), 0);
  const offlineSales = offlineOrders.reduce((s, o) => s + Number(o.total), 0);

  // Gross profit: totalSales - COGS from products.costPrice * quantity for paid order items
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const paidItems = allItems.filter((i) => paidOrderIds.has(i.orderId));
  let estimatedCOGS = 0;
  for (const item of paidItems) {
    if (item.productId) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) {
        estimatedCOGS += Number(product.costPrice) * item.quantity;
      }
    }
  }
  const grossProfit = totalSales - estimatedCOGS;

  const totalOrders = allOrders.length;
  const productsSold = paidItems.reduce((s, i) => s + i.quantity, 0);
  const newCustomers = allUsers.filter(
    (u) => new Date(u.createdAt) >= thirtyDaysAgo,
  ).length;
  const inventoryValue = allBatches.reduce(
    (s, b) => s + Number(b.costPrice) * b.quantityAvailable,
    0,
  );

  const lowStockProducts = allProducts
    .filter((p) => p.stock < 10)
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, imageUrl: p.imageUrl }));

  const recentOrders = allOrders.slice(0, 5).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    shippingFullName: o.shippingFullName,
    guestEmail: o.guestEmail,
    total: o.total,
    status: o.status,
    saleType: o.saleType,
    createdAt: o.createdAt,
  }));

  return NextResponse.json({
    totalSales,
    totalSettled,
    totalOwed,
    grossProfit,
    totalOrders,
    productsSold,
    newCustomers,
    inventoryValue,
    offlineSales,
    lowStockProducts,
    recentOrders,
  });
}
