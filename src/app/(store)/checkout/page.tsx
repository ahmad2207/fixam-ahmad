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
  ShoppingBag, ChevronRight, AlertTriangle, CheckCircle2,
  Lock, User, Phone, Mail, Home,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface SavedAddress {
  id: string; fullName: string; phone: string;
  streetAddress: string; city: string; state: string;
  abujaZone?: string | null; isDefault: boolean;
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function StepBar({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
          current > 1 ? 'bg-emerald-500 text-white' : current === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
        }`}>
          {current > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
        </div>
        <span className={`text-sm font-bold transition-colors ${current === 1 ? 'text-gray-900' : current > 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
          Delivery
        </span>
      </div>

      {/* Connector */}
      <div className="flex-1 mx-3 h-px bg-gray-200 max-w-[48px]">
        <div className={`h-px bg-primary transition-all duration-500 ${current > 1 ? 'w-full' : 'w-0'}`} />
      </div>

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
          current === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
        }`}>
          2
        </div>
        <span className={`text-sm font-bold transition-colors ${current === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
          Payment
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4.5 w-4.5 text-primary h-[18px] w-[18px]" />
        </div>
        <h2 className="font-black text-gray-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

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

  const buildShipping = () => {
    const sel = savedAddresses.find((a) => a.id === selectedAddressId);
    return sel && !useNewAddress
      ? { fullName: form.fullName, phone: sel.phone, streetAddress: sel.streetAddress, city: sel.city, state: isAbuja ? 'FCT - Abuja' : sel.state, abujaZone: isAbuja ? form.abujaZone : undefined }
      : { fullName: form.fullName, phone: form.phone, streetAddress: form.streetAddress, city: form.city, state: isAbuja ? 'FCT - Abuja' : form.state, abujaZone: isAbuja ? form.abujaZone : undefined };
  };

  const handleDeliveryNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.state) { toast.error('Please select your delivery state'); return; }
    if (isAbuja && !form.abujaZone) { toast.error('Please select your Abuja area council / zone'); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        router.push('/orders');
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
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-sm text-gray-500 mb-6">Add some items before checking out.</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-2xl hover:bg-primary/90 transition shadow-sm shadow-primary/20">
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  /* ── Location fields (reused in both saved-address flow and new-address) ── */
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
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-12">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Checkout</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-7">
        <StepBar current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-5 items-start">

          {/* ── LEFT: FORMS ── */}
          <div className="space-y-4">

            {/* ════ STEP 1: DELIVERY ════ */}
            {step === 1 && (
              <form onSubmit={handleDeliveryNext} className="space-y-4">

                {/* Contact */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader icon={User} title="Contact Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <input name="fullName" value={form.fullName} onChange={onChange} required placeholder="Your full name" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Phone Number" required>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <input name="phone" type="tel" value={form.phone} onChange={onChange} required placeholder="08012345678" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Email Address" required span2>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Delivery address */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader icon={Home} title="Delivery Address" />

                  {/* Saved addresses */}
                  {session && savedAddresses.length > 0 && (
                    <div className="space-y-2 mb-5">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-100 hover:border-primary/30 bg-gray-50'
                          }`}
                        >
                          <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => handleSelectAddress(addr)} className="mt-0.5 accent-primary" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-gray-800">{addr.fullName}</p>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Default</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                              {addr.phone} · {addr.streetAddress}, {addr.city}, {addr.state}
                            </p>
                          </div>
                        </label>
                      ))}
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === 'new' ? 'border-primary bg-primary/5' : 'border-dashed border-gray-200 hover:border-primary/40'
                      }`}>
                        <input type="radio" name="address" checked={selectedAddressId === 'new'} onChange={() => { setSelectedAddressId('new'); setUseNewAddress(true); }} className="accent-primary" />
                        <span className="text-sm font-bold text-gray-600">+ Use a different address</span>
                      </label>
                    </div>
                  )}

                  {/* Address fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locationFields(useNewAddress || !session || savedAddresses.length === 0)}
                  </div>

                  {/* Delivery fee result */}
                  {deliveryResult && (
                    <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800">{formatCurrency(finalDeliveryFee)} delivery fee</p>
                        <p className="text-xs text-emerald-600">{deliveryResult.label}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <Field label="Delivery Notes (optional)">
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={onChange}
                      rows={3}
                      placeholder="Any special instructions? e.g. call before delivery, leave at gate…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20 active:scale-[0.99]"
                >
                  Continue to Payment
                  <ChevronRight className="h-5 w-5" />
                </button>
              </form>
            )}

            {/* ════ STEP 2: PAYMENT ════ */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Delivery summary chip */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Delivering to</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{form.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {form.state}{form.abujaZone ? ` · ${form.abujaZone}` : ''}
                        {deliveryResult && <span className="text-primary font-semibold"> · {formatCurrency(finalDeliveryFee)}</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-shrink-0 text-xs text-primary font-bold bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <SectionHeader icon={CreditCard} title="Payment Method" />

                  <div className="space-y-3">
                    {/* Pay Online */}
                    <label className={`block cursor-pointer transition-all ${paymentMethod === 'online' ? '' : ''}`}>
                      <input type="radio" className="sr-only" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                      <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'online'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-100 bg-gray-50 hover:border-primary/30'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          paymentMethod === 'online' ? 'bg-primary' : 'bg-gray-200'
                        }`}>
                          <CreditCard className={`h-5 w-5 ${paymentMethod === 'online' ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-gray-900 text-sm">Pay Online</p>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              paymentMethod === 'online' ? 'border-primary' : 'border-gray-300'
                            }`}>
                              {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Card, bank transfer, or USSD via Flutterwave</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Lock className="h-3 w-3 text-gray-400" />
                            <span className="text-[11px] text-gray-400">Secure &amp; encrypted</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Pay on Delivery */}
                    <label className="block cursor-pointer">
                      <input type="radio" className="sr-only" checked={paymentMethod === 'pod'} onChange={() => setPaymentMethod('pod')} />
                      <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'pod'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-100 bg-gray-50 hover:border-emerald-300'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          paymentMethod === 'pod' ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}>
                          <Banknote className={`h-5 w-5 ${paymentMethod === 'pod' ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900 text-sm">Pay on Delivery</p>
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Recommended</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              paymentMethod === 'pod' ? 'border-emerald-500' : 'border-gray-300'
                            }`}>
                              {paymentMethod === 'pod' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Pay cash when your order arrives. No upfront payment needed.</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Stock errors */}
                {stockErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="font-bold text-sm text-red-700">Stock issues — please update your cart</p>
                    </div>
                    <ul className="space-y-1">
                      {stockErrors.map((err, i) => (
                        <li key={i} className="text-xs text-red-600">
                          <strong>{err.name}</strong>: {err.available === 0 ? 'Out of stock' : `Only ${err.available} available (you requested ${err.requested})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {flwError && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{flwError}</p>
                  </div>
                )}

                {/* Place order CTA */}
                <button
                  type="submit"
                  disabled={isLoading || !deliveryResult}
                  className={`w-full h-13 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === 'pod'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : paymentMethod === 'pod' ? (
                    <><Banknote className="h-5 w-5" /> Place Order — Pay on Delivery</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Pay {formatCurrency(grandTotal)} Securely</>
                  )}
                </button>

                {!deliveryResult && (
                  <p className="text-xs text-center text-gray-400">Go back and select your delivery state to continue</p>
                )}

                <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Your information is safe and encrypted
                </p>
              </form>
            )}
          </div>

          {/* ── RIGHT: ORDER SUMMARY (desktop) ── */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">

              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}:${item.variation}`} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {item.imageUrl
                        ? <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
                        : <div className="absolute inset-0 flex items-center justify-center text-xl text-gray-200">📦</div>
                      }
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-semibold text-xs text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                      {item.variation && <p className="text-[10px] text-gray-400 mt-0.5">{item.variation}</p>}
                      <p className="text-xs font-black text-primary mt-1 tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-100 mb-4" />

              {/* Totals */}
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span className="font-semibold text-gray-800 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  {deliveryResult
                    ? <span className="font-semibold text-gray-800 tabular-nums">{formatCurrency(finalDeliveryFee)}</span>
                    : <span className="text-xs text-gray-400 italic">Select state →</span>
                  }
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-4" />

              <div className="flex justify-between items-baseline mb-5">
                <span className="font-black text-base text-gray-900">Total</span>
                <span className="font-black text-2xl text-primary tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-4 border-t border-gray-100">
                {[
                  { icon: Banknote,       text: 'Pay on Delivery' },
                  { icon: Lock,           text: 'Secure Checkout' },
                  { icon: Truck,          text: 'Fast Delivery' },
                  { icon: CheckCircle2,   text: 'Genuine Products' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs text-gray-500">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE: sticky bar above bottom nav ── */}
      <div className="fixed bottom-[58px] left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Total</p>
          <p className="text-lg font-black text-primary leading-tight tabular-nums">{formatCurrency(grandTotal)}</p>
          {!deliveryResult && step === 1 && (
            <p className="text-[10px] text-gray-400 leading-none">+ delivery fee TBD</p>
          )}
        </div>
        {step === 1 ? (
          <button
            onClick={handleDeliveryNext as any}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all whitespace-nowrap shadow-sm shadow-primary/20"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit as any}
            disabled={isLoading || !deliveryResult}
            className={`flex items-center gap-2 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all whitespace-nowrap shadow-sm disabled:opacity-50 ${
              paymentMethod === 'pod' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-primary hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {isLoading ? 'Processing…' : paymentMethod === 'pod' ? 'Place Order' : `Pay ${formatCurrency(grandTotal)}`}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
}
