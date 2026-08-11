export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { ProductCard } from '@/components/store/ProductCard';
import { FlashSaleTimer } from '@/components/store/FlashSaleTimer';
import { Flame } from 'lucide-react';
import { hasProductImage } from '@/lib/utils';

export const metadata = {
  title: 'Combo Deals — Fixam Africa',
  description: 'Shop exclusive combo deals and promo products at Fixam Africa.',
};

export default async function ComboDealsPage() {
  const allPromoProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      imageUrl: products.imageUrl,
      images: products.images,
      stock: products.stock,
      isFeatured: products.isFeatured,
      isPromo: products.isPromo,
      isActive: products.isActive,
      rating: products.rating,
      reviewsCount: products.reviewsCount,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), eq(products.isPromo, true), gt(products.stock, 0)))
    .orderBy(desc(products.createdAt));

  // Don't publish products with no image on the storefront.
  const promoProducts = allPromoProducts.filter(hasProductImage);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Banner ── */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 lg:px-12 py-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Combo Deals</h1>
              <p className="text-sm text-orange-100 mt-0.5">
                {promoProducts.length > 0
                  ? `${promoProducts.length} exclusive promo product${promoProducts.length !== 1 ? 's' : ''}`
                  : 'Exclusive promo deals'}
              </p>
            </div>
          </div>
          <div className="sm:ml-auto">
            <FlashSaleTimer />
          </div>
        </div>
      </div>

      {/* ── Products Grid ── */}
      <div className="container mx-auto px-4 lg:px-12 py-8">
        {promoProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {promoProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Flame className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No combo deals right now</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Check back soon — our next round of promo deals is coming up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
