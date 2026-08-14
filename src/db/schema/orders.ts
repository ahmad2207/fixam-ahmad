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
  // Pickup-only statuses — a pickup order never passes through
  // 'shipped'/'delivered', it moves pending/confirmed/processing ->
  // ready_for_pickup -> picked_up instead.
  'ready_for_pickup',
  'picked_up',
]);

export const saleTypeEnum = pgEnum('sale_type', ['online', 'pos', 'offline']);

// Whether an order is fulfilled by shipping it out or by the customer
// collecting it in person. Reused on pendingCheckouts too (see that schema)
// so the choice survives the checkout -> order pipeline without being
// threaded as a separate parameter everywhere.
export const deliveryMethodEnum = pgEnum('delivery_method', ['delivery', 'pickup']);

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
  deliveryMethod: deliveryMethodEnum('delivery_method').notNull().default('delivery'),
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
