'use client';
import { useQuery } from '@tanstack/react-query';

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  imageUrl: string | null;
  category: string | null;
}

export function useLowStockProducts(threshold = 10) {
  return useQuery<LowStockProduct[]>({
    queryKey: ['low-stock-products', threshold],
    queryFn: async () => {
      const res = await fetch(`/api/admin/products?lowStock=true&threshold=${threshold}`);
      if (!res.ok) throw new Error('Failed to fetch low stock products');
      return res.json();
    },
  });
}
