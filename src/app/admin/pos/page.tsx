'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import {
  Search, Plus, Minus, CheckCircle, ShoppingCart,
  X, Check, Banknote, Building2, CreditCard, Zap,
  ReceiptText, UserPlus, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

type PaymentMethod = 'cash' | 'bank_transfer' | 'card_pos' | 'paystack';
type DiscountType  = 'percent' | 'fixed';

interface CartItem {
  productId:     string;
  name:          string;
  price:         number;
  originalPrice: number;
  imageUrl:      string | null;
  quantity:      number;
  stock:         number;
}

interface SaleResult {
  receiptNumber: string;
  orderId:       string;
  receiptId:     string;
}

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  Icon: React.ElementType;
  activeCls: string;
}[] = [
  { value: 'cash',          label: 'Cash',         Icon: Banknote,   activeCls: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200' },
  { value: 'bank_transfer', label: 'Bank Transfer', Icon: Building2,  activeCls: 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200' },
  { value: 'card_pos',      label: 'Card POS',      Icon: CreditCard, activeCls: 'bg-violet-50 text-violet-700 border-violet-300 ring-1 ring-violet-200' },
  { value: 'paystack',      label: 'Paystack',      Icon: Zap,        activeCls: 'bg-orange-50 text-primary border-primary/40 ring-1 ring-primary/20' },
];

const QUICK_CASH = [500, 1000, 2000, 5000, 10000, 20000, 50000];

export default function POSPage() {
  const { data: products, isLoading } = useProducts();
  const { data: session }             = useSession();
  const searchRef                     = useRef<HTMLInputElement>(null);

  const [search, setSearch]                 = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [customer, setCustomer]             = useState({ name: '', phone: '' });
  const [notes, setNotes]                   = useState('');
  const [salesRep, setSalesRep]             = useState('');
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived]     = useState('');
  const [discountType, setDiscountType]     = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue]   = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [saleResult, setSaleResult]         = useState<SaleResult | null>(null);
  const [cartOpen, setCartOpen]             = useState(false);

  // Inline editing state
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput]     = useState('');
  const [qtyEditing, setQtyEditing]     = useState<string | null>(null);
  const [qtyInput, setQtyInput]         = useState('');

  // Customer section toggle
  const [showCustomer, setShowCustomer] = useState(false);

  // Sync salesRep from session once
  useEffect(() => {
    if (session?.user?.name && !salesRep) setSalesRep(session.user.name);
  }, [session]);

  // Press "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products ?? []) {
      if (p.category) seen.set(p.category.id, p.category.name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (products ?? []).filter((p) => {
      if (p.stock <= 0) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (activeCategory && p.category?.id !== activeCategory) return false;
      return true;
    });
  }, [products, search, activeCategory]);

  const cartQtyMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of cart) m[i.productId] = i.quantity;
    return m;
  }, [cart]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.stock) return prev;
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id, name: product.name,
        price: Number(product.price), originalPrice: Number(product.price),
        imageUrl: product.imageUrl, quantity: 1, stock: product.stock,
      }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCart((p) => p.filter((i) => i.productId !== productId));
    else setCart((p) => p.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const commitPrice = (productId: string) => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val >= 0)
      setCart((p) => p.map((i) => i.productId === productId ? { ...i, price: val } : i));
    setEditingPrice(null);
  };

  const commitQty = (productId: string) => {
    const val = parseInt(qtyInput, 10);
    const item = cart.find((i) => i.productId === productId);
    if (!isNaN(val) && val > 0 && item) updateQty(productId, Math.min(val, item.stock));
    else if (!isNaN(val) && val <= 0) updateQty(productId, 0);
    setQtyEditing(null);
  };

  const clearCart = () => {
    setCart([]); setCustomer({ name: '', phone: '' });
    setNotes(''); setCashReceived(''); setDiscountValue('');
    setShowCustomer(false);
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const discountAmount = useMemo(() => {
    const v = parseFloat(discountValue) || 0;
    if (v <= 0) return 0;
    if (discountType === 'percent') return Math.min(subtotal * (v / 100), subtotal);
    return Math.min(v, subtotal);
  }, [discountValue, discountType, subtotal]);

  const total           = subtotal - discountAmount;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change          = paymentMethod === 'cash' && cashReceivedNum > 0 ? cashReceivedNum - total : null;
  const totalItems      = cart.reduce((s, i) => s + i.quantity, 0);

  const handleSale = async () => {
    if (!cart.length) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.productId, name: i.name, imageUrl: i.imageUrl,
            price: i.price, quantity: i.quantity, variation: null,
          })),
          customerName: customer.name, customerPhone: customer.phone,
          subtotal, discountAmount, deliveryFee: 0, total,
          paymentMethod, notes,
          salesRep: salesRep || session?.user?.name || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sale failed');
      setSaleResult({ receiptNumber: data.receiptNumber, orderId: data.orderId, receiptId: data.receiptId });
      clearCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────
  if (saleResult) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 -m-6">
        <div className="bg-white rounded-3xl shadow-2xl border p-12 text-center max-w-sm w-full mx-4">
          <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black mb-1">Sale Complete</h2>
          <p className="text-gray-400 text-sm mb-1">Receipt #</p>
          <p className="font-mono text-2xl font-bold text-primary mb-8 tracking-wide">{saleResult.receiptNumber}</p>
          <div className="flex gap-3 justify-center">
            {saleResult.receiptId && (
              <Link
                href={`/admin/receipts/${saleResult.receiptId}`}
                className="flex items-center gap-2 border-2 border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold hover:bg-gray-50 transition text-gray-700"
              >
                <ReceiptText className="w-4 h-4" /> Receipt
              </Link>
            )}
            <button
              onClick={() => setSaleResult(null)}
              className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-primary/90 transition"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Order panel JSX (NOT a component — avoids remount on parent re-render) ──
  const orderPanel = (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top accent */}
      <div className="h-0.5 bg-primary flex-shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm text-gray-800 tracking-tight">Order</span>
          {totalItems > 0 && (
            <span className="bg-primary text-white text-[10px] font-black rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center leading-none">
              {totalItems}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Clear
            </button>
          )}
          <button onClick={() => setCartOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable body: cart items + totals + payment + customer ── */}
      <div className="flex-1 overflow-y-auto bg-white min-h-0">
        {/* Cart items */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <ShoppingCart className="w-10 h-10 text-gray-200" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-gray-400 mt-1">No items yet</p>
            <p className="text-xs text-gray-300">Tap any product on the left to add it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/70 transition-colors">

                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex-shrink-0 overflow-hidden mt-0.5">
                  {item.imageUrl
                    ? <Image src={item.imageUrl} alt={item.name} width={44} height={44} className="w-full h-full object-contain p-0.5" />
                    : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">

                  {/* Row 1: name + line total */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</p>
                    <p className="text-sm font-black text-gray-900 flex-shrink-0 tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Row 2: qty pill + unit price + remove */}
                  <div className="flex items-center gap-2">

                    {/* Qty pill stepper */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition text-gray-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      {qtyEditing === item.productId ? (
                        <input
                          type="number" min={1} max={item.stock}
                          value={qtyInput}
                          onChange={(e) => setQtyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Tab') commitQty(item.productId);
                            if (e.key === 'Escape') setQtyEditing(null);
                          }}
                          onBlur={() => commitQty(item.productId)}
                          className="w-9 h-7 text-center text-xs font-black border-x border-gray-200 focus:outline-none focus:bg-orange-50 bg-white text-primary"
                          autoFocus
                          onFocus={(e) => e.target.select()}
                        />
                      ) : (
                        <button
                          onClick={() => { setQtyEditing(item.productId); setQtyInput(String(item.quantity)); }}
                          className="w-9 h-7 border-x border-gray-200 text-sm font-black text-gray-900 hover:bg-orange-50 hover:text-primary transition tabular-nums"
                          title="Click to type quantity"
                        >
                          {item.quantity}
                        </button>
                      )}

                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition text-gray-500 disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Unit price — click to edit */}
                    {editingPrice === item.productId ? (
                      <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg px-2 h-7 flex-1 min-w-0">
                        <span className="text-xs text-gray-400 flex-shrink-0">₦</span>
                        <input
                          type="number" min={0}
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPrice(item.productId);
                            if (e.key === 'Escape') setEditingPrice(null);
                          }}
                          onBlur={() => commitPrice(item.productId)}
                          className="flex-1 min-w-0 text-xs font-semibold focus:outline-none bg-transparent"
                          autoFocus
                          onFocus={(e) => e.target.select()}
                        />
                        <button onClick={() => commitPrice(item.productId)} className="flex-shrink-0 text-emerald-600">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPrice(item.productId); setPriceInput(String(item.price)); }}
                        className="flex items-center gap-1 h-7 text-xs text-gray-400 hover:text-gray-700 transition group/price rounded-lg px-1.5 hover:bg-gray-100"
                        title="Click to adjust price"
                      >
                        <span>@ {formatCurrency(item.price)}</span>
                        {item.price !== item.originalPrice && (
                          <span className="text-[9px] bg-amber-100 text-amber-600 px-1 rounded font-bold">adj</span>
                        )}
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => updateQty(item.productId, 0)}
                      className="ml-auto w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                      title="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Totals ── */}
        <div className="px-4 pt-3.5 pb-3 bg-gray-50 border-t border-b space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700 tabular-nums">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount row */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-14 flex-shrink-0">Discount</span>
            <button
              onClick={() => setDiscountType((t) => t === 'percent' ? 'fixed' : 'percent')}
              className="w-8 h-7 border rounded-lg text-[11px] font-black text-gray-500 bg-white hover:bg-gray-100 transition flex-shrink-0"
            >
              {discountType === 'percent' ? '%' : '₦'}
            </button>
            <input
              type="number" min={0} placeholder="0" value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1 min-w-0 border rounded-lg h-7 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white tabular-nums"
            />
            {discountAmount > 0 && (
              <span className="text-sm font-bold text-emerald-600 flex-shrink-0 tabular-nums">−{formatCurrency(discountAmount)}</span>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-[28px] font-black text-gray-900 leading-none tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="px-4 py-3 border-b space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map(({ value, label, Icon, activeCls }) => (
              <button
                key={value}
                onClick={() => { setPaymentMethod(value); setCashReceived(''); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === value
                    ? activeCls
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Cash received */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <input
                type="number" placeholder="Cash received (₦)" value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full border-2 rounded-xl h-9 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white tabular-nums"
              />
              {/* Quick presets */}
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {QUICK_CASH.filter((v) => v >= total).slice(0, 5).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCashReceived(String(v))}
                    className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                      cashReceived === String(v)
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {formatCurrency(v)}
                  </button>
                ))}
              </div>
              {change !== null && (
                <div className={`flex justify-between text-sm font-bold rounded-xl px-3 py-2 tabular-nums ${
                  change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  <span>Change</span>
                  <span>{change >= 0 ? formatCurrency(change) : `Short ${formatCurrency(-change)}`}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer section (collapsible) */}
        <div className="border-b">
          <button
            onClick={() => setShowCustomer((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <UserPlus className="w-3.5 h-3.5" />
              {customer.name ? customer.name : 'Customer & notes'}
              {customer.phone && <span className="text-gray-400 font-normal">· {customer.phone}</span>}
            </span>
            {showCustomer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showCustomer && (
            <div className="px-4 pb-3 space-y-1.5">
              <div className="flex gap-2">
                <input
                  placeholder="Customer name"
                  value={customer.name}
                  onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1 border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                />
                <input
                  placeholder="Phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
                  className="w-28 border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                />
              </div>
              <input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              />
              <input
                placeholder="Sales rep"
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                className="w-full border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white text-gray-500"
              />
            </div>
          )}
        </div>
      </div>{/* end scrollable body */}

      {/* ── Charge button — always pinned at bottom ── */}
      <div className="border-t px-4 py-4 bg-white flex-shrink-0">
        <button
          onClick={handleSale}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full h-14 rounded-2xl font-black text-[17px] tracking-tight transition-all
            bg-primary text-white hover:bg-primary/90 active:scale-[.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-lg shadow-primary/25"
        >
          {isSubmitting ? 'Processing…' : cart.length === 0 ? 'Add items to begin' : `Charge ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden -m-6">

      {/* ── Left: Product catalog ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-w-0">

        {/* Search + category bar */}
        <div className="px-5 pt-5 pb-3 bg-white border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-10 pr-12 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center text-[10px] text-gray-400 bg-gray-100 border rounded px-1.5 py-0.5 font-mono select-none">
              /
            </kbd>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 text-xs px-4 py-1.5 rounded-full font-semibold transition ${
                  activeCategory === null ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                  className={`flex-shrink-0 text-xs px-4 py-1.5 rounded-full font-semibold transition ${
                    activeCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                  <div className="h-36 sm:h-44 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded-full w-1/3" />
                    <div className="h-3 bg-gray-200 rounded-full" />
                    <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-200 rounded-full w-1/2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 py-20">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">
                {search || activeCategory ? 'No products match your search' : 'No products available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 lg:pb-0">
              {filtered.map((p) => {
                const inCart    = cartQtyMap[p.id] ?? 0;
                const price     = Number(p.price);
                const compareAt = Number(p.compareAtPrice ?? 0);
                const discount  = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`group bg-white rounded-xl text-left border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full active:scale-[.97] ${
                      inCart > 0 ? 'border-primary/40 ring-1 ring-primary/20' : 'border-gray-100 hover:border-primary/20'
                    }`}
                  >
                    <div className="relative h-36 sm:h-44 overflow-hidden bg-gray-50 flex-shrink-0">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl} alt={p.name} fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200">📦</div>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white font-bold px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                          -{discount}%
                        </span>
                      )}
                      {inCart > 0 && (
                        <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          {inCart}
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      {p.category?.name && (
                        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 truncate">
                          {p.category.name}
                        </p>
                      )}
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1 mb-2">
                        {p.name}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-extrabold text-primary leading-none tabular-nums">
                            {formatCurrency(price)}
                          </span>
                          {compareAt > price && (
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through leading-none tabular-nums">
                              {formatCurrency(compareAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{p.stock} in stock</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Desktop order panel ───────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col w-[340px] xl:w-[380px] bg-white border-l flex-shrink-0 shadow-[-4px_0_20px_rgba(0,0,0,.04)] overflow-hidden">
        {orderPanel}
      </div>

      {/* ── Mobile: floating cart button ─────────────────────────── */}
      <button
        onClick={() => setCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 px-5 py-3.5 flex items-center gap-2.5 font-bold text-sm"
      >
        <ShoppingCart className="w-4 h-4" />
        {totalItems > 0 ? `${totalItems} · ${formatCurrency(total)}` : 'Cart'}
      </button>

      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      )}

      {/* Mobile bottom sheet */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300 overflow-hidden ${
          cartOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          {orderPanel}
        </div>
      </div>
    </div>
  );
}
