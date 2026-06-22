'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star } from 'lucide-react';
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
      <Link href={`/products/${product.slug}`} className="group block h-full">
        <div className="h-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">

          {/* Square image — object-cover, no padding, fills completely */}
          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-200">📦</div>
            )}

            {/* Discount badge */}
            {discount > 0 && (
              <span className="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}

            {/* Sold out overlay */}
            {!inStock && (
              <div className="absolute inset-0 z-10 bg-black/20 flex items-end justify-center pb-2">
                <span className="bg-black/60 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Sold Out
                </span>
              </div>
            )}

            {/* Wishlist button */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm transition-all duration-200
                ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {/* Info section — tight like Temu */}
          <div className="flex-1 flex flex-col p-2 pb-2.5">
            <h3 className="text-[11px] leading-snug text-gray-700 line-clamp-2 min-h-[2.2rem]">
              {product.name}
            </h3>

            {/* Rating */}
            {product.rating && (product.reviewsCount ?? 0) >= 3 && (
              <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${s <= Math.round(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                    />
                  ))}
                </div>
                {product.reviewsCount ? (
                  <span className="text-[10px] text-gray-400">{product.reviewsCount.toLocaleString()}</span>
                ) : null}
              </div>
            )}

            {/* Price row — pushed to bottom */}
            <div className="flex items-center justify-between mt-auto pt-1.5 gap-1">
              <div className="min-w-0 flex items-baseline gap-1 flex-wrap">
                <span className="text-sm font-bold text-primary leading-none">
                  {formatCurrency(price)}
                </span>
                {compareAt > price && (
                  <span className="text-[10px] text-gray-400 line-through leading-none">
                    {formatCurrency(compareAt)}
                  </span>
                )}
              </div>
              <button
                disabled={!inStock}
                onClick={handleAddToCart}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary hover:bg-primary/90 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
