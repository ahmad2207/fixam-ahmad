'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Review {
  id: string;
  productId: string;
  userId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { name: string | null; image: string | null } | null;
}

export function useProductReviews(productId: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      productId: string;
      rating: number;
      title?: string;
      body?: string;
    }) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create review');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews', variables.productId] });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { rating?: number; title?: string; body?: string };
    }) => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update review');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete review');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
