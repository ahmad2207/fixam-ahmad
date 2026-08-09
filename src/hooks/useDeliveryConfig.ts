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

// Public read for the storefront (checkout needs this before/without a
// login) — hits /api/store/delivery-config, not the admin-only route above.
export function useStoreDeliveryConfig() {
  return useQuery<DeliveryConfig>({
    queryKey: ['store-delivery-config'],
    queryFn: async () => {
      const res = await fetch('/api/store/delivery-config');
      if (!res.ok) throw new Error('Failed to fetch delivery config');
      return res.json();
    },
    staleTime: 5 * 60_000,
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
