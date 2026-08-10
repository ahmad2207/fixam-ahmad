import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

// Shared branded shell for every transactional email (order confirmation,
// status updates, payment confirmed, password reset). Email HTML is a
// different discipline from the site's own CSS — table-based layout,
// inline styles only, web-safe fonts. External stylesheets, flexbox/grid,
// and custom fonts are unreliable-to-broken across real inboxes (Outlook's
// engine in particular only understands a small subset of CSS).

const BRAND_ORANGE = '#ff8800'; // matches --primary
const BRAND_GREEN = '#0a8800'; // matches the unified storefront green
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const PANEL = '#f9fafb';

export interface StoreContactInfo {
  storeName: string;
  storeEmail: string | null;
  storePhone: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
}

let cachedContactInfo: StoreContactInfo | null = null;

// Cheap in-memory cache for the lifetime of one serverless invocation —
// avoids a second DB round-trip if a caller already has settings, and
// costs nothing extra if it doesn't (each invocation starts fresh anyway).
export async function getStoreContactInfo(): Promise<StoreContactInfo> {
  if (cachedContactInfo) return cachedContactInfo;
  const [row] = await db.select().from(storeSettings).limit(1);
  cachedContactInfo = {
    storeName: row?.storeName || 'Fixam Africa',
    storeEmail: row?.storeEmail || 'support@fixam.africa',
    storePhone: row?.storePhone || null,
    whatsappNumber: row?.whatsappNumber || null,
    instagramUrl: row?.instagramUrl || null,
    twitterUrl: row?.twitterUrl || null,
    facebookUrl: row?.facebookUrl || null,
  };
  return cachedContactInfo;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// A colored badge used at the top of the body for order/status emails —
// e.g. a green "Delivered" pill or a red "Cancelled" one.
export function renderBadge(label: string, color: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
      <tr>
        <td style="background:${color}1a;border-radius:999px;padding:6px 16px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${color};letter-spacing:0.3px;">${escapeHtml(label)}</span>
        </td>
      </tr>
    </table>`;
}

// Orange filled CTA button.
export function renderButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
      <tr>
        <td style="border-radius:10px;background:${BRAND_ORANGE};">
          <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

export function renderItemsTable(
  items: { name: string; qty: number; price: number }[],
): string {
  const rows = items
    .map(
      (i, idx) => `
      <tr>
        <td style="padding:12px 0;border-top:${idx === 0 ? 'none' : `1px solid ${BORDER}`};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};">
          ${escapeHtml(i.name)}
          <span style="color:${MUTED};font-size:13px;"> × ${i.qty}</span>
        </td>
        <td align="right" style="padding:12px 0;border-top:${idx === 0 ? 'none' : `1px solid ${BORDER}`};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};white-space:nowrap;">
          ₦${i.price.toLocaleString()}
        </td>
      </tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

export function renderTotals(
  lines: { label: string; value: string; bold?: boolean }[],
): string {
  const rows = lines
    .map(
      (l) => `
      <tr>
        <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${l.bold ? '15px' : '13px'};font-weight:${l.bold ? '700' : '400'};color:${l.bold ? INK : MUTED};">${escapeHtml(l.label)}</td>
        <td align="right" style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${l.bold ? '15px' : '13px'};font-weight:${l.bold ? '700' : '400'};color:${l.bold ? INK : MUTED};white-space:nowrap;">${escapeHtml(l.value)}</td>
      </tr>`,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;border-top:1px solid ${BORDER};padding-top:12px;">
      <tr><td colspan="2" style="padding-top:12px"></td></tr>
      ${rows}
    </table>`;
}

function renderSocialLinks(info: StoreContactInfo): string {
  const links: string[] = [];
  if (info.instagramUrl) links.push(`<a href="${info.instagramUrl}" style="color:${MUTED};text-decoration:none;margin:0 6px;">Instagram</a>`);
  if (info.twitterUrl) links.push(`<a href="${info.twitterUrl}" style="color:${MUTED};text-decoration:none;margin:0 6px;">X</a>`);
  if (info.facebookUrl) links.push(`<a href="${info.facebookUrl}" style="color:${MUTED};text-decoration:none;margin:0 6px;">Facebook</a>`);
  if (!links.length) return '';
  return `<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;">${links.join(' · ')}</p>`;
}

export function renderEmailLayout(opts: {
  preheader: string;
  bodyHtml: string;
  info: StoreContactInfo;
}): string {
  const { preheader, bodyHtml, info } = opts;
  const contactLine = [info.storePhone, info.whatsappNumber ? `WhatsApp: ${info.whatsappNumber}` : null]
    .filter(Boolean)
    .join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(info.storeName)}</title>
</head>
<body style="margin:0;padding:0;background:${PANEL};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PANEL};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
          <tr>
            <td style="background:${BRAND_ORANGE};padding:26px 32px;">
              <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">${escapeHtml(info.storeName.toUpperCase())}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:${PANEL};padding:22px 32px;border-top:1px solid ${BORDER};">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">
                ${escapeHtml(info.storeName)}${contactLine ? ` · ${escapeHtml(contactLine)}` : ''}
              </p>
              ${renderSocialLinks(info)}
              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${MUTED};">
                You're receiving this because it relates to an order or account on ${escapeHtml(info.storeName)}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const emailColors = { orange: BRAND_ORANGE, green: BRAND_GREEN, ink: INK, muted: MUTED, border: BORDER, panel: PANEL };
