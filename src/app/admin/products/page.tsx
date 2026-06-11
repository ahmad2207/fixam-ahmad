'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import {
  Search, Package, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, Trash2, CheckSquare, Square, MinusSquare,
  Plus, TrendingUp, AlertTriangle, X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  createdAt: string;
}

type SortKey = 'name' | 'price' | 'stock' | 'margin';
type SortDir = 'asc' | 'desc';

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

// ── Quick Restock Dialog ─────────────────────────────────────────
function RestockDialog({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState('');
  const [costPrice, setCostPrice] = useState(product.costPrice ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const batchValue = Number(qty) > 0 && Number(costPrice) > 0
    ? Number(qty) * Number(costPrice)
    : 0;

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
      if (!res.ok) throw new Error('Failed to restock');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">Quick Restock</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">Current stock: <span className="font-bold text-foreground">{product.stock}</span></p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Quantity to Add *</label>
            <input
              type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required
              placeholder="e.g. 50"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Cost Price per Unit (₦) *</label>
            <input
              type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required
              placeholder="e.g. 2500"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          {batchValue > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Batch value</span>
              <span className="font-bold text-primary">{formatCurrency(batchValue)}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold hover:bg-secondary transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50">
              {isSubmitting ? 'Adding…' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restockProduct, setRestockProduct] = useState<AdminProduct | null>(null);
  const [bulkAction, setBulkAction] = useState('');

  const filtered = useMemo(() => {
    const list = (products ?? []).filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortKey === 'price')  cmp = Number(a.price) - Number(b.price);
      if (sortKey === 'stock')  cmp = a.stock - b.stock;
      if (sortKey === 'margin') cmp = getMargin(a) - getMargin(b);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }
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

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.delete(p.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.add(p.id)); return n; });
    }
  };
  const toggleOne = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkApply = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = [...selected];
    try {
      if (bulkAction === 'activate' || bulkAction === 'deactivate') {
        const isActive = bulkAction === 'activate';
        await Promise.all(ids.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive }),
          }),
        ));
        toast.success(`${ids.length} products ${isActive ? 'activated' : 'deactivated'}`);
      }
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      setSelected(new Set());
      setBulkAction('');
    } catch {
      toast.error('Bulk action failed');
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['admin-products-list'] });
      toast.success(`Product ${!current ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update product');
    }
  };

  const totalProducts    = products?.length ?? 0;
  const activeProducts   = products?.filter((p) => p.isActive).length ?? 0;
  const outOfStock       = products?.filter((p) => p.stock <= 0).length ?? 0;
  const totalRetailValue = (products ?? []).reduce((s, p) => s + Number(p.price) * p.stock, 0);

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalProducts} products in catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',   value: totalProducts,                   icon: Package,      color: 'bg-primary/10 text-primary',      border: 'border-primary/15' },
          { label: 'Active',           value: activeProducts,                  icon: TrendingUp,   color: 'bg-emerald-50 text-emerald-600',  border: 'border-emerald-100' },
          { label: 'Out of Stock',     value: outOfStock,                      icon: AlertTriangle,color: 'bg-red-50 text-red-600',          border: 'border-red-100' },
          { label: 'Total Retail Value',value: formatCurrency(totalRetailValue),icon: TrendingUp,  color: 'bg-emerald-50 text-emerald-600',  border: 'border-emerald-100' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={cn('bg-card rounded-2xl p-5 border shadow-sm', border)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Bulk Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">Bulk action…</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
            </select>
            <button
              onClick={handleBulkApply} disabled={!bulkAction}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >Apply</button>
            <button onClick={() => setSelected(new Set())} className="text-sm text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Restock Dialog */}
      {restockProduct && <RestockDialog product={restockProduct} onClose={() => setRestockProduct(null)} />}

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-muted-foreground hover:text-primary transition-colors">
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : someSelected ? (
                        <MinusSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  {[
                    { key: 'name' as SortKey,   label: 'Product' },
                    { key: 'price' as SortKey,  label: 'Price' },
                    { key: 'stock' as SortKey,  label: 'Stock' },
                    { key: 'margin' as SortKey, label: 'Margin' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none transition-colors"
                      onClick={() => handleSort(key)}
                    >
                      {label} <SortIcon col={key} />
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => {
                  const margin = getMargin(row);
                  const isSelected = selected.has(row.id);
                  return (
                    <tr key={row.id} className={cn('hover:bg-muted/20 transition-colors', isSelected && 'bg-primary/5')}>
                      <td className="px-4 py-3.5 w-10">
                        <button onClick={() => toggleOne(row.id)} className="text-muted-foreground hover:text-primary transition-colors">
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-primary" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {row.imageUrl ? (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border">
                              <Image src={row.imageUrl} alt={row.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-semibold text-foreground text-sm">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-foreground text-sm">{formatCurrency(Number(row.price))}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('font-bold text-sm', row.stock <= 0 ? 'text-destructive' : row.stock <= 5 ? 'text-warning' : 'text-foreground')}>
                          {row.stock}
                        </span>
                        {row.stock === 0 && (
                          <span className="ml-2 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">Out</span>
                        )}
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
                          'inline-block px-2.5 py-1 rounded-full text-xs font-bold border',
                          row.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-secondary text-muted-foreground border-border',
                        )}>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/products/${row.id}/edit`}
                            className="text-xs px-2.5 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setRestockProduct(row)}
                            title="Quick Restock"
                            className="text-xs px-2.5 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition font-medium flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restock
                          </button>
                          <button
                            onClick={() => toggleActive(row.id, row.isActive)}
                            className={cn(
                              'text-xs px-2.5 py-1.5 rounded-lg border transition font-medium',
                              row.isActive
                                ? 'border-border text-muted-foreground hover:bg-secondary'
                                : 'border-primary/30 text-primary hover:bg-primary/5',
                            )}
                          >
                            {row.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteProduct(row.id, row.name)}
                            title="Delete product"
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                          >
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
              <div className="text-center py-16">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{search ? 'No products match your search.' : 'No products yet.'}</p>
                {!search && (
                  <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:underline">
                    <Plus className="w-4 h-4" /> Add your first product
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
