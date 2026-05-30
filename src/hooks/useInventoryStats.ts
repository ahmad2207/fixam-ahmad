'use client';
import { useQuery } from '@tanstack/react-query';

interface CategoryInventoryValue {
  category: string;
  value: number;
  itemCount: number;
}

interface InventoryStats {
  totalValue: number;
  breakdown: CategoryInventoryValue[];
}

async function fetchInventoryStats(): Promise<InventoryStats> {
  const res = await fetch('/api/admin/inventory/stats');
  if (!res.ok) throw new Error('Failed to fetch inventory stats');
  return res.json();
}

export function useCategoryInventoryBreakdown() {
  return useQuery({
    queryKey: ['inventory-breakdown-by-category'],
    queryFn: async () => {
      const data = await fetchInventoryStats();
      return data.breakdown;
    },
  });
}

export function useTotalInventoryValue() {
  return useQuery({
    queryKey: ['total-inventory-value'],
    queryFn: async () => {
      const data = await fetchInventoryStats();
      return data.totalValue;
    },
  });
}
