import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pendingCheckouts, paymentTransactions } from '@/db/schema';
import { createStockReservations } from '@/lib/inventory';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id ?? null;

    const body = await req.json();
    const { items, shippingAddress, subtotal, deliveryFee, total, customerEmail, customerName, customerPhone } = body;

    if (!items?.length || !subtotal || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Generate tx ref
    const txRef = `FXM-${checkout.id.slice(0, 8)}-${Date.now()}`;

    // Log payment transaction
    await db.insert(paymentTransactions).values({
      checkoutId: checkout.id,
      flutterwaveTxRef: txRef,
      amount: String(total),
      currency: 'NGN',
      status: 'initiated',
    });

    // Build Flutterwave payment link
    const flwPayload = {
      tx_ref: txRef,
      amount: total,
      currency: 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      customer: {
        email: customerEmail || 'guest@fixamafrica.com',
        name: customerName || 'Guest',
        phone_number: customerPhone || '',
      },
      customizations: {
        title: 'Fixam Africa',
        description: `Order #${checkout.id.slice(0, 8)}`,
      },
    };

    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flwPayload),
    });

    const flwData = await flwRes.json();

    if (flwData.status !== 'success') {
      // Release reservations on FLW failure
      const { releaseStockReservations } = await import('@/lib/inventory');
      await releaseStockReservations(checkout.id);
      return NextResponse.json({ error: 'Payment initiation failed' }, { status: 502 });
    }

    return NextResponse.json({ link: flwData.data.link, checkoutId: checkout.id, txRef });
  } catch (err: any) {
    console.error('[payment/init]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
