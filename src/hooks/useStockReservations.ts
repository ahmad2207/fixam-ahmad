'use client';

import { useQuery } from '@tanstack/react-query';

export interface StockReservation {
  id: string;
  checkoutId: string;
  productId: string;
  batchId: string;
  quantity: number;
  costPrice: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export function useStockReservations(checkoutId?: string) {
  return useQuery<StockReservation[]>({
    queryKey: ['stock-reservations', checkoutId],
    queryFn: async () => {
      const url = checkoutId
        ? `/api/admin/reservations?checkoutId=${checkoutId}`
        : '/api/admin/reservations';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reservations');
      return res.json();
    },
  });
}
