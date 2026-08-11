import 'server-only';
import { db } from '@/lib/db';
import { banners } from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { DEFAULT_BY_TYPE } from '@/lib/defaultBanners';
import type { BannerType, Banner } from '@/db/schema/banners';

export async function getActiveBanners(type: BannerType): Promise<Banner[]> {
  let rows = await db.select().from(banners)
    .where(and(eq(banners.bannerType, type), eq(banners.isActive, true)))
    .orderBy(asc(banners.displayOrder));

  if (rows.length === 0) {
    const inserted = await db.insert(banners).values(DEFAULT_BY_TYPE[type]).returning();
    rows = inserted.filter((r) => r.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return rows;
}
