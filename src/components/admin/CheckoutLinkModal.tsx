'use client';

import { useState } from 'react';
import { X, Link2, Minus, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LinkableProduct {
  id: string;
  name: string;
  slug: string;
  pricedVariationName: string | null;
  defaultVariationOption: string | null;
  variations: { name: string; options: string[] }[] | null;
}

interface Row {
  product: LinkableProduct;
  qty: number;
  variant: string;
}

function priceGroupOptions(product: LinkableProduct): string[] {
  if (!product.pricedVariationName) return [];
  return product.variations?.find((v) => v.name === product.pricedVariationName)?.options ?? [];
}

export default function CheckoutLinkModal({
  products, onClose,
}: { products: LinkableProduct[]; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>(() =>
    products.map((product) => ({
      product,
      qty: 1,
      variant: product.defaultVariationOption || priceGroupOptions(product)[0] || '',
    })),
  );

  const updateQty = (id: string, qty: number) =>
    setRows((rs) => rs.map((r) => (r.product.id === id ? { ...r, qty: Math.max(1, qty) } : r)));
  const updateVariant = (id: string, variant: string) =>
    setRows((rs) => rs.map((r) => (r.product.id === id ? { ...r, variant } : r)));

  const copyLink = async () => {
    for (const row of rows) {
      if (row.product.pricedVariationName && !row.variant) {
        toast.error(`Choose a ${row.product.pricedVariationName} for ${row.product.name}`);
        return;
      }
    }
    const items = rows.map((r) => ({
      slug: r.product.slug,
      qty: r.qty,
      ...(r.product.pricedVariationName ? { variant: r.variant } : {}),
    }));
    const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${origin}/checkout?items=${encodeURIComponent(JSON.stringify(items))}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Checkout link copied — paste it into WhatsApp');
      onClose();
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground">Checkout Link</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground -mt-1">
            Sends the customer straight to checkout with these items — no account needed.
          </p>
          {rows.map((row) => {
            const options = priceGroupOptions(row.product);
            return (
              <div key={row.product.id} className="border border-border rounded-xl p-3.5 space-y-2.5">
                <p className="text-sm font-semibold text-foreground truncate">{row.product.name}</p>
                {options.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">{row.product.pricedVariationName}</label>
                    <select
                      value={row.variant}
                      onChange={(e) => updateVariant(row.product.id, e.target.value)}
                      className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    >
                      <option value="">Select…</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-muted-foreground">Qty</label>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button type="button" onClick={() => updateQty(row.product.id, row.qty - 1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{row.qty}</span>
                    <button type="button" onClick={() => updateQty(row.product.id, row.qty + 1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition"
          >
            <Copy className="w-4 h-4" /> Generate &amp; Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
