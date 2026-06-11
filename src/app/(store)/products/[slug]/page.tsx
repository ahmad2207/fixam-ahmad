import { db } from '@/lib/db';
import { products, categories, reviews } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';

import { ProductDetailClient } from '@/components/store/ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [product] = await db
    .select({ name: products.name, description: products.description })
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)));

  if (!product) return { title: 'Product Not Found' };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const [row] = await db
    .select({
      product: products,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)));

  if (!row) notFound();

  const relatedFields = {
    id: products.id,
    name: products.name,
    slug: products.slug,
    price: products.price,
    compareAtPrice: products.compareAtPrice,
    imageUrl: products.imageUrl,
    images: products.images,
    stock: products.stock,
    isFeatured: products.isFeatured,
    isActive: products.isActive,
    rating: products.rating,
    reviewsCount: products.reviewsCount,
    categoryName: categories.name,
  } as const;

  const [productReviews, relatedProducts] = await Promise.all([
    db.select().from(reviews).where(eq(reviews.productId, row.product.id)),

    row.product.categoryId
      ? db
          .select(relatedFields)
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(
            and(
              eq(products.isActive, true),
              eq(products.categoryId, row.product.categoryId),
              ne(products.id, row.product.id),
            ),
          )
          .orderBy(desc(products.rating), desc(products.createdAt))
          .limit(12)
      : Promise.resolve([]),
  ]);

  // Explicitly pick only serialisable fields — avoids passing Date objects
  // (createdAt / updatedAt) from a Server Component to a Client Component.
  const p = row.product;
  return (
    <ProductDetailClient
      product={{
        id:             p.id,
        name:           p.name,
        slug:           p.slug,
        description:    p.description,
        price:          p.price,
        compareAtPrice: p.compareAtPrice,
        imageUrl:       p.imageUrl,
        images:         p.images ?? undefined,
        stock:          p.stock,
        sku:            p.sku,
        variations:     p.variations ?? undefined,
        specifications: (p.specifications as Record<string, string> | null) ?? undefined,
        category:       row.category,
      }}
      reviews={productReviews}
      relatedProducts={relatedProducts}
    />
  );
}
