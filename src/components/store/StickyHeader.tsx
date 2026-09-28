'use client';

import { useEffect, useRef, useState } from 'react';
import { StoreHeader } from './StoreHeader';
import { Truck, ShieldCheck, Users } from 'lucide-react';

const TRUST_ITEMS = [
  { Icon: Truck,       label: 'Fast Delivery' },
  { Icon: ShieldCheck, label: 'Secure Checkout' },
  { Icon: Users,       label: '10,000+ Happy Customers' },
];

interface Props {
  categories: { id: string; name: string; slug: string }[];
}

export function StickyHeader({ categories }: Props) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  // The header's real height varies with its content (category pill count
  // wrapping to a 2nd line, responsive breakpoints, font-load reflows) — a
  // hardcoded spacer can drift out of sync with it, and since the header
  // itself is `position: fixed`, an undersized spacer means the header
  // visually overlaps (hides) whatever renders first in <main> below it.
  // Measuring the real height and sizing the spacer to match keeps this
  // correct regardless of what the header ends up containing.
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(146);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) {
        setVisible(true);
      } else if (y > lastY.current) {
        setVisible(false); // scrolling down
      } else {
        setVisible(true);  // scrolling up
      }
      lastY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-50 transition-transform duration-300 ease-in-out"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <StoreHeader categories={categories} />

        {/* Trust badge strip */}
        <div className="border-b border-brand-green-700 bg-brand-green-600 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <div className="container mx-auto px-4 lg:px-12">
            <div className="flex items-center justify-center h-10 gap-0 min-w-max lg:min-w-0 lg:w-full">
              <span className="font-black text-white text-[11px] sm:text-xs tracking-widest uppercase whitespace-nowrap border-r border-white/30 pr-5">
                Why Choose Fixam?
              </span>
              {TRUST_ITEMS.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-5 border-r border-white/20 last:border-r-0 whitespace-nowrap">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer — reserves real document flow space matching the fixed
          header's actual (measured) height, so content below never starts
          out hidden underneath it. */}
      <div style={{ height: headerHeight }} />
    </>
  );
}
