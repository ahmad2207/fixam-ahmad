import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comboDeals, comboDealItems } from '@/db/schema';
import { getAllComboDealsForAdmin, slugifyCombo } from '@/lib/combos';

interface ComboItemInput {
  productId: string;
  quantity: number;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const combosList = await getAllComboDealsForAdmin();
  return NextResponse.json(combosList);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, imageUrl, price, isActive, items } = body as {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number | string;
    isActive?: boolean;
    items: ComboItemInput[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length < 2) {
    return NextResponse.json({ error: 'A combo needs at least 2 products' }, { status: 400 });
  }
  if (!price || Number(price) <= 0) {
    return NextResponse.json({ error: 'A valid combo price is required' }, { status: 400 });
  }

  const slug = body.slug?.trim() || slugifyCombo(name);

  try {
    const combo = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(comboDeals)
        .values({
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          imageUrl: imageUrl || null,
          price: String(price),
          isActive: isActive ?? true,
        })
        .returning();

      await tx.insert(comboDealItems).values(
        items.map((item, index) => ({
          comboDealId: row.id,
          productId: item.productId,
          quantity: Math.max(1, Number(item.quantity) || 1),
          position: index,
        })),
      );

      return row;
    });

    return NextResponse.json(combo, { status: 201 });
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'A combo with this name/slug already exists' }, { status: 409 });
    }
    console.error('POST /api/admin/combo-deals:', err);
    return NextResponse.json({ error: err.message ?? 'Create failed' }, { status: 500 });
  }
}
