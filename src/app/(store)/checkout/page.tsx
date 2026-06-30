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
  Lock, User, Phone, Mail,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useStoreSetting } from '@/hooks/useStoreSettings';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.849L.057 23.617a.75.75 0 00.921.921l5.768-1.467A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-5.003-1.381l-.36-.214-3.724.948.963-3.628-.233-.373A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}

interface SavedAddress {
  id: string; fullName: string; phone: string;
  streetAddress: string; city: string; state: string;
  abujaZone?: string | null; isDefault: boolean;
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

function F({ label, req, children, wide }: { label: string; req?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, itemCount } = useCart();
  const { initiatePayment, isLoading: flwLoading, error: flwError } = useFlutterwavePayment();
  const { data: session } = useSession();
  const { data: storeSettings } = useStoreSetting<{ whatsapp_number?: string }>('general');

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
      .then(r => r.json())
      .then((data: SavedAddress[]) => {
        setSavedAddresses(data);
        const def = data.find(a => a.isDefault) ?? data[0];
        if (def) {
          setSelectedAddressId(def.id);
          setForm(p => ({ ...p, fullName: def.fullName || p.fullName, phone: def.phone, state: def.state, abujaZone: def.abujaZone ?? '' }));
        } else {
          setUseNewAddress(true); setSelectedAddressId('new');
        }
      })
      .catch(() => { setUseNewAddress(true); setSelectedAddressId('new'); });
  }, [session]);

  useEffect(() => {
    setForm(p => ({ ...p, fullName: session?.user?.name ?? p.fullName, email: session?.user?.email ?? p.email }));
  }, [session]);

  const handleSelectAddress = useCallback((addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    setForm(p => ({ ...p, phone: addr.phone, state: addr.state, abujaZone: addr.abujaZone ?? '', abujaArea: '' }));
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const checkStock = async () => {
    const res = await fetch('/api/products?' + new URLSearchParams({ ids: items.map(i => i.productId).join(',') }));
    if (!res.ok) return [];
    const available: { id: string; stock: number; name: string }[] = await res.json();
    const errors: typeof stockErrors = [];
    for (const item of items) {
      const p = available.find(a => a.id === item.productId);
      if (p && p.stock < item.quantity) errors.push({ name: item.name, available: p.stock, requested: item.quantity });
    }
    return errors;
  };

  const buildShipping = () => {
    const sel = savedAddresses.find(a => a.id === selectedAddressId);
    return sel && !useNewAddress
      ? { fullName: form.fullName, phone: sel.phone, streetAddress: sel.streetAddress, city: sel.city, state: isAbuja ? 'FCT - Abuja' : sel.state, abujaZone: isAbuja ? form.abujaZone : undefined }
      : { fullName: form.fullName, phone: form.phone, streetAddress: form.streetAddress, city: form.city, state: isAbuja ? 'FCT - Abuja' : form.state, abujaZone: isAbuja ? form.abujaZone : undefined };
  };

  const buildWhatsAppMessage = useCallback(() => {
    const sel = savedAddresses.find(a => a.id === selectedAddressId);
    const lines: string[] = ["Hi Fixam Africa! 👋 I'd like to order:\n"];
    items.forEach((item, i) => {
      lines.push(`${i + 1}. *${item.name}* × ${item.quantity}`);
      if (item.variation) lines.push(`   📐 Variant: ${item.variation}`);
      lines.push(`   💰 ${formatCurrency(item.price)} × ${item.quantity} = *${formatCurrency(item.price * item.quantity)}*`);
      if (item.imageUrl) lines.push(`   🖼️ ${item.imageUrl}`);
      lines.push('');
    });
    lines.push(`📦 Subtotal: ${formatCurrency(subtotal)}`);
    if (deliveryResult) {
      lines.push(`🚚 Delivery (${form.state}${form.abujaZone ? ` · ${form.abujaZone}` : ''}): ${formatCurrency(finalDeliveryFee)}`);
      lines.push(`💳 *Grand Total: ${formatCurrency(grandTotal)}*`);
    } else {
      lines.push(`💳 *Subtotal: ${formatCurrency(subtotal)}* (+ delivery TBD)`);
    }
    lines.push('');
    lines.push('📍 *Delivery Details:*');
    lines.push(`👤 Name: ${form.fullName}`);
    lines.push(`📞 Phone: ${form.phone || (sel?.phone ?? '')}`);
    if (form.streetAddress) lines.push(`🏠 Address: ${form.streetAddress}, ${form.city}, ${form.state}`);
    else if (sel?.streetAddress) lines.push(`🏠 Address: ${sel.streetAddress}, ${sel.city}, ${sel.state}`);
    else if (form.state) lines.push(`📍 State: ${form.state}${form.abujaZone ? ` · ${form.abujaZone}` : ''}`);
    if (form.notes) lines.push(`📝 Notes: ${form.notes}`);
    lines.push('\nPlease confirm my order. Thank you! 🙏');
    return lines.join('\n');
  }, [items, form, subtotal, deliveryResult, finalDeliveryFee, grandTotal, savedAddresses, selectedAddressId]);

  const handleWhatsAppCheckout = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!form.fullName.trim()) { toast.error('Please enter your full name'); return; }
    const phone = form.phone.trim() || savedAddresses.find(a => a.id === selectedAddressId)?.phone;
    if (!phone) { toast.error('Please enter your phone number'); return; }
    const num = (storeSettings?.whatsapp_number ?? '').replace(/\D/g, '');
    if (!num) { toast.error('WhatsApp not configured for this store'); return; }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(buildWhatsAppMessage())}`, '_blank');
  }, [form, storeSettings, buildWhatsAppMessage, savedAddresses, selectedAddressId]);

  const handleDeliveryNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.state) { toast.error('Please select your delivery state'); return; }
    if (isAbuja && !form.abujaZone) { toast.error('Please select your Abuja zone'); return; }
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
      items: items.map(i => ({ product_id: i.productId, product_name: i.name, product_image: i.imageUrl, quantity: i.quantity, price: i.price, variation: i.variation ?? null })),
      shippingAddress: shipping,
      subtotal, deliveryFee: finalDeliveryFee, total: grandTotal,
      customerEmail: form.email, customerName: form.fullName,
      customerPhone: form.phone || (savedAddresses.find(a => a.id === selectedAddressId)?.phone ?? ''),
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

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-black text-gray-900 mb-1">Cart is empty</h1>
          <p className="text-sm text-gray-500 mb-5">Add items before checking out.</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition">
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const locationFields = (showFull: boolean) => (
    <>
      {showFull && (
        <F label="Street Address" req wide>
          <input name="streetAddress" value={form.streetAddress} onChange={onChange} required placeholder="House no., street name" className={inp} />
        </F>
      )}
      {showFull && (
        <F label="City / Town" req>
          <input name="city" value={form.city} onChange={onChange} required className={inp} />
        </F>
      )}
      <F label="State" req>
        <SearchableSelect options={ALL_STATES} value={form.state}
          onChange={v => setForm(p => ({ ...p, state: v, abujaZone: '', abujaArea: '' }))}
          placeholder="Select state" searchPlaceholder="Search state…" />
      </F>
      {isAbuja && (
        <>
          <F label="Area Council / Zone" req>
            <SearchableSelect options={ABUJA_ZONE_NAMES} value={form.abujaZone}
              onChange={v => setForm(p => ({ ...p, abujaZone: v, abujaArea: '' }))}
              placeholder="Select zone" searchPlaceholder="Search zone…" />
          </F>
          {form.abujaZone && abujaAreas.length > 0 && (
            <F label="Area / District">
              <SearchableSelect options={abujaAreas} value={form.abujaArea}
                onChange={v => setForm(p => ({ ...p, abujaArea: v }))}
                placeholder="Select area" searchPlaceholder="Search area…" />
            </F>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-12 h-11 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-gray-700 transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-gray-700 font-semibold">Checkout</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Lock className="h-3 w-3" /> Secure checkout
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-5 items-start">

          {/* ═══ LEFT ═══ */}
          <div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => step === 2 && setStep(1)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step === 1 ? 'text-gray-900' : 'text-emerald-600 cursor-pointer hover:underline'}`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                  step > 1 ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'
                }`}>
                  {step > 1 ? <CheckCircle2 className="h-3 w-3" /> : '1'}
                </span>
                Delivery
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              <span className={`flex items-center gap-1.5 text-xs font-bold ${step === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                  step === 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
                }`}>2</span>
                Payment
              </span>
            </div>

            {/* ── STEP 1: DELIVERY ── */}
            {step === 1 && (
              <form id="delivery-form" onSubmit={handleDeliveryNext} noValidate>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">

                  {/* Contact */}
                  <div className="p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Contact</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <F label="Full Name" req>
                        <div className="relative">
                          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
                          <input name="fullName" value={form.fullName} onChange={onChange} required placeholder="Full name" className={`${inp} pl-8`} />
                        </div>
                      </F>
                      <F label="Phone" req>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
                          <input name="phone" type="tel" value={form.phone} onChange={onChange} required placeholder="08012345678" className={`${inp} pl-8`} />
                        </div>
                      </F>
                      <F label="Email" req wide>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
                          <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" className={`${inp} pl-8`} />
                        </div>
                      </F>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Delivery Address</p>

                    {session && savedAddresses.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {savedAddresses.map(addr => (
                          <label key={addr.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}>
                            <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => handleSelectAddress(addr)} className="accent-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-gray-800">{addr.fullName}</span>
                                {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">Default</span>}
                              </div>
                              <p className="text-xs text-gray-400 truncate">{addr.phone} · {addr.streetAddress}, {addr.city}, {addr.state}</p>
                            </div>
                          </label>
                        ))}
                        <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === 'new' ? 'border-primary bg-primary/5' : 'border-dashed border-gray-200 hover:border-gray-300'
                        }`}>
                          <input type="radio" name="address" checked={selectedAddressId === 'new'} onChange={() => { setSelectedAddressId('new'); setUseNewAddress(true); }} className="accent-primary" />
                          <span className="text-sm font-bold text-gray-500">+ Different address</span>
                        </label>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      {locationFields(useNewAddress || !session || savedAddresses.length === 0)}
                    </div>

                    {deliveryResult && (
                      <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-700">{formatCurrency(finalDeliveryFee)} delivery · {deliveryResult.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="p-4">
                    <F label="Order Notes (optional)">
                      <textarea name="notes" value={form.notes} onChange={onChange} rows={2}
                        placeholder="Call before delivery, leave at gate…"
                        className={`${inp} resize-none`} />
                    </F>
                  </div>

                </div>
              </form>
            )}

            {/* ── STEP 2: PAYMENT ── */}
            {step === 2 && (
              <form id="payment-form" onSubmit={handleSubmit}>

                {/* Delivery recap */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Delivering to</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{form.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {form.state}{form.abujaZone ? ` · ${form.abujaZone}` : ''}
                      {deliveryResult && <span className="text-emerald-600 font-semibold"> · {formatCurrency(finalDeliveryFee)}</span>}
                    </p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary font-bold hover:underline">Edit</button>
                </div>

                {/* Payment cards */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-3">
                  <div className="p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Choose Payment</p>
                    <div className="space-y-2">

                      <button type="button" onClick={() => setPaymentMethod('online')}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === 'online' ? 'border-gray-900 bg-gray-900' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === 'online' ? 'bg-white/15' : 'bg-gray-200'}`}>
                          <CreditCard className={`h-4 w-4 ${paymentMethod === 'online' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-black ${paymentMethod === 'online' ? 'text-white' : 'text-gray-800'}`}>Pay Online</p>
                          <p className={`text-xs ${paymentMethod === 'online' ? 'text-white/60' : 'text-gray-400'}`}>Card · bank transfer · USSD</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-white' : 'border-gray-300'}`}>
                          {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>

                      <button type="button" onClick={() => setPaymentMethod('pod')}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === 'pod' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === 'pod' ? 'bg-white/15' : 'bg-gray-200'}`}>
                          <Banknote className={`h-4 w-4 ${paymentMethod === 'pod' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-black ${paymentMethod === 'pod' ? 'text-white' : 'text-gray-800'}`}>Pay on Delivery</p>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${paymentMethod === 'pod' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>Popular</span>
                          </div>
                          <p className={`text-xs ${paymentMethod === 'pod' ? 'text-white/60' : 'text-gray-400'}`}>Cash at your door · no upfront payment</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'pod' ? 'border-white' : 'border-gray-300'}`}>
                          {paymentMethod === 'pod' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Errors */}
                  {(stockErrors.length > 0 || flwError) && (
                    <div className="p-4 space-y-2">
                      {stockErrors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span><strong>{err.name}</strong>: {err.available === 0 ? 'Out of stock' : `Only ${err.available} left`}</span>
                        </div>
                      ))}
                      {flwError && (
                        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span>{flwError}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </form>
            )}
          </div>

          {/* ═══ RIGHT: ORDER SUMMARY + CTAs ═══ */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Order · {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>

              <div className="space-y-2.5 mb-4 max-h-52 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={`${item.productId}:${item.variation}`} className="flex gap-2.5">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      {item.imageUrl
                        ? <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-0.5" />
                        : <div className="absolute inset-0 flex items-center justify-center text-lg text-gray-200">📦</div>
                      }
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                      {item.variation && <p className="text-[10px] text-gray-400">{item.variation}</p>}
                      <p className="text-xs font-black text-primary tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Delivery</span>
                  {deliveryResult
                    ? <span className="font-semibold tabular-nums">{formatCurrency(finalDeliveryFee)}</span>
                    : <span className="text-gray-400 italic">Select state</span>
                  }
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 mt-3 pt-3 mb-4">
                <span className="font-black text-gray-900">Total</span>
                <span className="font-black text-xl text-primary tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>

              {/* ── CTAs under order details ── */}
              {step === 1 ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppCheckout}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-black text-white transition-all active:scale-[0.98] hover:opacity-90"
                    style={{ background: '#25D366' }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Checkout on WhatsApp
                  </button>
                  <button
                    type="submit"
                    form="delivery-form"
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-black text-white bg-gray-900 hover:bg-gray-800 transition-all active:scale-[0.98]"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Pay Online
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">
                    WhatsApp — chat &amp; pay your way &nbsp;·&nbsp; Pay Online — card, bank, USSD
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="submit"
                    form="payment-form"
                    disabled={isLoading || !deliveryResult}
                    className={`w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 text-white ${
                      paymentMethod === 'pod' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {isLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                    ) : paymentMethod === 'pod' ? (
                      <><Banknote className="h-4 w-4" /> Place Order — Pay on Delivery</>
                    ) : (
                      <><Lock className="h-4 w-4" /> Pay {formatCurrency(grandTotal)} Securely</>
                    )}
                  </button>
                  {!deliveryResult && (
                    <p className="text-[11px] text-center text-gray-400">Go back to select your delivery state</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                {[
                  { icon: Banknote, text: 'Pay on Delivery' },
                  { icon: Lock, text: 'Secure Checkout' },
                  { icon: Truck, text: 'Fast Delivery' },
                  { icon: CheckCircle2, text: 'Genuine Products' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-[11px] text-gray-500">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile sticky — two buttons on step 1, total+action on step 2 */}
      <div className="fixed bottom-[58px] left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3">
        {step === 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleWhatsAppCheckout}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-black text-white"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handleDeliveryNext as any}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-black text-white bg-gray-900"
            >
              <Lock className="h-3.5 w-3.5" /> Pay Online
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 leading-none">Total</p>
              <p className="text-lg font-black text-primary tabular-nums">{formatCurrency(grandTotal)}</p>
            </div>
            <button
              onClick={handleSubmit as any}
              disabled={isLoading || !deliveryResult}
              className={`flex items-center gap-1.5 h-11 px-5 rounded-xl text-sm font-black text-white disabled:opacity-50 ${
                paymentMethod === 'pod' ? 'bg-emerald-600' : 'bg-gray-900'
              }`}
            >
              {isLoading ? 'Processing…' : paymentMethod === 'pod' ? 'Place Order' : `Pay ${formatCurrency(grandTotal)}`}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
