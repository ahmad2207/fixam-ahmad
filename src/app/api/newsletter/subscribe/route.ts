import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSubscribers } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    await db
      .insert(newsletterSubscribers)
      .values({ email: email.toLowerCase().trim() })
      .onConflictDoNothing();

    return NextResponse.json({ subscribed: true });
  } catch (err: any) {
    console.error('[newsletter/subscribe]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
