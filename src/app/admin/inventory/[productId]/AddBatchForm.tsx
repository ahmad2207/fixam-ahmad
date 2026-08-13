'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  productId: string;
  // When the product prices by variation: the group name (e.g. "Size"),
  // its option values, and which one currently shows on the storefront.
  // Absent/empty for a non-priced product, which keeps the original
  // single-line form below untouched.
  pricedVariationName?: string | null;
  variationOptions?: string[];
  defaultVariationOption?: string | null;
}

interface Line {
  quantity: string;
  costPrice: string;
  sellingPrice: string;
}

const emptyLines = (options: string[]): Record<string, Line> =>
  Object.fromEntries(options.map((opt) => [opt, { quantity: '', costPrice: '', sellingPrice: '' }]));

export function AddBatchForm({ productId, pricedVariationName, variationOptions = [], defaultVariationOption }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ── Non-priced product: one quantity/cost/selling triple ──
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // ── Priced product: one delivery, one row per variation option ──
  const [lines, setLines] = useState<Record<string, Line>>(() => emptyLines(variationOptions));
  const [displayOption, setDisplayOption] = useState(defaultVariationOption || variationOptions[0] || '');

  const updateLine = (option: string, field: keyof Line, value: string) =>
    setLines((prev) => ({ ...prev, [option]: { ...prev[option], [field]: value } }));

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: Number(quantity),
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Batch added successfully');
      setQuantity('');
      setCostPrice('');
      setSellingPrice('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeLines = Object.entries(lines)
      .filter(([, l]) => Number(l.quantity) > 0)
      .map(([option, l]) => ({
        variationOption: option,
        quantity: Number(l.quantity),
        costPrice: Number(l.costPrice),
        sellingPrice: Number(l.sellingPrice),
      }));

    if (!activeLines.length) {
      toast.error(`Enter a quantity for at least one ${pricedVariationName}`);
      return;
    }
    const incomplete = activeLines.find((l) => !l.costPrice || !l.sellingPrice);
    if (incomplete) {
      toast.error(`Enter both prices for "${incomplete.variationOption}"`);
      return;
    }
    if (!displayOption) {
      toast.error('Choose which price should show on the storefront');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: activeLines, defaultVariationOption: displayOption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Delivery added successfully');
      setLines(emptyLines(variationOptions));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pricedVariationName || variationOptions.length === 0) {
    return (
      <form onSubmit={handleSingleSubmit} className="flex gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            placeholder="e.g. 50"
            className="border rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cost Price (₦)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
            placeholder="e.g. 5000"
            className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Selling Price (₦)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
            placeholder="e.g. 7500"
            className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Batch'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleGroupSubmit} className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2 pr-3 font-medium">{pricedVariationName}</th>
              <th className="pb-2 pr-3 font-medium">Qty</th>
              <th className="pb-2 pr-3 font-medium">Cost (₦)</th>
              <th className="pb-2 font-medium">Selling (₦)</th>
            </tr>
          </thead>
          <tbody>
            {variationOptions.map((opt) => (
              <tr key={opt}>
                <td className="py-1 pr-3 font-medium text-gray-700">{opt}</td>
                <td className="py-1 pr-3">
                  <input
                    type="number" min="0" value={lines[opt]?.quantity ?? ''}
                    onChange={(e) => updateLine(opt, 'quantity', e.target.value)}
                    placeholder="0"
                    className="border rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </td>
                <td className="py-1 pr-3">
                  <input
                    type="number" min="0" step="0.01" value={lines[opt]?.costPrice ?? ''}
                    onChange={(e) => updateLine(opt, 'costPrice', e.target.value)}
                    placeholder="e.g. 5000"
                    className="border rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </td>
                <td className="py-1">
                  <input
                    type="number" min="0" step="0.01" value={lines[opt]?.sellingPrice ?? ''}
                    onChange={(e) => updateLine(opt, 'sellingPrice', e.target.value)}
                    placeholder="e.g. 7500"
                    className="border rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Which price shows on the storefront?</label>
          <select
            value={displayOption}
            onChange={(e) => setDisplayOption(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {variationOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Batch'}
        </button>
      </div>
      <p className="text-[11px] text-gray-400">
        Leave a {pricedVariationName.toLowerCase()}&apos;s quantity at 0 if it didn&apos;t arrive in this delivery.
      </p>
    </form>
  );
}
