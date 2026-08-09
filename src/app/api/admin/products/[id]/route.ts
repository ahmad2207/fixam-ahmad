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

  const { promoEndsAt, restockAt, ...rest } = body;

  try {
    const [updated] = await db
      .update(products)
      .set({
        ...rest,
        promoEndsAt: promoEndsAt ? new Date(promoEndsAt) : null,
        restockAt: restockAt ? new Date(restockAt) : null,
        updatedAt: new Date(),
      })
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
