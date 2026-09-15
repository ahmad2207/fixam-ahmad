import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { products } from './products';
import { comboDeals } from './comboDeals';

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
  // Set only when this line was purchased as part of a combo deal — the
  // price above is this product's *proportional share* of the combo's
  // total price, not its own standalone price (see priceCheckoutItems /
  // expandComboForCheckout in lib/inventory.ts). comboDealName is a
  // snapshot so past orders keep showing the right bundle name even after
  // it's later renamed, edited, or deleted (comboDealId set null then).
  comboDealId: text('combo_deal_id').references(() => comboDeals.id, { onDelete: 'set null' }),
  comboDealName: text('combo_deal_name'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
