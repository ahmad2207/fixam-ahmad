import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminAuditLog = pgTable('admin_audit_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  adminName: text('admin_name'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  details: jsonb('details'),
  before: jsonb('before'),
  after: jsonb('after'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
