'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  ArrowLeft, MapPin, CreditCard, Truck, Banknote,
  ShoppingBag, ChevronRight, AlertTriangle, CircleCheckBig,
  Lock,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

/* ─── Types ─── */
interface SavedAddress {
  id: string; fullName: string; phone: string;
  streetAddress: string; city: string; state: string;
  abujaZone?: string | null; isDefault: boolean;
}

/* ─── Step indicator ─── */
function Steps({ current }: { current: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Delivery' },
    { n: 2, label: 'Payment' },
  ];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            current === s.n
              ? 'bg-primary text-white'
              : current > s.n
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 text-gray-400'
          }`}>
            {current > s.n
              ? <CircleCheckBig className="h-3.5 w-3.5" />
              : <span>{s.n}</span>
            }
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Field wrapper ─── */
function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, itemCount } = useCart();
  const { initiatePayment, isLoading: flwLoading, error: flwError } = useFlutterwavePayment();
  const { data: session } = useSession();

  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'pod'>('online');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [stockErrors, setStockErrors] = useState<{ name: string; available: number; requested: number }[]>([]);
  const [podLoading, setPodLoading] = useState(false);

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

  const isAbuja = useMemo(() =>
    ['FCT - Abuja', 'Abuja', 'FCT', 'Federal Capital Territory'].includes(form.state),
  [form.state]);

  const abujaAreas = useMemo(() => getAbujaAreas(form.abujaZone), [form.abujaZone]);

  const deliveryResult = useMemo(() => {
    if (!form.state) return null;
    const state = isAbuja ? 'FCT - Abuja' : form.state;
    if (isAbuja && !form.abujaZone) return null;
    return calculateDeliveryFee(state, subtotal, isAbuja ? form.abujaZone : undefined);
  }, [form.state, form.abujaZone, subtotal, isAbuja]);

  const finalDeliveryFee = deliveryResult?.fee ?? 0;
  const grandTotal = subtotal + finalDeliveryFee;
  const isLoading = flwLoading || podLoading;

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/account/addresses')
      .then((r) => r.json())
      .then((data: SavedAddress[]) => {
        setSavedAddresses(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) {
          setSelectedAddressId(def.id);
          setForm((p) => ({ ...p, fullName: def.fullName || p.fullName, phone: def.phone, state: def.state, abujaZone: def.abujaZone ?? '' }));
        } else {
          setUseNewAddress(true); setSelectedAddressId('new');
        }
      })
      .catch(() => { setUseNewAddress(true); setSelectedAddressId('new'); });
  }, [session]);

  useEffect(() => {
    setForm((p) => ({ ...p, fullName: session?.user?.name ?? p.fullName, email: session?.user?.email ?? p.email }));
  }, [session]);

  const handleSelectAddress = useCallback((addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    setForm((p) => ({ ...p, phone: addr.phone, state: addr.state, abujaZone: addr.abujaZone ?? '', abujaArea: '' }));
  }, []);

  const set = (name: string, value: string) => setForm((p) => ({ ...p, [name]: value }));
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(e.target.name, e.target.value);

  /* ── Stock check ── */
  const checkStock = async () => {
    const res = await fetch('/api/products?' + new URLSearchParams({ ids: items.map((i) => i.productId).join(',') }));
    if (!res.ok) return [];
    const available: { id: string; stock: number; name: string }[] = await res.json();
    const errors: typeof stockErrors = [];
    for (const item of items) {
      const p = available.find((a) => a.id === item.productId);
      if (p && p.stock < item.quantity) errors.push({ name: item.name, available: p.stock, requested: item.quantity });
    }
    return errors;
  };

  /* ── Build shipping object ── */
  const buildShipping = () => {
    const sel = savedAddresses.find((a) => a.id === selectedAddressId);
    return sel && !useNewAddress
      ? { fullName: form.fullName, phone: sel.phone, streetAddress: sel.streetAddress, city: sel.city, state: isAbuja ? 'FCT - Abuja' : sel.state, abujaZone: isAbuja ? form.abujaZone : undefined }
      : { fullName: form.fullName, phone: form.phone, streetAddress: form.streetAddress, city: form.city, state: isAbuja ? 'FCT - Abuja' : form.state, abujaZone: isAbuja ? form.abujaZone : undefined };
  };

  /* ── Step 1 → 2 ── */
  const handleDeliveryNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.state) { toast.error('Please select your delivery state'); return; }
    if (isAbuja && !form.abujaZone) { toast.error('Please select your Abuja area council / zone'); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Final submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    setStockErrors([]);
    const errors = await checkStock();
    if (errors.length > 0) { setStockErrors(errors); toast.error('Some items have stock issues'); return; }

    const shipping = buildShipping();
    const payload = {
      items: items.map((i) => ({ product_id: i.productId, product_name: i.name, product_image: i.imageUrl, quantity: i.quantity, price: i.price, variation: i.variation ?? null })),
      shippingAddress: shipping,
      subtotal,
      deliveryFee: finalDeliveryFee,
      total: grandTotal,
      customerEmail: form.email,
      customerName: form.fullName,
      customerPhone: form.phone || (savedAddresses.find((a) => a.id === selectedAddressId)?.phone ?? ''),
      notes: form.notes,
    };

    if (paymentMethod === 'pod') {
      setPodLoading(true);
      try {
        const res = await fetch('/api/payment/pod', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Order failed');
        clearCart();
        toast.success('Order placed! Pay cash on delivery.');
        router.push(`/orders`);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setPodLoading(false);
      }
    } else {
      await initiatePayment(payload);
    }
  };

  /* ── Empty cart ── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
          <ShoppingBag className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-extrabold mb-2">Your cart is empty</h1>
          <Link href="/products" className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition mt-4">
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── Location fields ── */
  const locationFields = (showFull: boolean) => (
    <>
      {showFull && (
        <Field label="Street Address" required span2>
          <input name="streetAddress" value={form.streetAddress} onChange={onChange} required placeholder="House number, street name" className={inputCls} />
        </Field>
      )}
      {showFull && (
        <Field label="City / Town" required>
          <input name="city" value={form.city} onChange={onChange} required className={inputCls} />
        </Field>
      )}
      <Field label="State" required>
        <SearchableSelect
          options={ALL_STATES}
          value={form.state}
          onChange={(v) => setForm((p) => ({ ...p, state: v, abujaZone: '', abujaArea: '' }))}
          placeholder="Select your state"
          searchPlaceholder="Type to search state…"
        />
      </Field>
      {isAbuja && (
        <>
          <Field label="Area Council / Zone" required>
            <SearchableSelect
              options={ABUJA_ZONE_NAMES}
              value={form.abujaZone}
              onChange={(v) => setForm((p) => ({ ...p, abujaZone: v, abujaArea: '' }))}
              placeholder="Select area council / zone"
              searchPlaceholder="Type to search zone…"
            />
          </Field>
          {form.abujaZone && abujaAreas.length > 0 && (
            <Field label="Area / District">
              <SearchableSelect
                options={abujaAreas}
                value={form.abujaArea}
                onChange={(v) => setForm((p) => ({ ...p, abujaArea: v }))}
                placeholder="Select area / district"
                searchPlaceholder="Type to search area…"
              />
            </Field>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-8">

      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-primary">Cart</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Checkout</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5">
        <Steps current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 items-start">

          {/* ── LEFT: FORMS ── */}
          <div className="space-y-3">

            {/* ── STEP 1: DELIVERY ── */}
            {step === 1 && (
              <form onSubmit={handleDeliveryNext} className="space-y-3">
                {/* Contact */}
                <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-extrabold text-gray-900">Contact Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <input name="fullName" value={form.fullName} onChange={onChange} required placeholder="Your full name" className={inputCls} />
                    </Field>
                    <Field label="Phone Number" required>
                      <input name="phone" type="tel" value={form.phone} onChange={onChange} required placeholder="08012345678" className={inputCls} />
                    </Field>
                    <Field label="Email Address" required span2>
                      <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" className={inputCls} />
                    </Field>
                  </div>
                </div>

                {/* Delivery address */}
                <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-extrabold text-gray-900">Delivery Address</h2>
                  </div>

                  {/* Saved addresses */}
                  {session && savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <label key={addr.id} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                          <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => handleSelectAddress(addr)} className="mt-0.5 accent-primary" />
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{addr.fullName} {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold ml-1">Default</span>}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{addr.phone} · {addr.streetAddress}, {addr.city}, {addr.state}</p>
                          </div>
                        </label>
                      ))}
                      <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${selectedAddressId === 'new' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                        <input type="radio" name="address" checked={selectedAddressId === 'new'} onChange={() => { setSelectedAddressId('new'); setUseNewAddress(true); }} className="accent-primary" />
                        <span className="text-sm font-semibold text-gray-700">+ Use a new address</span>
                      </label>
                    </div>
                  )}

                  {/* Address fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locationFields(useNewAddress || !session || savedAddresses.length === 0)}
                  </div>

                  {/* Delivery fee preview */}
                  {deliveryResult && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                      <CircleCheckBig className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-700 font-medium">{deliveryResult.label} — <strong>{formatCurrency(finalDeliveryFee)}</strong></p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <Field label="Delivery Notes (optional)">
                    <textarea name="notes" value={form.notes} onChange={onChange} rows={3} placeholder="Any special instructions? e.g. call before delivery, leave at gate..." className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                <button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                  Continue to Payment
                  <ChevronRight className="h-5 w-5" />
                </button>
              </form>
            )}

            {/* ── STEP 2: PAYMENT ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Delivery summary */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Delivering to</p>
                        <p className="text-sm font-bold text-gray-800">{form.fullName} · {form.phone}</p>
                        <p className="text-xs text-gray-500">{form.state}{form.abujaZone ? ` — ${form.abujaZone}` : ''}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-bold hover:underline flex-shrink-0">Edit</button>
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-extrabold text-gray-900">Payment Method</h2>
                  </div>

                  {/* Pay Online */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40'}`}>
                    <input type="radio" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="mt-0.5 accent-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <p className="font-bold text-sm text-gray-800">Pay Online</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Card, bank transfer, USSD via Flutterwave. Secure & instant.</p>
                    </div>
                  </label>

                  {/* Pay on Delivery */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'pod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400'}`}>
                    <input type="radio" checked={paymentMethod === 'pod'} onChange={() => setPaymentMethod('pod')} className="mt-0.5 accent-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <p className="font-bold text-sm text-gray-800">Pay on Delivery</p>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Recommended</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Pay cash when your order arrives at your door. No upfront payment needed.</p>
                    </div>
                  </label>
                </div>

                {/* Stock errors */}
                {stockErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="font-bold text-sm text-red-700">Stock issues</p>
                    </div>
                    <ul className="space-y-1">
                      {stockErrors.map((err, i) => (
                        <li key={i} className="text-xs text-red-600">
                          <strong>{err.name}</strong>: {err.available === 0 ? 'Out of stock' : `Only ${err.available} available (requested ${err.requested})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(flwError) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{flwError}</p>
                  </div>
                )}

                {/* Place order */}
                <button
                  type="submit"
                  disabled={isLoading || !deliveryResult}
                  className={`w-full h-13 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 ${
                    paymentMethod === 'pod'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  {isLoading ? (
                    <span>Processing…</span>
                  ) : paymentMethod === 'pod' ? (
                    <><Banknote className="h-5 w-5" /> Place Order — Pay on Delivery</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Pay {formatCurrency(grandTotal)} Securely</>
                  )}
                </button>

                {!deliveryResult && (
                  <p className="text-xs text-center text-gray-400">Go back and select your delivery state to continue</p>
                )}

                <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  Your information is safe and encrypted
                </p>
              </form>
            )}
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24 space-y-4">
              <h2 className="font-extrabold text-gray-900 pb-3 border-b border-gray-100">
                Order Summary
                <span className="ml-2 text-sm font-bold text-gray-400">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
              </h2>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}:${item.variation}`} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {item.imageUrl
                        ? <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
                        : <div className="absolute inset-0 flex items-center justify-center text-xl text-gray-200">📦</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                      {item.variation && <p className="text-[10px] text-gray-400 mt-0.5">{item.variation}</p>}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                        <span className="text-xs font-extrabold text-primary">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm items-start">
                  <span className="text-gray-500">Delivery</span>
                  {deliveryResult
                    ? <span className="font-semibold text-gray-800">{formatCurrency(finalDeliveryFee)}</span>
                    : <span className="text-xs text-gray-400 italic">TBD</span>
                  }
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-gray-900">Total</span>
                  <span className="font-extrabold text-xl text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {[
                  { icon: Banknote, text: 'Pay on Delivery' },
                  { icon: Lock,     text: 'Secure Checkout' },
                  { icon: Truck,    text: 'Fast Delivery' },
                  { icon: CircleCheckBig, text: 'Genuine Products' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE: Order total bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-extrabold text-primary leading-tight">{formatCurrency(grandTotal)}</p>
          </div>
          {step === 1 ? (
            <button form="delivery-form" onClick={handleDeliveryNext as any} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm px-5 py-3 rounded-xl transition-colors">
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button form="payment-form" onClick={handleSubmit as any} disabled={isLoading || !deliveryResult}
              className={`flex items-center gap-2 text-white font-black text-sm px-5 py-3 rounded-xl transition-colors disabled:opacity-50 ${paymentMethod === 'pod' ? 'bg-green-600' : 'bg-primary hover:bg-primary/90'}`}>
              {isLoading ? 'Processing…' : paymentMethod === 'pod' ? 'Place Order' : `Pay ${formatCurrency(grandTotal)}`}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
