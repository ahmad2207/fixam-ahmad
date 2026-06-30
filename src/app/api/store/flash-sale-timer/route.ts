import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

export async function GET() {
  try {
    const [row] = await db.select({ flashSaleEnd: storeSettings.flashSaleEnd }).from(storeSettings).limit(1);
    return NextResponse.json({ endsAt: row?.flashSaleEnd?.toISOString() ?? null });
  } catch {
    return NextResponse.json({ endsAt: null });
  }
}
