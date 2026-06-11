import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactMessages } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const messages = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  return NextResponse.json(messages);
}
