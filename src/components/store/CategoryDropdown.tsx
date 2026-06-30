'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, ChevronDown, ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CATEGORY_META } from '@/lib/categoryMeta';

export function CategoryDropdown() {
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  return (
    <div ref={ref} className="relative hidden lg:block flex-shrink-0">

      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
          open
            ? 'bg-primary text-white border-primary shadow-lg'
            : 'bg-secondary/60 text-foreground border-border/60 hover:bg-primary/8 hover:border-primary/30 hover:text-primary'
        }`}
      >
        <LayoutGrid className="h-4 w-4 flex-shrink-0" />
        <span className="hidden xl:inline whitespace-nowrap">All Categories</span>
        <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown panel ── */}
      <div
        className={`absolute left-0 z-50 mt-2 w-max max-w-[92vw] rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200 origin-top-left ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-[0.97] -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-extrabold text-gray-900">Browse Categories</p>
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Single-row category strip */}
        <div className="flex gap-2 p-4">

          {/* All Items */}
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="group flex flex-col items-center gap-1.5 p-2 rounded-xl w-[88px] flex-shrink-0 border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/4 transition-all duration-150"
          >
            <div className="w-full h-[64px] rounded-lg bg-gradient-to-br from-primary/10 to-primary/5" />
            <p className="text-[11px] font-extrabold text-primary text-center leading-tight">All Items</p>
          </Link>

          {/* Category cards */}
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug];
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                onClick={() => setOpen(false)}
                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl w-[88px] flex-shrink-0 border-2 border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-150"
              >
                <div className={`relative w-full h-[64px] rounded-lg bg-gradient-to-br ${meta?.gradient ?? 'from-gray-50 to-gray-100'} overflow-hidden`}>
                  {meta?.image && (
                    <Image
                      src={meta.image}
                      alt={cat.name}
                      fill
                      className="object-contain p-1.5 group-hover:scale-110 transition-transform duration-200"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  )}
                </div>
                <p className="text-[11px] font-bold text-gray-700 group-hover:text-primary text-center leading-tight transition-colors line-clamp-2">
                  {cat.name}
                </p>
              </Link>
            );
          })}

        </div>
      </div>
    </div>
  );
}
