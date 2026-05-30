import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
