'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Zap,
  ArrowLeft, Minus, Plus, Edit2, Trash2,
} from 'lucide-react';
import { AddToCartDialog } from './AddToCartDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  stock: number;
  sku?: string | null;
  variations?: { name: string; options: string[] }[] | null;
  specifications?: Record<string, string> | null;
  category?: { id: string; name: string; slug: string } | null;
}

interface Review {
  id: string;
  userId: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  createdAt: Date | string;
  user?: { name: string | null; image: string | null } | null;
}

function ReviewForm({
  productId,
  existingReview,
  onCancel,
}: {
  productId: string;
  existingReview?: Review | null;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [body, setBody] = useState(existingReview?.body ?? '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (existingReview) {
        const res = await fetch(`/api/reviews/${existingReview.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, title, body }),
        });
        if (!res.ok) throw new Error('Failed to submit');
        return res.json();
      } else {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, rating, title, body }),
        });
        if (!res.ok) throw new Error('Failed to submit');
        return res.json();
      }
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
    <form
      onSubmit={(e) => { e.preventDefault(); if (rating === 0) return; mutation.mutate(); }}
      className="bg-secondary/30 rounded-xl p-6 space-y-4"
    >
      <h3 className="font-semibold text-lg">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || rating)
                    ? 'fill-warning text-warning'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
      />

      <textarea
        placeholder="Share your experience with this product..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card resize-none"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={rating === 0 || mutation.isPending}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-border px-5 py-2 rounded-lg text-sm font-medium hover:bg-secondary/50 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const qc = useQueryClient();
  const [editingReview, setEditingReview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      return res.json();
    },
  });

  const userReview = userId ? reviews.find((r) => r.userId === userId) : null;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reviews/${userReview!.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Review deleted');
      setDeleteConfirm(false);
    },
    onError: () => toast.error('Failed to delete review'),
  });

  return (
    <div className="space-y-6">
      {/* Review form / login prompt */}
      {session ? (
        userReview && !editingReview ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">Your Review</p>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < userReview.rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingReview(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1 text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
            {userReview.title && <p className="font-medium mb-1">{userReview.title}</p>}
            {userReview.body && <p className="text-muted-foreground">{userReview.body}</p>}

            {deleteConfirm && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium mb-3">Delete this review? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-destructive/90 transition disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ReviewForm
            productId={productId}
            existingReview={editingReview ? userReview : null}
            onCancel={editingReview ? () => setEditingReview(false) : undefined}
          />
        )
      ) : (
        <div className="bg-secondary/30 rounded-xl p-6 text-center">
          <p className="text-muted-foreground mb-3">Sign in to write a review</p>
          <Link
            href="/login"
            className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews
            .filter((r) => r.userId !== userId)
            .map((review) => (
              <div key={review.id} className="bg-secondary/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {(review.user?.name ?? 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{review.user?.name ?? 'Anonymous'}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                {review.title && <p className="font-medium mb-1">{review.title}</p>}
                {review.body && <p className="text-muted-foreground">{review.body}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetailClient({ product, reviews: initialReviews }: { product: Product; reviews: Review[] }) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(product.imageUrl ?? null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const isWishlisted = has(product.id);
  const inStock = product.stock > 0;

  const price = Number(product.price);
  const compareAt = Number(product.compareAtPrice ?? 0);
  const discount = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  const allImages = [product.imageUrl, ...(product.images ?? [])].filter(Boolean) as string[];
  const variationString = Object.values(selectedVariations).filter(Boolean).join(' / ') || null;

  const avgRating = initialReviews.length
    ? initialReviews.reduce((sum, r) => sum + r.rating, 0) / initialReviews.length
    : 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price,
      imageUrl: product.imageUrl ?? null,
      quantity,
      variation: variationString,
      stock: product.stock,
    });
    setShowDialog(true);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price,
      imageUrl: product.imageUrl ?? null,
      quantity,
      variation: variationString,
      stock: product.stock,
    });
    router.push('/checkout');
  };

  const tabs = [
    { key: 'description' as const, label: 'Description' },
    { key: 'specifications' as const, label: 'Specifications' },
    { key: 'reviews' as const, label: `Reviews (${initialReviews.length})` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/30">
              {selectedImage ? (
                <Image src={selectedImage} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">📦</div>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                  -{discount}% OFF
                </span>
              )}
              {!inStock && (
                <span className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-semibold px-3 py-1 rounded-full text-sm shadow-lg">
                  Out of Stock
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === img ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  {product.category.name}
                </p>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">{product.name}</h1>

              {/* Rating */}
              {initialReviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(avgRating) ? 'fill-warning text-warning' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({initialReviews.length} reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">{formatCurrency(price)}</span>
                {compareAt > price && (
                  <span className="text-xl text-muted-foreground line-through">{formatCurrency(compareAt)}</span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Variations */}
            {product.variations?.map((v) => (
              <div key={v.name}>
                <p className="font-semibold mb-3">Select {v.name}</p>
                <div className="flex flex-wrap gap-2">
                  {v.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedVariations((prev) => ({ ...prev, [v.name]: opt }))}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedVariations[v.name] === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity & Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-border rounded-xl">
                <button
                  className="p-3 hover:bg-secondary/50 rounded-l-xl transition disabled:opacity-40"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  className="p-3 hover:bg-secondary/50 rounded-r-xl transition disabled:opacity-40"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={!inStock || quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary h-12 rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
                disabled={!inStock}
                onClick={handleBuyNow}
              >
                <Zap className="h-5 w-5" />
                Buy Now
              </button>

              <button
                onClick={() => toggle(product.id)}
                className={`flex items-center justify-center h-12 w-12 rounded-xl border-2 transition ${
                  isWishlisted
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-primary' : ''}`} />
              </button>
            </div>

            {/* Stock info */}
            <p className={`text-sm font-medium ${inStock ? 'text-success' : 'text-destructive'}`}>
              {inStock ? `${product.stock} items in stock` : 'Out of stock'}
            </p>

            {/* Feature badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
              {[
                { icon: Truck, title: 'Fast Delivery', sub: 'Nationwide' },
                { icon: Shield, title: 'Warranty', sub: '1 Year' },
                { icon: RotateCcw, title: 'Easy Returns', sub: '7 Days' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-8 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {activeTab === 'description' && (
              <div className="prose prose-gray max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Experience the difference with our premium{' '}
                  {product.category?.name?.toLowerCase() ?? 'kitchen'} collection. Designed for both
                  professional chefs and home cooks, this product combines functionality with elegant
                  design to elevate your cooking experience.
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  <li>✓ Premium quality materials</li>
                  <li>✓ Ergonomic design for comfortable use</li>
                  <li>✓ Easy to clean and maintain</li>
                  <li>✓ Durable construction for long-lasting performance</li>
                </ul>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  product.specifications && Object.keys(product.specifications).length > 0
                    ? Object.entries(product.specifications)
                    : [
                        ['Category', product.category?.name ?? '—'],
                        ...(product.sku ? [['SKU', product.sku]] : []),
                        ['Stock', `${product.stock} units`],
                      ]
                ).map(([key, value], i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviews productId={product.id} />
            )}
          </div>
        </div>
      </main>

      <AddToCartDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productName={product.name}
        productImage={product.imageUrl}
        quantity={quantity}
        price={price}
      />
    </div>
  );
}
