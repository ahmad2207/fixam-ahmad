import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getStoreContactInfo, renderEmailLayout, renderButton, emailColors } from '@/lib/emailLayout';

export async function POST(req: NextRequest) {
  const { success } = await checkRateLimit('forgotPassword', getClientIp(req));
  if (!success) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Always return success to avoid revealing whether an email exists
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const info = await getStoreContactInfo();

      const bodyHtml = `
        <h1 style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${emailColors.ink};">Reset your password</h1>
        <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${emailColors.ink};line-height:1.6;">
          Hi ${user.name ?? 'there'},
        </p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${emailColors.muted};line-height:1.6;">
          We received a request to reset your ${info.storeName} account password. This link expires in 1 hour.
        </p>
        ${renderButton('Reset Password', resetUrl)}
        <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${emailColors.muted};line-height:1.6;">
          Didn't request this? You can safely ignore this email — your password won't change.
        </p>
        <p style="margin:16px 0 0;padding-top:16px;border-top:1px solid ${emailColors.border};font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${emailColors.muted};word-break:break-all;">
          Or paste this link into your browser: ${resetUrl}
        </p>
      `;

      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `Reset your password — ${info.storeName}`,
        html: renderEmailLayout({ preheader: 'Use this link to reset your password.', bodyHtml, info }),
      });
      // resend.emails.send() resolves (never throws) on API-level failures like an
      // unverified sending domain, so the error must be checked explicitly here.
      if (error) {
        console.error('[forgot-password] email error:', error);
      }
    } catch (err) {
      console.error('[forgot-password] email error:', err);
    }
  }

  return NextResponse.json({ success: true });
}
