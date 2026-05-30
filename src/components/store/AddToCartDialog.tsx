'use client';

import { ShoppingCart, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;
}

export function AddToCartDialog({
  open,
  onOpenChange,
  productName,
  productImage,
  quantity,
  price,
}: AddToCartDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 text-success mb-4">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-semibold text-base">Added to Cart!</h2>
        </div>

        {/* Product preview */}
        <div className="flex items-center gap-4 py-4 border-y border-border mb-4">
          {productImage && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={productImage} alt={productName} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground line-clamp-2">{productName}</p>
            <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
            <p className="font-semibold text-primary">₦{(price * quantity).toLocaleString()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl h-11 text-sm font-medium hover:bg-secondary/50 transition"
            onClick={() => onOpenChange(false)}
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </button>
          <Link
            href="/cart"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl h-11 text-sm font-semibold hover:bg-primary/90 transition"
            onClick={() => onOpenChange(false)}
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
