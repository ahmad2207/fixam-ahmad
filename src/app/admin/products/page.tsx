'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import {
  Search, Package, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, Trash2, CheckSquare, Square, MinusSquare,
  Plus, TrendingUp, AlertTriangle, X, Edit2, Eye, EyeOff,
  Filter, Printer, Camera,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BarcodeLabelPreview from '@/components/admin/BarcodeLabelPreview';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  costPrice: string | null;
  compareAtPrice: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  barcode: string | null;
  createdAt: string;
}

type SortKey = 'name' | 'price' | 'stock' | 'margin';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive' | 'out-of-stock';

function useAdminProducts() {
  return useQuery<AdminProduct[]>({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });
}

function getMargin(p: AdminProduct) {
  const price = Number(p.price);
  const cost = Number(p.costPrice ?? 0);
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

function RestockDialog({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState('');
  const [costPrice, setCostPrice] = useState(product.costPrice ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const batchValue = Number(qty) > 0 && Number(costPrice) > 0 ? Number(qty) * Number(costPrice) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || !costPrice) { toast.error('Quantity and cost price are required'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/inventory/${product.id}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(qty), costPrice: Number(costPrice) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Added ${qty} units to ${product.name}`);
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      onClose();
    } catch {
      toast.error('Failed to restock product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground">Quick Restock</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {product.imageUrl
                ? <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">Current stock: <span className={cn('font-bold', product.stock === 0 ? 'text-destructive' : 'text-foreground')}>{product.stock} units</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Qty to Add <span className="text-destructive">*</span></label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required placeholder="50"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Cost/Unit (₦) <span className="text-destructive">*</span></label>
              <input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required placeholder="2500"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background" />
            </div>
          </div>

          {batchValue > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Batch value</span>
              <span className="font-bold text-primary">{formatCurrency(batchValue)}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50">
              {isSubmitting ? 'Adding…' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restockProduct, setRestockProduct] = useState<AdminProduct | null>(null);
  const [labelProduct, setLabelProduct] = useState<AdminProduct | null>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q));
    }
    if (statusFilter === 'active')       list = list.filter((p) => p.isActive);
    if (statusFilter === 'inactive')     list = list.filter((p) => !p.isActive);
    if (statusFilter === 'out-of-stock') list = list.filter((p) => p.stock <= 0);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortKey === 'price')  cmp = Number(a.price) - Number(b.price);
      if (sortKey === 'stock')  cmp = a.stock - b.stock;
      if (sortKey === 'margin') cmp = getMargin(a) - getMargin(b);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, search, statusFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 inline text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 inline text-primary" />;
  };

  const allSelected  = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = filtered.some((p) => selected.has(p.id)) && !allSelected;
  const toggleAll    = () => {
    if (allSelected) setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.delete(p.id)); return n; });
    else setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.add(p.id)); return n; });
  };
  const toggleOne = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkApply = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = [...selected];
    try {
      if (bulkAction === 'activate' || bulkAction === 'deactivate') {
        const isActive = bulkAction === 'activate';
        await Promise.all(ids.map((id) =>
          fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) })
        ));
        toast.success(`${ids.length} products ${isActive ? 'activated' : 'deactivated'}`);
      }
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      setSelected(new Set()); setBulkAction('');
    } catch { toast.error('Bulk action failed'); }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete product'); }
  };

  const openLabel = async (product: AdminProduct) => {
    if (product.barcode) { setLabelProduct(product); return; }
    // Products created before barcodes existed have none yet — generate + persist one now.
    try {
      const genRes = await fetch('/api/admin/products/generate-barcode', { method: 'POST' });
      if (!genRes.ok) throw new Error();
      const { barcode } = await genRes.json();
      const patchRes = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode }),
      });
      if (!patchRes.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      setLabelProduct({ ...product, barcode });
    } catch {
      toast.error('Failed to generate a barcode for this product');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      toast.success(`Product ${!current ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update product'); }
  };

  const totalProducts    = products?.length ?? 0;
  const activeProducts   = products?.filter((p) => p.isActive).length ?? 0;
  const outOfStock       = products?.filter((p) => p.stock <= 0).length ?? 0;
  const totalRetailValue = (products ?? []).reduce((s, p) => s + Number(p.price) * p.stock, 0);

  const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'all',          label: 'All' },
    { id: 'active',       label: 'Active' },
    { id: 'inactive',     label: 'Inactive' },
    { id: 'out-of-stock', label: 'Out of Stock' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalProducts} products in catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Product
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',    value: totalProducts,                    icon: Package,       accentBg: 'bg-primary/10',   accentText: 'text-primary',     border: 'border-l-4 border-l-primary' },
          { label: 'Active',            value: activeProducts,                   icon: TrendingUp,    accentBg: 'bg-emerald-50',   accentText: 'text-emerald-600', border: 'border-l-4 border-l-emerald-500' },
          { label: 'Out of Stock',      value: outOfStock,                       icon: AlertTriangle, accentBg: 'bg-red-50',       accentText: 'text-red-500',     border: 'border-l-4 border-l-red-500' },
          { label: 'Total Retail Value',value: formatCurrency(totalRetailValue), icon: TrendingUp,    accentBg: 'bg-violet-50',    accentText: 'text-violet-600',  border: 'border-l-4 border-l-violet-500' },
        ].map(({ label, value, icon: Icon, accentBg, accentText, border }) => (
          <div key={label} className={cn('bg-card rounded-2xl p-5 border border-border shadow-sm', border)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                <p className="text-2xl font-black text-foreground leading-none">{value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', accentBg)}>
                <Icon className={cn('h-4 w-4', accentText)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or barcode…"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card"
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 bg-card transition"
          title="No handheld scanner? Scan with a device camera instead."
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Camera</span>
        </button>
        <div className="flex items-center gap-1 bg-muted/60 border border-border rounded-xl p-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1.5 flex-shrink-0" />
          {STATUS_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap',
                statusFilter === f.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm font-bold text-primary">{selected.size} selected</span>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
              className="border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none bg-background">
              <option value="">Action…</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
            </select>
            <button onClick={handleBulkApply} disabled={!bulkAction}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition disabled:opacity-50">Apply</button>
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {restockProduct && <RestockDialog product={restockProduct} onClose={() => setRestockProduct(null)} />}
      {labelProduct && (
        <BarcodeLabelPreview
          productName={labelProduct.name}
          price={Number(labelProduct.price)}
          barcode={labelProduct.barcode ?? ''}
          onClose={() => setLabelProduct(null)}
        />
      )}
      {showScanner && (
        <BarcodeScannerModal
          onDetected={(code) => { setSearch(code); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading products…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3.5 w-10">
                    <button onClick={toggleAll} className="text-muted-foreground hover:text-primary transition-colors">
                      {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : someSelected ? <MinusSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  {[
                    { key: 'name' as SortKey,   label: 'Product' },
                    { key: 'price' as SortKey,  label: 'Price' },
                    { key: 'stock' as SortKey,  label: 'Stock' },
                    { key: 'margin' as SortKey, label: 'Margin' },
                  ].map(({ key, label }) => (
                    <th key={key} onClick={() => handleSort(key)}
                      className="text-left px-4 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground select-none transition-colors">
                      {label} <SortIcon col={key} />
                    </th>
                  ))}
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => {
                  const margin     = getMargin(row);
                  const isSelected = selected.has(row.id);
                  return (
                    <tr key={row.id} className={cn('transition-colors', isSelected ? 'bg-primary/5' : 'hover:bg-muted/20')}>
                      <td className="px-4 py-3.5 w-10">
                        <button onClick={() => toggleOne(row.id)} className="text-muted-foreground hover:text-primary transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {row.imageUrl ? (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border">
                              <Image src={row.imageUrl} alt={row.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-tight">{row.name}</p>
                            {row.isFeatured && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-bold text-foreground text-sm">{formatCurrency(Number(row.price))}</p>
                          {row.costPrice && (
                            <p className="text-[11px] text-muted-foreground">Cost: {formatCurrency(Number(row.costPrice))}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-bold', row.stock <= 0 ? 'text-destructive' : row.stock <= 5 ? 'text-amber-600' : 'text-foreground')}>
                            {row.stock}
                          </span>
                          {row.stock === 0 && (
                            <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">Out</span>
                          )}
                          {row.stock > 0 && row.stock <= 5 && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">Low</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-full border',
                          margin >= 40 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          margin >= 20 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-red-50 text-red-700 border-red-200',
                        )}>
                          {margin.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                          row.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border',
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', row.isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${row.id}/edit`}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setRestockProduct(row)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition" title="Quick Restock">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openLabel(row)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition" title="Print barcode label">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleActive(row.id, row.isActive)}
                            className={cn('p-2 rounded-lg transition', row.isActive ? 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50')}
                            title={row.isActive ? 'Deactivate' : 'Activate'}>
                            {row.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deleteProduct(row.id, row.name)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {search ? 'No products match your search' : statusFilter !== 'all' ? 'No products in this filter' : 'No products yet'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {search ? `Try a different search term` : 'Start building your catalog'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition">
                    <Plus className="w-4 h-4" /> Add your first product
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {totalProducts} products
        </p>
      )}

    </div>
  );
}
