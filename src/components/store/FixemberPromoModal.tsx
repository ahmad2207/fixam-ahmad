'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { WheelSegment } from '@/lib/fixember';

// Shows once per browser session (not on every page navigation within the
// same visit, but reappears next time the tab/browser is reopened) — a
// plain flag in sessionStorage, no backend involved beyond fetching the
// current wheel contents to display.
const SEEN_KEY = 'fixember_promo_seen';

// Orange (site --primary) alternating with cream, not the navy used on the
// real wheel's white modal — this card's own background IS navy, so a navy
// segment would disappear into it.
const WEDGE_COLORS = ['hsl(var(--primary))', '#FBF1E2'];

export default function FixemberPromoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [segments, setSegments] = useState<WheelSegment[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    fetch('/api/fixember/segments')
      .then((r) => r.json())
      .then((data) => {
        setSegments(data.segments ?? []);
        setOpen(true);
        sessionStorage.setItem(SEEN_KEY, '1');
      })
      .catch(() => {
        // No wheel configured / request failed — nothing to promote yet.
      });
  }, []);

  const n = segments.length;
  const anglePer = n > 0 ? 360 / n : 0;
  const wheelBackground = useMemo(() => {
    if (n === 0) return undefined;
    const stops = segments
      .map((_, i) => `${WEDGE_COLORS[i % WEDGE_COLORS.length]} ${i * anglePer}deg ${(i + 1) * anglePer}deg`)
      .join(', ');
    return `conic-gradient(${stops})`;
  }, [segments, anglePer, n]);

  if (!open || n === 0) return null;

  const prizes = segments.filter((s) => s.isPrize);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-[#262f68]">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Everything except Close/Terms navigates to /products on click */}
        <div onClick={() => router.push('/products')} className="cursor-pointer px-6 pt-7 pb-5 text-center">
          <Image src="/logo.png" alt="Fixam" width={100} height={40} className="h-8 w-auto mx-auto mb-3" />

          <p className="text-primary text-[11px] font-bold tracking-[0.2em] uppercase mb-1">Spin &amp; Win at Checkout</p>
          <h2 className="text-4xl font-black mb-2 leading-none">
            <span className="text-white">FIX</span><span className="text-primary">EMBER</span>
          </h2>
          <p className="text-white/80 text-sm mb-6">Spend ₦150,000 or more and unlock a free spin of the wheel after checkout.</p>

          {/* Decorative wheel — purely illustrative, not interactive/spinnable here */}
          <div className="relative w-48 h-48 mx-auto mb-5">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[15px] border-t-primary drop-shadow" />
            <div
              className="w-full h-full rounded-full border-[5px] border-primary shadow-xl relative overflow-hidden"
              style={{ background: wheelBackground }}
            >
              {segments.map((s, i) => (
                <div
                  key={s.id}
                  className="absolute inset-0 flex justify-center"
                  style={{ transform: `rotate(${(i + 0.5) * anglePer}deg)` }}
                >
                  <div className="mt-3 flex flex-col items-center w-12">
                    {s.imageUrl && (
                      <div className="relative w-9 h-9 rounded-full bg-white overflow-hidden ring-1 ring-white flex-shrink-0">
                        <Image src={s.imageUrl} alt="" fill sizes="36px" className="object-contain p-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center ring-4 ring-primary">
                <span className="text-[#262f68] font-black text-[11px] tracking-wide">SPIN</span>
              </div>
            </div>
          </div>

          {/* Prize list */}
          <div className="flex justify-center gap-2.5 mb-4 flex-wrap">
            {prizes.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1 w-14">
                <div className="relative w-11 h-11 rounded-full bg-white overflow-hidden flex-shrink-0">
                  {s.imageUrl && <Image src={s.imageUrl} alt="" fill sizes="44px" className="object-contain p-1" />}
                </div>
                <span className="text-white text-[9px] font-semibold text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </div>

          <p className="text-white/50 text-[10px] leading-relaxed">
            One spin per order. Prizes subject to availability.{' '}
            <Link href="/terms" onClick={(e) => e.stopPropagation()} className="text-primary underline">
              Terms apply
            </Link>.
          </p>
        </div>

        {/* Cheering-person illustration, bottom-left flourish from the
            reference design — decorative only, doesn't intercept clicks. */}
        <Image
          src="/win.png"
          alt=""
          width={200}
          height={200}
          className="absolute -bottom-2 -left-3 w-16 sm:w-20 h-auto pointer-events-none select-none z-0"
        />
      </div>
    </div>
  );
}
