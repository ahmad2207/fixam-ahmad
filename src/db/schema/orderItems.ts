import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { products } from './products';

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  productImage: text('product_image'),
  quantity: integer('quantity').notNull(),
  price: text('price').notNull(),
  variation: text('variation'),
  fromReservation: boolean('from_reservation').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
