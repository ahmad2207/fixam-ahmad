import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stockNotifications } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { productId, name, email, phone } = await req.json();

    if (!productId || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    await db.insert(stockNotifications).values({
      productId,
      name:  name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
