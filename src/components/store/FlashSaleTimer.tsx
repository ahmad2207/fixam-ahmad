'use client';

import { useState, useEffect } from 'react';

export function FlashSaleTimer() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 59, s: 59 });

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem('fixam_flash_end');
    const end = stored ? parseInt(stored, 10) : (() => {
      const e = Date.now() + 24 * 60 * 60 * 1000;
      sessionStorage.setItem('fixam_flash_end', String(e));
      return e;
    })();

    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  const display = mounted
    ? [timeLeft.h, timeLeft.m, timeLeft.s]
    : [23, 59, 59];

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      {display.map((val, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded min-w-[28px] text-center tabular-nums">
            {pad(val)}
          </span>
          {i < 2 && <span className="text-red-500 font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}
