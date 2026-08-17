import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const paymentStatusEnum = pgEnum('payment_status', [
  'initiated',
  'pending',
  'successful',
  'failed',
  'cancelled',
  // Money was actually collected ('successful'), then given back — reversed
  // in Paystack's dashboard, or handed back in cash / issued as store credit
  // for POD, outside this app. Set when an order's status is changed to
  // 'refunded' (see /api/admin/orders/[id]/status). Distinct from
  // 'cancelled', which means money was never collected in the first place.
  'refunded',
]);

// Which payment rail this transaction moved through. 'paystack' rows are
// created by /api/payment/init and updated by /api/payment/verify;
// 'pod' rows (cash on delivery *or* cash on pickup — deliveryMethod on the
// joined order disambiguates which) are created by /api/payment/pod and
// updated when an admin confirms payment on the order. Defaults to
// 'paystack' so every pre-existing row (all of which were, in fact, Paystack
// transactions) backfills correctly without a data migration.
export const paymentProviderEnum = pgEnum('payment_provider', ['paystack', 'pod']);

export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  checkoutId: text('checkout_id'),
  provider: paymentProviderEnum('provider').notNull().default('paystack'),
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
