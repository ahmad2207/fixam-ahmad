import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryBatches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncProductStockFromBatches } from '@/lib/inventory';
import { logAdminAction } from '@/lib/auditLog';

// Corrects a mis-entered batch quantity, cost price, selling price, or
// landing date (e.g. a cashier fat-fingered "500" instead of "50" when
// logging a delivery, typo'd a price, or got the physical arrival date
// wrong). All four are editable here — this is a correction to a mistake,
// not a way to rewrite what actually happened; the batch's identity
// (product, variation, delivery) stays put.
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
  const { quantityAvailable, costPrice, sellingPrice, landingDate } = await req.json();

  const updates: Record<string, unknown> = {};

  if (quantityAvailable !== undefined) {
    const quantity = Number(quantityAvailable);
    if (!Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a whole number of 0 or more' },
        { status: 400 },
      );
    }
    updates.quantityAvailable = quantity;
  }

  if (costPrice !== undefined) {
    const cost = Number(costPrice);
    if (!Number.isFinite(cost) || cost < 0) {
      return NextResponse.json({ error: 'Cost price must be a number of 0 or more' }, { status: 400 });
    }
    updates.costPrice = String(cost);
  }

  if (sellingPrice !== undefined) {
    const selling = Number(sellingPrice);
    if (!Number.isFinite(selling) || selling < 0) {
      return NextResponse.json({ error: 'Selling price must be a number of 0 or more' }, { status: 400 });
    }
    updates.sellingPrice = String(selling);
  }

  // landingDate is informational only (see the column's own comment) — it
  // never touches FIFO/pricing/stock, so it's not part of the productStock
  // re-derivation below. `null` is a valid, meaningful value here ("reset to
  // same as upload date"), distinct from the key being absent entirely.
  let landingDateProvided = false;
  if (landingDate !== undefined) {
    landingDateProvided = true;
    if (landingDate === null) {
      updates.landingDate = null;
    } else {
      const parsed = new Date(landingDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid landing date' }, { status: 400 });
      }
      updates.landingDate = parsed;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const [batch] = await db
    .select({ id: inventoryBatches.id, productId: inventoryBatches.productId, landingDate: inventoryBatches.landingDate })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.id, batchId));

  if (!batch || batch.productId !== productId) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  // products.stock/price/costPrice are intentionally never written directly
  // outside real inventory batches (see lib/inventory.ts) — editing the
  // batch and then re-deriving those from all its batches, in the same
  // transaction, keeps that invariant true for a manual correction too.
  const productStock = await db.transaction(async (tx) => {
    await tx
      .update(inventoryBatches)
      .set(updates)
      .where(eq(inventoryBatches.id, batchId));

    return syncProductStockFromBatches(productId, tx);
  });

  // landingDate exists specifically so an auditor can trust when goods
  // physically arrived — unlike the other batch corrections above, an edit
  // to this one specifically gets its own paper trail (who changed it, and
  // from/to what), since a silently-editable audit field undermines its own
  // purpose.
  if (landingDateProvided) {
    await logAdminAction({
      userId: session.user?.id ?? '',
      adminName: session.user?.name ?? 'Admin',
      action: 'update',
      entityType: 'inventory_batch',
      entityId: batchId,
      before: { landingDate: batch.landingDate },
      after: { landingDate: updates.landingDate },
    });
  }

  return NextResponse.json({ id: batchId, ...updates, productStock });
}
