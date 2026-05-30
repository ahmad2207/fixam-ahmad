import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
