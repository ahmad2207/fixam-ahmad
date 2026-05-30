import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      categoryId: products.categoryId,
      imageUrl: products.imageUrl,
      images: products.images,
      stock: products.stock,
      sku: products.sku,
      variations: products.variations,
      tags: products.tags,
      isFeatured: products.isFeatured,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)));

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}
