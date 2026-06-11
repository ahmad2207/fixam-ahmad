'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/utils';
import { AddToCartDialog } from './AddToCartDialog';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  stock: number;
  isFeatured?: boolean;
  categoryName?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const [showDialog, setShowDialog] = useState(false);
  const isWishlisted = has(product.id);
  const inStock = product.stock > 0;

  const price = Number(product.price);
  const compareAt = Number(product.compareAtPrice ?? 0);
  const discount = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem({ productId: product.id, name: product.name, price, imageUrl: product.imageUrl ?? null, quantity: 1, stock: product.stock });
    setShowDialog(true);
  };

  return (
    <>
      <Link href={`/products/${product.slug}`} className="group flex flex-col h-full">
        <div className="flex flex-col h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-white/80 hover:border-primary/20 bg-white/60 backdrop-blur-sm">

          {/* Image area — full image always visible */}
          <div className="relative h-36 sm:h-44 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200">📦</div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {discount > 0 && (
                <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-sm">
                  -{discount}%
                </span>
              )}
              {!inStock && (
                <span className="bg-black/50 backdrop-blur-sm text-white font-semibold px-2 py-0.5 rounded-full text-[10px]">
                  Sold Out
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 backdrop-blur-sm border border-white/40 shadow-sm
                ${isWishlisted
                  ? 'bg-red-50/90 text-red-500'
                  : 'bg-white/60 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
                }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {/* Glassmorphism info panel */}
          <div className="flex-1 flex flex-col px-3 pt-2.5 pb-3 backdrop-blur-md bg-white/70 border-t border-white/60">
            {product.categoryName && (
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5 truncate">
                {product.categoryName}
              </p>
            )}
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1 mb-2">
              {product.name}
            </h3>
            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="min-w-0">
                <span className="text-sm font-extrabold text-primary leading-none">
                  {formatCurrency(price)}
                </span>
                {compareAt > price && (
                  <span className="text-[10px] text-gray-400 line-through ml-1 leading-none">
                    {formatCurrency(compareAt)}
                  </span>
                )}
              </div>
              <button
                disabled={!inStock}
                onClick={handleAddToCart}
                className="w-8 h-8 flex-shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      <AddToCartDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productName={product.name}
        productImage={product.imageUrl}
        quantity={1}
        price={price}
      />
    </>
  );
}
