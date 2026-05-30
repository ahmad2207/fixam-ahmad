import { pgTable, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products';

export const inventoryBatches = pgTable('inventory_batches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantityAvailable: integer('quantity_available').notNull().default(0),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
