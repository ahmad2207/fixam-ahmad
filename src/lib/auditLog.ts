import { db } from '@/lib/db';
import { adminAuditLog } from '@/db/schema';

interface AuditParams {
  userId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  details?: Record<string, unknown>;
}

export async function logAdminAction({
  userId,
  adminName,
  action,
  entityType,
  entityId,
  before,
  after,
  details,
}: AuditParams) {
  try {
    await db.insert(adminAuditLog).values({
      userId,
      adminName,
      action,
      entityType,
      entityId,
      before: before ?? null,
      after: after ?? null,
      details: details ?? null,
    });
  } catch {
    // audit log failures should never break the main operation
  }
}
