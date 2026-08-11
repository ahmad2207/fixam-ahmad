'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductForm, type ProductFormValues } from '@/components/admin/ProductForm';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<ProductFormValues> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((product) => {
        const images = [product.imageUrl, ...(product.images ?? [])].filter(Boolean) as string[];
        setInitialValues({
          name: product.name ?? '',
          description: product.description ?? '',
          price: product.price ?? '',
          compareAtPrice: product.compareAtPrice ?? '',
          costPrice: product.costPrice ?? '',
          categoryId: product.categoryId ?? '',
          sku: product.sku ?? '',
          barcode: product.barcode ?? '',
          stock: String(product.stock ?? 0),
          isFeatured: product.isFeatured ?? false,
          isPromo: product.isPromo ?? false,
          promoEndsAt: product.promoEndsAt ? new Date(product.promoEndsAt).toISOString().slice(0, 16) : '',
          restockAt: product.restockAt ? new Date(product.restockAt).toISOString().slice(0, 16) : '',
          isActive: product.isActive ?? true,
          tags: (product.tags ?? []).join(', '),
          images,
          variations: (product.variations ?? []).map((v: { name: string; options: string[] }) => ({
            name: v.name,
            options: v.options.join(', '),
          })),
          specs: product.specifications && typeof product.specifications === 'object'
            ? Object.entries(product.specifications as Record<string, string>).map(([key, value]) => ({ key, value: String(value) }))
            : [],
        });
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
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

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/products')} className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Product</h1>
      </div>

      {isLoading || !initialValues ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ProductForm
          mode="edit"
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/admin/products')}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
