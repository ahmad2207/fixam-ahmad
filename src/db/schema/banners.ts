import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export type BannerType = 'hero' | 'side' | 'promo' | 'cta';

export const BANNER_TYPE_META: Record<BannerType, { label: string; hint: string; max: number }> = {
  hero:  { label: 'Hero Carousel',  hint: 'Full-width auto-sliding banner at the top of the homepage',          max: 10 },
  side:  { label: 'Side Tiles',     hint: 'Two compact tiles beside the carousel — desktop only (first 2 used)', max: 2  },
  promo: { label: 'Promo Grid',     hint: 'Three-column promo banners below Flash Deals (first 3 used)',         max: 3  },
  cta:   { label: 'CTA Banner',     hint: 'Full-width promotional strip below all product sections (first 1 used, no image needed)', max: 1 },
};

export const banners = pgTable('banners', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bannerType:   text('banner_type').notNull().default('hero'),          // 'hero' | 'side' | 'promo' | 'cta'
  title:        text('title').notNull(),                                 // internal admin label
  imageUrl:     text('image_url'),                                       // nullable — CTA banners have no image
  eyebrow:      text('eyebrow'),                                         // small badge / eyebrow text
  heading:      text('heading').notNull(),                               // use \n for line breaks
  subheading:   text('subheading'),
  ctaLabel:     text('cta_label'),
  ctaHref:      text('cta_href'),
  theme:        text('theme').notNull().default('dark'),                 // key into BANNER_THEMES
  displayOrder: integer('display_order').notNull().default(0),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export type Banner    = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

export const BANNER_THEMES: Record<string, {
  label: string; swatch: string;
  overlayFrom: string; overlayVia: string; ctaColor: string; badgeBg: string;
}> = {
  orange: { label: 'Orange',  swatch: 'bg-orange-500', overlayFrom: 'from-orange-600', overlayVia: 'via-orange-500/90 via-40%', ctaColor: 'text-orange-600', badgeBg: 'bg-white/20' },
  red:    { label: 'Red',     swatch: 'bg-red-500',    overlayFrom: 'from-red-600',    overlayVia: 'via-red-500/90 via-40%',    ctaColor: 'text-red-600',    badgeBg: 'bg-white/20' },
  dark:   { label: 'Dark',    swatch: 'bg-gray-900',   overlayFrom: 'from-gray-900',   overlayVia: 'via-gray-800/90 via-40%',   ctaColor: 'text-orange-500', badgeBg: 'bg-white/20' },
  blue:   { label: 'Blue',    swatch: 'bg-blue-600',   overlayFrom: 'from-blue-700',   overlayVia: 'via-blue-600/90 via-40%',   ctaColor: 'text-blue-600',   badgeBg: 'bg-white/20' },
  green:  { label: 'Green',   swatch: 'bg-green-600',  overlayFrom: 'from-green-700',  overlayVia: 'via-green-600/90 via-40%',  ctaColor: 'text-green-600',  badgeBg: 'bg-white/20' },
  purple: { label: 'Purple',  swatch: 'bg-purple-600', overlayFrom: 'from-purple-700', overlayVia: 'via-purple-600/90 via-40%', ctaColor: 'text-purple-600', badgeBg: 'bg-white/20' },
};
