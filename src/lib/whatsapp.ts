// Thin client for the Meta WhatsApp Cloud API. No official SDK is published
// for it, so — same as this repo already does for Paystack — we just call
// the HTTP API directly with fetch() rather than pulling in a wrapper.
//
// Outbound messages here are always *business-initiated* (order/payment
// updates the customer didn't just ask for in a live chat), and Meta only
// allows that kind of message through a pre-approved message template — see
// WHATSAPP_INTEGRATION.md-equivalent context in the plan this was built
// from. `templateName` below must match a template already approved in
// WhatsApp Manager for `WHATSAPP_BUSINESS_ACCOUNT_ID`.

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

function isConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

type TemplateComponent = {
  type: 'body';
  parameters: { type: 'text'; text: string }[];
};

/**
 * Sends an approved WhatsApp message template to `to` (E.164, no leading
 * '+', e.g. "2348012345678" — see `normalizeNigerianPhone`).
 *
 * Never throws: callers here are all "best effort, don't break the request
 * that triggered this" side effects, same contract as the email senders in
 * `orderNotifications.ts`. Returns whether the send succeeded so callers can
 * log accordingly.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: string[],
  languageCode = 'en'
): Promise<boolean> {
  if (!isConfigured()) {
    console.log('[whatsapp] not configured (WHATSAPP_API_TOKEN/WHATSAPP_PHONE_NUMBER_ID missing) — skipping send:', templateName, to);
    return false;
  }

  const components: TemplateComponent[] = bodyParams.length
    ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
    : [];

  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[whatsapp] send failed:', templateName, to, res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[whatsapp] send threw:', templateName, to, err);
    return false;
  }
}

/**
 * Normalizes a locally-formatted Nigerian phone number (e.g. the
 * "08012345678" shape collected by the checkout form, with no validation
 * today) into the E.164-without-'+' shape the Cloud API expects
 * ("2348012345678"). Returns null if it doesn't look like a plausible
 * Nigerian mobile number, so callers can skip sending rather than firing at
 * a garbage destination.
 */
export function normalizeNigerianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');

  if (digits.startsWith('234') && digits.length === 13) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;

  return null;
}
