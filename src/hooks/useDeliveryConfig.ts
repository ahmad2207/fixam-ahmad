'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliveryConfig } from '@/lib/deliveryFees';

export function useDeliveryConfig() {
  return useQuery<DeliveryConfig>({
    queryKey: ['delivery-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/delivery');
      if (!res.ok) throw new Error('Failed to fetch delivery config');
      return res.json();
    },
  });
}

export function useUpdateDeliveryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: DeliveryConfig) => {
      const res = await fetch('/api/admin/settings/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to update delivery config');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-config'] }),
  });
}
