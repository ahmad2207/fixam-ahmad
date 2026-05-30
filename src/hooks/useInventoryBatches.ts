'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface InventoryBatch {
  id: string;
  productId: string;
  quantityAvailable: number;
  costPrice: string;
  notes: string | null;
  createdAt: string;
}

export function useInventoryBatches(productId: string) {
  return useQuery<InventoryBatch[]>({
    queryKey: ['inventory-batches', productId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/inventory/${productId}/batches`);
      if (!res.ok) throw new Error('Failed to fetch batches');
      return res.json();
    },
    enabled: !!productId,
  });
}

export function useAddInventoryBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity, costPrice }: { productId: string; quantity: number; costPrice: number }) => {
      const res = await fetch(`/api/admin/inventory/${productId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, costPrice }),
      });
      if (!res.ok) throw new Error('Failed to add batch');
      return res.json();
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ['inventory-batches', productId] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
