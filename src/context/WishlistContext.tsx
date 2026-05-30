'use client';

import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface WishlistContextValue {
  items: string[];
  isLoading: boolean;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<string[]>({
    queryKey: ['wishlist', (session?.user as any)?.id],
    queryFn: async () => {
      const res = await fetch('/api/wishlist');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.user,
    staleTime: 60_000,
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
    onSuccess: (data, productId) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      if (data.action === 'added') {
        toast.success('Added to wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
    },
    onError: () => {
      toast.error('Failed to update wishlist');
    },
  });

  const toggle = (productId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to save items');
      return;
    }
    toggleMutation.mutate(productId);
  };

  const has = (productId: string) => items.includes(productId);

  const clear = async () => {
    if (!session?.user) return;
    qc.setQueryData(['wishlist', (session?.user as any)?.id], []);
    await fetch('/api/wishlist', { method: 'DELETE' }).catch(() => {});
    qc.invalidateQueries({ queryKey: ['wishlist'] });
  };

  return (
    <WishlistContext.Provider value={{ items, isLoading, toggle, has, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
