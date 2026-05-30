import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return NextResponse.json(row ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json();

  const [row] = await db
    .update(profiles)
    .set({ fullName: body.fullName, phone: body.phone, avatarUrl: body.avatarUrl })
    .where(eq(profiles.userId, userId))
    .returning();

  if (!row) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json(row);
}
