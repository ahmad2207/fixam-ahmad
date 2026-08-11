import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingCheckouts, orders } from '@/db/schema';
import { consumeStockReservationsForOrder, generateOrderNumber, createStockReservations, priceCheckoutItems } from '@/lib/inventory';
import { sendOrderConfirmationEmail } from '@/lib/orderNotifications';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { success: withinLimit } = await checkRateLimit('payment', getClientIp(req));
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
    }

    const session = await auth();
    const userId = (session?.user as any)?.id ?? null;

    const body = await req.json();
    const {
      items: rawItems, shippingAddress,
      customerEmail, customerName, customerPhone, notes,
    } = body;

    if (!rawItems?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!shippingAddress?.state) {
      return NextResponse.json({ error: 'Delivery state is required' }, { status: 400 });
    }

    // Recompute everything from the products table and the delivery-fee
    // calculator — never trust price/subtotal/total from the client. This
    // is the only backstop on POD orders: there's no payment gateway to
    // catch a tampered total later.
    let items, subtotal, deliveryFee, total;
    try {
      ({ items, subtotal, deliveryFee, total } = await priceCheckoutItems(
        rawItems,
        shippingAddress.state,
        shippingAddress.abujaZone,
      ));
    } catch (err: any) {
      return NextResponse.json({ error: err.message ?? 'Could not price your cart' }, { status: 400 });
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

    // POD orders previously never sent any confirmation email at all.
    // Awaited for the same reason as payment/verify — see comment there.
    await sendOrderConfirmationEmail(order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err: any) {
    console.error('[POD] Error:', err);
    return NextResponse.json({ error: 'Could not place your order. Please try again.' }, { status: 500 });
  }
}
