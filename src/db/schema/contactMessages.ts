import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const contactMessages = pgTable('contact_messages', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      text('name').notNull(),
  email:     text('email').notNull(),
  phone:     text('phone'),
  subject:   text('subject'),
  message:   text('message').notNull(),
  status:    text('status').notNull().default('new'), // 'new' | 'read' | 'replied'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type ContactMessage    = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
