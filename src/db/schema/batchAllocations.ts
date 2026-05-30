import { pgTable, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { inventoryBatches } from './inventoryBatches';

export const batchAllocations = pgTable('batch_allocations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  // orderItemId FK enforced via migration; no .references() to avoid circular import with orderItems
  orderItemId: text('order_item_id').notNull(),
  batchId: text('batch_id').notNull().references(() => inventoryBatches.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  costPriceAtTime: numeric('cost_price_at_time', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
