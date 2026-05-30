import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { batchAllocations, orderItems } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get all orderItems for this order
  const items = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  if (items.length === 0) {
    return NextResponse.json([]);
  }

  const itemIds = items.map((i) => i.id);

  const allocations = await db
    .select()
    .from(batchAllocations)
    .where(inArray(batchAllocations.orderItemId, itemIds));

  return NextResponse.json(allocations);
}
