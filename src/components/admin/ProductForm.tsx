'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import {
  Plus, Trash2, Sparkles, Info, Image as ImageIcon, Layers,
  ClipboardList, CheckCircle2, Star, Megaphone,
} from 'lucide-react';

export interface Variation {
  name: string;
  options: string;
}

export interface SpecEntry {
  key: string;
  value: string;
}

export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  categoryId: string;
  sku: string;
  stock: string;
  isFeatured: boolean;
  isPromo: boolean;
  promoEndsAt: string;
  restockAt: string;
  isActive: boolean;
  tags: string;
  images: string[];
  variations: Variation[];
  specs: SpecEntry[];
}

const DEFAULT_VALUES: ProductFormValues = {
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
  images: [],
  variations: [],
  specs: [],
};

const MAX_MEDIA = 10;

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <h2 className="font-bold text-sm text-foreground leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function ToggleChip({
  checked,
  onChange,
  icon: Icon,
  label,
  badge,
  activeCls,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ElementType;
  label: string;
  badge?: string;
  activeCls: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
        checked ? activeCls : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/40'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge && checked && (
        <span className="text-[10px] font-bold bg-white/25 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          {badge}
        </span>
      )}
    </button>
  );
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<ProductFormValues>;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => void | Promise<void>;
}

export function ProductForm({ mode, initialValues, isSubmitting, onCancel, onSubmit }: ProductFormProps) {
  const { data: categories = [] } = useCategories();
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState(() => ({ ...DEFAULT_VALUES, ...initialValues }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const setImages = (images: string[]) => setForm((p) => ({ ...p, images }));

  const addVariation = () => setForm((p) => ({ ...p, variations: [...p.variations, { name: '', options: '' }] }));
  const removeVariation = (i: number) =>
    setForm((p) => ({ ...p, variations: p.variations.filter((_, idx) => idx !== i) }));
  const updateVariation = (i: number, field: keyof Variation, val: string) =>
    setForm((p) => ({
      ...p,
      variations: p.variations.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)),
    }));

  const addSpec = () => setForm((p) => ({ ...p, specs: [...p.specs, { key: '', value: '' }] }));
  const removeSpec = (i: number) => setForm((p) => ({ ...p, specs: p.specs.filter((_, idx) => idx !== i) }));
  const updateSpec = (i: number, field: keyof SpecEntry, val: string) =>
    setForm((p) => ({
      ...p,
      specs: p.specs.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)),
    }));

  /* ── AI generation ── */
  const handleGenerate = async () => {
    if (!form.name.trim()) {
      toast.error(mode === 'create' ? 'Enter a product name first' : 'Product name is required to generate specs');
      return;
    }
    setAiLoading(true);
    try {
      const categoryName = categories.find((c) => c.id === form.categoryId)?.name;
      const res = await fetch('/api/admin/ai/product-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, category: categoryName, imageUrl: form.images[0] ?? null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Generation failed');
      const data = await res.json();

      setForm((p) => ({
        ...p,
        description: data.description ?? p.description,
        variations: data.variations?.length > 0
          ? data.variations.map((v: { name: string; options: string[] }) => ({ name: v.name, options: v.options.join(', ') }))
          : p.variations,
        specs: data.specifications && Object.keys(data.specifications).length > 0
          ? Object.entries(data.specifications as Record<string, string>).map(([key, value]) => ({ key, value: String(value) }))
          : p.specs,
      }));

      toast.success('Description, variations & specifications generated — review and edit as needed');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }

    const specsObj = form.specs
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
      imageUrl: form.images[0] ?? null,
      images: form.images.slice(1),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      variations: form.variations
        .filter((v) => v.name.trim())
        .map((v) => ({ name: v.name.trim(), options: v.options.split(',').map((o) => o.trim()).filter(Boolean) })),
      specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-4">

      {/* Basic Info */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={Info} title="Basic Info" />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name <span className="text-red-400">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder={mode === 'create' ? 'AI will generate this when you click Generate' : 'AI will generate this when you click Regenerate'}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} placeholder="Optional unique identifier"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tags</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="comma-separated"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <ToggleChip
              checked={form.isActive}
              onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              icon={CheckCircle2}
              label="Active"
              activeCls="border-primary bg-primary text-white"
            />
            <ToggleChip
              checked={form.isFeatured}
              onChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))}
              icon={Star}
              label="Featured on homepage"
              activeCls="border-primary bg-primary text-white"
            />
            <ToggleChip
              checked={form.isPromo}
              onChange={(v) => setForm((p) => ({ ...p, isPromo: v }))}
              icon={Megaphone}
              label="Promo product"
              badge="Promo"
              activeCls="border-orange-500 bg-orange-500 text-white"
            />
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
      </div>

      {/* Media */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <SectionHeader icon={ImageIcon} title="Media" subtitle="Up to 10 images or videos — the first image is used as the main thumbnail" />
        <ImageUpload images={form.images} onImagesChange={setImages} maxImages={MAX_MEDIA} />
      </div>

      {/* ── AI Generate ── */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-none">
              {mode === 'create' ? 'Generate with AI' : 'Regenerate with AI'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              {mode === 'create'
                ? (form.name.trim() ? `Auto-fill variations & specs for "${form.name}"` : 'Enter a product name above, then click Generate')
                : 'Re-generate variations & specs from the current product name & category'}
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
              {mode === 'create' ? 'Generate' : 'Regenerate'}
            </>
          )}
        </button>
      </div>

      {/* Variations */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Layers} title="Variations" subtitle="Options like Size or Colour" />
          <button type="button" onClick={addVariation}
            className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {form.variations.length === 0 && (
          <p className="text-sm text-muted-foreground">No variations yet. Use AI to generate, or add manually.</p>
        )}
        <div className="space-y-3">
          {form.variations.map((v, i) => (
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
          <SectionHeader icon={ClipboardList} title="Specifications" subtitle="Technical details shown on the product page" />
          <button type="button" onClick={addSpec}
            className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {form.specs.length === 0 && (
          <p className="text-sm text-muted-foreground">No specifications yet. Use AI to generate, or add manually.</p>
        )}
        <div className="space-y-2">
          {form.specs.map((s, i) => (
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

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 bg-card/95 backdrop-blur border-t border-border px-4 sm:px-0 sm:border-0 sm:bg-transparent py-3 sm:py-0 flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors bg-card">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {isSubmitting
            ? (mode === 'create' ? 'Creating…' : 'Saving…')
            : (mode === 'create' ? 'Create Product' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
}
