import { pgTable, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { inventoryBatches } from './inventoryBatches';
import { products } from './products';

export const reservationStatusEnum = pgEnum('reservation_status', ['active', 'consumed', 'released', 'expired']);

export const stockReservations = pgTable('stock_reservations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  checkoutId: text('checkout_id').notNull(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  batchId: text('batch_id').notNull().references(() => inventoryBatches.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  status: reservationStatusEnum('status').notNull().default('active'),
  consumedOrderItemId: text('consumed_order_item_id'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
