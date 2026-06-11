'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStoreSetting<T>(key: string) {
  return useQuery<T | null>({
    queryKey: ['store-setting', key],
    queryFn: async () => {
      const res = await fetch(`/api/admin/settings/${key}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch setting');
      const data = await res.json();
      // General route returns a flat object; [key] route wraps in { value }
      return (data.value !== undefined ? data.value : data) as T;
    },
  });
}

export function useUpdateStoreSetting(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: unknown) => {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update setting');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-setting', key] }),
  });
}
