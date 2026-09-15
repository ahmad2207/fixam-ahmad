'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ComboDealForm } from '@/components/admin/ComboDealForm';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function NewComboDealPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/combo-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create bundle');
      toast.success('Bundle created');
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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">New Bundle</h1>
      </div>

      <ComboDealForm
        mode="create"
        isSubmitting={isSubmitting}
        onCancel={() => router.push('/admin/combo-deals')}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
