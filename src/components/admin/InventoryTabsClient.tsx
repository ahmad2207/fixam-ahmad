'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Download, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductRow {
  id: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  price: string;
  costPrice: string;
  isActive: boolean;
  categoryName: string | null;
}

interface BatchRow {
  id: string;
  productId: string | null;
  quantityAvailable: number;
  costPrice: string;
  createdAt: string | null;
  productName: string | null;
  productImage: string | null;
}

interface Reservation {
  id: string;
  checkoutId: string;
  productId: string | null;
  quantity: number;
  expiresAt: string;
  productName: string | null;
}

interface Props {
  products: ProductRow[];
  batches: BatchRow[];
  activeReservations: Reservation[];
}

type ViewMode = 'all-batches' | 'by-product' | 'low-stock';

function StockHealthBar({ stock }: { stock: number }) {
  const isOut = stock === 0;
  const isLow = stock > 0 && stock < 10;
  const isHealthy = stock >= 10;

  const color = isOut
    ? 'bg-red-500'
    : isLow
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const label = isOut ? 'Critical' : isLow ? 'Low' : 'Healthy';
  const labelColor = isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600';

  // Progress fills to 100% at 50 units, capped
  const pct = Math.min((stock / 50) * 100, 100);

  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium w-14 shrink-0 ${labelColor}`}>{label} ({stock})</span>
    </div>
  );
}

function exportCSV(products: ProductRow[], batches: BatchRow[]) {
  const rows: string[][] = [
    ['Product', 'Category', 'Stock', 'Price', 'Cost Price', 'Inventory Value', 'Batch Count', 'Batch ID', 'Batch Date', 'Batch Qty Available', 'Batch Cost'],
  ];

  for (const p of products) {
    const pBatches = batches.filter((b) => b.productId === p.id);
    const invValue = pBatches.reduce((s, b) => s + b.quantityAvailable * Number(b.costPrice), 0);

    if (pBatches.length === 0) {
      rows.push([p.name, p.categoryName ?? '', String(p.stock), p.price, p.costPrice, '0', '0', '', '', '', '']);
    } else {
      pBatches.forEach((b, i) => {
        rows.push([
          i === 0 ? p.name : '',
          i === 0 ? (p.categoryName ?? '') : '',
          i === 0 ? String(p.stock) : '',
          i === 0 ? p.price : '',
          i === 0 ? p.costPrice : '',
          i === 0 ? invValue.toFixed(2) : '',
          i === 0 ? String(pBatches.length) : '',
          b.id,
          b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-NG') : '',
          String(b.quantityAvailable),
          b.costPrice,
        ]);
      });
    }
  }

  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InventoryTabsClient({ products, batches, activeReservations }: Props) {
  const [view, setView] = useState<ViewMode>('by-product');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const lowStockProducts = useMemo(() => products.filter((p) => p.stock < 10), [products]);

  const batchesByProduct = useMemo(() => {
    const map: Record<string, BatchRow[]> = {};
    for (const b of batches) {
      if (!b.productId) continue;
      if (!map[b.productId]) map[b.productId] = [];
      map[b.productId].push(b);
    }
    return map;
  }, [batches]);

  const tabs: { id: ViewMode; label: string; count?: number }[] = [
    { id: 'by-product', label: 'By Product', count: products.length },
    { id: 'all-batches', label: 'All Batches', count: batches.length },
    { id: 'low-stock', label: 'Low Stock', count: lowStockProducts.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs + Export */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                view === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  view === t.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCSV(products, batches)}
          className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* All Batches View */}
      {view === 'all-batches' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Batch Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Qty Available</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Cost/Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Batch Value</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {b.productImage ? (
                          <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
                            <Image src={b.productImage} alt={b.productName ?? ''} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center shrink-0">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium">{b.productName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-NG') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {b.quantityAvailable}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(Number(b.costPrice))}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(b.quantityAvailable * Number(b.costPrice))}
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No inventory batches found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Product View */}
      {view === 'by-product' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-6" />
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Stock Health</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Inv. Value</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const pBatches = batchesByProduct[p.id] ?? [];
                  const isOpen = expanded.has(p.id);
                  const invValue = pBatches.reduce((s, b) => s + b.quantityAvailable * Number(b.costPrice), 0);
                  return (
                    <>
                      <tr
                        key={p.id}
                        onClick={() => pBatches.length > 0 && toggle(p.id)}
                        className={`border-b hover:bg-gray-50 ${pBatches.length > 0 ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {pBatches.length > 0 ? (
                            isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium">{p.name}</span>
                              {pBatches.length > 0 && (
                                <span className="ml-2 text-xs text-gray-400">{pBatches.length} batch{pBatches.length !== 1 ? 'es' : ''}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.categoryName ?? '—'}</td>
                        <td className="px-4 py-3">
                          <StockHealthBar stock={p.stock} />
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(Number(p.price))}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(Number(p.costPrice))}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(invValue)}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/inventory/${p.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>

                      {isOpen && pBatches.map((b, idx) => (
                        <tr key={b.id} className="bg-gray-50 border-b last:border-0">
                          <td />
                          <td colSpan={2} className="px-4 py-2 pl-16">
                            <span className="text-xs text-gray-500 font-medium">
                              Batch #{idx + 1} — {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-NG') : '—'}
                              {idx === 0 && <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">Next to sell (FIFO)</span>}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-xs text-gray-500">{b.quantityAvailable} units remaining</span>
                          </td>
                          <td colSpan={2} className="px-4 py-2 text-right text-xs text-gray-500">
                            {formatCurrency(Number(b.costPrice))}/unit
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-medium text-emerald-600">
                            {formatCurrency(b.quantityAvailable * Number(b.costPrice))}
                          </td>
                          <td />
                        </tr>
                      ))}
                    </>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock View */}
      {view === 'low-stock' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-600 font-medium">All products are well stocked!</p>
              <p className="text-sm text-gray-400 mt-1">No products below 10 units.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Stock Health</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                              <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.categoryName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StockHealthBar stock={p.stock} />
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(Number(p.price))}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/inventory/${p.id}`} className="text-primary hover:underline text-xs font-medium">
                          Restock →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Stock Reservations */}
      {activeReservations.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">
            Active Stock Reservations
            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {activeReservations.length}
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Qty Reserved</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Expires At</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Checkout ID</th>
                </tr>
              </thead>
              <tbody>
                {activeReservations.map((r) => {
                  const expired = new Date(r.expiresAt) < new Date();
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{r.productName ?? r.productId}</td>
                      <td className="px-4 py-2">{r.quantity}</td>
                      <td className="px-4 py-2">
                        <span className={expired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(r.expiresAt).toLocaleString('en-NG')}
                          {expired && <span className="ml-1 text-xs">(expired)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {r.checkoutId.slice(0, 12)}…
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
