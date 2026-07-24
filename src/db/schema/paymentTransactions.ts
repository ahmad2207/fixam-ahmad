import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const paymentStatusEnum = pgEnum('payment_status', [
  'initiated',
  'pending',
  'successful',
  'failed',
  'cancelled',
]);

export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  checkoutId: text('checkout_id'),
  paystackReference: text('paystack_reference').unique(),
  paystackTransactionId: text('paystack_transaction_id'),
  amount: text('amount').notNull(),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  currency: text('currency').notNull().default('NGN'),
  status: paymentStatusEnum('status').notNull().default('initiated'),
  rawResponse: text('raw_response'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
