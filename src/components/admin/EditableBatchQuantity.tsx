'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  batchId: string;
  quantity: number;
  className?: string;
}

/**
 * A batch's "units remaining" figure, editable in place — click it to
 * correct a data-entry mistake (e.g. a delivery logged as 500 units instead
 * of 50). Mirrors the click-to-edit pattern already used for price/quantity
 * on the POS page, so it behaves the way admins already expect a number to.
 *
 * The pages this renders on (`/admin/inventory` and its per-product "Manage"
 * view) are Server Components fetching fresh on every navigation, not
 * react-query — so a successful save calls `router.refresh()` to re-pull
 * the batch list, the product's resynced stock, and the Inventory Value
 * total, instead of just updating local state and going stale.
 */
export function EditableBatchQuantity({ productId, batchId, quantity, className }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(quantity));
  const [saving, setSaving] = useState(false);

  // Stay in sync once the refresh below lands a new server-fetched value.
  useEffect(() => {
    if (!editing) setValue(String(quantity));
  }, [quantity, editing]);

  const cancel = () => {
    setValue(String(quantity));
    setEditing(false);
  };

  const commit = async () => {
    const next = parseInt(value, 10);
    if (!Number.isFinite(next) || next < 0) {
      toast.error('Enter a whole number of 0 or more');
      cancel();
      return;
    }
    if (next === quantity) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityAvailable: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update batch');
      toast.success('Batch quantity corrected');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update batch quantity');
      setValue(String(quantity));
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        step={1}
        autoFocus
        disabled={saving}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') cancel();
        }}
        className={cn(
          'w-20 border border-primary/50 rounded-md px-2 py-1 text-right text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20',
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      disabled={saving}
      title="Click to correct this batch's quantity"
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-1 -mx-1 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50',
        className,
      )}
    >
      {saving && <Loader2 className="h-3 w-3 animate-spin" />}
      {quantity.toLocaleString()}
    </button>
  );
}
