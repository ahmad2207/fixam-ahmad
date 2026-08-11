import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

async function ensureSettings() {
  const [row] = await db.select().from(storeSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(storeSettings).values({}).returning();
  return created;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db.select({ flashSaleEnd: storeSettings.flashSaleEnd }).from(storeSettings).limit(1);
  return NextResponse.json({ endsAt: row?.flashSaleEnd?.toISOString() ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endsAt } = await req.json();
  await ensureSettings();

  await db.update(storeSettings).set({
    flashSaleEnd: endsAt ? new Date(endsAt) : null,
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, endsAt: endsAt ?? null });
}
