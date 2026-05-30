import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, receipts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const receipt = await db.query.receipts.findFirst({
      where: eq(receipts.orderId, orderId),
    });

    let recipientEmail = order.guestEmail;
    if (!recipientEmail && order.userId) {
      const user = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).then((r) => r[0] ?? null);
      recipientEmail = user?.email ?? null;
    }
    if (!recipientEmail) return NextResponse.json({ sent: false, reason: 'No email' });

    const itemRows = items
      .map(
        (i) =>
          `<tr><td>${i.productName}${i.variation ? ` (${i.variation})` : ''}</td><td>x${i.quantity}</td><td>₦${Number(i.price).toLocaleString()}</td></tr>`,
      )
      .join('');

    const html = `
      <h2>Thank you for your order!</h2>
      <p>Order #${orderId.slice(0, 8).toUpperCase()}</p>
      ${receipt ? `<p>Receipt: <strong>${receipt.receiptNumber}</strong></p>` : ''}
      <table border="1" cellpadding="8" style="border-collapse:collapse">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p>Subtotal: ₦${Number(order.subtotal).toLocaleString()}</p>
      <p>Delivery: ₦${Number(order.deliveryFee).toLocaleString()}</p>
      <p><strong>Total: ₦${Number(order.total).toLocaleString()}</strong></p>
      <p>We will contact you about delivery shortly.</p>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `Order Confirmed — Fixam Africa #${orderId.slice(0, 8).toUpperCase()}`,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error('[email/order]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
