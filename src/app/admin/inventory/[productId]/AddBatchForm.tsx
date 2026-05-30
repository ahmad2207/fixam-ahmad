'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AddBatchForm({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity), costPrice: Number(costPrice) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Batch added successfully');
      setQuantity('');
      setCostPrice('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          placeholder="e.g. 50"
          className="border rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Cost Price (₦)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          required
          placeholder="e.g. 5000"
          className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Batch'}
        </button>
      </div>
    </form>
  );
}
