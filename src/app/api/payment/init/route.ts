import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingCheckouts, paymentTransactions } from '@/db/schema';
import { createStockReservations, releaseStockReservations, priceCheckoutItems } from '@/lib/inventory';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id ?? null;

    const body = await req.json();
    const { items: rawItems, shippingAddress, customerEmail, customerName, customerPhone } = body;

    if (!rawItems?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Recompute everything from the products table and the delivery-fee
    // calculator — never trust price/subtotal/total from the client.
    let items, subtotal, deliveryFee, total;
    try {
      ({ items, subtotal, deliveryFee, total } = await priceCheckoutItems(
        rawItems,
        shippingAddress?.state,
        shippingAddress?.abujaZone,
      ));
    } catch (err: any) {
      return NextResponse.json({ error: err.message ?? 'Could not price your cart' }, { status: 400 });
    }

    // Create pending checkout
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

    // Reserve stock (FIFO)
    await createStockReservations(checkout.id, 30);

    // Generate tx reference
    const reference = `FXM-${checkout.id.slice(0, 8)}-${Date.now()}`;

    // Log payment transaction
    await db.insert(paymentTransactions).values({
      checkoutId: checkout.id,
      paystackReference: reference,
      amount: String(total),
      currency: 'NGN',
      status: 'initiated',
      customerName,
      customerEmail,
    });

    // Build Paystack payment link (amount is in kobo)
    const paystackPayload = {
      email: customerEmail || 'guest@fixamafrica.com',
      amount: Math.round(Number(total) * 100),
      currency: 'NGN',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      metadata: {
        checkout_id: checkout.id,
        customer_name: customerName || 'Guest',
        customer_phone: customerPhone || '',
      },
    };

    try {
      const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackPayload),
      });

      const psData = await psRes.json();

      if (!psData.status) {
        await releaseStockReservations(checkout.id);
        return NextResponse.json({ error: 'Payment initiation failed' }, { status: 502 });
      }

      return NextResponse.json({ link: psData.data.authorization_url, checkoutId: checkout.id, reference });
    } catch (err) {
      // Release reservations on any Paystack call failure, including network errors
      await releaseStockReservations(checkout.id);
      throw err;
    }
  } catch (err: any) {
    console.error('[payment/init]', err);
    return NextResponse.json({ error: 'Could not start payment. Please try again.' }, { status: 500 });
  }
}
