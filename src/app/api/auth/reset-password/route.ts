import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/db/schema';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) {
    return NextResponse.json(
      { error: 'This link is invalid or has expired. Please request a new one.' },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await Promise.all([
    db.update(users).set({ hashedPassword }).where(eq(users.id, record.userId)),
    db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id)),
  ]);

  return NextResponse.json({ success: true });
}
