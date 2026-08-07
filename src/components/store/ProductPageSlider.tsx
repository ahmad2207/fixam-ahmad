'use client';

import { useState, useCallback, useRef } from 'react';
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

const SWIPE_THRESHOLD = 40; // px of horizontal drag before a page change fires

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

  // ── Swipe / drag support (mouse + touch, via Pointer Events) ──
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; dragging: boolean } | null>(null);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const wasDraggedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (totalPages <= 1) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dragging: false };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = dragState.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (!state.dragging) {
      // Only claim the gesture once movement is clearly horizontal —
      // otherwise let the page scroll vertically as normal.
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      state.dragging = true;
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }

    setDragDeltaX(dx);
  };

  const endDrag = (e: React.PointerEvent) => {
    const state = dragState.current;
    if (!state) return;
    if (state.dragging) {
      const dx = e.clientX - state.startX;
      if (dx <= -SWIPE_THRESHOLD) next();
      else if (dx >= SWIPE_THRESHOLD) prev();
      // Swallow the click that (synthetically) follows a drag so it
      // doesn't navigate into whatever product card was under the pointer.
      wasDraggedRef.current = true;
    }
    dragState.current = null;
    setIsDragging(false);
    setDragDeltaX(0);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (wasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDraggedRef.current = false;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={prev}
          aria-label="Previous"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-primary text-white border-2 border-white shadow-lg items-center justify-center hover:bg-primary/90 hover:scale-110 transition-all"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div
          className="overflow-hidden touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={handleClickCapture}
        >
          <div
            className={`flex ${isDragging ? '' : 'transition-transform duration-300 ease-in-out'}`}
            style={{ transform: `translateX(calc(-${page * 100}% + ${dragDeltaX}px))` }}
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
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-primary text-white border-2 border-white shadow-lg items-center justify-center hover:bg-primary/90 hover:scale-110 transition-all"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
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
