import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products';
import { users } from './users';

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
