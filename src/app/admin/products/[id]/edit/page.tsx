'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Variation {
  name: string;
  options: string;
}

interface SpecEntry {
  key: string;
  value: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: categories = [] } = useCategories();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    isActive: true,
    tags: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [specs, setSpecs] = useState<SpecEntry[]>([]);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((product) => {
        const allImages = [product.imageUrl, ...(product.images ?? [])].filter(Boolean) as string[];
        setImages(allImages);
        setForm({
          name: product.name ?? '',
          description: product.description ?? '',
          price: product.price ?? '',
          compareAtPrice: product.compareAtPrice ?? '',
          costPrice: product.costPrice ?? '',
          categoryId: product.categoryId ?? '',
          sku: product.sku ?? '',
          stock: String(product.stock ?? 0),
          isFeatured: product.isFeatured ?? false,
          isActive: product.isActive ?? true,
          tags: (product.tags ?? []).join(', '),
        });
        setVariations(
          (product.variations ?? []).map((v: { name: string; options: string[] }) => ({
            name: v.name,
            options: v.options.join(', '),
          }))
        );
        if (product.specifications && typeof product.specifications === 'object') {
          setSpecs(
            Object.entries(product.specifications as Record<string, string>).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          );
        }
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setIsLoading(false));
  }, [id]);

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

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update product');
      toast.success('Product updated');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/products')} className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₦) *</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Compare-at Price (₦)</label>
              <input name="compareAtPrice" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={handleChange}
                placeholder="Original price if on sale"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost Price (₦)</label>
              <input name="costPrice" type="number" step="0.01" min="0" value={form.costPrice} onChange={handleChange}
                placeholder="Your purchase cost"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input name="sku" value={form.sku} onChange={handleChange} placeholder="Optional unique identifier"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. cookware, premium, gift"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium">Active (visible in store)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium">Featured on homepage</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">Images</h2>
          <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
        </div>

        {/* Variations */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Variations</h2>
            <button type="button" onClick={addVariation}
              className="flex items-center gap-1 text-sm text-primary hover:underline">
              <Plus className="w-4 h-4" /> Add variation
            </button>
          </div>
          {variations.length === 0 && (
            <p className="text-sm text-gray-400">No variations. Add one if this product has options like Size or Color.</p>
          )}
          <div className="space-y-3">
            {variations.map((v, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input value={v.name} onChange={(e) => updateVariation(i, 'name', e.target.value)}
                    placeholder="Variation name (e.g. Size)"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2" />
                  <input value={v.options} onChange={(e) => updateVariation(i, 'options', e.target.value)}
                    placeholder="Options, comma-separated (e.g. Small, Medium, Large)"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <button type="button" onClick={() => removeVariation(i)} className="mt-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Specifications</h2>
              <p className="text-xs text-gray-400 mt-0.5">Key-value pairs shown on the product page (e.g. Material → Stainless Steel)</p>
            </div>
            <button type="button" onClick={addSpec}
              className="flex items-center gap-1 text-sm text-primary hover:underline">
              <Plus className="w-4 h-4" /> Add spec
            </button>
          </div>
          {specs.length === 0 && (
            <p className="text-sm text-gray-400">No specifications added yet.</p>
          )}
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={s.key}
                  onChange={(e) => updateSpec(i, 'key', e.target.value)}
                  placeholder="Key (e.g. Material)"
                  className="w-2/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                  value={s.value}
                  onChange={(e) => updateSpec(i, 'value', e.target.value)}
                  placeholder="Value (e.g. Stainless Steel)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/admin/products')}
            className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
