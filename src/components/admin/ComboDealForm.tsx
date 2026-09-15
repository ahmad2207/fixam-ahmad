'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useImageUpload } from '@/hooks/useImageUpload';
import { formatCurrency } from '@/lib/utils';
import { Search, X, Loader2, Upload, Plus, Minus, PackageSearch, AlertTriangle } from 'lucide-react';

interface PickableProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  price: string | number;
  stock: number;
  isActive: boolean;
  pricedVariationName: string | null;
}

export interface ComboFormItem {
  id?: string; // existing comboDealItems.id — present only when editing
  productId: string;
  quantity: number;
}

export interface ComboFormValues {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  isActive: boolean;
  items: ComboFormItem[];
}

const DEFAULT_VALUES: ComboFormValues = {
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  isActive: true,
  items: [],
};

interface ComboDealFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<ComboFormValues>;
  // Products already in the combo may reference one that's since been
  // deleted (productId null'd) — pass their last-known name/image so the
  // slot still renders sensibly and prompts the admin to replace it.
  initialProductInfo?: Record<string, { name: string; imageUrl: string | null }>;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => void | Promise<void>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-bold text-sm text-foreground leading-none">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export function ComboDealForm({ mode, initialValues, initialProductInfo, isSubmitting, onCancel, onSubmit }: ComboDealFormProps) {
  const [form, setForm] = useState<ComboFormValues>(() => ({ ...DEFAULT_VALUES, ...initialValues }));
  const { upload, isUploading } = useImageUpload('combo-deals');

  const [products, setProducts] = useState<PickableProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((rows: PickableProduct[]) => setProducts(Array.isArray(rows) ? rows : []))
      .finally(() => setProductsLoaded(true));
  }, []);

  // Bundle components are restricted to simple, priced, active products —
  // a priced-variation product's per-option price/stock isn't something the
  // combo pricing/stock math (see expandComboForCheckout in lib/inventory.ts)
  // accounts for.
  const pickableProducts = useMemo(
    () => products.filter((p) => !p.pricedVariationName && p.isActive && Number(p.price) > 0),
    [products],
  );

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    const alreadyPicked = new Set(form.items.map((i) => i.productId));
    return pickableProducts.filter((p) => !alreadyPicked.has(p.id) && p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, pickableProducts, form.items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImageSelect = async (file: File) => {
    const url = await upload(file);
    if (url) setForm((f) => ({ ...f, imageUrl: url }));
  };

  const addProduct = (productId: string) => {
    setForm((f) => ({ ...f, items: [...f.items, { productId, quantity: 1 }] }));
    setSearch('');
  };

  const removeItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, quantity) } : it)),
    }));
  };

  const replaceItemProduct = (index: number, productId: string) => {
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === index ? { ...it, productId } : it)) }));
  };

  const sumOfParts = form.items.reduce((sum, item) => {
    const product = productById.get(item.productId);
    return sum + (product ? Number(product.price) * item.quantity : 0);
  }, 0);
  const enteredPrice = Number(form.price) || 0;
  const savings = Math.max(0, sumOfParts - enteredPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      price: form.price,
      isActive: form.isActive,
      items: form.items,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Basic info ── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader title="Bundle details" />
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Name</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Home Starter Bundle"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Image</label>
            {form.imageUrl ? (
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border bg-muted group">
                <Image src={form.imageUrl} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 border-2 border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-pointer hover:border-muted-foreground/40 transition w-fit">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file" accept="image/*" className="hidden" disabled={isUploading}
                  onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-foreground">Active (visible on the storefront)</span>
          </label>
        </div>
      </div>

      {/* ── Products ── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader title="Products in this bundle" subtitle="Pick at least 2. Replacing one just means picking a different product for that slot." />

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={productsLoaded ? 'Search products to add…' : 'Loading products…'}
            disabled={!productsLoaded}
            className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(Number(p.price))} · {p.stock} in stock</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {form.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl">
            <PackageSearch className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No products added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {form.items.map((item, index) => {
              const product = productById.get(item.productId);
              const fallback = !product ? initialProductInfo?.[item.productId] : undefined;
              const outOfStock = product ? product.stock <= 0 || !product.isActive : true;
              return (
                <div
                  key={item.id ?? `new-${index}`}
                  className={`flex items-center gap-3 border rounded-xl p-3 ${outOfStock ? 'border-red-200 bg-red-50/40' : 'border-border'}`}
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                    {(product?.imageUrl ?? fallback?.imageUrl) && (
                      <Image src={(product?.imageUrl ?? fallback?.imageUrl)!} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{product?.name ?? fallback?.name ?? 'Unknown product'}</p>
                    {product ? (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(product.price))}
                        {outOfStock && <span className="ml-1.5 text-red-600 font-semibold">· Out of stock</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Needs a replacement
                      </p>
                    )}
                  </div>

                  {/* Swap this slot for a different product */}
                  <select
                    value={item.productId}
                    onChange={(e) => replaceItemProduct(index, e.target.value)}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background max-w-[9rem]"
                    title="Replace product"
                  >
                    <option value={item.productId} disabled hidden>Replace…</option>
                    {pickableProducts
                      .filter((p) => p.id === item.productId || !form.items.some((it) => it.productId === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>

                  <div className="flex items-center gap-1 border border-border rounded-lg">
                    <button type="button" onClick={() => updateItemQuantity(index, item.quantity - 1)} className="p-1.5 hover:bg-muted/40">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button type="button" onClick={() => updateItemQuantity(index, item.quantity + 1)} className="p-1.5 hover:bg-muted/40">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-muted-foreground hover:text-red-600 transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pricing ── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <SectionHeader title="Bundle price" subtitle="The total customers pay for the whole set — independent of the individual product prices." />
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-40">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Price</label>
            <input
              name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Sum of individual prices: <span className="font-semibold text-foreground">{formatCurrency(sumOfParts)}</span></p>
            {savings > 0 && (
              <p className="text-emerald-700 font-semibold">Customer saves {formatCurrency(savings)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors bg-card">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || form.items.length < 2}
          className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {isSubmitting
            ? (mode === 'create' ? 'Creating…' : 'Saving…')
            : (mode === 'create' ? 'Create Bundle' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
}
