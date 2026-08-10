import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

// Shared branded shell for every transactional email (order confirmation,
// status updates, payment confirmed, password reset). Email HTML is a
// different discipline from the site's own CSS — table-based layout,
// inline styles only, web-safe fonts. External stylesheets, flexbox/grid,
// custom fonts, and CSS filters (e.g. the brightness-0 invert trick the
// site uses to turn the logo white on dark backgrounds) are unreliable-to-
// broken across real inboxes — Outlook's rendering engine in particular
// only understands a small subset of CSS. That's why the header here is
// white with the logo in its natural color, rather than colored with an
// inverted logo.

const BRAND_ORANGE = '#ff8800'; // matches --primary
const BRAND_ORANGE_DARK = '#e67700';
const BRAND_GREEN = '#0a8800'; // matches the unified storefront green
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const PANEL = '#f9fafb';

// /public/logo-email.png — a 400x400 optimized copy of the site's real
// logo.png (which is 1563x1563 / 109KB, heavier than an email should embed).
const LOGO_PATH = '/logo-email.png';

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

function logoUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${base}${LOGO_PATH}`;
}

// Full-width colored banner right under the header — the primary "eye" of
// the email, so the status reads at a glance even with images off (it's
// pure HTML/CSS, not an image).
export function renderStatusBanner(label: string, emoji: string, color: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color};">
      <tr>
        <td align="center" style="padding:14px 24px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">${emoji ? `${emoji} ` : ''}${escapeHtml(label.toUpperCase())}</span>
        </td>
      </tr>
    </table>`;
}

// Orange filled CTA button, with a subtle darker-orange bottom edge for
// depth (box-shadow support is inconsistent across clients, so depth here
// comes from a real border rather than a shadow).
export function renderButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px">
      <tr>
        <td style="border-radius:10px;background:${BRAND_ORANGE};border-bottom:3px solid ${BRAND_ORANGE_DARK};">
          <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)} →</a>
        </td>
      </tr>
    </table>`;
}

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  image?: string | null;
}

// Each row gets a product thumbnail when one's available — falls back to a
// simple bag-emoji tile when it isn't, rather than leaving a blank gap.
export function renderItemsTable(items: ReceiptItem[]): string {
  const rows = items
    .map((i, idx) => {
      const thumb = i.image
        ? `<img src="${i.image}" width="52" height="52" alt="" style="display:block;width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid ${BORDER};" />`
        : `<table role="presentation" width="52" height="52" cellpadding="0" cellspacing="0" style="width:52px;height:52px;background:${PANEL};border-radius:8px;border:1px solid ${BORDER};"><tr><td align="center" valign="middle" style="font-size:20px;">🛍️</td></tr></table>`;

      return `
      <tr>
        <td width="52" style="padding:12px 0;border-top:${idx === 0 ? 'none' : `1px solid ${BORDER}`};">${thumb}</td>
        <td style="padding:12px 0 12px 12px;border-top:${idx === 0 ? 'none' : `1px solid ${BORDER}`};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};vertical-align:middle;">
          ${escapeHtml(i.name)}
          <br /><span style="color:${MUTED};font-size:12.5px;">Qty ${i.qty}</span>
        </td>
        <td align="right" style="padding:12px 0;border-top:${idx === 0 ? 'none' : `1px solid ${BORDER}`};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${INK};white-space:nowrap;vertical-align:middle;">
          ₦${i.price.toLocaleString()}
        </td>
      </tr>`;
    })
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">${rows}</table>`;
}

export function renderTotals(
  lines: { label: string; value: string; bold?: boolean }[],
): string {
  const rows = lines
    .map(
      (l) => `
      <tr>
        <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${l.bold ? '16px' : '13px'};font-weight:${l.bold ? '800' : '400'};color:${l.bold ? INK : MUTED};">${escapeHtml(l.label)}</td>
        <td align="right" style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:${l.bold ? '16px' : '13px'};font-weight:${l.bold ? '800' : '400'};color:${l.bold ? BRAND_ORANGE_DARK : MUTED};white-space:nowrap;">${escapeHtml(l.value)}</td>
      </tr>`,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 0;border-top:2px solid ${BORDER};">
      <tr><td colspan="2" style="padding-top:14px"></td></tr>
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
  bannerHtml?: string;
}): string {
  const { preheader, bodyHtml, info, bannerHtml } = opts;
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
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
          <tr>
            <td align="center" style="background:#ffffff;padding:28px 32px 20px;">
              <img src="${logoUrl()}" width="120" alt="${escapeHtml(info.storeName)}" style="display:block;width:120px;max-width:120px;height:auto;" />
            </td>
          </tr>
          ${bannerHtml ? `<tr><td>${bannerHtml}</td></tr>` : ''}
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

export const emailColors = {
  orange: BRAND_ORANGE,
  orangeDark: BRAND_ORANGE_DARK,
  green: BRAND_GREEN,
  ink: INK,
  muted: MUTED,
  border: BORDER,
  panel: PANEL,
};
