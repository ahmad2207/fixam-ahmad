import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingCheckouts, orders, paymentTransactions } from '@/db/schema';
import { consumeStockReservationsForOrder, generateOrderNumber, createStockReservations, priceCheckoutItems } from '@/lib/inventory';
import { sendOrderConfirmationEmail } from '@/lib/orderNotifications';
import { sendOrderConfirmationWhatsApp } from '@/lib/whatsappNotifications';
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
      items: rawItems, combos, shippingAddress,
      customerEmail, customerName, customerPhone, notes, deliveryMethod,
    } = body;
    const method: 'delivery' | 'pickup' = deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

    if (!rawItems?.length && !combos?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (method === 'delivery' && !shippingAddress?.state) {
      return NextResponse.json({ error: 'Delivery state is required' }, { status: 400 });
    }

    // Recompute everything from the products table and the delivery-fee
    // calculator — never trust price/subtotal/total from the client. This
    // is the only backstop on POD/pickup orders: there's no payment gateway
    // to catch a tampered total later.
    let items, subtotal, deliveryFee, total;
    try {
      ({ items, subtotal, deliveryFee, total } = await priceCheckoutItems(
        rawItems ?? [],
        shippingAddress?.state,
        shippingAddress?.abujaZone,
        method,
        combos ?? [],
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
        deliveryMethod: method,
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
        deliveryMethod: method,
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

    // Record this as a payment transaction too, same as the Paystack flow
    // does in /api/payment/init — otherwise a POD/pickup order never shows
    // up anywhere in the admin Transactions ledger, even after it's paid.
    // Starts 'pending' (cash not yet collected); flipped to 'successful' when
    // an admin confirms payment (see /api/admin/orders/[id]), or 'cancelled'
    // if the order is cancelled before that happens (see the status route).
    await db.insert(paymentTransactions).values({
      orderId: order.id,
      checkoutId: checkout.id,
      provider: 'pod',
      amount: String(total),
      currency: 'NGN',
      status: 'pending',
      customerName,
      customerEmail,
    });

    // Consume reservations → creates order_items + batch_allocations
    await consumeStockReservationsForOrder(checkout.id, order.id);

    // Mark pending checkout as used
    await db
      .update(pendingCheckouts)
      .set({ status: 'paid' })
      .where(eq(pendingCheckouts.id, checkout.id));

    // POD orders previously never sent any confirmation email at all.
    // Awaited for the same reason as payment/verify — see comment there.
    await Promise.all([sendOrderConfirmationEmail(order.id), sendOrderConfirmationWhatsApp(order.id)]);

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
