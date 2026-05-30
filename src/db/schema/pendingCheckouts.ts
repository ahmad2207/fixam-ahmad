import { pgTable, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { addresses } from './addresses';

export const checkoutStatusEnum = pgEnum('checkout_status', ['pending', 'paid', 'expired', 'cancelled']);

export const pendingCheckouts = pgTable('pending_checkouts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  guestEmail: text('guest_email'),
  addressId: text('address_id').references(() => addresses.id, { onDelete: 'set null' }),
  notes: text('notes'),
  paymentMethod: text('payment_method'),
  items: jsonb('items').notNull().$type<Array<{
    product_id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
    variation: string | null;
  }>>(),
  shippingAddress: jsonb('shipping_address').$type<{
    fullName: string;
    phone: string;
    streetAddress: string;
    city: string;
    state: string;
    abujaZone?: string;
  }>(),
  subtotal: text('subtotal').notNull(),
  deliveryFee: text('delivery_fee').notNull(),
  total: text('total').notNull(),
  status: checkoutStatusEnum('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
