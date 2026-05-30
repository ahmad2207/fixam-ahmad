import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminAuditLog } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const limit = Number(searchParams.get('limit') ?? '50');

  const conditions: any[] = [];
  if (entityType) conditions.push(eq(adminAuditLog.entityType, entityType));
  if (entityId) conditions.push(eq(adminAuditLog.entityId, entityId));

  const rows = await db
    .select()
    .from(adminAuditLog)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit);

  return NextResponse.json(rows);
}
