import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_STATUSES = ['new', 'read', 'replied'] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  return NextResponse.json({ ok: true });
}
