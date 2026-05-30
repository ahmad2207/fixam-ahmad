'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useSession } from 'next-auth/react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/store/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { data: session } = useSession();
  const { items: wishlistIds } = useWishlist();
  const { data: products = [], isLoading } = useProducts();

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">Sign in to save your favourite products.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">Wishlist</span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground mb-8">{wishlistProducts.length} saved item{wishlistProducts.length !== 1 ? 's' : ''}</p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4">
                <Skeleton className="aspect-square rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-4">Your wishlist is empty</p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
