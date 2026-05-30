import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  email: text('email'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
