import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { deleteFromSpaces } from '@/lib/spaces';
import { isBarcodeUniqueViolation } from '@/lib/barcode';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db.select().from(products).where(eq(products.id, id));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // `stock`, `price` and `costPrice` are deliberately discarded here, no
  // matter what the client sends — this route never touches those columns.
  // The only way to move them is through a real batch via
  // POST /api/admin/inventory/[productId]/batches.
  const { promoEndsAt, restockAt, stock: _stock, price: _price, costPrice: _costPrice, ...rest } = body;

  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };

  // Only touch these when the caller actually included the key — plenty of
  // callers PATCH a single unrelated field (toggleActive, barcode
  // generation) and were, before this check, silently wiping whichever
  // promo/restock date was already set just by omitting it from the body.
  if ('promoEndsAt' in body) {
    updates.promoEndsAt = promoEndsAt ? new Date(promoEndsAt) : null;
  }

  if ('restockAt' in body) {
    const [existing] = await db
      .select({ stock: products.stock, restockAt: products.restockAt })
      .from(products)
      .where(eq(products.id, id));
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let nextRestockAt: Date | null = null;
    if (restockAt) {
      nextRestockAt = new Date(restockAt);
      if (Number.isNaN(nextRestockAt.getTime())) {
        return NextResponse.json({ error: 'Invalid restock date' }, { status: 400 });
      }
      // A restock date is a promise about the future — a past one is never
      // legitimate, it can only be a stale value or a mistake.
      if (nextRestockAt.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Restock date must be in the future' }, { status: 400 });
      }
    }

    const currentTime = existing.restockAt ? existing.restockAt.getTime() : null;
    const nextTime = nextRestockAt ? nextRestockAt.getTime() : null;

    // restockAt only means something while there's no real stock (see the
    // column's own comment) — block setting/changing it while stock is > 0
    // rather than let it go stale the moment a delivery lands. Re-submitting
    // the same value unchanged (or clearing an already-null value) is fine.
    if (existing.stock > 0 && nextTime !== currentTime) {
      return NextResponse.json(
        { error: 'Restock date can only be set while this product is out of stock' },
        { status: 400 },
      );
    }
    updates.restockAt = nextRestockAt;
  }

  try {
    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (isBarcodeUniqueViolation(err)) {
      return NextResponse.json({ error: 'This barcode is already used by another product.' }, { status: 409 });
    }
    console.error('PATCH /api/admin/products/[id]:', err);
    return NextResponse.json({ error: err.message ?? 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (existing.imageUrl) await deleteFromSpaces(existing.imageUrl).catch(() => {});

  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ deleted: true });
}
