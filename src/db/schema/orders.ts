import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { addresses } from './addresses';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const saleTypeEnum = pgEnum('sale_type', ['online', 'pos', 'offline']);

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').unique(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestEmail: text('guest_email'),
  addressId: text('address_id').references(() => addresses.id, { onDelete: 'set null' }),
  status: orderStatusEnum('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  saleType: saleTypeEnum('sale_type').notNull().default('online'),
  subtotal: text('subtotal').notNull(),
  deliveryFee: text('delivery_fee').notNull().default('0'),
  total: text('total').notNull(),
  shippingFullName: text('shipping_full_name'),
  shippingPhone: text('shipping_phone'),
  shippingStreetAddress: text('shipping_street_address'),
  shippingCity: text('shipping_city'),
  shippingState: text('shipping_state'),
  shippingAbujaZone: text('shipping_abuja_zone'),
  notes: text('notes'),
  checkoutId: text('checkout_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
