'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EditableBatchQuantity, EditableBatchField } from '@/components/admin/EditableBatchQuantity';
import { formatCurrency } from '@/lib/utils';

export interface BatchLine {
  id: string;
  createdAt: string;
  quantityAvailable: number;
  costPrice: string;
  sellingPrice: string;
  variationOption: string | null;
}

interface Props {
  productId: string;
  lines: BatchLine[];
  defaultVariationOption: string | null;
}

/**
 * One row of the batch history table. A delivery logged as several
 * variation lines at once (see AddBatchForm) renders as a single
 * expandable "Batch" summary row — click to drop down and see/edit each
 * variation's own quantity/cost/selling price. A delivery with just one
 * line (every non-priced product, and any priced delivery that only
 * restocked one size) renders flat, exactly as batch rows always have.
 */
export function BatchGroupRow({ productId, lines, defaultVariationOption }: Props) {
  const [open, setOpen] = useState(false);
  const date = new Date(lines[0].createdAt).toLocaleDateString('en-NG');

  if (lines.length === 1) {
    const b = lines[0];
    return (
      <tr className="border-t">
        <td className="px-4 py-3 text-gray-500">{date}</td>
        <td className={`px-4 py-3 font-medium ${b.quantityAvailable === 0 ? 'text-gray-400' : 'text-primary'}`}>
          <EditableBatchQuantity productId={productId} batchId={b.id} quantity={b.quantityAvailable} />
          {b.variationOption && <span className="ml-2 text-xs font-normal text-gray-400">({b.variationOption})</span>}
        </td>
        <td className="px-4 py-3">
          <EditableBatchField productId={productId} batchId={b.id} field="costPrice" value={Number(b.costPrice)} />
        </td>
        <td className="px-4 py-3">
          <EditableBatchField productId={productId} batchId={b.id} field="sellingPrice" value={Number(b.sellingPrice)} />
        </td>
      </tr>
    );
  }

  const totalQty = lines.reduce((sum, l) => sum + l.quantityAvailable, 0);
  const displayLine = lines.find((l) => l.variationOption === defaultVariationOption);

  return (
    <>
      <tr className="border-t cursor-pointer hover:bg-gray-50" onClick={() => setOpen((o) => !o)}>
        <td className="px-4 py-3 text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {date}
          </span>
        </td>
        <td className="px-4 py-3 font-medium text-primary">
          {lines.length} variations · {totalQty.toLocaleString()} units
        </td>
        <td className="px-4 py-3 text-gray-500">{displayLine ? formatCurrency(Number(displayLine.costPrice)) : '—'}</td>
        <td className="px-4 py-3 text-gray-500">{displayLine ? formatCurrency(Number(displayLine.sellingPrice)) : '—'}</td>
      </tr>
      {open && lines.map((b) => (
        <tr key={b.id} className="border-t bg-gray-50">
          <td className="px-4 py-2 pl-8 text-xs text-gray-500">
            {b.variationOption}
            {b.variationOption === defaultVariationOption && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">Displayed</span>
            )}
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
      ))}
    </>
  );
}
