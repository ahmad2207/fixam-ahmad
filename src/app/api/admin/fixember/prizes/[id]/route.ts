import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixemberPrizes } from '@/db/schema';
import { eq } from 'drizzle-orm';

function isAdminOrStaff(role: unknown) {
  return role === 'admin' || role === 'staff';
}

// Named-field allow-list (not a raw ...body spread) — keeps a stray client
// field from silently overwriting a column it shouldn't touch.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !isAdminOrStaff((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { label, imageUrl, isPrize, sortOrder, isActive } = body;

  const [existing] = await db.select().from(fixemberPrizes).where(eq(fixemberPrizes.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.update(fixemberPrizes).set({
    ...(label !== undefined ? { label } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
    ...(isPrize !== undefined ? { isPrize } : {}),
    ...(sortOrder !== undefined ? { sortOrder } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    updatedAt: new Date(),
  }).where(eq(fixemberPrizes.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !isAdminOrStaff((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(fixemberPrizes).where(eq(fixemberPrizes.id, id));
  return NextResponse.json({ ok: true });
}
