'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { BatchGroupRow, type BatchLine } from './BatchGroupRow';
import { VariationGroupRow } from './VariationGroupRow';

interface BatchRow extends BatchLine {
  deliveryGroupId: string | null;
}

interface Props {
  productId: string;
  batches: BatchRow[]; // oldest-first (createdAt ascending)
  pricedVariationName: string | null;
  variationOptions: string[];
  defaultVariationOption: string | null;
}

/**
 * Two views over the exact same batch rows — grouping is purely a display
 * choice, since variationOption and deliveryGroupId both already live on
 * every row (see the columns' own comments in db/schema/inventoryBatches.ts):
 *
 *  - "By Delivery" (default): grouped by deliveryGroupId — "what arrived
 *    together and what did it cost us." Good for receiving/traceability.
 *  - "By Variation": grouped by variationOption — each variation's own full
 *    FIFO lineage, oldest to newest, with which batch is currently active.
 *    Answers "if I sell N more of this size, whose cost am I about to roll
 *    onto?" — a question the delivery view can't answer without manually
 *    scanning every past delivery for this one option.
 *
 * Only shown for products with priced variations; a non-priced product has
 * nothing to group by variation (every batch's variationOption is null), so
 * it only ever sees the delivery view, unchanged from before this existed.
 */
export function BatchHistoryTable({ productId, batches, pricedVariationName, variationOptions, defaultVariationOption }: Props) {
  const showToggle = !!pricedVariationName && variationOptions.length > 0;
  const [view, setView] = useState<'delivery' | 'variation'>('delivery');
  const activeView = showToggle ? view : 'delivery';

  const deliveryGroups = useMemo(() => {
    const map = new Map<string, BatchRow[]>();
    for (const b of batches) {
      const key = b.deliveryGroupId ?? b.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return [...map.entries()];
  }, [batches]);

  const variationGroups = useMemo(() => {
    if (!showToggle) return [];
    const byOption = new Map<string, BatchRow[]>();
    for (const b of batches) {
      if (!b.variationOption) continue;
      if (!byOption.has(b.variationOption)) byOption.set(b.variationOption, []);
      byOption.get(b.variationOption)!.push(b);
    }
    // Preserve the product's declared variation order, and include options
    // with zero batches — surfaces a size that was configured but never
    // actually stocked, which the delivery view has no way to show at all.
    return variationOptions.map((opt) => ({ option: opt, lines: byOption.get(opt) ?? [] }));
  }, [batches, showToggle, variationOptions]);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold">Batch History</h2>
        {showToggle && (
          <div className="inline-flex rounded-lg border p-0.5 bg-gray-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => setView('delivery')}
              className={cn('px-3 py-1.5 rounded-md transition-colors', activeView === 'delivery' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700')}
            >
              By Delivery
            </button>
            <button
              type="button"
              onClick={() => setView('variation')}
              className={cn('px-3 py-1.5 rounded-md transition-colors', activeView === 'variation' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700')}
            >
              By Variation
            </button>
          </div>
        )}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {activeView === 'delivery' ? (
              <>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{pricedVariationName ? 'Variation' : 'Qty Available'}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cost Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Selling Price</th>
              </>
            ) : (
              <>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{pricedVariationName}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Active Cost</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Active Selling</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {activeView === 'delivery'
            ? deliveryGroups.map(([key, lines]) => (
                <BatchGroupRow key={key} productId={productId} lines={lines} defaultVariationOption={defaultVariationOption} />
              ))
            : variationGroups.map(({ option, lines }) => (
                <VariationGroupRow
                  key={option}
                  productId={productId}
                  variationOption={option}
                  lines={lines}
                  isDisplayed={option === defaultVariationOption}
                />
              ))}
        </tbody>
      </table>
      {batches.length === 0 && (
        <p className="text-center py-6 text-gray-500 text-sm">No batches yet.</p>
      )}
    </div>
  );
}
