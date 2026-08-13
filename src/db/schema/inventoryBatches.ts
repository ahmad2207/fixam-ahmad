import { pgTable, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products';

export const inventoryBatches = pgTable('inventory_batches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantityAvailable: integer('quantity_available').notNull().default(0),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull().default('0'),
  // Which variation option (e.g. "24cm") this batch is for — null for
  // products without priced variations, and for all batches created before
  // this feature. Drives FIFO price/stock per option; see
  // getVariationPricing in lib/inventory.ts.
  variationOption: text('variation_option'),
  // Purely a UI grouping key: every variation line added together in one
  // "Add Batch" submission (one delivery) shares a deliveryGroupId, so the
  // inventory page can drill down Product -> Batch -> Variations. Never
  // read by FIFO/deduction/allocation/pricing logic — those all operate on
  // individual batch rows exactly as before.
  deliveryGroupId: text('delivery_group_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
