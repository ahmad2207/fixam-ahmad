import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, reviews } from '@/db/schema';
import { eq, and, ilike, desc, avg, count, sql, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured') === 'true';
  const ids = searchParams.get('ids');

  const conditions = [eq(products.isActive, true)];
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    if (idList.length > 0) conditions.push(inArray(products.id, idList));
  }
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (featured) conditions.push(eq(products.isFeatured, true));
  if (search) conditions.push(ilike(products.name, `%${search}%`));

  const rows = await db
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
      isPromo: products.isPromo,
      promoEndsAt: products.promoEndsAt,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
      rating: avg(reviews.rating),
      reviewsCount: count(reviews.id),
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(reviews, eq(products.id, reviews.productId))
    .where(and(...conditions))
    .groupBy(products.id, categories.id, categories.name, categories.slug)
    .orderBy(desc(products.createdAt));

  const result = rows.map((r) => ({
    ...r,
    rating: r.rating ? Math.round(Number(r.rating) * 10) / 10 : 0,
    reviewsCount: Number(r.reviewsCount),
  }));

  return NextResponse.json(result);
}
