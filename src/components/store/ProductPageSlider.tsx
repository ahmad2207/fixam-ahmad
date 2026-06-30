'use client';

import { useState, useCallback } from 'react';
import { ProductCard } from '@/components/store/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  stock: number;
  isFeatured?: boolean;
  categoryName?: string | null;
  rating?: string | null;
  reviewsCount?: number | null;
}

export function ProductPageSlider({
  products,
  itemsPerPage = 5,
}: {
  products: Product[];
  itemsPerPage?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const pages = Array.from({ length: totalPages }, (_, i) =>
    products.slice(i * itemsPerPage, (i + 1) * itemsPerPage),
  );

  const prev = useCallback(() => setPage(p => (p - 1 + totalPages) % totalPages), [totalPages]);
  const next = useCallback(() => setPage(p => (p + 1) % totalPages), [totalPages]);

  return (
    <>
      <div className="relative">
        <button
          onClick={prev}
          aria-label="Previous"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center hover:bg-gray-50 hover:shadow-lg transition-all"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {pages.map((pageProducts, i) => (
              <div
                key={i}
                className={`w-full flex-shrink-0 grid gap-3 sm:gap-6 ${
                  itemsPerPage === 4
                    ? 'grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                }`}
              >
                {pageProducts.map(product => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={next}
          aria-label="Next"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center hover:bg-gray-50 hover:shadow-lg transition-all"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === page ? 'w-4 bg-primary' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
