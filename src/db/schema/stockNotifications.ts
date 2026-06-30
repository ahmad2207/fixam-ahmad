import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const stockNotifications = pgTable('stock_notifications', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId:  text('product_id').notNull(),
  name:       text('name').notNull(),
  email:      text('email').notNull(),
  phone:      text('phone'),
  notifiedAt: timestamp('notified_at', { mode: 'date' }),
  createdAt:  timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type StockNotification    = typeof stockNotifications.$inferSelect;
export type NewStockNotification = typeof stockNotifications.$inferInsert;
