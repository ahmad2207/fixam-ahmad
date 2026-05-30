'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useFlutterwavePayment } from '@/hooks/useFlutterwavePayment';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import {
  ALL_STATES,
  ABUJA_ZONE_NAMES,
  getAbujaAreas,
  calculateDeliveryFee,
} from '@/lib/deliveryFees';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, CreditCard, Truck, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  abujaZone?: string | null;
  isDefault: boolean;
}

function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onUseNew,
}: {
  addresses: SavedAddress[];
  selectedId: string | null;
  onSelect: (addr: SavedAddress) => void;
  onUseNew: () => void;
}) {
  if (addresses.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {addresses.map((addr) => (
        <label
          key={addr.id}
          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
            selectedId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
          }`}
        >
          <input
            type="radio"
            name="address"
            checked={selectedId === addr.id}
            onChange={() => onSelect(addr)}
            className="mt-1 accent-primary"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{addr.fullName}</p>
              {addr.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{addr.phone}</p>
            <p className="text-sm text-muted-foreground">{addr.streetAddress}</p>
            <p className="text-sm text-muted-foreground">{addr.city}, {addr.state}</p>
          </div>
        </label>
      ))}

      <button
        type="button"
        onClick={onUseNew}
        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition text-left ${
          selectedId === 'new' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
        }`}
      >
        <input type="radio" name="address" checked={selectedId === 'new'} onChange={onUseNew} className="accent-primary" />
        <span className="text-sm font-medium">Use a new address</span>
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { initiatePayment, isLoading, error } = useFlutterwavePayment();
  const { data: session } = useSession();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [stockErrors, setStockErrors] = useState<{ name: string; available: number; requested: number }[]>([]);

  const [form, setForm] = useState({
    fullName: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    abujaZone: '',
    abujaArea: '',
    notes: '',
  });

  const isAbuja = useMemo(() => {
    return ['FCT - Abuja', 'Abuja', 'FCT', 'Federal Capital Territory'].includes(form.state);
  }, [form.state]);

  const abujaAreas = useMemo(() => getAbujaAreas(form.abujaZone), [form.abujaZone]);

  const deliveryResult = useMemo(() => {
    if (!form.state) return null;
    const state = isAbuja ? 'FCT - Abuja' : form.state;
    if (isAbuja && !form.abujaZone) return null;
    return calculateDeliveryFee(state, subtotal, isAbuja ? form.abujaZone : undefined);
  }, [form.state, form.abujaZone, subtotal, isAbuja]);

  const finalDeliveryFee = deliveryResult?.fee ?? 0;
  const grandTotal = subtotal + finalDeliveryFee;

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/account/addresses')
      .then((r) => r.json())
      .then((data: SavedAddress[]) => {
        setSavedAddresses(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) {
          setSelectedAddressId(def.id);
          setForm((prev) => ({
            ...prev,
            fullName: def.fullName || prev.fullName,
            phone: def.phone,
            state: def.state,
            abujaZone: def.abujaZone ?? '',
          }));
        } else {
          setUseNewAddress(true);
          setSelectedAddressId('new');
        }
      })
      .catch(() => {
        setUseNewAddress(true);
        setSelectedAddressId('new');
      });
  }, [session]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: session?.user?.name ?? prev.fullName,
      email: session?.user?.email ?? prev.email,
    }));
  }, [session]);

  const handleSelectAddress = useCallback((addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    setForm((prev) => ({
      ...prev,
      phone: addr.phone,
      state: addr.state,
      abujaZone: addr.abujaZone ?? '',
      abujaArea: '',
    }));
  }, []);

  const handleUseNew = useCallback(() => {
    setSelectedAddressId('new');
    setUseNewAddress(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!form.state) {
      toast.error('Please select your delivery state');
      return;
    }

    if (isAbuja && !form.abujaZone) {
      toast.error('Please select your Abuja area council / zone');
      return;
    }

    setStockErrors([]);
    const errors: typeof stockErrors = [];
    const stockRes = await fetch('/api/products?' + new URLSearchParams({ ids: items.map((i) => i.productId).join(',') }));
    if (stockRes.ok) {
      const available: { id: string; stock: number; name: string }[] = await stockRes.json();
      for (const item of items) {
        const p = available.find((a) => a.id === item.productId);
        if (p && p.stock < item.quantity) {
          errors.push({ name: item.name, available: p.stock, requested: item.quantity });
        }
      }
    }
    if (errors.length > 0) {
      setStockErrors(errors);
      toast.error('Some items have stock issues');
      return;
    }

    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
    const shipping = selectedAddr && !useNewAddress
      ? {
          fullName: form.fullName,
          phone: selectedAddr.phone,
          streetAddress: selectedAddr.streetAddress,
          city: selectedAddr.city,
          state: isAbuja ? 'FCT - Abuja' : selectedAddr.state,
          abujaZone: isAbuja ? form.abujaZone : undefined,
        }
      : {
          fullName: form.fullName,
          phone: form.phone,
          streetAddress: form.streetAddress,
          city: form.city,
          state: isAbuja ? 'FCT - Abuja' : form.state,
          abujaZone: isAbuja ? form.abujaZone : undefined,
        };

    await initiatePayment({
      items: items.map((i) => ({
        product_id: i.productId,
        product_name: i.name,
        product_image: i.imageUrl,
        quantity: i.quantity,
        price: i.price,
        variation: i.variation ?? null,
      })),
      shippingAddress: shipping,
      subtotal,
      deliveryFee: finalDeliveryFee,
      total: grandTotal,
      customerEmail: form.email,
      customerName: form.fullName,
      customerPhone: form.phone || (selectedAddr?.phone ?? ''),
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button size="lg" asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </main>
      </div>
    );
  }

  const locationFields = (showStreetAndCity: boolean) => (
    <>
      {showStreetAndCity && (
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="streetAddress">Street Address</Label>
          <Input
            id="streetAddress"
            name="streetAddress"
            value={form.streetAddress}
            onChange={handleChange}
            required
            placeholder="House number, street name"
          />
        </div>
      )}
      {showStreetAndCity && (
        <div className="space-y-2">
          <Label htmlFor="city">City / Town</Label>
          <Input
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>State</Label>
        <Select
          value={form.state}
          onValueChange={(val) => setForm((prev) => ({ ...prev, state: val, abujaZone: '', abujaArea: '' }))}
        >
          <SelectTrigger>
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
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Area Council / Zone</Label>
            <Select
              value={form.abujaZone}
              onValueChange={(val) => setForm((prev) => ({ ...prev, abujaZone: val, abujaArea: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {ABUJA_ZONE_NAMES.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.abujaZone && abujaAreas.length > 0 && (
            <div className="space-y-2">
              <Label>Area / District</Label>
              <Select
                value={form.abujaArea}
                onValueChange={(val) => setForm((prev) => ({ ...prev, abujaArea: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {abujaAreas.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Shipping Address</h2>
                    <p className="text-sm text-muted-foreground">Where should we deliver?</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <Label className="text-base font-medium mb-4 block">Delivery Address</Label>

                  {session && savedAddresses.length > 0 && (
                    <AddressSelector
                      addresses={savedAddresses}
                      selectedId={selectedAddressId}
                      onSelect={handleSelectAddress}
                      onUseNew={handleUseNew}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {locationFields(useNewAddress || !session || savedAddresses.length === 0)}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Payment Method</h2>
                    <p className="text-sm text-muted-foreground">Select how you want to pay</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Pay Online</p>
                    <p className="text-sm text-muted-foreground">Card, bank transfer, USSD via Flutterwave</p>
                  </div>
                </div>
              </div>

              {/* Delivery Notes */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Delivery Notes</h2>
                    <p className="text-sm text-muted-foreground">Any special instructions?</p>
                  </div>
                </div>
                <Textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Add any delivery instructions or notes..."
                />
              </div>
            </div>

            {/* Right: order summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                {stockErrors.length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Stock issues:</p>
                      <ul className="text-sm space-y-1">
                        {stockErrors.map((err, i) => (
                          <li key={i}>
                            <strong>{err.name}</strong>:{' '}
                            {err.available === 0
                              ? 'Out of stock'
                              : `Only ${err.available} available (you requested ${err.requested})`}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.productId}:${item.variation}`} className="flex gap-3">
                      {item.imageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        {item.variation && <p className="text-xs text-muted-foreground">{item.variation}</p>}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
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
                      <span className="text-xs text-muted-foreground italic">Select location</span>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6 gap-2"
                  disabled={isLoading || !deliveryResult}
                >
                  {isLoading ? 'Processing...' : 'Pay Now'}
                  <Check className="h-4 w-4" />
                </Button>

                {!deliveryResult && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Please select your delivery state to see the fee
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
