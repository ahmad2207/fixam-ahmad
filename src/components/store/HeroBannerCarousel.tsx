'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BANNER_THEMES } from '@/db/schema/banners';
import type { Banner } from '@/db/schema/banners';

/* ─── Static fallback slides (used when no banners are saved in DB) ─── */
const STATIC_SLIDES = [
  {
    id: 'static-0',
    overlayFrom: 'from-orange-600', overlayVia: 'via-orange-500/90 via-40%',
    badgeBg: 'bg-white/20', ctaColor: 'text-orange-600',
    eyebrow: '🍳 Premium Cookware',
    heading: 'Cook Like a\nProfessional',
    sub:     'Premium stainless-steel pots, pans & sets for every kitchen',
    cta:     { label: 'Shop Cookware', href: '/products?category=cookware' },
    image:   '/cookware-banner.png',
  },
  {
    id: 'static-1',
    overlayFrom: 'from-red-600', overlayVia: 'via-red-500/90 via-40%',
    badgeBg: 'bg-white/20', ctaColor: 'text-red-600',
    eyebrow: '⚡ New Arrivals',
    heading: 'Smart Kitchen\nAppliances',
    sub:     'Microwaves, irons, blenders & more — the latest kitchen tech',
    cta:     { label: 'Shop Appliances', href: '/products?category=appliances' },
    image:   '/appliances-banner.png',
  },
  {
    id: 'static-2',
    overlayFrom: 'from-gray-900', overlayVia: 'via-gray-800/90 via-40%',
    badgeBg: 'bg-white/20', ctaColor: 'text-orange-500',
    eyebrow: '⭐ Customer Favourites',
    heading: "Africa's #1 Kitchen\nEssentials Store",
    sub:     'Trusted by 10,000+ home chefs. Fast nationwide delivery.',
    cta:     { label: 'Browse All Products', href: '/products' },
    image:   '/top-banner.png',
  },
];

function bannerToSlide(b: Banner) {
  const theme = BANNER_THEMES[b.theme] ?? BANNER_THEMES.dark;
  return {
    id:          b.id,
    overlayFrom: theme.overlayFrom,
    overlayVia:  theme.overlayVia,
    badgeBg:     theme.badgeBg,
    ctaColor:    theme.ctaColor,
    eyebrow:     b.eyebrow    ?? '',
    heading:     b.heading,
    sub:         b.subheading ?? '',
    cta:         { label: b.ctaLabel ?? 'Shop Now', href: b.ctaHref ?? '/products' },
    image:       b.imageUrl ?? '',
  };
}

export function HeroBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const { data: dbBanners = [] } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await fetch('/api/banners?type=hero');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides = dbBanners.length > 0 ? dbBanners.map(bannerToSlide) : STATIC_SLIDES;

  // Reset to first slide if slide count changes
  useEffect(() => { setCurrent(0); }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
    setAnimKey((k) => k + 1);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
    setAnimKey((k) => k + 1);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, slides.length]);

  const s = slides[Math.min(current, slides.length - 1)];

  // ── Swipe / drag support (mouse + touch, via Pointer Events) ──
  const SWIPE_THRESHOLD = 40; // px
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; dragging: boolean } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (slides.length <= 1) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dragging: false };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = dragState.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      state.dragging = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const state = dragState.current;
    if (!state) return;
    if (state.dragging) {
      const dx = e.clientX - state.startX;
      if (dx <= -SWIPE_THRESHOLD) next();
      else if (dx >= SWIPE_THRESHOLD) prev();
    }
    dragState.current = null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* ── SLIDE ── */}
      <div className="relative h-[260px] sm:h-[340px] lg:h-[360px] bg-white overflow-hidden touch-pan-y">

        {/* Banner image — use plain <img> for GIFs so animation plays */}
        {s.image.toLowerCase().endsWith('.gif') ? (
          <img
            key={s.image}
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
        ) : (
          <Image
            key={s.image}
            src={s.image}
            alt=""
            fill
            className="object-cover object-right transition-transform duration-700 scale-100"
            priority
          />
        )}

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${s.overlayFrom} ${s.overlayVia} to-transparent`} />

        {/* Text content */}
        <div
          key={animKey}
          className="relative z-10 flex flex-col justify-center h-full pl-6 sm:pl-10 pr-4 max-w-[60%] sm:max-w-[50%] lg:max-w-[45%]"
          style={{ animation: 'fadeInUp .45s ease both' }}
        >
          {s.eyebrow && (
            <span className={`self-start text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white ${s.badgeBg} backdrop-blur-sm px-3 py-1 rounded-full mb-3`}>
              {s.eyebrow}
            </span>
          )}

          <h2 className="font-display text-[1.85rem] sm:text-[2.4rem] lg:text-[2.9rem] font-bold text-white leading-[1.1] mb-3 whitespace-pre-line uppercase tracking-wide" style={{ textShadow: '0 2px 14px rgba(0,0,0,.3)' }}>
            {s.heading}
          </h2>

          {s.sub && (
            <p className="text-white/85 text-xs sm:text-sm mb-5 hidden sm:block leading-relaxed max-w-[220px] sm:max-w-xs">
              {s.sub}
            </p>
          )}

          {s.cta.label && (
            <Link
              href={s.cta.href}
              className={`self-start inline-flex items-center gap-2 bg-white ${s.ctaColor} font-black text-xs sm:text-sm px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
            >
              {s.cta.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Slide counter */}
        {slides.length > 1 && (
          <div className="absolute top-3 right-10 z-20 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {current + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* ── NAV ARROWS ── */}
      {slides.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-900/70 hover:bg-primary border-2 border-white/80 rounded-full flex items-center justify-center shadow-lg transition-all z-20 hover:scale-110"
            aria-label="Previous slide">
            <ChevronLeft className="h-5 w-5 text-white" strokeWidth={2.5} />
          </button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-900/70 hover:bg-primary border-2 border-white/80 rounded-full flex items-center justify-center shadow-lg transition-all z-20 hover:scale-110"
            aria-label="Next slide">
            <ChevronRight className="h-5 w-5 text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* ── DOT INDICATORS ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setAnimKey((k) => k + 1); }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-white shadow-md' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
