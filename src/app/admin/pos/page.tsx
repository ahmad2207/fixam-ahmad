'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle, ExternalLink, ShoppingCart, X, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type PaymentMethod = 'cash' | 'bank_transfer' | 'card_pos' | 'flutterwave';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
  variation: string | null;
}

interface SaleResult {
  receiptNumber: string;
  orderId: string;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card_pos', label: 'Card POS' },
  { value: 'flutterwave', label: 'Flutterwave' },
];

export default function POSPage() {
  const { data: products, isLoading } = useProducts();
  const { data: session } = useSession();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [salesRep, setSalesRep] = useState((session?.user?.name) ?? '');
  const [cashReceived, setCashReceived] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const filtered = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0,
  ) ?? [];

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.stock) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          originalPrice: Number(product.price),
          imageUrl: product.imageUrl,
          quantity: 1,
          stock: product.stock,
          variation: null,
        },
      ];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.productId !== productId));
    else setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const startEditPrice = (item: CartItem) => {
    setEditingPrice(item.productId);
    setPriceInput(String(item.price));
  };

  const commitPrice = (productId: string) => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val >= 0) {
      setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, price: val } : i));
    }
    setEditingPrice(null);
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'cash' && cashReceivedNum > 0 ? cashReceivedNum - subtotal : null;

  const handleSale = async () => {
    if (!cart.length) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            imageUrl: i.imageUrl,
            price: i.price,
            quantity: i.quantity,
            variation: i.variation,
          })),
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          subtotal,
          deliveryFee: 0,
          total: subtotal,
          paymentMethod,
          notes,
          salesRep: salesRep || session?.user?.name || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sale failed');
      setSaleResult({ receiptNumber: data.receiptNumber, orderId: data.orderId });
      setCart([]);
      setCustomer({ name: '', phone: '', email: '' });
      setNotes('');
      setCashReceived('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewSale = () => {
    setSaleResult(null);
  };

  // Success State
  if (saleResult) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border rounded-2xl p-10 text-center max-w-sm w-full shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sale Complete!</h2>
          <p className="text-gray-500 mb-1 text-sm">Receipt Number</p>
          <p className="font-mono text-lg font-bold text-primary mb-6">{saleResult.receiptNumber}</p>
          <div className="flex gap-3 justify-center">
            {saleResult.orderId && (
              <Link
                href={`/admin/orders/${saleResult.orderId}`}
                className="flex items-center gap-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition"
              >
                <ExternalLink className="w-4 h-4" />
                View Receipt
              </Link>
            )}
            <button
              onClick={startNewSale}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const CartPanel = () => (
    <>
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold">Current Sale</h2>
        <button onClick={() => setCartOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No items added</p>
        )}
        {cart.map((item) => (
          <div key={item.productId} className="text-sm border rounded-lg p-2 space-y-1.5">
            <div className="flex items-start justify-between gap-1">
              <p className="font-medium truncate flex-1">{item.name}</p>
              <button onClick={() => updateQty(item.productId, 0)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Price row */}
            <div className="flex items-center gap-1">
              {editingPrice === item.productId ? (
                <>
                  <span className="text-xs text-gray-400">₦</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitPrice(item.productId); if (e.key === 'Escape') setEditingPrice(null); }}
                    className="w-20 border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <button onClick={() => commitPrice(item.productId)} className="text-emerald-600 hover:text-emerald-800">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingPrice(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-primary text-xs font-semibold">{formatCurrency(item.price)}</span>
                  {item.price !== item.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">{formatCurrency(item.originalPrice)}</span>
                  )}
                  {item.price !== item.originalPrice && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">Adj.</span>
                  )}
                  <button onClick={() => startEditPrice(item)} className="text-gray-400 hover:text-gray-600 ml-1">
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Qty row */}
            <div className="flex items-center gap-1">
              <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-5 h-5 rounded border flex items-center justify-center hover:bg-gray-100">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
              <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-5 h-5 rounded border flex items-center justify-center hover:bg-gray-100" disabled={item.quantity >= item.stock}>
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-xs text-gray-400 ml-1">= {formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t space-y-3">
        <input
          placeholder="Customer name (optional)"
          value={customer.name}
          onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
          className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          placeholder="Phone (optional)"
          value={customer.phone}
          onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
          className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          placeholder="Sales rep name"
          value={salesRep}
          onChange={(e) => setSalesRep(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div>
          <p className="text-xs text-gray-500 mb-1.5 font-medium">Payment Method</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={`text-xs py-1.5 px-2 rounded-lg border transition ${
                  paymentMethod === pm.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === 'cash' && (
          <div>
            <input
              type="number"
              placeholder="Cash received"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {change !== null && (
              <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                Change: {formatCurrency(change)}
              </p>
            )}
          </div>
        )}

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />

        <div className="flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <button
          onClick={handleSale}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          {isSubmitting ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-full flex gap-4">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start pb-20 lg:pb-0">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white border rounded-xl p-3 text-left hover:border-primary/60 hover:shadow-sm transition"
              >
                <p className="text-sm font-medium line-clamp-2 mb-1">{p.name}</p>
                <p className="text-primary font-bold text-sm">{formatCurrency(Number(p.price))}</p>
                <p className="text-xs text-gray-400 mt-0.5">Stock: {p.stock}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Cart Panel */}
      <div className="hidden lg:flex w-80 flex-col bg-white border rounded-xl overflow-hidden flex-shrink-0">
        <CartPanel />
      </div>

      {/* Mobile Floating Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-2 font-semibold text-sm"
      >
        <ShoppingCart className="w-5 h-5" />
        Cart
        {totalItems > 0 && (
          <span className="bg-white text-primary text-xs font-bold rounded-full px-2 py-0.5 ml-0.5">
            {totalItems}
          </span>
        )}
      </button>

      {/* Mobile Bottom Sheet Backdrop */}
      {cartOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Mobile Bottom Sheet */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ${
          cartOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <CartPanel />
      </div>
    </div>
  );
}
