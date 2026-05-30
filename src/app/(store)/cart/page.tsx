'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, ArrowRight, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import {
  ALL_STATES,
  ABUJA_ZONE_NAMES,
  calculateDeliveryFee,
} from '@/lib/deliveryFees';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variation}`}
                className="bg-card rounded-2xl p-4 sm:p-6 shadow-card flex flex-col sm:flex-row gap-4"
              >
                {item.imageUrl && (
                  <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground line-clamp-2">{item.name}</p>
                      {item.variation && (
                        <p className="text-sm text-muted-foreground">Option: {item.variation}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary whitespace-nowrap">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variation)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variation)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                      onClick={() => removeItem(item.productId, item.variation)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-muted-foreground">Delivery Fee</span>
                    {deliveryResult && (
                      <p className="text-xs text-muted-foreground mt-0.5">{deliveryResult.label}</p>
                    )}
                  </div>
                  {deliveryResult ? (
                    <span className="font-medium">{formatCurrency(finalDeliveryFee)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Select location below</span>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Delivery Fee Estimator */}
              <div className="mt-6 p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Estimate Delivery Fee</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">State</Label>
                  <Select
                    value={selectedState}
                    onValueChange={(val) => { setSelectedState(val); setAbujaZone(''); }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isAbuja && (
                  <div className="space-y-2">
                    <Label className="text-xs">Area Council / Zone</Label>
                    <Select value={abujaZone} onValueChange={setAbujaZone}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {ABUJA_ZONE_NAMES.map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button size="lg" className="w-full gap-2 mt-6" asChild>
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure checkout powered by trusted payment providers
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
