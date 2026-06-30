'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Minus, Plus, ShoppingBag, Trash2,
  ArrowRight, Shield, Banknote, Truck, Tag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

const TRUST_BADGES = [
  { icon: Banknote, text: 'Pay on Delivery' },
  { icon: Shield,   text: 'Secure Checkout' },
  { icon: Truck,    text: 'Fast Delivery' },
  { icon: Tag,      text: 'Best Prices' },
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Browse our kitchen essentials and add something you love.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-colors shadow-sm shadow-primary/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-12">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Shopping Cart</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-5 sm:py-7">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">Shopping Cart</h1>
            <p className="text-xs text-gray-400 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>

          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Clear all items?</span>
              <button
                onClick={() => { clearCart(); setConfirmClear(false); }}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-xl hover:bg-red-50 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-5 items-start">

          {/* ── Cart Items ── */}
          <div className="space-y-3">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              const atMax = item.quantity >= item.stock;

              return (
                <div
                  key={`${item.productId}-${item.variation}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="flex">
                    {/* Product image */}
                    <Link
                      href={`/products/${item.productId}`}
                      className="relative flex-shrink-0 w-[96px] sm:w-[120px] bg-gray-50 border-r border-gray-100 self-stretch min-h-[110px]"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain p-2.5"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-200">📦</div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between gap-2.5">
                      {/* Name + remove */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link href={`/products/${item.productId}`}>
                            <p className="font-bold text-[13px] sm:text-sm text-gray-900 line-clamp-2 hover:text-primary transition-colors leading-snug">
                              {item.name}
                            </p>
                          </Link>
                          {item.variation && (
                            <span className="inline-block mt-1.5 text-[11px] bg-orange-50 text-primary border border-orange-100 px-2 py-0.5 rounded-full font-medium">
                              {item.variation}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variation)}
                          aria-label="Remove item"
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Qty + line total */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variation)}
                            disabled={item.quantity <= 1}
                            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-gray-900 select-none tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variation)}
                            disabled={atMax}
                            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-primary transition-colors disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-base text-primary leading-none tabular-nums">
                            {formatCurrency(lineTotal)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>

                      {atMax && (
                        <p className="text-[11px] text-amber-500 font-medium -mt-0.5">
                          Max quantity reached
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary font-medium transition-colors mt-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Continue Shopping
            </Link>
          </div>

          {/* ── Order Summary — desktop sidebar ── */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Order Summary
              </h2>

              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal&nbsp;
                    <span className="text-gray-400 font-normal">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  </span>
                  <span className="font-semibold text-gray-800 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-xs text-gray-400 italic">Calculated at checkout</span>
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-4" />

              <div className="flex justify-between items-baseline mb-5">
                <span className="font-black text-base text-gray-900">Subtotal</span>
                <span className="font-black text-2xl text-primary tabular-nums">{formatCurrency(subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl transition-all shadow-sm shadow-primary/20 active:scale-[0.98]"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4 pt-4 border-t border-gray-100">
                {TRUST_BADGES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs text-gray-500">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Mobile: summary below items ── */}
        <div className="lg:hidden mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3.5">
              Order Summary
            </h2>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-gray-800 tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-xs text-gray-400 italic">Calculated at checkout</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3.5 border-t border-gray-100">
              {TRUST_BADGES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Mobile sticky checkout bar (sits above bottom nav) ── */}
      <div className="fixed bottom-[58px] left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 leading-none uppercase tracking-wide">Subtotal</p>
          <p className="text-lg font-black text-primary leading-tight tabular-nums">{formatCurrency(subtotal)}</p>
          <p className="text-[10px] text-gray-400 leading-none">+ delivery at checkout</p>
        </div>
        <Link
          href="/checkout"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all whitespace-nowrap shadow-sm shadow-primary/20 active:scale-[0.98]"
        >
          Checkout
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
