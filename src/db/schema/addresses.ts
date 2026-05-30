import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const addresses = pgTable('addresses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').default('Home'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  streetAddress: text('street_address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull().default('Nigeria'),
  postalCode: text('postal_code'),
  abujaZone: text('abuja_zone'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
