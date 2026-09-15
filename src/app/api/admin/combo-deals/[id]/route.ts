import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comboDeals, comboDealItems } from '@/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';
import { getComboDealById, slugifyCombo } from '@/lib/combos';

type Params = { params: Promise<{ id: string }> };

interface ComboItemInput {
  id?: string; // existing comboDealItems.id — present means "update this slot in place"
  productId: string;
  quantity: number;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const combo = await getComboDealById(id);
  if (!combo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(combo);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.query.comboDeals.findFirst({ where: eq(comboDeals.id, id) });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { name, description, imageUrl, price, isActive, items } = body as {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    price?: number | string;
    isActive?: boolean;
    items?: ComboItemInput[];
  };

  if (items !== undefined && (!Array.isArray(items) || items.length < 2)) {
    return NextResponse.json({ error: 'A combo needs at least 2 products' }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comboDeals)
        .set({
          ...(name !== undefined ? { name: name.trim(), slug: body.slug?.trim() || slugifyCombo(name) } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
          ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
          ...(price !== undefined ? { price: String(price) } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(comboDeals.id, id));

      if (items) {
        // Diff against current rows: update-in-place whatever the client sent
        // an existing `id` for (this is what preserves a slot's `position`
        // across a product swap — same row, new productId), insert the rest
        // as new slots, and delete any row not present in the new list.
        const keepIds = items.filter((i) => i.id).map((i) => i.id!) as string[];

        if (keepIds.length > 0) {
          await tx
            .delete(comboDealItems)
            .where(and(eq(comboDealItems.comboDealId, id), notInArray(comboDealItems.id, keepIds)));
        } else {
          await tx.delete(comboDealItems).where(eq(comboDealItems.comboDealId, id));
        }

        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          const quantity = Math.max(1, Number(item.quantity) || 1);
          if (item.id) {
            await tx
              .update(comboDealItems)
              .set({ productId: item.productId, quantity, position: index })
              .where(and(eq(comboDealItems.id, item.id), eq(comboDealItems.comboDealId, id)));
          } else {
            await tx.insert(comboDealItems).values({
              comboDealId: id,
              productId: item.productId,
              quantity,
              position: index,
            });
          }
        }
      }
    });

    const updated = await getComboDealById(id);
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'A combo with this name/slug already exists' }, { status: 409 });
    }
    console.error('PATCH /api/admin/combo-deals/[id]:', err);
    return NextResponse.json({ error: err.message ?? 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(comboDeals).where(eq(comboDeals.id, id));
  return NextResponse.json({ success: true });
}
