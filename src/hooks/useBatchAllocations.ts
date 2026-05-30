'use client';
import { useQuery } from '@tanstack/react-query';

export interface BatchAllocation {
  id: string;
  orderItemId: string;
  batchId: string;
  quantity: number;
  costPriceAtTime: string;
  createdAt: string;
}

export function useBatchAllocationsForOrder(orderId: string | null) {
  return useQuery<BatchAllocation[]>({
    queryKey: ['batch-allocations', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}/batch-allocations`);
      if (!res.ok) throw new Error('Failed to fetch batch allocations');
      return res.json();
    },
    enabled: !!orderId,
  });
}
