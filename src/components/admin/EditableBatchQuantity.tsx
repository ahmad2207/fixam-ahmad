'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

type BatchField = 'quantityAvailable' | 'costPrice' | 'sellingPrice';

interface FieldProps {
  productId: string;
  batchId: string;
  field: BatchField;
  value: number;
  className?: string;
}

const FIELD_META: Record<BatchField, { label: string; isCurrency: boolean; isInteger: boolean; successMessage: string }> = {
  quantityAvailable: { label: "this batch's quantity", isCurrency: false, isInteger: true, successMessage: 'Batch quantity corrected' },
  costPrice: { label: "this batch's cost price", isCurrency: true, isInteger: false, successMessage: 'Batch cost price corrected' },
  sellingPrice: { label: "this batch's selling price", isCurrency: true, isInteger: false, successMessage: 'Batch selling price corrected' },
};

/**
 * A batch's quantity, cost price, or selling price — editable in place —
 * click it to correct a data-entry mistake (e.g. a delivery logged as 500
 * units instead of 50, or a cost/selling price typo). Mirrors the
 * click-to-edit pattern already used for price/quantity on the POS page, so
 * it behaves the way admins already expect a number to.
 *
 * The pages this renders on (`/admin/inventory` and its per-product "Manage"
 * view) are Server Components fetching fresh on every navigation, not
 * react-query — so a successful save calls `router.refresh()` to re-pull
 * the batch list, the product's resynced stock/price, and the Inventory
 * Value total, instead of just updating local state and going stale.
 */
export function EditableBatchField({ productId, batchId, field, value, className }: FieldProps) {
  const router = useRouter();
  const meta = FIELD_META[field];
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const [saving, setSaving] = useState(false);

  // Stay in sync once the refresh below lands a new server-fetched value.
  useEffect(() => {
    if (!editing) setInput(String(value));
  }, [value, editing]);

  const cancel = () => {
    setInput(String(value));
    setEditing(false);
  };

  const commit = async () => {
    const next = meta.isInteger ? parseInt(input, 10) : parseFloat(input);
    if (!Number.isFinite(next) || next < 0) {
      toast.error(meta.isInteger ? 'Enter a whole number of 0 or more' : 'Enter a number of 0 or more');
      cancel();
      return;
    }
    if (next === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update batch');
      toast.success(meta.successMessage);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update batch');
      setInput(String(value));
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
        step={meta.isInteger ? 1 : 0.01}
        autoFocus
        disabled={saving}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') cancel();
        }}
        className={cn(
          'w-24 border border-primary/50 rounded-md px-2 py-1 text-right text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20',
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
      title={`Click to correct ${meta.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-1 -mx-1 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50',
        className,
      )}
    >
      {saving && <Loader2 className="h-3 w-3 animate-spin" />}
      {meta.isCurrency ? formatCurrency(value) : value.toLocaleString()}
    </button>
  );
}

// Thin wrapper preserving the pre-existing name/prop shape used across the
// batch history tables — quantity correction predates the generic field
// editor above.
export function EditableBatchQuantity({
  productId, batchId, quantity, className,
}: { productId: string; batchId: string; quantity: number; className?: string }) {
  return (
    <EditableBatchField
      productId={productId}
      batchId={batchId}
      field="quantityAvailable"
      value={quantity}
      className={className}
    />
  );
}

/**
 * Landing date — informational only (see inventory_batches.landingDate's
 * own comment), so unlike the fields above it's a tri-state edit rather
 * than a plain number swap: "same as upload date" (null) vs an explicit
 * date. Click to reveal the same checkbox + date-picker control used when
 * first logging the batch, so the edit affordance matches what the admin
 * already knows from the Add Batch form. Edits to this field specifically
 * get an admin-audit-log entry (see the PATCH route) — the other batch
 * fields don't, but this one exists for auditors, so a silent edit here
 * would undermine its own purpose.
 */
export function EditableLandingDate({
  productId, batchId, landingDate, createdAt, className,
}: { productId: string; batchId: string; landingDate: string | null; createdAt: string; className?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [sameAsUpload, setSameAsUpload] = useState(landingDate === null);
  const [dateInput, setDateInput] = useState(landingDate ? landingDate.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setSameAsUpload(landingDate === null);
      setDateInput(landingDate ? landingDate.slice(0, 10) : '');
    }
  }, [landingDate, editing]);

  const cancel = () => {
    setSameAsUpload(landingDate === null);
    setDateInput(landingDate ? landingDate.slice(0, 10) : '');
    setEditing(false);
  };

  const commit = async () => {
    if (!sameAsUpload && !dateInput) {
      toast.error('Choose a landing date, or check "same as upload date"');
      return;
    }
    const nextValue = sameAsUpload ? null : dateInput;
    const currentValue = landingDate ? landingDate.slice(0, 10) : null;
    if (nextValue === currentValue) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingDate: nextValue }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update landing date');
      toast.success('Landing date corrected');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update landing date');
      cancel();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className={cn('inline-flex flex-col items-start gap-1', className)} onClick={(e) => e.stopPropagation()}>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sameAsUpload}
            disabled={saving}
            onChange={(e) => setSameAsUpload(e.target.checked)}
            className="rounded border-gray-300"
          />
          Same as upload date
        </label>
        {!sameAsUpload && (
          <input
            type="date"
            autoFocus
            disabled={saving}
            value={dateInput}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') cancel();
            }}
            className="border border-primary/50 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
        <div className="flex gap-2">
          <button type="button" disabled={saving} onClick={commit} className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" disabled={saving} onClick={cancel} className="text-[10px] text-gray-400 hover:underline disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Click to correct the landing date"
      className={cn(
        'inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-primary/10 hover:text-primary transition-colors text-gray-400',
        className,
      )}
    >
      {landingDate
        ? `Landed: ${new Date(landingDate).toLocaleDateString('en-NG')}`
        : `Landed: ${new Date(createdAt).toLocaleDateString('en-NG')} (same as upload)`}
    </button>
  );
}
