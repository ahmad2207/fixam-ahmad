import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import { getDefaultDeliveryConfig, mergeDeliveryConfig, type DeliveryConfig } from '@/lib/deliveryFees';

async function getOrCreateSettings() {
  const [row] = await db.select().from(storeSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(storeSettings).values({}).returning();
  return created;
}

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = await getOrCreateSettings();
  const config = mergeDeliveryConfig(row.deliveryConfig as Partial<DeliveryConfig> | null);
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config: DeliveryConfig = await req.json();
  await getOrCreateSettings();
  await db.update(storeSettings).set({ deliveryConfig: config, updatedAt: new Date() });

  return NextResponse.json(config);
}
