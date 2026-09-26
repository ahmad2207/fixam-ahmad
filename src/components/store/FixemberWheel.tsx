'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, PartyPopper, X, Gift } from 'lucide-react';
import Image from 'next/image';
import type { WheelSegment } from '@/lib/fixember';

// Alternating brand-orange (the site's --primary) / the requested navy blue —
// hsl(var(--primary)) rather than a hardcoded hex so the orange stays in
// sync if the brand color ever changes in globals.css.
const WEDGE_COLORS = ['hsl(var(--primary))', '#262f68'];
const SPIN_DURATION_MS = 4200;
const EXTRA_SPINS = 6; // purely cosmetic — more revolutions before landing

interface Props {
  orderId: string;
  segments: WheelSegment[];
  onClose: () => void;
}

export default function FixemberWheel({ orderId, segments, onClose }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ isWin: boolean; prizeLabel: string } | null>(null);
  const [error, setError] = useState(false);

  const n = segments.length;
  const anglePer = n > 0 ? 360 / n : 0;

  const wheelBackground = useMemo(() => {
    if (n === 0) return undefined;
    const stops = segments
      .map((_, i) => `${WEDGE_COLORS[i % WEDGE_COLORS.length]} ${i * anglePer}deg ${(i + 1) * anglePer}deg`)
      .join(', ');
    return `conic-gradient(${stops})`;
  }, [segments, anglePer, n]);

  const handleSpin = async () => {
    if (spinning || result || n === 0) return;
    setSpinning(true);
    setError(false);
    try {
      const res = await fetch('/api/fixember/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (!res.ok || !data.eligible) {
        toast.error('This order is no longer eligible to spin.');
        setSpinning(false);
        setError(true);
        return;
      }

      const targetIdx = data.prizeId
        ? segments.findIndex((s) => s.id === data.prizeId)
        : segments.findIndex((s) => s.label === data.prizeLabel);
      const idx = targetIdx >= 0 ? targetIdx : 0;

      // Rotate so the target segment's center lands under the fixed pointer
      // at the top (0deg). Segment i's center sits at (i + 0.5) * anglePer
      // clockwise from 0 on the unrotated wheel.
      const segmentCenter = (idx + 0.5) * anglePer;
      setRotation(EXTRA_SPINS * 360 + (360 - segmentCenter));

      // Result set once, spinning cleared, only when the animation actually
      // finishes — see the wheel's onTransitionEnd below, not a fixed
      // timeout (a fixed delay can race the real transition duration).
      setTimeout(() => {
        setSpinning(false);
        setResult({ isWin: data.isWin, prizeLabel: data.prizeLabel });
      }, SPIN_DURATION_MS);
    } catch {
      toast.error('Could not spin right now — try again.');
      setSpinning(false);
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 pt-7 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-[#262f68]" />
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
          <X className="w-5 h-5" />
        </button>

        {result ? (
          <div className="text-center py-4">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${result.isWin ? 'bg-brand-green-50' : 'bg-gray-100'}`}>
              <PartyPopper className={`h-8 w-8 ${result.isWin ? 'text-brand-green-600' : 'text-gray-400'}`} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1">
              {result.isWin ? '🎉 You Won!' : 'So Close!'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {result.isWin
                ? <>You won a <strong className="text-gray-800">{result.prizeLabel}</strong>! Our team will reach out to arrange delivery.</>
                : 'No prize this time — thanks for shopping with us, and good luck next order!'}
            </p>
            <button onClick={onClose} className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-black text-gray-900 text-center mb-1">Fixember Spin &amp; Win</h2>
            <p className="text-xs text-gray-500 text-center mb-5">You&apos;ve unlocked one free spin on this order!</p>

            <div className="relative w-72 h-72 mx-auto mb-6">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[22px] border-t-[#262f68] drop-shadow-md" />
              <div
                className="w-full h-full rounded-full border-[6px] border-white shadow-xl relative overflow-hidden"
                style={{
                  background: wheelBackground,
                  transform: `rotate(${rotation}deg)`,
                  transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17,0.67,0.12,0.99)`,
                }}
              >
                {segments.map((s, i) => (
                  <div
                    key={s.id}
                    className="absolute inset-0 flex justify-center"
                    style={{ transform: `rotate(${(i + 0.5) * anglePer}deg)` }}
                  >
                    <div className="mt-3 flex flex-col items-center gap-1 w-16">
                      {s.imageUrl && (
                        <div className="relative w-10 h-10 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0 ring-2 ring-white/70">
                          <Image src={s.imageUrl} alt="" fill sizes="40px" className="object-contain p-1" />
                        </div>
                      )}
                      <span className="text-white text-[8.5px] font-bold text-center leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        {s.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Center hub */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center ring-4 ring-[#262f68]">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={spinning || n === 0}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-[#262f68] hover:opacity-90 disabled:opacity-60 text-white font-black text-sm transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {spinning ? <><Loader2 className="w-4 h-4 animate-spin" /> Spinning…</> : 'Spin the Wheel'}
            </button>
            {error && (
              <p className="text-xs text-red-500 text-center mt-2">Something went wrong — you can try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
