import Link from 'next/link';
import Image from 'next/image';
import type { WheelSegment } from '@/lib/fixember';

interface Props {
  segments: WheelSegment[];
  ctaHref: string;
}

// Orange/navy alternating — same pairing the real interactive wheel uses on
// its own white modal, kept consistent now that this banner is white too.
const WEDGE_COLORS = ['hsl(var(--primary))', '#262f68'];

// Real markup, not a flat image — a fixed-aspect graphic (the earlier
// version of this banner) can only ever be exactly one shape, which reads
// fine on desktop and becomes either an unreadable sliver or a bad crop on
// a phone. A flex row reflows naturally at any width instead. Content stays
// data-driven (fetched wheel segments), same reasoning as the promo modal:
// admin edits in Admin > Fixember show up here too, nothing hardcoded to
// drift out of sync.
export default function FixemberTopBanner({ segments, ctaHref }: Props) {
  const prizes = segments.filter((s) => s.isPrize).slice(0, 5);
  if (prizes.length === 0) return null;

  const n = segments.length;
  const miniWheelBg = n > 0
    ? `conic-gradient(${segments.map((_, i) => `${WEDGE_COLORS[i % 2]} ${i * (360 / n)}deg ${(i + 1) * (360 / n)}deg`).join(', ')})`
    : undefined;

  return (
    <Link href={ctaHref} className="block w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 lg:px-12 py-2 sm:py-2.5 flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cheering-person flourish — desktop only, too tight a fit on mobile */}
          <div className="hidden sm:block relative w-10 h-10 flex-shrink-0">
            <Image src="/win.png" alt="" fill sizes="40px" className="object-contain" />
          </div>
          {/* Small spinning wheel — same colors/segments as the real wheel, just decorative here */}
          <div
            className="hidden sm:block w-8 h-8 rounded-full flex-shrink-0 shadow-sm animate-[spin_6s_linear_infinite]"
            style={{ background: miniWheelBg }}
          />
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span className="font-black text-sm sm:text-base whitespace-nowrap">
              <span className="text-gray-900">FIX</span><span className="text-primary">EMBER</span>
            </span>
            <span className="text-gray-500 text-[11px] sm:text-xs text-center">
              Spend ₦150,000 or more and unlock a FREE SPIN to win a gift after checkout! 🎁
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {prizes.map((s) => (
            <div key={s.id} className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 ring-1 ring-gray-200 overflow-hidden flex-shrink-0">
              {s.imageUrl && <Image src={s.imageUrl} alt="" fill sizes="32px" className="object-contain p-0.5" />}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
