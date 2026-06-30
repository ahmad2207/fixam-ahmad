'use client';

import { useState, useEffect, useRef } from 'react';
import { Timer, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: '+24 h',   ms: 24 * 60 * 60 * 1000 },
  { label: '+3 days', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '+7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '+30 days', ms: 30 * 24 * 60 * 60 * 1000 },
];

const UNITS = ['DAYS', 'HRS', 'MIN', 'SEC'] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function calcTimeLeft(endIso: string) {
  const diff = Math.max(0, new Date(endIso).getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export function ComboDealsTimerCard() {
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/admin/combo-deals/timer')
      .then((r) => r.json())
      .then(({ endsAt: ea }: { endsAt: string | null }) => {
        setEndsAt(ea);
        if (ea) {
          setInputVal(toLocalInputValue(new Date(ea)));
          setTimeLeft(calcTimeLeft(ea));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!endsAt) return;
    setTimeLeft(calcTimeLeft(endsAt));
    tickRef.current = setInterval(() => setTimeLeft(calcTimeLeft(endsAt)), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [endsAt]);

  const isActive = endsAt && new Date(endsAt) > new Date();
  const isExpired = endsAt && new Date(endsAt) <= new Date();

  async function save(isoString: string | null) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/combo-deals/timer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endsAt: isoString }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEndsAt(isoString);
      if (isoString) {
        setInputVal(toLocalInputValue(new Date(isoString)));
        toast.success('Timer updated');
      } else {
        setInputVal('');
        toast.success('Timer cleared');
      }
    } catch {
      toast.error('Failed to update timer');
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(ms: number) {
    const d = new Date(Date.now() + ms);
    setInputVal(toLocalInputValue(d));
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Timer className="h-4 w-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground">Flash Sale Timer</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Countdown shown on the storefront combo deals section</p>
        </div>
        {loaded && (
          <span className={cn(
            'text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1',
            isActive  ? 'bg-emerald-50 text-emerald-700' :
            isExpired ? 'bg-red-50 text-red-600' :
                        'bg-muted text-muted-foreground',
          )}>
            {isActive  ? <><CheckCircle2 className="h-3 w-3" /> Active</>  :
             isExpired ? <><Clock className="h-3 w-3" /> Expired</> :
                         'Not set'}
          </span>
        )}
      </div>

      {/* ── Live countdown ── */}
      {loaded && endsAt && (
        <div className={cn(
          'px-5 py-5 flex flex-col items-center gap-3 border-b border-border',
          isActive ? 'bg-gray-950' : 'bg-muted/40',
        )}>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
            {isActive ? 'Ends in' : 'Sale ended'}
          </p>
          <div className="flex items-end gap-1">
            {[timeLeft.d, timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
              <span key={i} className="flex items-end gap-1">
                <span className="flex flex-col items-center">
                  <span className={cn(
                    'font-black text-2xl px-3 py-2 min-w-[52px] text-center tabular-nums font-mono leading-none rounded-lg',
                    isActive ? 'bg-gray-800 text-orange-400' : 'bg-muted text-muted-foreground',
                  )}>
                    {String(val).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold tracking-widest uppercase mt-1 text-gray-500">
                    {UNITS[i]}
                  </span>
                </span>
                {i < 3 && (
                  <span className={cn('font-black text-xl mb-5 px-0.5', isActive ? 'text-orange-400/60' : 'text-muted-foreground/40')}>
                    :
                  </span>
                )}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-gray-500">
            {isActive ? 'Ends' : 'Ended'}{' '}
            <span className="font-semibold text-gray-400">
              {new Date(endsAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </p>
        </div>
      )}

      {loaded && !endsAt && (
        <div className="px-5 py-6 flex items-center justify-center border-b border-border bg-muted/20">
          <p className="text-sm text-muted-foreground">No timer set — configure one below</p>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Quick presets */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => applyPreset(p.ms)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 transition">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date/time input */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Set custom end date &amp; time
          </label>
          <input
            type="datetime-local"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => inputVal && save(new Date(inputVal).toISOString())}
            disabled={!inputVal || saving}
            className="flex-1 bg-primary text-primary-foreground text-sm font-semibold rounded-xl py-2.5 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Set Timer'}
          </button>
          {endsAt && (
            <button
              onClick={() => save(null)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-red-500 hover:border-red-300 transition disabled:opacity-50"
              title="Clear timer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
