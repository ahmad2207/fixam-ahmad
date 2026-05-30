import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { addresses } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;

  const body = await req.json();

  const [row] = await db
    .update(addresses)
    .set({
      label: body.label,
      fullName: body.fullName,
      phone: body.phone,
      streetAddress: body.streetAddress,
      city: body.city,
      state: body.state,
      abujaZone: body.abujaZone,
      isDefault: body.isDefault,
    })
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;

  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  return NextResponse.json({ success: true });
}
