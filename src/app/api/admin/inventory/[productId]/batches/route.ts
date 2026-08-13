import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryBatches } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { addInventoryBatch, addInventoryBatchGroup, type BatchGroupLine } from '@/lib/inventory';

export async function GET(_: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const rows = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const body = await req.json();

  // Priced-variation products submit a whole delivery at once — one line
  // per variation option that actually arrived, plus (optionally) which
  // option's price should now be "the" storefront price. Non-priced
  // products keep the original single-line shape below, unchanged.
  if (Array.isArray(body.lines)) {
    const rawLines = body.lines as Array<{
      variationOption?: string;
      quantity?: number;
      costPrice?: number;
      sellingPrice?: number;
    }>;
    const activeLines = rawLines.filter((l) => Number(l.quantity) > 0);

    if (!activeLines.length) {
      return NextResponse.json({ error: 'Enter a quantity for at least one variation' }, { status: 400 });
    }

    const parsedLines: BatchGroupLine[] = [];
    for (const line of activeLines) {
      if (!line.variationOption || !line.costPrice || !line.sellingPrice) {
        return NextResponse.json(
          { error: 'Every variation with a quantity needs a cost price and selling price' },
          { status: 400 },
        );
      }
      parsedLines.push({
        variationOption: line.variationOption,
        quantity: Number(line.quantity),
        costPrice: Number(line.costPrice),
        sellingPrice: Number(line.sellingPrice),
      });
    }

    const { deliveryGroupId, batchIds } = await addInventoryBatchGroup(
      productId,
      parsedLines,
      body.defaultVariationOption || undefined,
    );
    return NextResponse.json({ deliveryGroupId, batchIds }, { status: 201 });
  }

  const { quantity, costPrice, sellingPrice } = body;

  if (!quantity || !costPrice || !sellingPrice) {
    return NextResponse.json({ error: 'quantity, costPrice and sellingPrice are required' }, { status: 400 });
  }

  const batchId = await addInventoryBatch(productId, Number(quantity), Number(costPrice), Number(sellingPrice));
  return NextResponse.json({ batchId }, { status: 201 });
}
