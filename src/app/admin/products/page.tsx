'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import {
  Search, Package, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, Trash2, CheckSquare, Square, MinusSquare,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

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
function RestockDialog({
  product,
  onClose,
}: {
  product: AdminProduct;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [qty, setQty] = useState('');
  const [costPrice, setCostPrice] = useState(product.costPrice ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const batchValue = Number(qty) > 0 && Number(costPrice) > 0
    ? Number(qty) * Number(costPrice)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || !costPrice) {
      toast.error('Quantity and cost price are required');
      return;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Quick Restock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-gray-400">Current stock: <span className="font-semibold text-gray-700">{product.stock}</span></p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity to Add *</label>
            <input
              type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required
              placeholder="e.g. 50"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cost Price per Unit (₦) *</label>
            <input
              type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required
              placeholder="e.g. 2500"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {batchValue > 0 && (
            <div className="bg-primary/5 rounded-lg px-4 py-3 text-sm flex justify-between">
              <span className="text-gray-600">Batch value</span>
              <span className="font-bold text-primary">{formatCurrency(batchValue)}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50">
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

  // Sorted + filtered list
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
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-gray-300" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-primary" />;
  };

  // Bulk selection helpers
  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
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
        await Promise.all(
          ids.map((id) =>
            fetch(`/api/admin/products/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive }),
            }),
          ),
        );
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

  const totalProducts     = products?.length ?? 0;
  const activeProducts    = products?.filter((p) => p.isActive).length ?? 0;
  const outOfStock        = products?.filter((p) => p.stock <= 0).length ?? 0;
  const totalRetailValue  = (products ?? []).reduce((s, p) => s + Number(p.price) * p.stock, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          + New Product
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Products</p>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active</p>
          <p className="text-2xl font-bold text-primary">{activeProducts}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Retail Value</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRetailValue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        />
      </div>

      {/* P1 — Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Bulk action…</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
            </select>
            <button
              onClick={handleBulkApply}
              disabled={!bulkAction}
              className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Quick Restock Dialog */}
      {restockProduct && (
        <RestockDialog product={restockProduct} onClose={() => setRestockProduct(null)} />
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {/* P1 — Select all checkbox */}
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-gray-500 hover:text-primary">
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : someSelected ? (
                        <MinusSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  {/* P2 — Sortable column headers */}
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('name')}
                  >
                    Product <SortIcon col="name" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('price')}
                  >
                    Price <SortIcon col="price" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('stock')}
                  >
                    Stock <SortIcon col="stock" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                    onClick={() => handleSort('margin')}
                  >
                    Margin <SortIcon col="margin" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const price   = Number(row.price);
                  const margin  = getMargin(row);
                  const isSelected = selected.has(row.id);

                  return (
                    <tr key={row.id} className={`border-b last:border-0 hover:bg-gray-50 ${isSelected ? 'bg-primary/5' : ''}`}>
                      {/* P1 — Row checkbox */}
                      <td className="px-4 py-3 w-10">
                        <button onClick={() => toggleOne(row.id)} className="text-gray-400 hover:text-primary">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.imageUrl ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <Image src={row.imageUrl} alt={row.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(price)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          row.stock <= 0 ? 'text-red-500' : row.stock <= 5 ? 'text-yellow-600' : 'text-primary'
                        }`}>
                          {row.stock}
                        </span>
                        {row.stock === 0 && (
                          <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Out</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          margin >= 40 ? 'bg-emerald-100 text-emerald-800' :
                          margin >= 20 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {margin.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/products/${row.id}/edit`}
                            className="text-xs px-2 py-1 border rounded text-blue-600 hover:bg-blue-50 transition">
                            Edit
                          </Link>
                          {/* P3 — Quick Restock */}
                          <button
                            onClick={() => setRestockProduct(row)}
                            title="Quick Restock"
                            className="text-xs px-2 py-1 border rounded text-primary hover:bg-primary/5 transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restock
                          </button>
                          <button
                            onClick={() => toggleActive(row.id, row.isActive)}
                            className={`text-xs px-2 py-0.5 rounded border transition ${
                              row.isActive
                                ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                : 'border-primary/40 text-primary hover:bg-primary/5'
                            }`}
                          >
                            {row.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteProduct(row.id, row.name)}
                            title="Delete product"
                            className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                {search ? 'No products match your search.' : 'No products yet.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
