import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const receiptTypeEnum = pgEnum('receipt_type', ['online', 'pos', 'offline']);

export const receipts = pgTable('receipts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  receiptNumber: text('receipt_number').notNull().unique(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  type: receiptTypeEnum('type').notNull().default('online'),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  subtotal: text('subtotal').notNull(),
  deliveryFee: text('delivery_fee').notNull().default('0'),
  total: text('total').notNull(),
  items: text('items').notNull(),
  pdfUrl: text('pdf_url'),
  thermalImageUrl: text('thermal_image_url'),
  driveFileId: text('drive_file_id'),
  driveFileUrl: text('drive_file_url'),
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status').notNull().default('paid'),
  notes: text('notes'),
  createdBy: text('created_by'),
  salesRep: text('sales_rep'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
