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
  // Purely informational — never read by FIFO/deduction/allocation/pricing
  // logic, and never used to order batches (createdAt alone still drives
  // FIFO sell-order). Null means "same as createdAt" (the common case: the
  // system-entry date IS the day it physically arrived); a non-null value
  // is an admin's explicit correction for when goods sat in transit/customs
  // before being logged, or a delivery entered days after it actually
  // landed. Exists so an auditor can see when goods physically arrived,
  // independent of when someone got around to typing it into the system —
  // e.g. for reconciling offline/cash settlements against a real delivery
  // date. Read as `landingDate ?? createdAt` everywhere it's displayed.
  landingDate: timestamp('landing_date', { mode: 'date' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
