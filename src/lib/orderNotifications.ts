import { db } from '@/lib/db';
import { orders, orderItems, receipts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

// Direct in-process senders, not HTTP self-fetches. The routes that create
// or update orders used to fire-and-forget a fetch() back into this same
// app's /api/email/* routes, gated on NEXT_PUBLIC_APP_URL — when that env
// var was empty in production, every one of those calls threw immediately
// (a relative URL has no meaning to a server-side fetch) and was silently
// swallowed by a bare `.catch(() => {})`. No customer email has ever
// actually sent. Calling straight into these functions removes that entire
// failure mode, and every caller here logs on failure instead of discarding it.

const resend = new Resend(process.env.RESEND_API_KEY);

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Order Confirmed',
  processing: 'Order Processing',
  shipped: 'Order Shipped',
  delivered: 'Order Delivered',
  cancelled: 'Order Cancelled',
  refunded: 'Order Refunded',
};

async function resolveRecipientEmail(order: typeof orders.$inferSelect): Promise<string | null> {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).then((r) => r[0] ?? null);
    return user?.email ?? null;
  }
  return null;
}

// Order confirmation — fired once, right after an order is created (both
// Pay-on-Delivery and Paystack-verified orders).
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const recipientEmail = await resolveRecipientEmail(order);
    if (!recipientEmail) return;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const receipt = await db.query.receipts.findFirst({ where: eq(receipts.orderId, orderId) });

    const itemRows = items
      .map(
        (i) =>
          `<tr><td>${i.productName}${i.variation ? ` (${i.variation})` : ''}</td><td>x${i.quantity}</td><td>₦${Number(i.price).toLocaleString()}</td></tr>`,
      )
      .join('');

    const html = `
      <h2>Thank you for your order!</h2>
      <p>Order #${order.orderNumber}</p>
      ${receipt ? `<p>Receipt: <strong>${receipt.receiptNumber}</strong></p>` : ''}
      <table border="1" cellpadding="8" style="border-collapse:collapse">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p>Subtotal: ₦${Number(order.subtotal).toLocaleString()}</p>
      <p>Delivery: ₦${Number(order.deliveryFee).toLocaleString()}</p>
      <p><strong>Total: ₦${Number(order.total).toLocaleString()}</strong></p>
      ${order.paymentMethod === 'pod' ? '<p>Payment method: Pay on Delivery — please have the total ready for the courier.</p>' : ''}
      <p>We will contact you about delivery shortly.</p>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `Order Confirmed — Fixam Africa #${order.orderNumber}`,
      html,
    });
    if (error) console.error('[orderNotifications] confirmation email failed:', orderId, error);
  } catch (err) {
    console.error('[orderNotifications] confirmation email threw:', orderId, err);
  }
}

// Status-change notification — fired when an admin moves an order to a new
// `status` (confirmed/processing/shipped/delivered/cancelled/refunded).
export async function sendOrderStatusEmail(orderId: string, status: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const recipientEmail = await resolveRecipientEmail(order);
    if (!recipientEmail) return;

    const label = STATUS_LABELS[status] ?? `Order ${status}`;
    const html = `
      <h2>${label}</h2>
      <p>Order #${order.orderNumber}</p>
      <p>Thank you for shopping with Fixam Africa!</p>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `${label} — Fixam Africa #${order.orderNumber}`,
      html,
    });
    if (error) console.error('[orderNotifications] status email failed:', orderId, status, error);
  } catch (err) {
    console.error('[orderNotifications] status email threw:', orderId, status, err);
  }
}

// Payment-confirmed notification — fired when an admin manually confirms a
// bank-transfer/manual payment (there's no `orders.status` value for this;
// it's a `paymentStatus` transition, so it gets its own label/subject).
export async function sendPaymentConfirmedEmail(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const recipientEmail = await resolveRecipientEmail(order);
    if (!recipientEmail) return;

    const html = `
      <h2>Payment Confirmed</h2>
      <p>Order #${order.orderNumber}</p>
      <p>We've confirmed your payment — thank you! Your order is now being processed.</p>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `Payment Confirmed — Fixam Africa #${order.orderNumber}`,
      html,
    });
    if (error) console.error('[orderNotifications] payment-confirmed email failed:', orderId, error);
  } catch (err) {
    console.error('[orderNotifications] payment-confirmed email threw:', orderId, err);
  }
}
