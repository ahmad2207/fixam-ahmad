'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/store/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { data: session } = useSession();
  const { items: wishlistIds, toggle, isLoading: wishlistLoading } = useWishlist();
  const { data: allProducts = [], isLoading: productsLoading } = useProducts();
  const { addItem } = useCart();

  const isLoading = wishlistLoading || productsLoading;
  const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  const handleAddAll = () => {
    if (wishlistProducts.length === 0) return;
    let added = 0;
    wishlistProducts.forEach((p) => {
      if ((p as any).stock > 0) {
        addItem({
          productId: p.id,
          name: p.name,
          price: Number(p.price),
          imageUrl: (p as any).imageUrl ?? null,
          quantity: 1,
          stock: (p as any).stock,
        });
        added++;
      }
    });
    toast.success(`${added} item${added !== 1 ? 's' : ''} added to cart`);
  };

  /* ── Not signed in ── */
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Wishlist</span>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Heart className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Sign in to see your Wishlist</h1>
            <p className="text-sm text-gray-500 mb-7">
              Save your favourite products and come back to them any time.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">My Wishlist</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">My Wishlist</h1>
            {!isLoading && (
              <span className="text-sm font-bold text-gray-400">
                ({wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>

          {wishlistProducts.length > 0 && (
            <button
              onClick={handleAddAll}
              className="hidden sm:inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add All to Cart
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3">
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>

        /* Empty wishlist */
        ) : wishlistProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Heart className="h-10 w-10 text-red-300" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 mb-7">
              Tap the ♡ on any product to save it here for later.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        /* Products grid */
        ) : (
          <>
            {/* Mobile add-all */}
            <button
              onClick={handleAddAll}
              className="sm:hidden w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors shadow-sm mb-4"
            >
              <ShoppingCart className="h-4 w-4" />
              Add All to Cart ({wishlistProducts.filter((p) => (p as any).stock > 0).length} in stock)
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="relative group/wish">
                  <ProductCard product={product as any} />
                  {/* Remove from wishlist overlay */}
                  <button
                    onClick={() => toggle(product.id)}
                    className="absolute top-2 left-2 z-20 w-7 h-7 bg-white/90 hover:bg-red-50 rounded-full shadow-sm flex items-center justify-center transition-colors opacity-0 group-hover/wish:opacity-100"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Continue shopping */}
            <div className="text-center mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                Continue Browsing
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
