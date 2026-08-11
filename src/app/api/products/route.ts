import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, reviews } from '@/db/schema';
import { eq, and, or, ilike, desc, avg, count, sql, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured') === 'true';
  const ids = searchParams.get('ids');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  // No `limit` param at all means "fetch everything" (used by the POS, the storefront's
  // client-side-filtered browse page, wishlist, etc). Only clamp to [1, 48] when a limit
  // was actually requested — `Math.max(1, 0)` previously turned "no limit" into "limit 1".
  const limitParam = searchParams.get('limit');
  const parsedLimit = limitParam !== null ? parseInt(limitParam, 10) : NaN;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(48, parsedLimit) : 0;
  const paginated = limit > 0;

  const conditions = [eq(products.isActive, true)];
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    if (idList.length > 0) conditions.push(inArray(products.id, idList));
  }
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (featured) conditions.push(eq(products.isFeatured, true));
  if (search) conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.barcode, `%${search}%`))!);

  let query = db
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
      barcode: products.barcode,
      variations: products.variations,
      tags: products.tags,
      isFeatured: products.isFeatured,
      isPromo: products.isPromo,
      promoEndsAt: products.promoEndsAt,
      restockAt: products.restockAt,
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
    .orderBy(desc(products.createdAt)) as any;

  if (paginated) {
    query = query.limit(limit).offset((page - 1) * limit);
  }

  const rows = await query;

  const result = rows.map((r: any) => ({
    ...r,
    rating: r.rating ? Math.round(Number(r.rating) * 10) / 10 : 0,
    reviewsCount: Number(r.reviewsCount),
  }));

  return NextResponse.json(result);
}
