import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const roleEnum = pgEnum('role', ['admin', 'staff', 'customer']);

export const userRoles = pgTable('user_roles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('customer'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
