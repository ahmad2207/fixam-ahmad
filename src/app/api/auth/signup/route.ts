import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, profiles, userRoles } from '@/db/schema';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = crypto.randomUUID();

  await db.insert(users).values({ id: userId, name, email, hashedPassword });
  await db.insert(profiles).values({ userId, fullName: name, email });
  await db.insert(userRoles).values({ userId, role: 'customer' });

  return NextResponse.json({ success: true });
}
