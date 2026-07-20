'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';

interface Variation {
  name: string;
  options: string;
}

interface SpecEntry {
  key: string;
  value: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    costPrice: '',
    categoryId: '',
    sku: '',
    stock: '0',
    isFeatured: false,
    isPromo: false,
    promoEndsAt: '',
    restockAt: '',
    isActive: true,
    tags: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [specs, setSpecs] = useState<SpecEntry[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const addVariation = () => setVariations((v) => [...v, { name: '', options: '' }]);
  const removeVariation = (i: number) => setVariations((v) => v.filter((_, idx) => idx !== i));
  const updateVariation = (i: number, field: keyof Variation, val: string) =>
    setVariations((v) => v.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));

  const addSpec = () => setSpecs((s) => [...s, { key: '', value: '' }]);
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: keyof SpecEntry, val: string) =>
    setSpecs((s) => s.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));

  /* ── AI generation ── */
  const handleGenerate = async () => {
    if (!form.name.trim()) {
      toast.error('Enter a product name first');
      return;
    }
    setAiLoading(true);
    try {
      const categoryName = categories.find((c) => c.id === form.categoryId)?.name;
      const res = await fetch('/api/admin/ai/product-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, category: categoryName, imageUrl: images[0] ?? null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Generation failed');
      const data = await res.json();

      if (data.description) {
        setForm((p) => ({ ...p, description: data.description }));
      }
      if (data.variations?.length > 0) {
        setVariations(
          data.variations.map((v: { name: string; options: string[] }) => ({
            name: v.name,
            options: v.options.join(', '),
          }))
        );
      }
      if (data.specifications && Object.keys(data.specifications).length > 0) {
        setSpecs(
          Object.entries(data.specifications as Record<string, string>).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      }

      toast.success('Description, variations & specifications generated — review and edit as needed');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const specsObj = specs
        .filter((s) => s.key.trim())
        .reduce<Record<string, string>>((acc, s) => { acc[s.key.trim()] = s.value; return acc; }, {});

      const payload = {
        name: form.name,
        description: form.description || null,
        price: form.price,
        compareAtPrice: form.compareAtPrice || null,
        costPrice: form.costPrice || '0',
        categoryId: form.categoryId || null,
        sku: form.sku || null,
        stock: parseInt(form.stock) || 0,
        isFeatured: form.isFeatured,
        isPromo: form.isPromo,
        promoEndsAt: form.promoEndsAt ? new Date(form.promoEndsAt).toISOString() : null,
        restockAt: form.restockAt ? new Date(form.restockAt).toISOString() : null,
        isActive: form.isActive,
        imageUrl: images[0] ?? null,
        images: images.slice(1),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        variations: variations
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            options: v.options.split(',').map((o) => o.trim()).filter(Boolean),
          })),
        specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create product');
      toast.success('Product created');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/products')} className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Name <span className="text-red-400">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="AI will generate this when you click Generate"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Price (₦) <span className="text-red-400">*</span></label>
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Compare-at (₦)</label>
              <input name="compareAtPrice" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={handleChange}
                placeholder="Sale — original"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Cost Price (₦)</label>
              <input name="costPrice" type="number" step="0.01" min="0" value={form.costPrice} onChange={handleChange}
                placeholder="Purchase cost"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Stock</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Restock date</label>
            <input
              type="datetime-local"
              name="restockAt"
              value={form.restockAt}
              onChange={handleChange}
              className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-400 transition-all"
            />
            <p className="text-[11px] text-muted-foreground mt-1">If set, customers see a countdown to this date while stock is 0.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">SKU</label>
            <input name="sku" value={form.sku} onChange={handleChange} placeholder="Optional unique identifier"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (comma-separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. cookware, premium, gift"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium">Featured on homepage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isPromo" checked={form.isPromo} onChange={handleChange} className="w-4 h-4 accent-orange-500" />
              <span className="text-sm font-medium">
                Promo product
                <span className="ml-1.5 text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Promo</span>
              </span>
            </label>
          </div>

          {form.isPromo && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Promo ends at</label>
              <input
                type="datetime-local"
                name="promoEndsAt"
                value={form.promoEndsAt}
                onChange={handleChange}
                className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300/40 focus:border-orange-400 transition-all"
              />
              <p className="text-[11px] text-muted-foreground mt-1">A countdown timer will appear on the product card until this time.</p>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Images</h2>
          <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
        </div>

        {/* ── AI Generate ── */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-none">Generate with AI</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {form.name.trim()
                  ? `Auto-fill variations & specs for "${form.name}"`
                  : 'Enter a product name above, then click Generate'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!form.name.trim() || aiLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex-shrink-0 disabled:cursor-not-allowed"
          >
            {aiLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Variations */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Variations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Options like Size or Colour</p>
            </div>
            <button type="button" onClick={addVariation}
              className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {variations.length === 0 && (
            <p className="text-sm text-muted-foreground">No variations yet. Use AI to generate, or add manually.</p>
          )}
          <div className="space-y-3">
            {variations.map((v, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <input value={v.name} onChange={(e) => updateVariation(i, 'name', e.target.value)}
                    placeholder="Name (e.g. Size)"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  <input value={v.options} onChange={(e) => updateVariation(i, 'options', e.target.value)}
                    placeholder="Options, comma-separated (e.g. 20cm, 24cm, 28cm)"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <button type="button" onClick={() => removeVariation(i)} className="mt-2 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Specifications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Technical details shown on the product page</p>
            </div>
            <button type="button" onClick={addSpec}
              className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {specs.length === 0 && (
            <p className="text-sm text-muted-foreground">No specifications yet. Use AI to generate, or add manually.</p>
          )}
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={s.key} onChange={(e) => updateSpec(i, 'key', e.target.value)}
                  placeholder="Key (e.g. Material)"
                  className="w-2/5 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                <span className="text-muted-foreground text-sm">→</span>
                <input value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)}
                  placeholder="Value (e.g. Stainless Steel)"
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/admin/products')}
            className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Creating…' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
