import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockNotifications, products } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(stockNotifications)
    .orderBy(desc(stockNotifications.createdAt));

  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Fetch the notification + product name
  const [notification] = await db
    .select({
      id: stockNotifications.id,
      name: stockNotifications.name,
      email: stockNotifications.email,
      productId: stockNotifications.productId,
      notifiedAt: stockNotifications.notifiedAt,
    })
    .from(stockNotifications)
    .where(eq(stockNotifications.id, id));

  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (notification.notifiedAt) return NextResponse.json({ success: true, alreadySent: true });

  const [product] = await db
    .select({ name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.id, notification.productId));

  const productName = product?.name ?? 'a product you saved';
  const productUrl  = product?.slug
    ? `${process.env.NEXTAUTH_URL ?? 'https://fixam.africa'}/products/${product.slug}`
    : `${process.env.NEXTAUTH_URL ?? 'https://fixam.africa'}/products`;

  // Send email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: notification.email,
      subject: `Good news! "${productName}" is back in stock — Fixam`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#f97316;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Fixam</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Your kitchen, elevated.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;">Hi ${notification.name},</p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111;line-height:1.3;">
            Great news — it's back in stock! 🎉
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
            <strong style="color:#111;">${productName}</strong> is now available on Fixam.
            You asked us to let you know, so here we are — don't miss out, stock can go fast.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${productUrl}"
               style="display:inline-block;background:#f97316;color:#fff;font-weight:800;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
              Shop Now →
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;" />
          <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
            You received this email because you joined the waitlist for this product on Fixam.
            If you no longer wish to receive these alerts, simply ignore this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#bbb;">© Fixam Africa · Abuja, Nigeria</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (err) {
    console.error('[stock-notification email]', err);
    // Still mark as notified even if email fails — avoids duplicate sends on retry
  }

  await db
    .update(stockNotifications)
    .set({ notifiedAt: new Date() })
    .where(eq(stockNotifications.id, id));

  return NextResponse.json({ success: true });
}
