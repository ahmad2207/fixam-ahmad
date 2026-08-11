'use client';

import { useState, useMemo, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, BellOff, ChevronDown, ChevronRight, Download, Loader2, Package, Search, Camera, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import BarcodeScannerModal from './BarcodeScannerModal';
import { EditableBatchQuantity } from './EditableBatchQuantity';

interface ProductRow {
  id: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  price: string;
  costPrice: string;
  isActive: boolean;
  barcode: string | null;
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

interface WaitlistItem {
  id: string;
  productId: string;
  name: string;
  email: string;
  phone: string | null;
  notifiedAt: string | null;
  createdAt: string;
  productName: string | null;
  productImage: string | null;
  productSlug: string | null;
}

interface Props {
  products: ProductRow[];
  batches: BatchRow[];
  activeReservations: Reservation[];
  waitlist: WaitlistItem[];
}

type ViewMode = 'all-batches' | 'by-product' | 'low-stock' | 'waitlist';

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

export function InventoryTabsClient({ products, batches, activeReservations, waitlist }: Props) {
  const [view, setView] = useState<ViewMode>('by-product');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [notifying, setNotifying] = useState<Set<string>>(new Set());
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q));
  }, [products, search]);

  const lowStockProducts = useMemo(() => filteredProducts.filter((p) => p.stock < 10), [filteredProducts]);
  const pendingWaitlist  = useMemo(() => waitlist.filter((w) => !w.notifiedAt && !notifiedIds.has(w.id)), [waitlist, notifiedIds]);

  const markNotified = async (id: string) => {
    setNotifying(prev => new Set(prev).add(id));
    try {
      await fetch('/api/admin/stock-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifiedIds(prev => new Set(prev).add(id));
    } finally {
      setNotifying(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const batchesByProduct = useMemo(() => {
    const map: Record<string, BatchRow[]> = {};
    for (const b of batches) {
      if (!b.productId) continue;
      if (!map[b.productId]) map[b.productId] = [];
      map[b.productId].push(b);
    }
    return map;
  }, [batches]);

  const tabs: { id: ViewMode; label: string; count?: number; alert?: boolean }[] = [
    { id: 'by-product',  label: 'By Product',  count: filteredProducts.length },
    { id: 'all-batches', label: 'All Batches', count: batches.length },
    { id: 'low-stock',   label: 'Low Stock',   count: lowStockProducts.length },
    { id: 'waitlist',    label: 'Waitlist',     count: pendingWaitlist.length, alert: pendingWaitlist.length > 0 },
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
                  t.alert && view !== t.id
                    ? 'bg-violet-100 text-violet-700 font-bold'
                    : view === t.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'
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

      {/* Search — filters By Product / Low Stock by name or barcode */}
      {(view === 'by-product' || view === 'low-stock') && (
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or barcode…"
              className="w-full pl-9 pr-8 h-9 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 h-9 border rounded-lg text-sm font-medium text-gray-500 hover:text-primary hover:border-primary/40 bg-white transition"
            title="No handheld scanner? Scan with a device camera instead."
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        </div>
      )}

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
                      {b.productId ? (
                        <EditableBatchQuantity productId={b.productId} batchId={b.id} quantity={b.quantityAvailable} />
                      ) : (
                        b.quantityAvailable
                      )}
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
                {filteredProducts.map((p) => {
                  const pBatches = batchesByProduct[p.id] ?? [];
                  const isOpen = expanded.has(p.id);
                  const invValue = pBatches.reduce((s, b) => s + b.quantityAvailable * Number(b.costPrice), 0);
                  return (
                    <Fragment key={p.id}>
                      <tr
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
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                              {b.productId ? (
                                <EditableBatchQuantity productId={b.productId} batchId={b.id} quantity={b.quantityAvailable} className="text-xs" />
                              ) : (
                                b.quantityAvailable
                              )}
                              units remaining
                            </span>
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
                    </Fragment>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500">
                      {search ? 'No products match your search.' : 'No products found.'}
                    </td>
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
              <p className="text-gray-600 font-medium">
                {search ? 'No low-stock products match your search.' : 'All products are well stocked!'}
              </p>
              {!search && <p className="text-sm text-gray-400 mt-1">No products below 10 units.</p>}
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

      {/* Waitlist View */}
      {view === 'waitlist' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          {waitlist.length === 0 ? (
            <div className="text-center py-14">
              <BellOff className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No waitlist entries yet.</p>
              <p className="text-sm text-gray-400 mt-1">Customers will appear here when they sign up for out-of-stock alerts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Signed Up</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((w) => {
                    const isNotified = !!w.notifiedAt || notifiedIds.has(w.id);
                    const isBusy    = notifying.has(w.id);
                    return (
                      <tr key={w.id} className={`border-b last:border-0 ${isNotified ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {w.productImage ? (
                              <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                                <Image src={w.productImage} alt={w.productName ?? ''} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[160px]">{w.productName ?? '—'}</p>
                              {w.productSlug && (
                                <Link href={`/products/${w.productSlug}`} target="_blank"
                                  className="text-[11px] text-primary hover:underline">View →</Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{w.name}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{w.email}</p>
                          {w.phone && <p className="text-xs text-gray-400">{w.phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(w.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {isNotified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              <Bell className="h-3 w-3" /> Notified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!isNotified && (
                            <button
                              onClick={() => markNotified(w.id)}
                              disabled={isBusy}
                              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 px-3 py-1.5 rounded-md transition"
                            >
                              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
                              {isBusy ? 'Sending…' : 'Send Email'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {showScanner && (
        <BarcodeScannerModal
          onDetected={(code) => { setSearch(code); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
