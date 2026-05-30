import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentTransactions, orders, pendingCheckouts, receipts } from '@/db/schema';
import { consumeStockReservationsForOrder, generateReceiptNumber, generateOrderNumber } from '@/lib/inventory';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, tx_ref } = await req.json();

    if (!transaction_id || !tx_ref) {
      return NextResponse.json({ error: 'Missing transaction_id or tx_ref' }, { status: 400 });
    }

    // Verify with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
      },
    );
    const verifyData = await verifyRes.json();

    if (verifyData.status !== 'success' || verifyData.data.status !== 'successful') {
      await db
        .update(paymentTransactions)
        .set({ status: 'failed', rawResponse: JSON.stringify(verifyData) })
        .where(eq(paymentTransactions.flutterwaveTxRef, tx_ref));
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 402 });
    }

    const txn = await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.flutterwaveTxRef, tx_ref),
    });

    if (!txn?.checkoutId) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Idempotency: if already successful, return existing order
    if (txn.status === 'successful' && txn.orderId) {
      return NextResponse.json({ success: true, orderId: txn.orderId });
    }

    const checkout = await db.query.pendingCheckouts.findFirst({
      where: eq(pendingCheckouts.id, txn.checkoutId),
    });
    if (!checkout) return NextResponse.json({ error: 'Checkout not found' }, { status: 404 });

    const shippingAddr = checkout.shippingAddress as any;

    // Create order
    const orderNumber = await generateOrderNumber();
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: checkout.userId ?? null,
        guestEmail: checkout.guestEmail,
        status: 'confirmed',
        paymentStatus: 'paid',
        saleType: 'online',
        subtotal: checkout.subtotal,
        deliveryFee: checkout.deliveryFee,
        total: checkout.total,
        shippingFullName: shippingAddr?.fullName,
        shippingPhone: shippingAddr?.phone,
        shippingStreetAddress: shippingAddr?.streetAddress,
        shippingCity: shippingAddr?.city,
        shippingState: shippingAddr?.state,
        shippingAbujaZone: shippingAddr?.abujaZone,
        checkoutId: txn.checkoutId,
      })
      .returning({ id: orders.id });

    // Consume reservations → order_items + batch_allocations
    await consumeStockReservationsForOrder(txn.checkoutId, order.id);

    // Mark checkout paid
    await db
      .update(pendingCheckouts)
      .set({ status: 'paid' })
      .where(eq(pendingCheckouts.id, txn.checkoutId));

    // Update payment transaction
    await db
      .update(paymentTransactions)
      .set({
        status: 'successful',
        orderId: order.id,
        flutterwaveTransactionId: String(transaction_id),
        rawResponse: JSON.stringify(verifyData),
      })
      .where(eq(paymentTransactions.flutterwaveTxRef, tx_ref));

    // Generate receipt
    const receiptNumber = await generateReceiptNumber();
    await db.insert(receipts).values({
      receiptNumber,
      orderId: order.id,
      type: 'online',
      customerName: shippingAddr?.fullName,
      customerEmail: checkout.guestEmail,
      customerPhone: shippingAddr?.phone,
      subtotal: checkout.subtotal,
      deliveryFee: checkout.deliveryFee,
      total: checkout.total,
      items: JSON.stringify(checkout.items),
    });

    // Send confirmation email (fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    }).catch(() => {});

    return NextResponse.json({ success: true, orderId: order.id, receiptNumber });
  } catch (err: any) {
    console.error('[payment/verify]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
