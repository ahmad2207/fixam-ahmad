import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { fixemberPrizes } from './fixemberPrizes';

// One row per order that has spun the Fixember wheel — the winner ledger.
// orderId is UNIQUE: that's the actual race guard for "exactly one spin per
// order" (a plain check-then-insert has a TOCTOU gap under concurrent
// requests; a DB unique constraint doesn't — see src/lib/fixember.ts).
export const fixemberSpins = pgTable('fixember_spins', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().unique().references(() => orders.id),
  // Snapshot off the order at spin time — never trust identity posted by
  // the client, and these survive the order/prize rows changing later.
  userId: text('user_id'),
  guestEmail: text('guest_email'),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  prizeId: text('prize_id').references(() => fixemberPrizes.id, { onDelete: 'set null' }),
  prizeLabel: text('prize_label').notNull(),
  isWin: boolean('is_win').notNull(),
  // Only meaningful when isWin — admin's manual follow-up tracker.
  fulfillmentStatus: text('fulfillment_status').notNull().default('pending'), // 'pending' | 'contacted' | 'fulfilled'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type FixemberSpin = typeof fixemberSpins.$inferSelect;
export type NewFixemberSpin = typeof fixemberSpins.$inferInsert;
