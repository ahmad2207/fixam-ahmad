import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// One row per wheel segment. The wheel is rendered from however many active
// rows exist (sorted by sortOrder), not a hardcoded slice count — so an
// admin adding/removing a row actually reshapes the wheel. isPrize=false
// segments are the "you didn't win" outcomes (e.g. "Try Again", "Shop With
// Us Next Time") — the wheel's visual mix of prize vs non-prize segments has
// no bearing on actual win odds, see src/lib/fixember.ts's WIN_PROBABILITY.
export const fixemberPrizes = pgTable('fixember_prizes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  label: text('label').notNull(),
  imageUrl: text('image_url'),
  isPrize: boolean('is_prize').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export type FixemberPrize = typeof fixemberPrizes.$inferSelect;
export type NewFixemberPrize = typeof fixemberPrizes.$inferInsert;

// Seeded into the table the first time an admin opens the Fixember page
// against an empty table (see GET /api/admin/fixember/prizes) — the exact
// 8 segments requested for the initial campaign.
export const DEFAULT_FIXEMBER_PRIZES: Pick<NewFixemberPrize, 'label' | 'isPrize' | 'sortOrder'>[] = [
  { label: 'Airfryer',                 isPrize: true,  sortOrder: 0 },
  { label: 'Try Again',                isPrize: false, sortOrder: 1 },
  { label: 'Mug',                      isPrize: true,  sortOrder: 2 },
  { label: 'Shop With Us Next Time',   isPrize: false, sortOrder: 3 },
  { label: 'Wooden Spoon',             isPrize: true,  sortOrder: 4 },
  { label: 'Vacuum Flask',             isPrize: true,  sortOrder: 5 },
  { label: 'Shop With Us Next Time',   isPrize: false, sortOrder: 6 },
  { label: 'Silicon Spoon',            isPrize: true,  sortOrder: 7 },
];
