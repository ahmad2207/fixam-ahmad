'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Bell, Flame, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/utils';
import { AddToCartDialog } from './AddToCartDialog';
import { NotifyMeModal } from './NotifyMeModal';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  stock: number;
  isFeatured?: boolean;
  isPromo?: boolean;
  promoEndsAt?: string | Date | null;
  restockAt?: string | Date | null;
  categoryName?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
}

function PromoTimer({ endsAt }: { endsAt: string | Date }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    setMounted(true);
    const end = new Date(endsAt).getTime();

    // Persist first-seen time so progress drains consistently across renders
    const key = `promo_start_${end}`;
    let start = parseInt(sessionStorage.getItem(key) ?? '0', 10);
    if (!start || start >= end) {
      start = Date.now();
      sessionStorage.setItem(key, String(start));
    }
    const total = end - start;

    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true });
        setProgress(0);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
      setProgress(Math.max(0, Math.min(1, diff / total)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!mounted || timeLeft.expired) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = timeLeft.d > 0
    ? `${timeLeft.d}d ${pad(timeLeft.h)}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`
    : `${pad(timeLeft.h)}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`;

  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col gap-1">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-500" />
          <span className="text-[10px] font-bold text-orange-500">Sale ends in</span>
        </div>
        <span className="text-[10px] font-black text-gray-600 tabular-nums">{time}</span>
      </div>

      {/* Temu-style pill bar */}
      <div className="relative h-2 w-full rounded-full bg-orange-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
          style={{ width: `${pct}%`, transition: 'width 1s linear' }}
        />
      </div>

      {/* Bottom label */}
      <span className="text-[9px] text-gray-400 font-medium">
        {pct}% time remaining
      </span>
    </div>
  );
}

function RestockTimer({ restockAt }: { restockAt: string | Date }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, arrived: false });

  useEffect(() => {
    setMounted(true);
    const end = new Date(restockAt).getTime();

    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, arrived: true });
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        arrived: false,
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [restockAt]);

  if (!mounted || timeLeft.arrived) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = timeLeft.d > 0
    ? `${timeLeft.d}d ${pad(timeLeft.h)}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`
    : `${pad(timeLeft.h)}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-blue-500" />
        <span className="text-[10px] font-bold text-blue-500">Back in stock in</span>
      </div>
      <span className="text-[10px] font-black text-gray-600 tabular-nums">{time}</span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const [showDialog,      setShowDialog     ] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
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
        <div className="h-full bg-white overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">

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
                ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {/* Info section */}
          <div className="flex-1 flex flex-col px-2.5 pt-2 pb-2.5 gap-1.5">
            <h3 className="text-[13px] font-normal leading-snug text-gray-800 line-clamp-2">
              {product.name}
            </h3>

            {/* Per-product promo countdown */}
            {product.isPromo && product.promoEndsAt && (
              <PromoTimer endsAt={product.promoEndsAt} />
            )}

            {/* Restock countdown */}
            {!inStock && product.restockAt && (
              <RestockTimer restockAt={product.restockAt} />
            )}

            {/* Rating — black stars, count right-aligned */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-px">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-gray-900 text-gray-900" />
                ))}
              </div>
              {product.reviewsCount ? (
                <span className="text-[10px] text-gray-400">{product.reviewsCount.toLocaleString()}</span>
              ) : null}
            </div>

            {/* Price + cart — full-width */}
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <span className="text-lg font-semibold text-primary leading-none">
                  {formatCurrency(price)}
                </span>
                {compareAt > price && (
                  <span className="text-xs text-gray-400 line-through leading-none ml-1">
                    {formatCurrency(compareAt)}
                  </span>
                )}
              </div>
              {inStock ? (
                <button
                  onClick={handleAddToCart}
                  className="flex-shrink-0 p-0.5 text-gray-900 hover:text-primary transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifyModal(true); }}
                  title="Notify me when available"
                  className="flex-shrink-0 p-0.5 text-amber-500 hover:text-amber-400 transition-colors"
                >
                  <Bell className="h-6 w-6" />
                </button>
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
      <NotifyMeModal
        open={showNotifyModal}
        onOpenChange={setShowNotifyModal}
        productId={product.id}
        productName={product.name}
        productImage={product.imageUrl}
      />
    </>
  );
}
