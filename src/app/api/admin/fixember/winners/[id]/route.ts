import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixemberSpins } from '@/db/schema';
import { eq } from 'drizzle-orm';

function isAdminOrStaff(role: unknown) {
  return role === 'admin' || role === 'staff';
}

const VALID_STATUSES = ['pending', 'contacted', 'fulfilled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !isAdminOrStaff((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const { fulfillmentStatus } = await req.json();

  if (!VALID_STATUSES.includes(fulfillmentStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await db.update(fixemberSpins).set({ fulfillmentStatus }).where(eq(fixemberSpins.id, id));
  return NextResponse.json({ ok: true });
}
