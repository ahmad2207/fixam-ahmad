import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

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
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: 'Reset your Fixam password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Reset your password</h2>
            <p>Hi ${user.name ?? 'there'},</p>
            <p>We received a request to reset your Fixam account password. Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Reset Password
            </a>
            <p style="color:#666;font-size:14px">If you did not request a password reset, you can safely ignore this email.</p>
            <p style="color:#666;font-size:12px">Link: ${resetUrl}</p>
          </div>
        `,
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
