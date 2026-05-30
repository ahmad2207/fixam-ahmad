import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryBatches, products, categories } from '@/db/schema';
import { eq, gt } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batches = await db
    .select({
      quantityAvailable: inventoryBatches.quantityAvailable,
      costPrice: inventoryBatches.costPrice,
      productId: inventoryBatches.productId,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(inventoryBatches)
    .leftJoin(products, eq(inventoryBatches.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(gt(inventoryBatches.quantityAvailable, 0));

  const aggregates: Record<string, { value: number; itemCount: number }> = {};
  let totalValue = 0;

  for (const b of batches) {
    const category = b.categoryName ?? 'Uncategorized';
    const batchValue = b.quantityAvailable * Number(b.costPrice);
    totalValue += batchValue;
    if (!aggregates[category]) aggregates[category] = { value: 0, itemCount: 0 };
    aggregates[category].value += batchValue;
    aggregates[category].itemCount += b.quantityAvailable;
  }

  const breakdown = Object.entries(aggregates)
    .map(([category, data]) => ({ category, value: data.value, itemCount: data.itemCount }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({ totalValue, breakdown });
}
