/**
 * Standalone smoke test for the WhatsApp Cloud API integration — sends one
 * real template message so you can verify WHATSAPP_API_TOKEN /
 * WHATSAPP_PHONE_NUMBER_ID and template approval are all correct before
 * relying on the order-flow triggers in whatsappNotifications.ts.
 *
 * Usage:
 *   npx tsx scripts/test-whatsapp-send.ts <phone> [type]
 *
 *   <phone> required — any shape normalizeNigerianPhone() accepts
 *           (e.g. 08012345678, 2348012345678, 8012345678)
 *   [type]  optional — one of "order_confirmation" (default),
 *           "order_status_update", "payment_confirmed". This picks which
 *           set of placeholder body params to send; the actual template
 *           name sent to Meta still resolves through the same
 *           WHATSAPP_TEMPLATE_* env vars whatsappNotifications.ts uses, so
 *           this test reflects whatever name you've actually approved.
 *
 * Body params are filled with obviously-fake placeholder values (order
 * number "TEST-0001" etc.) — this hits the real Cloud API and sends a real
 * message, so only run it against a number you control.
 */

import { readFileSync } from 'fs';
import path from 'path';

for (const file of ['.env.local', '.env']) {
  try {
    const env = readFileSync(path.join(process.cwd(), file), 'utf-8');
    for (const line of env.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}

import { sendWhatsAppTemplate, normalizeNigerianPhone } from '../src/lib/whatsapp';

// Keyed by notification type, not the literal Meta template name — the real
// name resolves via the same env vars whatsappNotifications.ts falls back
// on, so overriding e.g. WHATSAPP_TEMPLATE_ORDER_CONFIRMATION also changes
// what this script actually sends for "order_confirmation".
const TEMPLATES: Record<string, { envVar: string; default: string; bodyParams: string[] }> = {
  order_confirmation: {
    envVar: 'WHATSAPP_TEMPLATE_ORDER_CONFIRMATION',
    default: 'order_confirmation',
    bodyParams: ['TEST-0001', '₦15,000'],
  },
  order_status_update: {
    envVar: 'WHATSAPP_TEMPLATE_ORDER_STATUS_UPDATE',
    default: 'order_status_update',
    bodyParams: ['TEST-0001', 'Order Shipped', 'Your order has left our warehouse and is on its way to you.'],
  },
  payment_confirmed: {
    envVar: 'WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED',
    default: 'payment_confirmed',
    bodyParams: ['TEST-0001', '₦15,000'],
  },
};

async function main() {
  const rawPhone = process.argv[2];
  const type = process.argv[3] || 'order_confirmation';

  if (!rawPhone) {
    console.error('Usage: npx tsx scripts/test-whatsapp-send.ts <phone> [type]');
    process.exit(1);
  }

  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error('WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set in .env — fill those in first.');
    process.exit(1);
  }

  const phone = normalizeNigerianPhone(rawPhone);
  if (!phone) {
    console.error(`"${rawPhone}" doesn't look like a valid Nigerian phone number.`);
    process.exit(1);
  }

  const template = TEMPLATES[type];
  if (!template) {
    console.error(`Unknown type "${type}". Expected one of: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  const templateName = process.env[template.envVar] || template.default;

  console.log(`Sending "${templateName}" (${type}) to ${phone}...`);
  const ok = await sendWhatsAppTemplate(phone, templateName, template.bodyParams);
  console.log(ok ? '✅ Sent (check the phone, and check delivery in WhatsApp Manager).' : '❌ Failed — see the [whatsapp] error logged above.');
  process.exit(ok ? 0 : 1);
}

main();
