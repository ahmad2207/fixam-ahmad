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
    return products
      .filter((p) => p.isActive && (p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q)))
      .slice(0, 8);
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
      <div className="flex items-center gap-3">
        <Link href="/admin/receipts" className="text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Offline Receipt</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate a manual receipt for offline sales</p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-foreground mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Name', value: customerName, setter: setCustomerName, placeholder: 'Walk-in Customer' },
            { label: 'Email', value: customerEmail, setter: setCustomerEmail, placeholder: 'Optional' },
            { label: 'Phone', value: customerPhone, setter: setCustomerPhone, placeholder: 'Optional' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="text-sm font-semibold text-foreground">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-foreground mb-4">Items</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or barcode, and add products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex justify-between items-center text-sm"
                >
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="text-primary font-bold">{formatCurrency(Number(p.price))}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Search for products above to add items</p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3.5 bg-muted/30 border border-border rounded-xl">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 border border-border rounded-lg flex items-center justify-center hover:bg-secondary transition text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 border border-border rounded-lg flex items-center justify-center hover:bg-secondary transition text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="w-7 h-7 flex items-center justify-center text-destructive/60 hover:text-destructive transition ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-bold text-foreground w-24 text-right">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary & Submit */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground">Notes</label>
          <textarea
            placeholder="Any additional notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
          />
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between">
          <span className="font-bold text-foreground">Total</span>
          <span className="text-xl font-black text-primary">{formatCurrency(subtotal)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={items.length === 0 || isProcessing}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 shadow-sm shadow-primary/20"
        >
          {isProcessing ? 'Creating…' : 'Create Receipt'}
        </button>
      </div>
    </div>
  );
}
