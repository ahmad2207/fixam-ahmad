import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { orderId, status, note } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let recipientEmail = order.guestEmail;
    if (!recipientEmail && order.userId) {
      const user = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).then((r) => r[0] ?? null);
      recipientEmail = user?.email ?? null;
    }
    if (!recipientEmail) return NextResponse.json({ sent: false, reason: 'No email' });

    const statusLabels: Record<string, string> = {
      confirmed: 'Order Confirmed',
      processing: 'Order Processing',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
    };

    const html = `
      <h2>${statusLabels[status] ?? `Order ${status}`}</h2>
      <p>Order #${orderId.slice(0, 8).toUpperCase()}</p>
      ${note ? `<p>${note}</p>` : ''}
      <p>Thank you for shopping with Fixam Africa!</p>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `${statusLabels[status] ?? status} — Fixam Africa`,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error('[email/status]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
