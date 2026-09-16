// WhatsApp counterparts to the email senders in orderNotifications.ts — same
// events, same trigger points, same "never throw, just log" contract, so
// callers can `await Promise.all([sendXEmail(...), sendXWhatsApp(...)])`
// without a WhatsApp failure ever affecting the request that triggered it.
//
// Each function here sends one pre-approved WhatsApp message template (see
// sendWhatsAppTemplate in @/lib/whatsapp for why templates are required).
// Template names are configurable via env — WhatsApp Manager may reject the
// default name (already taken, doesn't meet naming rules, etc.) and the app
// shouldn't need a code change to point at whatever name actually got
// approved. The exact body copy for each template is documented below so
// they can be (re)created in WhatsApp Manager if needed:
//
//   order_confirmation   — "Thanks for your order! Order #{{1}} has been
//                           confirmed — total {{2}}. We'll message you again
//                           as soon as it ships."
//   order_status_update  — "Update on order #{{1}}: {{2}}. {{3}}"
//                           ({{2}} = STATUS_META label, {{3}} = message)
//   payment_confirmed    — "Payment received for order #{{1}} — {{2}}. Your
//                           order is now being processed."

import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppTemplate, normalizeNigerianPhone } from '@/lib/whatsapp';
import { STATUS_META } from '@/lib/orderNotifications';

const TEMPLATE_ORDER_CONFIRMATION = process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMATION || 'order_confirmation';
const TEMPLATE_ORDER_STATUS_UPDATE = process.env.WHATSAPP_TEMPLATE_ORDER_STATUS_UPDATE || 'order_status_update';
const TEMPLATE_PAYMENT_CONFIRMED = process.env.WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED || 'payment_confirmed';

function resolveRecipientPhone(order: typeof orders.$inferSelect): string | null {
  return normalizeNigerianPhone(order.shippingPhone);
}

function formatNaira(amount: number | string): string {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

// Order confirmation — fired alongside sendOrderConfirmationEmail, right
// after an order is created (both Pay-on-Delivery and Paystack-verified).
export async function sendOrderConfirmationWhatsApp(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const phone = resolveRecipientPhone(order);
    if (!phone) return;

    await sendWhatsAppTemplate(phone, TEMPLATE_ORDER_CONFIRMATION, [
      order.orderNumber ?? '—',
      formatNaira(order.total),
    ]);
  } catch (err) {
    console.error('[whatsappNotifications] confirmation message threw:', orderId, err);
  }
}

// Status-change notification — fired alongside sendOrderStatusEmail when an
// admin moves an order to a new status.
export async function sendOrderStatusWhatsApp(orderId: string, status: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const phone = resolveRecipientPhone(order);
    if (!phone) return;

    const meta = STATUS_META[status] ?? {
      label: `Order ${status}`,
      message: 'There has been an update to your order.',
    };

    await sendWhatsAppTemplate(phone, TEMPLATE_ORDER_STATUS_UPDATE, [
      order.orderNumber ?? '—',
      meta.label,
      meta.message,
    ]);
  } catch (err) {
    console.error('[whatsappNotifications] status message threw:', orderId, status, err);
  }
}

// Payment-confirmed notification — fired alongside sendPaymentConfirmedEmail
// when an admin manually confirms a bank-transfer/manual payment.
export async function sendPaymentConfirmedWhatsApp(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const phone = resolveRecipientPhone(order);
    if (!phone) return;

    await sendWhatsAppTemplate(phone, TEMPLATE_PAYMENT_CONFIRMED, [
      order.orderNumber ?? '—',
      formatNaira(order.total),
    ]);
  } catch (err) {
    console.error('[whatsappNotifications] payment-confirmed message threw:', orderId, err);
  }
}
