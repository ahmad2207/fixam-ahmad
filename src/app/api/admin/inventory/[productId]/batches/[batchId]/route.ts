import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryBatches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncProductStockFromBatches } from '@/lib/inventory';

// Corrects a mis-entered batch quantity (e.g. a cashier fat-fingered "500"
// instead of "50" when logging a delivery). Only `quantityAvailable` is
// editable here — the batch's cost price and history stay put; this is a
// correction to a typo, not a way to rewrite what actually happened.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; batchId: string }> },
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId, batchId } = await params;
  const { quantityAvailable } = await req.json();

  const quantity = Number(quantityAvailable);
  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json(
      { error: 'Quantity must be a whole number of 0 or more' },
      { status: 400 },
    );
  }

  const [batch] = await db
    .select({ id: inventoryBatches.id, productId: inventoryBatches.productId })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.id, batchId));

  if (!batch || batch.productId !== productId) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  // products.stock is intentionally never written directly outside real
  // inventory batches (see lib/inventory.ts) — editing the batch and then
  // re-deriving stock as the sum of all its batches, in the same
  // transaction, keeps that invariant true for a manual correction too.
  const productStock = await db.transaction(async (tx) => {
    await tx
      .update(inventoryBatches)
      .set({ quantityAvailable: quantity })
      .where(eq(inventoryBatches.id, batchId));

    return syncProductStockFromBatches(productId, tx);
  });

  return NextResponse.json({ id: batchId, quantityAvailable: quantity, productStock });
}
