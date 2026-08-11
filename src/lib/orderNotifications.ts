import { db } from '@/lib/db';
import { orders, orderItems, receipts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import {
  getStoreContactInfo,
  renderEmailLayout,
  renderStatusBanner,
  renderButton,
  renderItemsTable,
  renderTotals,
  emailColors,
} from '@/lib/emailLayout';

// Direct in-process senders, not HTTP self-fetches. The routes that create
// or update orders used to fire-and-forget a fetch() back into this same
// app's /api/email/* routes, gated on NEXT_PUBLIC_APP_URL — when that env
// var was empty in production, every one of those calls threw immediately
// (a relative URL has no meaning to a server-side fetch) and was silently
// swallowed by a bare `.catch(() => {})`. Calling straight into these
// functions removes that entire failure mode, and every caller here logs
// on failure instead of discarding it.

const resend = new Resend(process.env.RESEND_API_KEY);

const STATUS_META: Record<string, { label: string; heading: string; message: string; color: string; emoji: string }> = {
  pending: {
    label: 'Order Received',
    heading: "We've got your order",
    message: "Your order has been received and is awaiting confirmation. We'll email you again as soon as it's confirmed.",
    color: emailColors.orange,
    emoji: '📝',
  },
  confirmed: {
    label: 'Order Confirmed',
    heading: 'Your order is confirmed',
    message: "We've confirmed your order and it's being prepared for dispatch.",
    color: emailColors.green,
    emoji: '✅',
  },
  processing: {
    label: 'Order Processing',
    heading: "We're preparing your order",
    message: "Your order is being picked and packed — we'll let you know the moment it ships.",
    color: emailColors.orange,
    emoji: '📦',
  },
  shipped: {
    label: 'Order Shipped',
    heading: 'Your order is on its way',
    message: "Your order has left our warehouse and is on its way to you.",
    color: emailColors.green,
    emoji: '🚚',
  },
  delivered: {
    label: 'Order Delivered',
    heading: 'Delivered!',
    message: "Your order has been delivered. We hope you love it — thank you for shopping with us.",
    color: emailColors.green,
    emoji: '🎉',
  },
  cancelled: {
    label: 'Order Cancelled',
    heading: 'Your order was cancelled',
    message: "This order has been cancelled. If you weren't expecting this or have questions, just reply to this email.",
    color: '#dc2626',
    emoji: '✕',
  },
  refunded: {
    label: 'Order Refunded',
    heading: "You've been refunded",
    message: 'A refund for this order has been processed. It may take a few business days to reflect, depending on your bank.',
    color: emailColors.muted,
    emoji: '↩️',
  },
};

async function resolveRecipientEmail(order: typeof orders.$inferSelect): Promise<string | null> {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).then((r) => r[0] ?? null);
    return user?.email ?? null;
  }
  return null;
}

// "Track your order" only resolves for a logged-in customer's own order —
// the guest-checkout order page currently redirects anyone without a
// session straight to /login with no way back in, even if their email
// matches. Rather than link guests to a page they can't actually reach,
// the button is omitted for guest orders until that's fixed separately.
function renderTrackButton(order: typeof orders.$inferSelect): string {
  if (!order.userId || !process.env.NEXT_PUBLIC_APP_URL) return '';
  return renderButton('Track Your Order', `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`);
}

function renderOrderNumberChip(orderNumber: string | null): string {
  return `<p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:13px;color:${emailColors.muted};">Order <strong style="color:${emailColors.ink};">#${orderNumber ?? '—'}</strong></p>`;
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
    const info = await getStoreContactInfo();

    const podNote =
      order.paymentMethod === 'pod'
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:${emailColors.orange}14;border-radius:10px;border:1px solid ${emailColors.orange}33;">
             <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${emailColors.ink};">
               💰 <strong>Pay on Delivery</strong> — please have ₦${Number(order.total).toLocaleString()} ready for the courier.
             </td></tr>
           </table>`
        : '';

    const bodyHtml = `
      <h1 style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:${emailColors.ink};">🎉 Thank you for your order!</h1>
      ${renderOrderNumberChip(order.orderNumber)}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${emailColors.muted};line-height:1.6;">
        We're getting your order ready. Here's what you ordered:
      </p>
      ${renderItemsTable(items.map((i) => ({ name: `${i.productName}${i.variation ? ` (${i.variation})` : ''}`, qty: i.quantity, price: Number(i.price), image: i.productImage })))}
      ${renderTotals([
        { label: 'Subtotal', value: `₦${Number(order.subtotal).toLocaleString()}` },
        { label: 'Delivery', value: `₦${Number(order.deliveryFee).toLocaleString()}` },
        { label: 'Total', value: `₦${Number(order.total).toLocaleString()}`, bold: true },
      ])}
      ${receipt ? `<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${emailColors.muted};">Receipt: <strong style="color:${emailColors.ink};">${receipt.receiptNumber}</strong></p>` : ''}
      ${podNote}
      ${renderTrackButton(order)}
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `🎉 Order Confirmed — ${info.storeName} #${order.orderNumber}`,
      html: renderEmailLayout({
        preheader: `Your order #${order.orderNumber} has been confirmed.`,
        bodyHtml,
        info,
        bannerHtml: renderStatusBanner('Order Confirmed', '✅', emailColors.green),
      }),
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

    const info = await getStoreContactInfo();
    const meta = STATUS_META[status] ?? {
      label: `Order ${status}`,
      heading: `Order ${status}`,
      message: 'There has been an update to your order.',
      color: emailColors.orange,
      emoji: 'ℹ️',
    };

    const bodyHtml = `
      <h1 style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:${emailColors.ink};">${meta.heading}</h1>
      ${renderOrderNumberChip(order.orderNumber)}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${emailColors.muted};line-height:1.6;">
        ${meta.message}
      </p>
      ${renderTrackButton(order)}
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `${meta.emoji} ${meta.label} — ${info.storeName} #${order.orderNumber}`,
      html: renderEmailLayout({
        preheader: meta.message,
        bodyHtml,
        info,
        bannerHtml: renderStatusBanner(meta.label, meta.emoji, meta.color),
      }),
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

    const info = await getStoreContactInfo();

    const bodyHtml = `
      <h1 style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:${emailColors.ink};">💳 Payment received — thank you!</h1>
      ${renderOrderNumberChip(order.orderNumber)}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${emailColors.muted};line-height:1.6;">
        We've confirmed your payment of <strong style="color:${emailColors.ink};">₦${Number(order.total).toLocaleString()}</strong>. Your order is now being processed.
      </p>
      ${renderTrackButton(order)}
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipientEmail,
      subject: `✅ Payment Confirmed — ${info.storeName} #${order.orderNumber}`,
      html: renderEmailLayout({
        preheader: 'Your payment has been confirmed.',
        bodyHtml,
        info,
        bannerHtml: renderStatusBanner('Payment Confirmed', '💳', emailColors.green),
      }),
    });
    if (error) console.error('[orderNotifications] payment-confirmed email failed:', orderId, error);
  } catch (err) {
    console.error('[orderNotifications] payment-confirmed email threw:', orderId, err);
  }
}
