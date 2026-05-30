'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCreateManualReceipt } from '@/hooks/useReceipts';
import { Search, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface LineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const { data: products = [] } = useProducts();
  const createReceipt = useCreateManualReceipt();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products.filter((p) => p.isActive && p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, search]);

  const addItem = (product: typeof products[0]) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1, stock: product.stock }];
    });
    setSearch('');
  };

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0)
    );
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    try {
      await createReceipt.mutateAsync({
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        items: items.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
        subtotal,
        deliveryFee: 0,
        total: subtotal,
        notes: notes || undefined,
      });
      toast.success('Receipt created');
      router.push('/admin/receipts');
    } catch {
      toast.error('Failed to create receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/receipts" className="text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create Offline Receipt</h1>
      </div>

      {/* Customer Details */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Name', value: customerName, setter: setCustomerName, placeholder: 'Walk-in Customer' },
            { label: 'Email', value: customerEmail, setter: setCustomerEmail, placeholder: 'Optional' },
            { label: 'Phone', value: customerPhone, setter: setCustomerPhone, placeholder: 'Optional' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-4">Items</h2>
        {/* Product search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search and add products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-primary font-bold">{formatCurrency(Number(p.price))}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Search for products above to add items</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 border rounded-lg flex items-center justify-center hover:bg-white transition">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 border rounded-lg flex items-center justify-center hover:bg-white transition">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 transition">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-bold w-24 text-right">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment & Summary */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <hr />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(subtotal)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={items.length === 0 || isProcessing}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isProcessing ? 'Creating...' : 'Create Receipt'}
        </button>
      </div>
    </div>
  );
}
