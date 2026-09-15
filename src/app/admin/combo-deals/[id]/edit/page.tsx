'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ComboDealForm, type ComboFormValues } from '@/components/admin/ComboDealForm';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface ComboComponentRow {
  itemId: string;
  productId: string | null;
  quantity: number;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

export default function EditComboDealPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<ComboFormValues> | null>(null);
  const [initialProductInfo, setInitialProductInfo] = useState<Record<string, { name: string; imageUrl: string | null }>>({});

  useEffect(() => {
    fetch(`/api/admin/combo-deals/${id}`)
      .then((r) => r.json())
      .then((combo) => {
        const components: ComboComponentRow[] = combo.components ?? [];
        setInitialValues({
          name: combo.name ?? '',
          description: combo.description ?? '',
          imageUrl: combo.imageUrl ?? '',
          price: String(combo.price ?? ''),
          isActive: combo.isActive ?? true,
          items: components
            .filter((c) => c.productId) // a slot whose product was deleted has nothing to submit until replaced
            .map((c) => ({ id: c.itemId, productId: c.productId!, quantity: c.quantity })),
        });
        setInitialProductInfo(
          Object.fromEntries(
            components.filter((c) => c.product).map((c) => [c.productId as string, { name: c.product!.name, imageUrl: c.product!.imageUrl }]),
          ),
        );
      })
      .catch(() => toast.error('Failed to load bundle'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/combo-deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save bundle');
      toast.success('Bundle updated');
      router.push('/admin/combo-deals');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin/combo-deals')} className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Bundle</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : initialValues ? (
        <ComboDealForm
          mode="edit"
          initialValues={initialValues}
          initialProductInfo={initialProductInfo}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/admin/combo-deals')}
          onSubmit={handleSubmit}
        />
      ) : (
        <p className="text-sm text-red-600">Bundle not found.</p>
      )}
    </div>
  );
}
