import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactMessages } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const { success } = await checkRateLimit('contact', getClientIp(req));
  if (!success) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
  }

  const body = await req.json();
  const { name, email, phone, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  await db.insert(contactMessages).values({
    name:    name.trim(),
    email:   email.trim().toLowerCase(),
    phone:   phone?.trim() || null,
    subject: subject?.trim() || null,
    message: message.trim(),
  });

  return NextResponse.json({ ok: true });
}
