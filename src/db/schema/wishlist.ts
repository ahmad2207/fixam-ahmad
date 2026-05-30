import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products';
import { users } from './users';

export const wishlist = pgTable('wishlist', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
