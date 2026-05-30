'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function useWishlist() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery<string[]>({
    queryKey: ['wishlist', session?.user?.email],
    queryFn: async () => {
      const res = await fetch('/api/wishlist');
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      return res.json();
    },
    enabled: !!session?.user,
  });

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error('Failed to update wishlist');
      return res.json() as Promise<{ action: 'added' | 'removed' }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast(data.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
    },
    onError: () => toast.error('Failed to update wishlist'),
  });

  const toggleWishlist = (productId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to save items');
      return;
    }
    toggleMutation.mutate(productId);
  };

  const isInWishlist = (productId: string) => wishlistItems.includes(productId);

  return {
    wishlistItems,
    isLoading,
    toggleWishlist,
    isInWishlist,
    wishlistCount: wishlistItems.length,
  };
}
