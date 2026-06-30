'use client';

import { useState, useEffect, useRef } from 'react';

export function FlashSaleTimer() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 23, m: 59, s: 59 });
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);

    fetch('/api/store/flash-sale-timer')
      .then((r) => r.json())
      .then(({ endsAt }: { endsAt: string | null }) => {
        if (endsAt) {
          endRef.current = new Date(endsAt).getTime();
        } else {
          // Fall back to a session-local 7-day countdown
          const stored = sessionStorage.getItem('fixam_flash_end');
          endRef.current = stored
            ? parseInt(stored, 10)
            : (() => {
                const e = Date.now() + 7 * 24 * 60 * 60 * 1000;
                sessionStorage.setItem('fixam_flash_end', String(e));
                return e;
              })();
        }
      })
      .catch(() => {
        const stored = sessionStorage.getItem('fixam_flash_end');
        endRef.current = stored
          ? parseInt(stored, 10)
          : Date.now() + 7 * 24 * 60 * 60 * 1000;
      });

    const t = setInterval(() => {
      if (endRef.current == null) return;
      const diff = Math.max(0, endRef.current - Date.now());
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);

    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const display = mounted
    ? [timeLeft.d, timeLeft.h, timeLeft.m, timeLeft.s]
    : [0, 23, 59, 59];
  const units = ['DAYS', 'HRS', 'MIN', 'SEC'];

  return (
    <div className="flex items-end gap-0.5">
      {display.map((val, i) => (
        <span key={i} className="flex items-end gap-0.5">
          <span className="flex flex-col items-center">
            <span className="bg-gray-900 text-orange-400 font-black text-sm px-2 py-1 min-w-[34px] text-center tabular-nums font-mono leading-none">
              {pad(val)}
            </span>
            <span className="text-[8px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">
              {units[i]}
            </span>
          </span>
          {i < 3 && <span className="text-gray-400 font-bold text-sm mb-3.5 px-px">:</span>}
        </span>
      ))}
    </div>
  );
}
