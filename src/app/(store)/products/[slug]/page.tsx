import { db } from '@/lib/db';
import { products, categories, reviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

  const productReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, row.product.id));

  return (
    <ProductDetailClient
      product={{
          ...row.product,
          images: row.product.images ?? undefined,
          variations: row.product.variations ?? undefined,
          specifications: (row.product.specifications as Record<string, string> | null) ?? undefined,
          category: row.category,
        }}
      reviews={productReviews}
    />
  );
}
