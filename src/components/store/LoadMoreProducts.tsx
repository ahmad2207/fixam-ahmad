'use client';

import { useState, useTransition } from 'react';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';
import { hasProductImage, hasProductPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  stock: number;
  isFeatured?: boolean;
  isPromo?: boolean;
  promoEndsAt?: string | null;
  categoryName?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
}

const PAGE_SIZE = 24;

export function LoadMoreProducts({ initialProducts }: { initialProducts: Product[] }) {
  const [items, setItems] = useState<Product[]>(initialProducts.filter(hasProductImage).filter(hasProductPrice));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    startTransition(async () => {
      const nextPage = page + 1;
      // hasImage=true & hasPrice=true — same filtering as the SSR'd first
      // page, applied server-side rather than after the fact. Without it, a
      // page ranked/paginated with no idea about images/prices could come
      // back mostly filtered away client-side, making "See More" feel like it
      // did nothing.
      const res = await fetch(`/api/products?page=${nextPage}&limit=${PAGE_SIZE}&hasImage=true&hasPrice=true`);
      const data: Product[] = await res.json();
      setItems((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        // .filter(hasProductImage/hasProductPrice) here is just a defensive
        // backstop — the server already only returns matching products for
        // this request.
        return [...prev, ...data.filter((p) => !existingIds.has(p.id) && hasProductImage(p) && hasProductPrice(p))];
      });
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-stretch">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-primary text-primary font-black text-sm hover:bg-primary hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed rounded-full shadow-sm hover:shadow-md"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              'See More Products'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
