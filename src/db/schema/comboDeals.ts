import { pgTable, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products';

// A combo deal is a set of distinct products sold together at one
// admin-set total price (independent of the sum of the parts' own prices).
// Savings/"sum of parts" are never stored here — always computed live from
// the components' current `products.price`, same spirit as how a product's
// own `compareAtPrice` savings are computed elsewhere.
export const comboDeals = pgTable('combo_deals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// One row per product "slot" in a combo. `position` keeps display order
// stable across edits — replacing a product (e.g. it went out of stock)
// just updates `productId` on the same row rather than removing/re-adding,
// so the slot's place in the list doesn't shuffle.
export const comboDealItems = pgTable('combo_deal_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  comboDealId: text('combo_deal_id').notNull().references(() => comboDeals.id, { onDelete: 'cascade' }),
  // Nullable: if the underlying product is deleted, the slot survives (as
  // "needs a replacement") rather than taking the whole combo down with it.
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
