'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, ShoppingCart } from 'lucide-react';
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
  const isLowStock = inStock && product.stock <= 5;

  const price = Number(product.price);
  const compareAt = Number(product.compareAtPrice ?? 0);
  const discount = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const rating = product.rating ?? 0;
  const reviewsCount = product.reviewsCount ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price,
      imageUrl: product.imageUrl ?? null,
      quantity: 1,
      stock: product.stock,
    });
    setShowDialog(true);
  };

  return (
    <>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 card-shine">
          {/* Image container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/30">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl">📦</div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {discount > 0 && (
                <span className="bg-primary text-primary-foreground font-bold px-2.5 py-1 rounded-full text-xs shadow-lg">
                  -{discount}%
                </span>
              )}
              {!inStock && (
                <span className="bg-destructive text-destructive-foreground font-semibold px-2.5 py-1 rounded-full text-xs shadow-lg">
                  Out of Stock
                </span>
              )}
              {isLowStock && (
                <span className="bg-warning text-warning-foreground font-semibold px-2.5 py-1 rounded-full text-xs shadow-lg">
                  Only {product.stock} left
                </span>
              )}
            </div>

            {/* Quick action buttons (top-right) */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10">
              <button
                className={`rounded-full shadow-lg w-10 h-10 flex items-center justify-center transition ${
                  isWishlisted
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-white/90 hover:bg-white hover:text-primary'
                }`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-primary' : ''}`} />
              </button>
            </div>

            {/* Add to cart overlay (bottom) */}
            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-10">
              <button
                className="w-full shadow-xl rounded-xl h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {product.categoryName && (
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                {product.categoryName}
              </p>
            )}
            <h3 className="font-semibold text-foreground line-clamp-2 mb-3 text-base group-hover:text-primary transition-colors leading-snug">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-warning text-warning' : 'fill-muted text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewsCount})</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">{formatCurrency(price)}</span>
              {compareAt > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(compareAt)}
                </span>
              )}
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
