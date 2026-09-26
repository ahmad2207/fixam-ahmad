import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixemberPrizes, DEFAULT_FIXEMBER_PRIZES } from '@/db/schema';
import { asc } from 'drizzle-orm';

function isAdminOrStaff(role: unknown) {
  return role === 'admin' || role === 'staff';
}

export async function GET() {
  const session = await auth();
  if (!session || !isAdminOrStaff((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rows = await db.select().from(fixemberPrizes).orderBy(asc(fixemberPrizes.sortOrder));

  // First-time setup: seed the requested 8 segments so admin has something
  // to edit immediately (same trick as GET /api/admin/banners).
  if (rows.length === 0) {
    rows = await db.insert(fixemberPrizes).values(DEFAULT_FIXEMBER_PRIZES).returning();
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !isAdminOrStaff((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { label, imageUrl, isPrize, sortOrder, isActive } = body;

  if (!label?.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }

  const [row] = await db.insert(fixemberPrizes).values({
    label: label.trim(),
    imageUrl: imageUrl || null,
    isPrize: isPrize ?? true,
    sortOrder: sortOrder ?? 0,
    isActive: isActive ?? true,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
