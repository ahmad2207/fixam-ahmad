import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { banners } from '@/db/schema';
import { asc, and, eq } from 'drizzle-orm';
import { DEFAULT_BY_TYPE } from '@/lib/defaultBanners';
import type { BannerType } from '@/db/schema/banners';

const VALID_TYPES: BannerType[] = ['hero', 'side', 'promo', 'cta'];

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const typeParam = req.nextUrl.searchParams.get('type') as BannerType | null;
  const type: BannerType = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : 'hero';

  let rows = await db.select().from(banners)
    .where(eq(banners.bannerType, type))
    .orderBy(asc(banners.displayOrder));

  // First-time setup: seed defaults so admin can manage them immediately
  if (rows.length === 0) {
    rows = await db.insert(banners).values(DEFAULT_BY_TYPE[type]).returning();
    rows.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { bannerType, title, imageUrl, eyebrow, heading, subheading, ctaLabel, ctaHref, theme, displayOrder, isActive } = body;

  const resolvedType: BannerType = VALID_TYPES.includes(bannerType) ? bannerType : 'hero';
  const requiresImage = resolvedType !== 'cta';

  if (!title || !heading || (requiresImage && !imageUrl)) {
    return NextResponse.json({ error: 'title and heading are required; imageUrl required for non-CTA banners' }, { status: 400 });
  }

  const [row] = await db.insert(banners).values({
    bannerType:   resolvedType,
    title,
    imageUrl:     imageUrl || null,
    eyebrow:      eyebrow || null,
    heading,
    subheading:   subheading || null,
    ctaLabel:     ctaLabel || null,
    ctaHref:      ctaHref || null,
    theme:        theme ?? 'dark',
    displayOrder: displayOrder ?? 0,
    isActive:     isActive ?? true,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
