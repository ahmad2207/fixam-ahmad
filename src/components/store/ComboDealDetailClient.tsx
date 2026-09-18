'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { computeComboPricing, type ComboDealWithComponents } from '@/lib/comboPricing';
import { AddToCartDialog } from './AddToCartDialog';

export function ComboDealDetailClient({ combo }: { combo: ComboDealWithComponents }) {
  const { addCombo } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const pricing = computeComboPricing(combo);

  const handleAddToCart = () => {
    if (!pricing.available) return;
    addCombo({
      comboId: combo.id,
      slug: combo.slug,
      name: combo.name,
      price: combo.price,
      imageUrl: combo.imageUrl,
      quantity,
      maxQuantity: pricing.maxQuantity,
      components: combo.components
        .filter((c) => c.product)
        .map((c) => ({ productId: c.product!.id, name: c.product!.name, quantity: c.quantity, imageUrl: c.product!.imageUrl })),
    });
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24 lg:pb-8">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/combo-deals" className="hover:text-primary">Combo Deals</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[160px] sm:max-w-xs">{combo.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ── Image ── */}
          <div className="bg-white shadow-sm overflow-hidden relative aspect-square">
            {combo.imageUrl ? (
              <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 480px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl text-gray-200">🎁</div>
            )}
            <span className="absolute top-3 left-3 z-10 bg-primary text-white font-black text-xs px-2.5 py-1 shadow uppercase tracking-wide">
              Bundle
            </span>
            {!pricing.available && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <span className="bg-white text-gray-800 font-bold px-6 py-2.5 text-sm">Currently Unavailable</span>
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="bg-white shadow-sm p-5 space-y-5">
            <div>
              <h1 className="text-xl font-black text-gray-900">{combo.name}</h1>
              {combo.description && <p className="text-sm text-gray-500 mt-1.5">{combo.description}</p>}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-primary">{formatCurrency(combo.price)}</span>
              {pricing.savings > 0 && (
                <span className="text-sm text-gray-400 line-through">{formatCurrency(pricing.sumOfParts)}</span>
              )}
            </div>
            {/* ── Included products ── */}
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> What&apos;s included
              </h2>
              <div className="space-y-2">
                {combo.components.map((c) => (
                  <div key={c.itemId} className="flex items-center gap-3 border border-gray-100 rounded-lg p-2">
                    <div className="relative w-11 h-11 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      {c.product?.imageUrl && <Image src={c.product.imageUrl} alt="" fill className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {c.quantity > 1 ? `${c.quantity} × ` : ''}{c.product?.name ?? 'Unavailable product'}
                      </p>
                      {c.product && <p className="text-xs text-gray-400">{formatCurrency(c.product.price)} each</p>}
                    </div>
                    {c.product && (!c.product.isActive || c.product.stock <= 0) && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Out of stock
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quantity + Add to cart ── */}
            {pricing.available ? (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 disabled:opacity-30">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-9 text-center font-black text-sm text-gray-900 border-x border-gray-300">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(pricing.maxQuantity, q + 1))} disabled={quantity >= pricing.maxQuantity}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 disabled:opacity-30">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-white font-bold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" /> Add Bundle to Cart
                </button>
              </div>
            ) : (
              <p className="text-sm text-red-600 font-medium">This bundle is currently unavailable — one of its products is out of stock.</p>
            )}
          </div>
        </div>
      </div>

      <AddToCartDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productName={combo.name}
        productImage={combo.imageUrl}
        quantity={quantity}
        price={combo.price}
      />
    </div>
  );
}
