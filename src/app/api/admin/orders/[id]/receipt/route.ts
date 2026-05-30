import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, receipts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateReceiptNumber } from '@/lib/inventory';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const [existing] = await db.select().from(receipts).where(eq(receipts.orderId, id));
  if (existing) return NextResponse.json(existing);

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  const receiptItems = items.map((item) => ({
    name: item.productName,
    quantity: item.quantity,
    price: Number(item.price),
    variation: item.variation ?? undefined,
  }));

  const receiptNumber = await generateReceiptNumber();

  const [receipt] = await db
    .insert(receipts)
    .values({
      receiptNumber,
      orderId: order.id,
      type: (order.saleType as 'online' | 'pos' | 'offline') ?? 'online',
      customerName: order.shippingFullName ?? undefined,
      customerPhone: order.shippingPhone ?? undefined,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      items: JSON.stringify(receiptItems),
      paymentMethod: order.paymentMethod ?? undefined,
      paymentStatus: order.paymentStatus ?? 'paid',
      createdBy: session.user?.id ?? null,
      salesRep: (session.user as any)?.name ?? null,
    })
    .returning();

  return NextResponse.json(receipt, { status: 201 });
}
