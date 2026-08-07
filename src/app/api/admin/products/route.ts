import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { desc, lt, eq } from 'drizzle-orm';
import { insertProductWithBarcode } from '@/lib/barcode-server';
import { isBarcodeUniqueViolation } from '@/lib/barcode';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const lowStock = searchParams.get('lowStock') === 'true';
  const threshold = parseInt(searchParams.get('threshold') ?? '10', 10);

  if (lowStock) {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        imageUrl: products.imageUrl,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(lt(products.stock, threshold))
      .orderBy(products.stock);

    return NextResponse.json(
      rows.map((r) => ({ id: r.id, name: r.name, stock: r.stock, imageUrl: r.imageUrl, category: r.categoryName ?? null }))
    );
  }

  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { promoEndsAt, restockAt, ...rest } = body;
  const slug = rest.slug || slugify(rest.name);

  try {
    const product = await insertProductWithBarcode({
      ...rest,
      slug,
      promoEndsAt: promoEndsAt ? new Date(promoEndsAt) : null,
      restockAt: restockAt ? new Date(restockAt) : null,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    if (isBarcodeUniqueViolation(err)) {
      return NextResponse.json({ error: 'This barcode is already used by another product.' }, { status: 409 });
    }
    console.error('POST /api/admin/products:', err);
    return NextResponse.json({ error: err.message ?? 'Create failed' }, { status: 500 });
  }
}
