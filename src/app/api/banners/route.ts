import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { banners } from '@/db/schema';
import { asc, and, eq } from 'drizzle-orm';
import { DEFAULT_BY_TYPE } from '@/lib/defaultBanners';
import type { BannerType } from '@/db/schema/banners';

const VALID_TYPES: BannerType[] = ['hero', 'side', 'promo', 'cta'];

export async function GET(req: NextRequest) {
  const type = (req.nextUrl.searchParams.get('type') ?? 'hero') as BannerType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  let rows = await db.select().from(banners)
    .where(and(eq(banners.bannerType, type)))
    .orderBy(asc(banners.displayOrder));

  // Seed defaults on first access
  if (rows.length === 0) {
    rows = await db.insert(banners).values(DEFAULT_BY_TYPE[type]).returning();
    rows.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const active = rows.filter((r) => r.isActive);
  return NextResponse.json(active);
}
