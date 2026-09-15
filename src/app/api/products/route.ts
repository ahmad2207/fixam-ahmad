import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, reviews } from '@/db/schema';
import { eq, and, or, ilike, desc, avg, count, sql, inArray } from 'drizzle-orm';
import { hasProductImageSql, hasProductPriceSql } from '@/lib/productFilters';
import { getVariationPricingForProducts } from '@/lib/inventory';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured') === 'true';
  const ids = searchParams.get('ids');
  // Opt-in only — POS and the admin panel use this same endpoint and need
  // every product regardless of whether a photo's been uploaded yet. Only
  // storefront pagination (LoadMoreProducts, past the first SSR'd page)
  // passes this, to match the has-image filtering already applied to that
  // first page server-side.
  const hasImage = searchParams.get('hasImage') === 'true';
  // Same opt-in-only story as `hasImage` above: a product's price defaults to
  // '0' until an admin adds its first inventory batch, so pass this only
  // from customer-facing requests — POS/admin still need to find priceless
  // products to finish setting them up.
  const hasPrice = searchParams.get('hasPrice') === 'true';
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
  if (hasImage) conditions.push(hasProductImageSql);
  if (hasPrice) conditions.push(hasProductPriceSql);

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
      pricedVariationName: products.pricedVariationName,
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

  // Products priced by variation need each option's own price/stock — no
  // cost, that stays admin-only. Computed in one grouped query across every
  // priced product in this page rather than one round-trip per product.
  const pricedIds = rows.filter((r: any) => r.pricedVariationName).map((r: any) => r.id);
  const variationPricingByProduct = pricedIds.length
    ? await getVariationPricingForProducts(pricedIds)
    : new Map();

  const result = rows.map((r: any) => ({
    ...r,
    rating: r.rating ? Math.round(Number(r.rating) * 10) / 10 : 0,
    reviewsCount: Number(r.reviewsCount),
    variationPricing: r.pricedVariationName
      ? (variationPricingByProduct.get(r.id) ?? []).map((v: any) => ({ option: v.option, price: v.price, stock: v.stock }))
      : null,
  }));

  return NextResponse.json(result);
}
