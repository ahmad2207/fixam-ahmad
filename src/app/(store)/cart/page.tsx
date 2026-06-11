'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Minus, Plus, ShoppingBag, Trash2,
  ArrowRight, MapPin, Truck, Shield, Banknote, Tag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import {
  ALL_STATES,
  ABUJA_ZONE_NAMES,
  calculateDeliveryFee,
} from '@/lib/deliveryFees';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const [selectedState, setSelectedState] = useState('');
  const [abujaZone, setAbujaZone] = useState('');

  const isAbuja = ['FCT - Abuja', 'Abuja', 'FCT', 'Federal Capital Territory'].includes(selectedState);

  const deliveryResult = useMemo(() => {
    if (!selectedState) return null;
    const state = isAbuja ? 'FCT - Abuja' : selectedState;
    if (isAbuja && !abujaZone) return null;
    return calculateDeliveryFee(state, subtotal, isAbuja ? abujaZone : undefined);
  }, [selectedState, abujaZone, subtotal, isAbuja]);

  const finalDeliveryFee = deliveryResult?.fee ?? 0;
  const grandTotal = subtotal + finalDeliveryFee;

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-20">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-orange-50 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-sm text-gray-500 mb-7">
            Looks like you haven&apos;t added anything yet. Browse our products and find something you love!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors w-full justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── Order Summary (reused in both sidebar and mobile footer) ── */
  const OrderSummary = () => (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
        <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
      </div>

      {/* Delivery fee */}
      <div className="flex justify-between items-start text-sm">
        <div>
          <span className="text-gray-500">Delivery Fee</span>
          {deliveryResult && (
            <p className="text-xs text-gray-400 mt-0.5">{deliveryResult.label}</p>
          )}
        </div>
        {deliveryResult ? (
          <span className="font-semibold text-gray-800">{formatCurrency(finalDeliveryFee)}</span>
        ) : (
          <span className="text-xs text-gray-400 italic">Select location</span>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="font-extrabold text-base text-gray-900">Total</span>
        <span className="font-extrabold text-xl text-primary">{formatCurrency(grandTotal)}</span>
      </div>

      {/* Delivery estimator */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Estimate Delivery</p>
        </div>
        <SearchableSelect
          options={ALL_STATES}
          value={selectedState}
          onChange={(v) => { setSelectedState(v); setAbujaZone(''); }}
          placeholder="Select your state"
          searchPlaceholder="Type to search state…"
        />
        {isAbuja && (
          <SearchableSelect
            options={ABUJA_ZONE_NAMES}
            value={abujaZone}
            onChange={setAbujaZone}
            placeholder="Select area council / zone"
            searchPlaceholder="Type to search zone…"
          />
        )}
        {deliveryResult && (
          <p className="text-xs text-primary font-semibold">
            ✓ {deliveryResult.label}
          </p>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/checkout"
        className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-xl transition-colors shadow-sm"
      >
        Proceed to Checkout
        <ArrowRight className="h-4 w-4" />
      </Link>

      {/* Trust row */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { icon: Banknote, text: 'Pay on Delivery' },
          { icon: Shield,   text: 'Secure Checkout' },
          { icon: Truck,    text: 'Fast Delivery' },
          { icon: Tag,      text: 'Best Prices' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
            <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-40 lg:pb-6">

      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Shopping Cart</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">
            My Cart
            <span className="ml-2 text-sm font-bold text-gray-400">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          </h1>
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-4 items-start">

          {/* ── CART ITEMS ── */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variation}`}
                className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4"
              >
                {/* Image */}
                <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-200">📦</div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/products/${item.productId}`}>
                        <p className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-primary transition-colors leading-snug">
                          {item.name}
                        </p>
                      </Link>
                      {item.variation && (
                        <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {item.variation}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variation)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Qty + Total */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variation)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3 text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variation)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>
                    <span className="font-extrabold text-base text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline mt-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Continue Shopping
            </Link>
          </div>

          {/* ── ORDER SUMMARY — Desktop sidebar ── */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
              <h2 className="font-extrabold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Order Summary
              </h2>
              <OrderSummary />
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY SUMMARY ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
        {/* Collapsed total row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Total ({itemCount} items)</p>
            <p className="text-lg font-extrabold text-primary leading-tight">{formatCurrency(grandTotal)}</p>
            {!deliveryResult && (
              <p className="text-[10px] text-gray-400">+ delivery fee (select state above)</p>
            )}
          </div>
          <Link
            href="/checkout"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Delivery estimator — mobile */}
        <div className="px-4 py-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <SearchableSelect
            options={ALL_STATES}
            value={selectedState}
            onChange={(v) => { setSelectedState(v); setAbujaZone(''); }}
            placeholder="Estimate delivery — select state"
            searchPlaceholder="Type to search state…"
            className="flex-1 h-8 text-xs"
          />
          {isAbuja && (
            <SearchableSelect
              options={ABUJA_ZONE_NAMES}
              value={abujaZone}
              onChange={setAbujaZone}
              placeholder="Select zone"
              searchPlaceholder="Type to search zone…"
              className="flex-1 h-8 text-xs"
            />
          )}
        </div>
      </div>

    </div>
  );
}
