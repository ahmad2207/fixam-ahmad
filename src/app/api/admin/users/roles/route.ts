import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, userRoles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, email, role } = body;

  let targetUserId = userId;

  // If searching by email
  if (!targetUserId && email) {
    const user = await db.select().from(users).where(eq(users.email, email.trim())).limit(1).then((r) => r[0]);
    if (!user) return NextResponse.json({ error: 'User not found. Make sure they have signed up.' }, { status: 404 });
    targetUserId = user.id;
  }

  if (!targetUserId) return NextResponse.json({ error: 'userId or email required' }, { status: 400 });

  // Check if role already exists
  const existing = await db.select().from(userRoles).where(and(eq(userRoles.userId, targetUserId), eq(userRoles.role, role))).limit(1);
  if (existing.length > 0) return NextResponse.json({ error: 'User already has this role' }, { status: 409 });

  await db.update(userRoles).set({ role }).where(eq(userRoles.userId, targetUserId));

  return NextResponse.json({ userId: targetUserId, role });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId } = body;

  await db.update(userRoles).set({ role: 'customer' }).where(eq(userRoles.userId, userId));

  return NextResponse.json({ success: true });
}
