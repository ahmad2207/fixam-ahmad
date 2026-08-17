'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EditableBatchQuantity, EditableBatchField, EditableLandingDate } from '@/components/admin/EditableBatchQuantity';
import { formatCurrency } from '@/lib/utils';
import type { BatchLine } from './BatchGroupRow';

interface Props {
  productId: string;
  variationOption: string;
  // This variation's own batches, oldest-first (same createdAt-ascending
  // order the page fetches with) — never mixed with another variation's
  // batches. FIFO/pricing operate strictly per (product, variationOption);
  // see getVariationPricingForProducts/pickActiveLine in lib/inventory.ts,
  // which this mirrors purely for display.
  lines: BatchLine[];
  // Whether this is the variation whose price currently mirrors onto the
  // product card (products.defaultVariationOption) — a display choice,
  // independent of which batch is FIFO-active within this variation.
  isDisplayed: boolean;
}

/**
 * One variation's full FIFO lineage — click to expand and see every batch
 * ever logged for this option, oldest to newest, with each one's status:
 *   - Active: the oldest batch that still has stock — this is what
 *     getVariationPricingForProducts is currently pricing this variation
 *     from, and what the next sale draws down.
 *   - Queued: has stock, but sits behind the active batch — will only
 *     become active once it depletes.
 *   - Depleted: no stock left; every batch older than the active one is
 *     always in this state, by definition of "active" being the oldest one
 *     WITH stock.
 * Variations declared on the product but never actually stocked render with
 * `lines: []` — a flat "No batches yet" row, not expandable.
 */
export function VariationGroupRow({ productId, variationOption, lines, isDisplayed }: Props) {
  const [open, setOpen] = useState(false);
  const hasLines = lines.length > 0;
  const totalQty = lines.reduce((sum, l) => sum + l.quantityAvailable, 0);
  // Same rule as pickActiveLine in lib/inventory.ts: the oldest line still
  // holding stock, else the most recently added line (a real last-known
  // price beats dropping to nothing).
  const active = hasLines ? (lines.find((l) => l.quantityAvailable > 0) ?? lines[lines.length - 1]) : undefined;

  return (
    <>
      <tr
        className={`border-t ${hasLines ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasLines && setOpen((o) => !o)}
      >
        <td className="px-4 py-3 font-medium text-gray-700">
          <span className="inline-flex items-center gap-1.5">
            {hasLines
              ? (open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)
              : <span className="inline-block w-3.5" />}
            {variationOption}
            {isDisplayed && (
              <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">Displayed</span>
            )}
          </span>
        </td>
        <td className={`px-4 py-3 font-medium ${totalQty === 0 ? 'text-gray-400' : 'text-primary'}`}>
          {hasLines ? `${totalQty.toLocaleString()} in ${lines.length} batch${lines.length !== 1 ? 'es' : ''}` : 'No batches yet'}
        </td>
        <td className="px-4 py-3 text-gray-500">{active ? formatCurrency(Number(active.costPrice)) : '—'}</td>
        <td className="px-4 py-3 text-gray-500">{active ? formatCurrency(Number(active.sellingPrice)) : '—'}</td>
      </tr>
      {open && hasLines && lines.map((b) => {
        const status = b.quantityAvailable === 0 ? 'Depleted' : b.id === active?.id ? 'Active' : 'Queued';
        const statusCls = status === 'Active'
          ? 'bg-emerald-100 text-emerald-700'
          : status === 'Queued'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-gray-100 text-gray-400';
        return (
          <tr key={b.id} className="border-t bg-gray-50">
            <td className="px-4 py-2 pl-8 text-xs text-gray-500 whitespace-nowrap">
              {new Date(b.createdAt).toLocaleDateString('en-NG')}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${statusCls}`}>{status}</span>
              <EditableLandingDate
                productId={productId}
                batchId={b.id}
                landingDate={b.landingDate}
                createdAt={b.createdAt}
                className="block text-[10px] mt-0.5"
              />
            </td>
            <td className={`px-4 py-2 text-xs font-medium ${b.quantityAvailable === 0 ? 'text-gray-400' : 'text-primary'}`}>
              <EditableBatchQuantity productId={productId} batchId={b.id} quantity={b.quantityAvailable} className="text-xs" />
            </td>
            <td className="px-4 py-2 text-xs">
              <EditableBatchField productId={productId} batchId={b.id} field="costPrice" value={Number(b.costPrice)} className="text-xs" />
            </td>
            <td className="px-4 py-2 text-xs">
              <EditableBatchField productId={productId} batchId={b.id} field="sellingPrice" value={Number(b.sellingPrice)} className="text-xs" />
            </td>
          </tr>
        );
      })}
    </>
  );
}
