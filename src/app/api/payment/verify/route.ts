import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentTransactions, orders, pendingCheckouts, receipts } from '@/db/schema';
import { consumeStockReservationsForOrder, generateReceiptNumber, generateOrderNumber } from '@/lib/inventory';
import { sendOrderConfirmationEmail } from '@/lib/orderNotifications';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );
    const verifyData = await verifyRes.json();

    const txn = await db.query.paymentTransactions.findFirst({
      where: eq(paymentTransactions.paystackReference, reference),
    });

    if (!txn?.checkoutId) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Idempotency: if already successful, return existing order
    if (txn.status === 'successful' && txn.orderId) {
      return NextResponse.json({ success: true, orderId: txn.orderId });
    }

    const isSuccessful = verifyData.status && verifyData.data?.status === 'success';
    // Amount is in kobo on Paystack's side; compare against the amount we recorded.
    const amountMatches = isSuccessful && verifyData.data.amount === Math.round(Number(txn.amount) * 100);

    if (!isSuccessful || !amountMatches) {
      await db
        .update(paymentTransactions)
        .set({ status: 'failed', rawResponse: JSON.stringify(verifyData) })
        .where(eq(paymentTransactions.paystackReference, reference));
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 402 });
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
        paymentMethod: 'paystack',
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
        paystackTransactionId: String(verifyData.data.id),
        rawResponse: JSON.stringify(verifyData),
      })
      .where(eq(paymentTransactions.paystackReference, reference));

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

    // Awaited deliberately (not fire-and-forget) — a serverless function can
    // tear down as soon as the response is sent, which previously meant a
    // background fetch() calling back into this app was never guaranteed to
    // finish. The function itself never throws (self-caught + logged), so
    // this can't turn an email failure into a failed payment verification.
    await sendOrderConfirmationEmail(order.id);

    return NextResponse.json({ success: true, orderId: order.id, receiptNumber });
  } catch (err: any) {
    console.error('[payment/verify]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
