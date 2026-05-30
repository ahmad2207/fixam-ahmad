import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and, desc, inArray, count } from 'drizzle-orm';

const ORDERS_PER_PAGE = 50;

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const saleType = searchParams.get('saleType');
  const paymentMethod = searchParams.get('paymentMethod');

  const conditions: any[] = [];
  if (status) conditions.push(eq(orders.status, status as any));
  if (saleType) conditions.push(eq(orders.saleType, saleType as any));
  if (paymentMethod) conditions.push(eq(orders.paymentMethod, paymentMethod));

  const where = conditions.length ? and(...conditions) : undefined;

  // Summary mode — lightweight aggregate for stats cards, no row data
  if (searchParams.get('summary') === 'true') {
    const rows = await db
      .select({ status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total })
      .from(orders);
    return NextResponse.json({
      totalOrders: rows.length,
      totalRevenue: rows
        .filter((r) => ['confirmed', 'shipped', 'delivered'].includes(r.status))
        .reduce((s, r) => s + Number(r.total), 0),
      inTransit: rows.filter((r) => r.status === 'shipped').length,
      awaitingPayment: rows.filter((r) => r.paymentStatus === 'pending').length,
    });
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const offset = (page - 1) * ORDERS_PER_PAGE;

  const [{ total }] = await db.select({ total: count() }).from(orders).where(where);

  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(ORDERS_PER_PAGE)
    .offset(offset);

  if (rows.length === 0) return NextResponse.json({ orders: [], total });

  // Attach item previews (images + count) for thumbnail display
  const orderIds = rows.map((r) => r.id);
  const items = await db
    .select({
      orderId: orderItems.orderId,
      productImage: orderItems.productImage,
      productName: orderItems.productName,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const itemsByOrder: Record<string, typeof items> = {};
  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push(item);
  }

  const result = rows.map((r) => ({
    ...r,
    itemPreviews: (itemsByOrder[r.id] ?? []).slice(0, 3).map((i) => ({
      image: i.productImage,
      name: i.productName,
    })),
    totalItemCount: (itemsByOrder[r.id] ?? []).length,
  }));

  return NextResponse.json({ orders: result, total });
}
