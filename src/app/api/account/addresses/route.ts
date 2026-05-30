import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { addresses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const rows = await db.select().from(addresses).where(eq(addresses.userId, userId));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const body = await req.json();

  const [row] = await db.insert(addresses).values({
    userId,
    label: body.label || 'Home',
    fullName: body.fullName,
    phone: body.phone,
    streetAddress: body.streetAddress,
    city: body.city,
    state: body.state,
    abujaZone: body.abujaZone,
    isDefault: body.isDefault ?? false,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
