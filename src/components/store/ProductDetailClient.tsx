'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart, Heart, Star, Truck, Shield, RotateCcw,
  Zap, Minus, Plus, Edit2, Trash2, ArrowRight, ChevronLeft, ChevronRight,
  BadgeCheck, Banknote, CircleCheckBig, CreditCard, Bell, Flame, Clock,
} from 'lucide-react';
import { AddToCartDialog } from './AddToCartDialog';
import { NotifyMeModal } from './NotifyMeModal';
import { ProductCard } from './ProductCard';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreSetting } from '@/hooks/useStoreSettings';
import { isVideoUrl } from '@/lib/media';

/* ─── Types ─── */
interface Product {
  id: string; name: string; slug: string;
  description?: string | null; price: string;
  compareAtPrice?: string | null; imageUrl?: string | null;
  images?: string[] | null; stock: number; sku?: string | null;
  variations?: { name: string; options: string[] }[] | null;
  specifications?: Record<string, string> | null;
  category?: { id: string; name: string; slug: string } | null;
  isPromo?: boolean;
  promoEndsAt?: string | null;
  restockAt?: string | null;
}
interface Review {
  id: string; userId: string | null; rating: number;
  title?: string | null; body?: string | null;
  createdAt: Date | string;
  user?: { name: string | null; image: string | null } | null;
}
interface RelatedProduct {
  id: string; name: string; slug: string; price: string;
  compareAtPrice?: string | null; imageUrl?: string | null;
  stock: number; isFeatured?: boolean;
  rating?: string | null; reviewsCount?: number | null; categoryName?: string | null;
}

/* ─── Promo countdown ─── */
function PromoTimer({ endsAt }: { endsAt: string }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    setMounted(true);
    const end = new Date(endsAt).getTime();
    const key = `promo_start_${end}`;
    let start = parseInt(sessionStorage.getItem(key) ?? '0', 10);
    if (!start || start >= end) {
      start = Date.now();
      sessionStorage.setItem(key, String(start));
    }
    const total = end - start;
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true }); setProgress(0); return; }
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
    <div className="flex flex-col gap-1.5 p-3 bg-orange-50 border border-orange-100 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-bold text-orange-600">Sale ends in</span>
        </div>
        <span className="text-sm font-black text-gray-700 tabular-nums">{time}</span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-orange-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
          style={{ width: `${pct}%`, transition: 'width 1s linear' }}
        />
      </div>
      <span className="text-xs text-gray-400">{pct}% time remaining</span>
    </div>
  );
}

/* ─── Restock countdown ─── */
function RestockTimer({ restockAt }: { restockAt: string }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, arrived: false });

  useEffect(() => {
    setMounted(true);
    const end = new Date(restockAt).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, arrived: true }); return; }
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
    <div className="flex flex-col gap-1.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold text-blue-600">Back in stock in</span>
        </div>
        <span className="text-sm font-black text-gray-700 tabular-nums">{time}</span>
      </div>
    </div>
  );
}

/* ─── Stars ─── */
function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
      <span className="w-1 h-5 bg-primary flex-shrink-0" />
      <div>
        <h2 className="font-extrabold text-base text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Review form ─── */
function ReviewForm({ productId, existingReview, onCancel }: {
  productId: string; existingReview?: Review | null; onCancel?: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [body, setBody] = useState(existingReview?.body ?? '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(existingReview ? `/api/reviews/${existingReview.id}` : '/api/reviews', {
        method: existingReview ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
      if (!existingReview) { setRating(0); setTitle(''); setBody(''); }
      onCancel?.();
    },
    onError: () => toast.error('Failed to submit review'),
  });

  return (
    <form onSubmit={e => { e.preventDefault(); if (rating) mutation.mutate(); }}
      className="bg-gray-50 p-4 space-y-3 border border-gray-200">
      <p className="font-bold text-sm text-gray-800">{existingReview ? 'Update Your Review' : 'Write a Review'}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button" onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110">
            <Star className={`h-7 w-7 ${s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
          </button>
        ))}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summary (optional)"
        className="w-full border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Share your experience…"
        className="w-full border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
      <div className="flex gap-2">
        <button type="submit" disabled={!rating || mutation.isPending}
          className="bg-primary text-white px-5 py-2 text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : existingReview ? 'Update' : 'Submit'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="border border-gray-200 px-5 py-2 text-sm font-medium">Cancel</button>
        )}
      </div>
    </form>
  );
}

/* ─── Reviews section ─── */
function ReviewsSection({ productId, initialReviews }: { productId: string; initialReviews: Review[] }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: reviews = initialReviews } = useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => (await fetch(`/api/reviews?productId=${productId}`)).json(),
    initialData: initialReviews,
  });

  const userReview = userId ? reviews.find(r => r.userId === userId) : null;
  const otherReviews = reviews.filter(r => r.userId !== userId);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const deleteMutation = useMutation({
    mutationFn: async () => { await fetch(`/api/reviews/${userReview!.id}`, { method: 'DELETE' }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews', productId] }); toast.success('Deleted'); setDeleteConfirm(false); },
    onError: () => toast.error('Failed'),
  });

  return (
    <div className="space-y-5">
      {reviews.length > 0 && (
        <div className="flex gap-5 p-4 bg-gray-50 border border-gray-100">
          <div className="flex flex-col items-center justify-center w-24 flex-shrink-0">
            <span className="text-4xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
            <Stars rating={avgRating} size="md" />
            <span className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-2">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {session ? (
        userReview && !editing ? (
          <div className="border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Your Review</p>
                <Stars rating={userReview.rating} size="md" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-white text-gray-400 hover:text-gray-700"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteConfirm(true)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {userReview.title && <p className="font-semibold text-sm mb-1">{userReview.title}</p>}
            {userReview.body && <p className="text-sm text-gray-600">{userReview.body}</p>}
            {deleteConfirm && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100">
                <p className="text-sm font-medium mb-2">Delete this review?</p>
                <div className="flex gap-2">
                  <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                    className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 disabled:opacity-50">
                    {deleteMutation.isPending ? '…' : 'Delete'}
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="border border-gray-200 text-xs px-4 py-1.5">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ReviewForm productId={productId} existingReview={editing ? userReview : null}
            onCancel={editing ? () => setEditing(false) : undefined} />
        )
      ) : (
        <div className="text-center py-5 bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Sign in to write a review</p>
          <Link href="/login" className="bg-primary text-white text-sm font-bold px-5 py-2 hover:bg-primary/90 transition inline-block">Sign In</Link>
        </div>
      )}

      {otherReviews.length === 0 && !userReview ? (
        <p className="text-center text-gray-400 text-sm py-6">No reviews yet — be the first!</p>
      ) : (
        <div className="space-y-3">
          {otherReviews.map(review => (
            <div key={review.id} className="bg-gray-50 p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{(review.user?.name ?? 'U')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{review.user?.name ?? 'Anonymous'}</p>
                    <Stars rating={review.rating} />
                  </div>
                </div>
                <span className="text-xs text-gray-400" suppressHydrationWarning>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
              {review.body && <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── WhatsApp icon ─── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Stock badge ─── */
function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-red-50 text-red-500 border border-red-200">
      <span className="w-1.5 h-1.5 bg-red-500" />Out of Stock
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-brand-green-50 text-brand-green-600 border border-brand-green-200">
      <span className="w-1.5 h-1.5 bg-brand-green-500 animate-pulse" />In Stock
    </span>
  );
}

/* ─── Main component ─── */
export function ProductDetailClient({
  product, reviews: initialReviews, relatedProducts = [],
}: {
  product: Product; reviews: Review[]; relatedProducts?: RelatedProduct[];
}) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const router = useRouter();
  const { data: storeSettings } = useStoreSetting<{ whatsapp_number?: string }>('general');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const isWishlisted = has(product.id);
  const inStock = product.stock > 0;
  const price = Number(product.price);
  const compareAt = Number(product.compareAtPrice ?? 0);
  const discount = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const allImages = [product.imageUrl, ...(product.images ?? [])].filter(Boolean).filter((u) => !isVideoUrl(u as string)) as string[];
  const variationString = Object.values(selectedVariations).filter(Boolean).join(' / ') || null;
  const avgRating = initialReviews.length
    ? initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length
    : 0;
  const showRating = initialReviews.length >= 3;

  const waNumber = storeSettings?.whatsapp_number?.replace(/\D/g, '') ?? '';
  const whatsappUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi! I'm interested in *${product.name}* (${formatCurrency(price)}). Is it available?`)}`
    : null;

  const prevImage = () => setActiveImage(i => (i - 1 + allImages.length) % allImages.length);
  const nextImage = () => setActiveImage(i => (i + 1) % allImages.length);

  const parseSpecs = (): [string, string][] => {
    const raw = product.specifications;
    let entries: [string, string][] = [];
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw)) {
        entries = (raw as { key: string; value: string }[]).map(s => [String(s.key ?? ''), String(s.value ?? '')]);
      } else {
        entries = Object.entries(raw).map(([k, v]) => [k, String(v)]);
      }
    }
    if (entries.length === 0) {
      entries = [
        ['Category', product.category?.name ?? '—'],
        ...(product.sku ? [['SKU', product.sku] as [string, string]] : []),
        ['Availability', product.stock > 0 ? 'In Stock' : 'Out of Stock'],
      ];
    }
    return entries;
  };

  const doAddToCart = () => {
    if (!inStock) return;
    addItem({ productId: product.id, name: product.name, price, imageUrl: product.imageUrl ?? null, quantity, variation: variationString, stock: product.stock });
    setShowDialog(true);
  };
  const doBuyNow = () => {
    if (!inStock) return;
    addItem({ productId: product.id, name: product.name, price, imageUrl: product.imageUrl ?? null, quantity, variation: variationString, stock: product.stock });
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 lg:pb-8">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">Products</Link>
          {product.category && (<>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
          </>)}
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[160px] sm:max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-4 space-y-4">

        {/* ── MAIN: 50/50 image | details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ── IMAGE COLUMN ── */}
          <div className="bg-white shadow-sm overflow-hidden">

            {/* Thumbnails (left) + Main image (right) */}
            <div className="flex">

              {/* Vertical thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex flex-col gap-1.5 p-1.5 border-r border-gray-100 overflow-y-auto [&::-webkit-scrollbar]:hidden flex-shrink-0 w-[70px]">
                  {allImages.map((img, i) => (
                    <button key={i}
                      onMouseEnter={() => setActiveImage(i)}
                      onClick={() => setActiveImage(i)}
                      className={`relative w-[54px] h-[54px] flex-shrink-0 overflow-hidden border-2 transition-all ${
                        i === activeImage ? 'border-primary' : 'border-gray-100 hover:border-gray-300'
                      }`}>
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 aspect-square bg-gray-100 group min-w-0">
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[activeImage]}
                    alt={product.name}
                    fill
                    className="object-cover transition-opacity duration-200"
                    priority
                    sizes="(max-width: 1024px) 100vw, 480px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl text-gray-200">📦</div>
                )}

                {allImages.length > 1 && (
                  <>
                    <button onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                      <ChevronLeft className="h-4 w-4 text-gray-700" />
                    </button>
                    <button onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                      <ChevronRight className="h-4 w-4 text-gray-700" />
                    </button>
                  </>
                )}

                {discount > 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-primary text-white font-black text-xs px-2.5 py-1 shadow">
                    -{discount}%
                  </span>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggle(product.id)}
                  className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 shadow hover:bg-white transition-all ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                </button>

                {!inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <span className="bg-white text-gray-800 font-bold px-6 py-2.5 text-sm">Out of Stock</span>
                  </div>
                )}

                {allImages.length > 1 && (
                  <span className="absolute bottom-3 right-3 z-10 bg-black/40 text-white text-[10px] font-semibold px-2 py-0.5 backdrop-blur-sm">
                    {activeImage + 1} / {allImages.length}
                  </span>
                )}
              </div>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
              {[
                { icon: BadgeCheck, label: 'Genuine',       color: 'text-primary' },
                { icon: Shield,     label: 'Secure',        color: 'text-blue-500' },
                { icon: RotateCcw,  label: '30-Day Returns', color: 'text-brand-green-500' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center justify-center gap-1 py-3">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-[9px] text-gray-500 font-medium text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── DETAILS COLUMN ── */}
          <div className="bg-white shadow-sm">

            {/* ── Trust strip ── */}
            <div className="flex divide-x divide-white/10 bg-gray-900 border-b border-gray-800">
              <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white leading-none">Pay on Delivery</p>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white leading-none">30-Day Returns</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">Hassle-free policy</p>
                </div>
              </div>
            </div>

            <div className="px-5 pt-3 pb-2 border-b border-gray-100">

              {/* Category */}
              {product.category && (
                <Link href={`/products?category=${product.category.slug}`}
                  className="text-[11px] font-semibold text-primary uppercase tracking-wider hover:underline">
                  {product.category.name}
                </Link>
              )}

              {/* Name */}
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mt-1">
                {product.name}
              </h1>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-2 whitespace-pre-wrap">{product.description}</p>
              )}

              {/* Rating */}
              {showRating && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Stars rating={avgRating} size="sm" />
                  <span className="text-xs font-bold text-amber-500">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({initialReviews.length})</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-primary leading-none">{formatCurrency(price)}</span>
                {compareAt > price && (
                  <span className="text-base text-gray-400 line-through leading-none">{formatCurrency(compareAt)}</span>
                )}
                {discount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5">{discount}% OFF</span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-xs text-brand-green-600 font-semibold mt-1">You save {formatCurrency(compareAt - price)}</p>
              )}
            </div>

            {/* Promo countdown */}
            {product.isPromo && product.promoEndsAt && (
              <div className="px-5 py-2 border-b border-gray-100">
                <PromoTimer endsAt={product.promoEndsAt} />
              </div>
            )}

            {/* Variations */}
            {(product.variations?.length ?? 0) > 0 && (
              <div className="px-5 py-2 border-b border-gray-100 space-y-2.5">
                {product.variations!.map(v => (
                  <div key={v.name}>
                    <p className="text-xs font-bold text-gray-500 mb-2">
                      {v.name}{selectedVariations[v.name] && <span className="text-primary font-semibold ml-1">· {selectedVariations[v.name]}</span>}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {v.options.map(opt => (
                        <button key={opt}
                          onClick={() => setSelectedVariations(prev => ({ ...prev, [v.name]: opt }))}
                          className={`px-3 py-1.5 border text-xs font-bold transition-all ${
                            selectedVariations[v.name] === opt
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stock + Quantity */}
            <div className="px-5 py-2 flex items-center justify-between border-b border-gray-100">
              <StockBadge stock={product.stock} />
              {inStock && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Qty</span>
                  <div className="flex items-center border border-gray-300">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition">
                      <Minus className="h-3 w-3 text-gray-600" />
                    </button>
                    <span className="w-9 text-center font-black text-sm text-gray-900 border-x border-gray-300">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition">
                      <Plus className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Restock countdown */}
            {!inStock && product.restockAt && (
              <div className="px-5 py-2 border-b border-gray-100">
                <RestockTimer restockAt={product.restockAt} />
              </div>
            )}

            {/* CTA buttons */}
            <div className="px-5 py-2 space-y-2 border-b border-gray-100">
              {inStock ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={doAddToCart}
                    className="h-11 bg-primary hover:bg-primary/90 text-white font-black text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] rounded-md">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                  <button onClick={doBuyNow}
                    className="h-11 bg-gray-900 hover:bg-gray-800 text-white font-black text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] rounded-md">
                    <Zap className="h-4 w-4" /> Buy Now
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowNotifyModal(true)}
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] rounded-md">
                  <Bell className="h-4 w-4" /> Notify Me When Back in Stock
                </button>
              )}

              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full h-10 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition rounded-md">
                  <WhatsAppIcon className="h-4 w-4" /> Chat with a Sales Rep
                </a>
              )}
            </div>

            {/* Delivery + Payment */}
            <div className="px-5 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Truck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span><span className="font-semibold text-gray-700">Abuja:</span> 24–48 hrs &nbsp;·&nbsp; <span className="font-semibold text-gray-700">Nationwide:</span> 2–5 days</span>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-green-700 bg-brand-green-50 border border-brand-green-100 px-2.5 py-1.5">
                  <Banknote className="h-3.5 w-3.5" /> Pay on Delivery
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Online Payment
                </div>
              </div>
            </div>

            {/* SKU */}
            {product.sku && (
              <div className="px-5 py-2">
                <p className="text-[11px] text-gray-400">SKU: <span className="font-mono">{product.sku}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* ── SPECIFICATIONS + REVIEWS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white shadow-sm p-5 sm:p-6">
            <SectionHeader title="Specifications" />
            <div className="overflow-hidden border border-gray-100">
              {parseSpecs().map(([key, value], i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <span className="text-gray-500 font-medium w-2/5 flex-shrink-0">{key}</span>
                  <span className="font-semibold text-gray-800 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-sm p-5 sm:p-6">
            <SectionHeader
              title="Ratings & Reviews"
              sub={initialReviews.length > 0 ? `${initialReviews.length} review${initialReviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
            />
            <ReviewsSection productId={product.id} initialReviews={initialReviews} />
          </div>
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <div className="bg-white shadow-sm pt-4 pb-5">
            <div className="px-4 sm:px-5 flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-primary flex-shrink-0" />
                <div>
                  <h2 className="font-extrabold text-base text-gray-900">You May Also Like</h2>
                  <p className="text-xs text-gray-400">More from {product.category?.name ?? 'this category'}</p>
                </div>
              </div>
              {product.category && (
                <Link href={`/products?category=${product.category.slug}`}
                  className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                  See All <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="px-4 sm:px-5">
              <div className="grid grid-flow-col auto-cols-[160px] sm:auto-cols-[190px] lg:grid-flow-row lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {relatedProducts.map(p => <ProductCard key={p.id} product={p as any} />)}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-3 py-2.5 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2">
          {inStock ? (
            <>
              <button onClick={doAddToCart}
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-black text-sm flex items-center justify-center gap-1.5 transition rounded-md">
                <ShoppingCart className="h-4 w-4" />Add to Cart
              </button>
              <button onClick={doBuyNow}
                className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white font-black text-sm flex items-center justify-center gap-1.5 transition rounded-md">
                <Zap className="h-4 w-4" />Buy Now
              </button>
            </>
          ) : (
            <button onClick={() => setShowNotifyModal(true)}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center gap-1.5 transition rounded-md">
              <Bell className="h-4 w-4" />Notify Me When Back in Stock
            </button>
          )}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="h-11 w-11 flex-shrink-0 border border-[#25D366] text-[#25D366] flex items-center justify-center rounded-md hover:bg-[#25D366] hover:text-white transition">
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      <AddToCartDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productName={product.name}
        productImage={product.imageUrl}
        quantity={quantity}
        price={price}
      />

      <NotifyMeModal
        open={showNotifyModal}
        onOpenChange={setShowNotifyModal}
        productId={product.id}
        productName={product.name}
        productImage={product.imageUrl}
      />
    </div>
  );
}
