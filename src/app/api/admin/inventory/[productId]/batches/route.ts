import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryBatches } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { addInventoryBatch } from '@/lib/inventory';

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
  const { quantity, costPrice } = await req.json();

  if (!quantity || !costPrice) {
    return NextResponse.json({ error: 'quantity and costPrice are required' }, { status: 400 });
  }

  const batchId = await addInventoryBatch(productId, Number(quantity), Number(costPrice));
  return NextResponse.json({ batchId }, { status: 201 });
}
