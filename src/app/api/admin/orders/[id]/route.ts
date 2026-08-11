import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  orders, orderItems, batchAllocations, inventoryBatches, paymentTransactions,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logAdminAction } from '@/lib/auditLog';
import { sendPaymentConfirmedEmail } from '@/lib/orderNotifications';
import { restoreStockForOrder } from '@/lib/inventory';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  // Fetch FIFO batch allocations for each item
  const itemIds = items.map((i) => i.id);
  const allocRows =
    itemIds.length > 0
      ? await db
          .select({
            id: batchAllocations.id,
            orderItemId: batchAllocations.orderItemId,
            batchId: batchAllocations.batchId,
            quantity: batchAllocations.quantity,
            costPriceAtTime: batchAllocations.costPriceAtTime,
            batchCreatedAt: inventoryBatches.createdAt,
          })
          .from(batchAllocations)
          .leftJoin(inventoryBatches, eq(batchAllocations.batchId, inventoryBatches.id))
          .where(inArray(batchAllocations.orderItemId, itemIds))
      : [];

  // Group allocations by orderItemId
  const allocByItem: Record<string, typeof allocRows> = {};
  for (const a of allocRows) {
    if (!allocByItem[a.orderItemId]) allocByItem[a.orderItemId] = [];
    allocByItem[a.orderItemId].push(a);
  }

  const itemsWithAllocations = items.map((item) => ({
    ...item,
    allocations: (allocByItem[item.id] ?? []).map((a) => ({
      batchId: a.batchId,
      quantity: a.quantity,
      costPriceAtTime: a.costPriceAtTime,
      batchCreatedAt: a.batchCreatedAt?.toISOString() ?? null,
    })),
  }));

  // Total COGS from batch allocations
  const totalCOGS = allocRows.reduce(
    (s, a) => s + a.quantity * Number(a.costPriceAtTime),
    0,
  );

  // Payment transactions for this order
  const txns = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.orderId, id));

  return NextResponse.json({
    ...order,
    items: itemsWithAllocations,
    totalCOGS,
    paymentTransactions: txns,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Partial<typeof existing> = {};
  if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus;

  const [updated] = await db
    .update(orders)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  await logAdminAction({
    userId: session.user?.id ?? '',
    adminName: session.user?.name ?? 'Admin',
    action: 'update',
    entityType: 'order',
    entityId: id,
    before: existing,
    after: updated,
  });

  // Only email on the actual pending -> paid transition (e.g. "Confirm
  // Payment" for a manual/bank-transfer order) — not on every unrelated
  // PATCH, and not repeatedly if it's already confirmed.
  if (body.paymentStatus === 'paid' && existing.paymentStatus !== 'paid') {
    await sendPaymentConfirmedEmail(id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const restored = await db.transaction(async (tx) => {
    // If this order was already cancelled, its stock was already restored
    // at that point (see the status route) — restoring it again here would
    // double-count it. Only restore if it's being deleted directly, never
    // having gone through a cancellation first.
    const restored = existing.status !== 'cancelled'
      ? await restoreStockForOrder(id, `Restored: order ${existing.orderNumber ?? id} was deleted`, tx)
      : [];

    // order_items cascade-deletes with the order (see schema), but
    // batch_allocations.orderItemId has no real FK/cascade to it (kept
    // that way to avoid a circular import — see the schema file's own
    // comment) — without this, deleting the order would leave orphaned
    // allocation rows pointing at order_items that no longer exist.
    const items = await tx.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.orderId, id));
    if (items.length) {
      await tx.delete(batchAllocations).where(inArray(batchAllocations.orderItemId, items.map((i) => i.id)));
    }

    await tx.delete(orders).where(eq(orders.id, id));

    return restored;
  });

  await logAdminAction({
    userId: session.user?.id ?? '',
    adminName: session.user?.name ?? 'Admin',
    action: 'delete',
    entityType: 'order',
    entityId: id,
    before: existing,
    after: null,
  });

  return NextResponse.json({ success: true, stockRestored: restored });
}
