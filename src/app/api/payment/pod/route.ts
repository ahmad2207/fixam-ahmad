import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingCheckouts, orders } from '@/db/schema';
import { consumeStockReservationsForOrder, generateOrderNumber, createStockReservations } from '@/lib/inventory';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id ?? null;

    const body = await req.json();
    const {
      items, shippingAddress, subtotal, deliveryFee, total,
      customerEmail, customerName, customerPhone, notes,
    } = body;

    if (!items?.length || !subtotal || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!shippingAddress?.state) {
      return NextResponse.json({ error: 'Delivery state is required' }, { status: 400 });
    }

    // Create pending checkout record
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const [checkout] = await db
      .insert(pendingCheckouts)
      .values({
        userId,
        guestEmail: customerEmail,
        items,
        shippingAddress,
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee ?? 0),
        total: String(total),
        status: 'pending',
        expiresAt,
      })
      .returning({ id: pendingCheckouts.id });

    // Reserve stock (30 min hold)
    await createStockReservations(checkout.id, 30);

    // Create the order immediately (no payment needed upfront)
    const orderNumber = await generateOrderNumber();
    const addr = shippingAddress as any;
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        guestEmail: customerEmail,
        status: 'pending',
        paymentMethod: 'pod',
        paymentStatus: 'pending',
        saleType: 'online',
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee ?? 0),
        total: String(total),
        shippingFullName: addr?.fullName,
        shippingPhone: addr?.phone,
        shippingStreetAddress: addr?.streetAddress,
        shippingCity: addr?.city,
        shippingState: addr?.state,
        shippingAbujaZone: addr?.abujaZone ?? null,
        notes: notes ?? null,
        checkoutId: checkout.id,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    // Consume reservations → creates order_items + batch_allocations
    await consumeStockReservationsForOrder(checkout.id, order.id);

    // Mark pending checkout as used
    await db
      .update(pendingCheckouts)
      .set({ status: 'paid' })
      .where(eq(pendingCheckouts.id, checkout.id));

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err: any) {
    console.error('[POD] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Order creation failed' }, { status: 500 });
  }
}
