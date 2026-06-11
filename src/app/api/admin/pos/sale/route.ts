import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, receipts } from '@/db/schema';
import { deductPOSInventory, generateReceiptNumber, generateOrderNumber } from '@/lib/inventory';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { items, customerName, customerPhone, customerEmail, subtotal, deliveryFee, total, notes, paymentMethod, salesRep: salesRepBody } = body;

  if (!items?.length) {
    return NextResponse.json({ error: 'No items' }, { status: 400 });
  }

  // Create order
  const orderNumber = await generateOrderNumber();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: paymentMethod ?? 'cash',
      saleType: 'pos',
      subtotal: String(subtotal),
      deliveryFee: String(deliveryFee ?? 0),
      total: String(total),
      shippingFullName: customerName,
      shippingPhone: customerPhone,
      notes,
    })
    .returning({ id: orders.id });

  // Insert order items and deduct inventory
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.name,
      productImage: item.imageUrl ?? null,
      quantity: item.quantity,
      price: String(item.price),
      variation: item.variation ?? null,
      fromReservation: false,
    });

    if (item.productId) {
      await deductPOSInventory(item.productId, item.quantity);
    }
  }

  // Generate receipt
  const receiptNumber = await generateReceiptNumber();
  const [receipt] = await db
    .insert(receipts)
    .values({
      receiptNumber,
      orderId: order.id,
      type: 'pos',
      customerName,
      customerEmail,
      customerPhone,
      subtotal: String(subtotal),
      deliveryFee: String(deliveryFee ?? 0),
      total: String(total),
      items: JSON.stringify(items),
      notes,
      createdBy: session.user?.id ?? null,
      salesRep: salesRepBody || (session.user as any)?.name || null,
    })
    .returning();

  return NextResponse.json({ orderId: order.id, receiptId: receipt.id, receiptNumber: receipt.receiptNumber }, { status: 201 });
}
