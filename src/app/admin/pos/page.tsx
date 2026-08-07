'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import { isLikelyScannerBurst } from '@/lib/barcode';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';
import { printThermalReceipt } from '@/components/admin/ThermalReceiptPreview';
import { useStoreSetting } from '@/hooks/useStoreSettings';
import {
  Search, Plus, Minus, CheckCircle, ShoppingCart,
  X, Check, Banknote, Building2, CreditCard, Zap,
  ReceiptText, UserPlus, ChevronUp, ChevronDown, ScanLine, Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

// A dedicated USB/Bluetooth barcode scanner "types" its code into whatever's
// focused (or nothing), then usually sends a terminator key (Enter or Tab) —
// much faster than any human typist. If the gap between any two keystrokes
// exceeds this, the burst isn't a scan.
const SCAN_RESET_MS = 400;
// Many scanners are configured (or default) to send NO terminator key at all.
// If a fast burst goes quiet for this long with no Enter/Tab, treat the pause
// itself as "the scan is done" rather than waiting for a key that never comes.
const SCAN_IDLE_COMMIT_MS = 120;

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
  { value: 'cash',          label: 'Cash',          Icon: Banknote,   activeCls: 'bg-success/10 text-success border-success/40 ring-1 ring-success/20' },
  { value: 'bank_transfer', label: 'Bank Transfer', Icon: Building2,  activeCls: 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200' },
  { value: 'card_pos',      label: 'Card POS',      Icon: CreditCard, activeCls: 'bg-violet-50 text-violet-700 border-violet-300 ring-1 ring-violet-200' },
  { value: 'paystack',      label: 'Paystack',      Icon: Zap,        activeCls: 'bg-accent text-primary border-primary/40 ring-1 ring-primary/20' },
];

const QUICK_CASH = [500, 1000, 2000, 5000, 10000, 20000, 50000];

// True while a text field is actively focused — i.e. someone could genuinely be
// typing. When nothing editable has focus, a burst of characters landing on the
// page can only realistically be a scanner (a human can't "type" without a
// field to type into), so we can accept it without the strict speed check.
function isEditableFieldFocused() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

interface GeneralSettings {
  store_address: string;
  store_phone: string;
}

export default function POSPage() {
  const { data: products, isLoading } = useProducts();
  const { data: session }             = useSession();
  const { data: storeSettings }       = useStoreSetting<GeneralSettings>('general');
  const searchRef                     = useRef<HTMLInputElement>(null);

  // Always the logged-in admin — not a field anyone can accidentally overwrite.
  const salesRepName = session?.user?.name || 'Admin';

  const [search, setSearch]                 = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [catalogMode, setCatalogMode]       = useState(false); // explicit "browse everything" toggle
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [customer, setCustomer]             = useState({ name: '', phone: '' });
  const [notes, setNotes]                   = useState('');
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived]     = useState('');
  const [discountType, setDiscountType]     = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue]   = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [saleResult, setSaleResult]         = useState<SaleResult | null>(null);
  const [cartOpen, setCartOpen]             = useState(false);
  const [showScanner, setShowScanner]       = useState(false);
  const scanBufferRef = useRef({ chars: '', lastTime: 0, maxGap: 0 });
  const scanIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Momentary feedback: which line just landed on the tape, and — only for a
  // scan match — which shelf tile just lit up to confirm the machine found it.
  const [lastTouchedId, setLastTouchedId] = useState<string | null>(null);
  const [scanFlashId, setScanFlashId]     = useState<string | null>(null);

  // The main display shows only products actually scanned this sale (newest
  // first), not the full catalog — scannedOrder tracks that, in scan order.
  const [scannedOrder, setScannedOrder]         = useState<string[]>([]);
  const [mostRecentScanId, setMostRecentScanId] = useState<string | null>(null);

  // Inline editing state
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput]     = useState('');
  const [qtyEditing, setQtyEditing]     = useState<string | null>(null);
  const [qtyInput, setQtyInput]         = useState('');

  // Customer section toggle
  const [showCustomer, setShowCustomer] = useState(false);

  useEffect(() => {
    if (!lastTouchedId) return;
    const t = setTimeout(() => setLastTouchedId(null), 260);
    return () => clearTimeout(t);
  }, [lastTouchedId]);

  useEffect(() => {
    if (!scanFlashId) return;
    const t = setTimeout(() => setScanFlashId(null), 700);
    return () => clearTimeout(t);
  }, [scanFlashId]);

  // Press "/" to focus search, and detect barcode-scanner keystroke bursts anywhere on the page.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      const buf = scanBufferRef.current;
      const now = performance.now();

      const qualifiesAsScan = (code: string) =>
        isLikelyScannerBurst(code, buf.maxGap) || (code.length >= 4 && !isEditableFieldFocused());

      const commitIfScan = (code: string) => {
        if (qualifiesAsScan(code)) {
          scanStateRef.current.handleScannedCode(code);
          return true;
        }
        return false;
      };

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const gap = buf.chars ? now - buf.lastTime : 0;
        if (gap > SCAN_RESET_MS) { buf.chars = ''; buf.maxGap = 0; }
        else if (buf.chars) buf.maxGap = Math.max(buf.maxGap, gap);
        buf.chars += e.key;
        buf.lastTime = now;

        // Re-arm the idle-commit timer on every keystroke. If this is a real
        // scanner burst with no terminator configured, the next keystroke never
        // comes and this fires — a human's next keystroke always cancels it first.
        if (scanIdleTimerRef.current) clearTimeout(scanIdleTimerRef.current);
        const pending = buf.chars;
        scanIdleTimerRef.current = setTimeout(() => {
          scanIdleTimerRef.current = null;
          if (buf.chars === pending && commitIfScan(pending)) {
            buf.chars = ''; buf.maxGap = 0;
          }
        }, SCAN_IDLE_COMMIT_MS);
        return;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (scanIdleTimerRef.current) { clearTimeout(scanIdleTimerRef.current); scanIdleTimerRef.current = null; }
        const code = buf.chars;
        const looksLikeScan = qualifiesAsScan(code);
        buf.chars = ''; buf.maxGap = 0;

        if (looksLikeScan) {
          // Stop a stray Enter/Tab from clicking or focus-shifting whatever
          // element currently has focus.
          e.preventDefault();
          scanStateRef.current.handleScannedCode(code);
          return;
        }

        // Not scanner-speed, but the search box's current text exactly matches a
        // known barcode (e.g. typed manually off the box) — treat it the same way.
        // If it doesn't match, fall through untouched to the existing name-filter.
        if (e.key === 'Enter' && document.activeElement === searchRef.current) {
          const typed = scanStateRef.current.search.trim();
          if (scanStateRef.current.barcodeIndex.has(typed)) {
            scanStateRef.current.handleScannedCode(typed);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (scanIdleTimerRef.current) clearTimeout(scanIdleTimerRef.current);
    };
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
      if (q && !(p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q))) return false;
      if (activeCategory && p.category?.id !== activeCategory) return false;
      return true;
    });
  }, [products, search, activeCategory]);

  const productsById = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of products ?? []) m.set(p.id, p);
    return m;
  }, [products]);

  // Typing a search, picking a category, or explicitly switching to "All
  // Products" is a deliberate "look something up" action — that's when the
  // full catalog appears as a manual-add fallback (e.g. the scanner is down,
  // or a barcode won't scan). Otherwise the display only shows what's
  // actually been scanned this sale.
  const isBrowsing = catalogMode || search.trim().length > 0 || !!activeCategory;

  const scannedFeed = useMemo(
    () => scannedOrder.slice().reverse().map((id) => productsById.get(id)).filter(Boolean),
    [scannedOrder, productsById],
  );

  const displayed = isBrowsing ? filtered : scannedFeed;

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
    setLastTouchedId(product.id);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCart((p) => p.filter((i) => i.productId !== productId));
    else setCart((p) => p.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  // ── Barcode scanning (dedicated USB/Bluetooth scanner + camera) ──────────
  const barcodeIndex = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of products ?? []) if (p.barcode) m.set(p.barcode, p);
    return m;
  }, [products]);

  const handleScannedCode = (code: string) => {
    const product = barcodeIndex.get(code);
    if (product) {
      addToCart(product);
      setScanFlashId(product.id);
      setMostRecentScanId(product.id);
      setScannedOrder((prev) => prev.includes(product.id) ? prev : [...prev, product.id]);
      toast.success(`Scanned: ${product.name}`);
      setSearch('');
      searchRef.current?.focus();
    } else {
      toast.error(`Unknown barcode: ${code}`);
    }
  };

  // The global keydown listener below is registered once (empty deps) so it never
  // misses a keystroke mid-scan — it reads through this ref to stay non-stale.
  const scanStateRef = useRef({ barcodeIndex, search, handleScannedCode });
  scanStateRef.current = { barcodeIndex, search, handleScannedCode };

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
    setScannedOrder([]); setMostRecentScanId(null);
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
          salesRep: salesRepName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sale failed');
      setSaleResult({ receiptNumber: data.receiptNumber, orderId: data.orderId, receiptId: data.receiptId });

      // Print the receipt immediately — capture the sale's data now, before
      // clearCart() below resets it for the next customer.
      printThermalReceipt(
        {
          receiptNumber: data.receiptNumber,
          customerName: customer.name || null,
          customerPhone: customer.phone || null,
          subtotal: String(subtotal),
          deliveryFee: '0',
          total: String(total),
          paymentMethod,
          notes: notes || null,
          salesRep: salesRepName,
          items: JSON.stringify(cart.map((i) => ({ product_name: i.name, quantity: i.quantity, price: i.price }))),
          createdAt: new Date(),
          type: 'pos',
        },
        cart.map((i) => ({ product_name: i.name, quantity: i.quantity, price: i.price })),
        storeSettings?.store_address,
        storeSettings?.store_phone,
      );

      clearCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen — the finished ticket, torn off the roll ──────────────
  if (saleResult) {
    return (
      <div className="h-full flex items-center justify-center bg-background -m-6">
        <div className="pos-torn-top mt-3 bg-card rounded-b-3xl rounded-t-lg shadow-2xl border border-border p-12 text-center max-w-sm w-full mx-4">
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h2 className="font-display uppercase tracking-wide text-3xl font-bold mb-3 text-foreground">Sale Complete</h2>
          <div className="inline-block border-y border-dashed border-border py-3 px-6 mb-8">
            <p className="text-muted-foreground text-[11px] uppercase tracking-widest mb-1">Receipt #</p>
            <p className="font-receipt text-2xl font-bold text-primary tracking-wide">{saleResult.receiptNumber}</p>
          </div>
          <div className="flex gap-3 justify-center">
            {saleResult.receiptId && (
              <Link
                href={`/admin/receipts/${saleResult.receiptId}`}
                className="flex items-center gap-2 border-2 border-border rounded-2xl px-5 py-3 text-sm font-bold hover:bg-muted transition text-foreground"
              >
                <ReceiptText className="w-4 h-4" /> Receipt
              </Link>
            )}
            <button
              onClick={() => setSaleResult(null)}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl text-sm font-display uppercase tracking-wide font-bold hover:bg-primary/90 transition"
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

      {/* Header — the ticket stub */}
      <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-primary flex-shrink-0 bg-accent">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display uppercase tracking-wide text-sm text-foreground flex-shrink-0">Order</span>
          {totalItems > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center leading-none flex-shrink-0">
              {totalItems}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground truncate">· Sold by {salesRepName}</span>
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg hover:bg-destructive/10 transition"
            >
              Clear
            </button>
          )}
          <button onClick={() => setCartOpen(false)} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tear-line between the stub and the itemized body */}
      <div className="pos-perforation" />

      {/* ── Scrollable body: cart items + totals + payment + customer ── */}
      <div className="flex-1 overflow-y-auto bg-card min-h-0">
        {/* Cart items */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-muted-foreground mt-1">No items yet</p>
            <p className="text-xs text-muted-foreground/70">Tap a product, or scan a barcode, to start the ticket</p>
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-border">
            {cart.map((item) => (
              <div
                key={item.productId}
                className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors ${
                  item.productId === lastTouchedId ? 'animate-print-line' : ''
                }`}
              >

                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-xl border border-border bg-muted flex-shrink-0 overflow-hidden mt-0.5">
                  {item.imageUrl
                    ? <Image src={item.imageUrl} alt={item.name} width={44} height={44} className="w-full h-full object-contain p-0.5" />
                    : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">

                  {/* Row 1: name + line total */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
                    <p className="font-receipt text-sm font-bold text-foreground flex-shrink-0 tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Row 2: qty pill + unit price + remove */}
                  <div className="flex items-center gap-2">

                    {/* Qty pill stepper */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-muted active:bg-muted transition text-muted-foreground"
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
                          className="w-9 h-7 text-center text-xs font-receipt font-bold border-x border-border focus:outline-none focus:bg-accent bg-card text-primary"
                          autoFocus
                          onFocus={(e) => e.target.select()}
                        />
                      ) : (
                        <button
                          onClick={() => { setQtyEditing(item.productId); setQtyInput(String(item.quantity)); }}
                          className="w-9 h-7 border-x border-border text-sm font-receipt font-bold text-foreground hover:bg-accent hover:text-primary transition tabular-nums"
                          title="Click to type quantity"
                        >
                          {item.quantity}
                        </button>
                      )}

                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center hover:bg-muted active:bg-muted transition text-muted-foreground disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Unit price — click to edit */}
                    {editingPrice === item.productId ? (
                      <div className="flex items-center gap-1 bg-accent border border-primary/30 rounded-lg px-2 h-7 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground flex-shrink-0">₦</span>
                        <input
                          type="number" min={0}
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPrice(item.productId);
                            if (e.key === 'Escape') setEditingPrice(null);
                          }}
                          onBlur={() => commitPrice(item.productId)}
                          className="flex-1 min-w-0 text-xs font-receipt font-semibold focus:outline-none bg-transparent"
                          autoFocus
                          onFocus={(e) => e.target.select()}
                        />
                        <button onClick={() => commitPrice(item.productId)} className="flex-shrink-0 text-success">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPrice(item.productId); setPriceInput(String(item.price)); }}
                        className="flex items-center gap-1 h-7 text-xs font-receipt text-muted-foreground hover:text-foreground transition rounded-lg px-1.5 hover:bg-muted"
                        title="Click to adjust price"
                      >
                        <span>@ {formatCurrency(item.price)}</span>
                        {item.price !== item.originalPrice && (
                          <span className="text-[9px] font-sans bg-warning/25 text-foreground px-1 rounded font-bold">adj</span>
                        )}
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => updateQty(item.productId, 0)}
                      className="ml-auto w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition"
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

        {/* ── Totals — the running ledger, ending in the headline price ── */}
        <div className="px-4 pt-3.5 pb-3 bg-muted/50 border-t border-b border-border space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-receipt font-medium text-foreground tabular-nums">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount row */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-14 flex-shrink-0">Discount</span>
            <button
              onClick={() => setDiscountType((t) => t === 'percent' ? 'fixed' : 'percent')}
              className="w-8 h-7 border border-border rounded-lg text-[11px] font-bold text-muted-foreground bg-card hover:bg-muted transition flex-shrink-0"
            >
              {discountType === 'percent' ? '%' : '₦'}
            </button>
            <input
              type="number" min={0} placeholder="0" value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1 min-w-0 border border-border rounded-lg h-7 px-2 text-sm font-receipt focus:outline-none focus:ring-2 focus:ring-primary bg-card tabular-nums"
            />
            {discountAmount > 0 && (
              <span className="font-receipt text-sm font-bold text-success flex-shrink-0 tabular-nums">−{formatCurrency(discountAmount)}</span>
            )}
          </div>

          {/* Total — the one number that matters, given the shelf-tag treatment */}
          <div className="flex justify-between items-baseline pt-2 border-t border-border">
            <span className="font-display uppercase tracking-wide text-sm text-foreground">Total</span>
            <span className="font-display text-[30px] font-bold text-foreground leading-none tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="px-4 py-3 border-b border-border space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map(({ value, label, Icon, activeCls }) => (
              <button
                key={value}
                onClick={() => { setPaymentMethod(value); setCashReceived(''); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === value
                    ? activeCls
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40 bg-card hover:bg-muted/40'
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
                className="w-full border-2 border-border rounded-xl h-9 px-3 text-sm font-receipt font-semibold focus:outline-none focus:ring-2 focus:ring-success/40 focus:border-success bg-card tabular-nums"
              />
              {/* Quick presets */}
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {QUICK_CASH.filter((v) => v >= total).slice(0, 5).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCashReceived(String(v))}
                    className={`flex-shrink-0 font-receipt text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                      cashReceived === String(v)
                        ? 'bg-success/10 border-success/50 text-success'
                        : 'bg-card border-border text-muted-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    {formatCurrency(v)}
                  </button>
                ))}
              </div>
              {change !== null && (
                <div className={`flex justify-between text-sm font-bold rounded-xl px-3 py-2 ${
                  change >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  <span className="font-sans">Change</span>
                  <span className="font-receipt tabular-nums">{change >= 0 ? formatCurrency(change) : `Short ${formatCurrency(-change)}`}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer section (collapsible) */}
        <div className="border-b border-border">
          <button
            onClick={() => setShowCustomer((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <UserPlus className="w-3.5 h-3.5" />
              {customer.name ? customer.name : 'Customer & notes'}
              {customer.phone && <span className="text-muted-foreground/70 font-normal">· {customer.phone}</span>}
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
                  className="flex-1 border border-border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-card"
                />
                <input
                  placeholder="Phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
                  className="w-28 border border-border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-card"
                />
              </div>
              <input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-border rounded-lg h-8 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-card"
              />
            </div>
          )}
        </div>
      </div>{/* end scrollable body */}

      {/* ── Charge button — always pinned at bottom ── */}
      <div className="border-t border-border px-4 py-4 bg-card flex-shrink-0">
        <button
          onClick={handleSale}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full h-14 rounded-2xl transition-all
            bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="font-display uppercase tracking-wide text-[17px] font-bold">Processing…</span>
          ) : cart.length === 0 ? (
            <span className="font-display uppercase tracking-wide text-[17px] font-bold">Add items to begin</span>
          ) : (
            <>
              <span className="font-display uppercase tracking-wide text-[17px] font-bold">Charge</span>
              <span className="font-display text-[19px] font-bold tabular-nums">{formatCurrency(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden -m-6">

      {/* ── Left: Product catalog ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-secondary/40 min-w-0">

        {/* Search + category bar */}
        <div className="px-5 pt-5 pb-3 bg-card border-b border-border flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or barcode…"
                className="w-full pl-10 pr-12 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
              />
              <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 font-receipt select-none">
                /
              </kbd>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 bg-card transition"
              title="No handheld scanner? Scan with a device camera instead."
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          </div>

          {/* A handheld/USB scanner needs no button at all — it just "types" into
              the page. This button is only for scanning with a webcam/phone camera
              when there's no scanner hardware plugged in. */}
          <p className="text-[11px] text-muted-foreground/80 mt-1.5">
            Using a handheld scanner? Just click anywhere on this page, then scan — no button needed.
          </p>

          {/* Scanned feed vs. full catalog — an explicit way to see everything,
              not just what's been scanned so far (fallback if a scan fails). */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              onClick={() => { setCatalogMode(false); setActiveCategory(null); setSearch(''); }}
              className={`font-display uppercase tracking-wide text-[11px] px-3.5 py-1.5 rounded-full font-semibold transition ${
                !isBrowsing ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              Scanned
            </button>
            <button
              onClick={() => setCatalogMode(true)}
              className={`font-display uppercase tracking-wide text-[11px] px-3.5 py-1.5 rounded-full font-semibold transition ${
                isBrowsing ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              All Products
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 font-display uppercase tracking-wide text-[11px] px-4 py-1.5 rounded-full font-semibold transition ${
                  activeCategory === null ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                  className={`flex-shrink-0 font-display uppercase tracking-wide text-[11px] px-4 py-1.5 rounded-full font-semibold transition ${
                    activeCategory === cat.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden border border-border shadow-sm animate-pulse">
                  <div className="h-36 sm:h-44 bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-muted rounded-full w-1/3" />
                    <div className="h-3 bg-muted rounded-full" />
                    <div className="h-3 bg-muted rounded-full w-3/4" />
                    <div className="h-4 bg-muted rounded-full w-1/2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-20">
              {isBrowsing ? (
                <>
                  <Search className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No products match your search</p>
                </>
              ) : (
                <>
                  <ScanLine className="w-10 h-10 opacity-30" strokeWidth={1.5} />
                  <p className="font-display uppercase tracking-wide text-sm font-semibold text-foreground/70">Scan a product to begin</p>
                  <p className="text-xs text-muted-foreground/70">Or search by name or barcode above to add one manually</p>
                  <button
                    onClick={() => setCatalogMode(true)}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    Browse all products
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24 md:pb-0">
              {displayed.map((p) => {
                const inCart    = cartQtyMap[p.id] ?? 0;
                const price     = Number(p.price);
                const compareAt = Number(p.compareAtPrice ?? 0);
                const discount  = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
                const justScanned = p.id === scanFlashId;
                const isMostRecent = !isBrowsing && !justScanned && p.id === mostRecentScanId;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`group bg-card rounded-xl text-left border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full active:scale-[.97] ${
                      justScanned ? 'border-success/50 animate-scan-flash'
                        : isMostRecent ? 'border-primary/50 ring-2 ring-primary/25'
                        : inCart > 0 ? 'border-primary/40 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="relative h-36 sm:h-44 overflow-hidden bg-secondary/50 flex-shrink-0">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl} alt={p.name} fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted-foreground/40">📦</div>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-display uppercase tracking-wide font-bold px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                          -{discount}%
                        </span>
                      )}
                      {inCart > 0 && !justScanned && (
                        <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          {inCart}
                        </span>
                      )}
                      {justScanned && (
                        <span className="absolute top-2 right-2 bg-success text-success-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      {p.category?.name && (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 truncate">
                          {p.category.name}
                        </p>
                      )}
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1 mb-2">
                        {p.name}
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-display text-sm sm:text-base font-bold text-primary leading-none tabular-nums">
                            {formatCurrency(price)}
                          </span>
                          {compareAt > price && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground line-through leading-none tabular-nums">
                              {formatCurrency(compareAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{p.stock} in stock</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: order panel, visible from tablet width up ──────── */}
      <div className="hidden md:flex md:flex-col w-[340px] xl:w-[380px] bg-card border-l border-border flex-shrink-0 shadow-[-4px_0_20px_rgba(0,0,0,.04)] overflow-hidden">
        {orderPanel}
      </div>

      {/* ── Phone-only: floating cart button ─────────────────────── */}
      <button
        onClick={() => setCartOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 px-5 py-3.5 flex items-center gap-2.5 font-display uppercase tracking-wide font-bold text-sm"
      >
        <ShoppingCart className="w-4 h-4" />
        {totalItems > 0 ? `${totalItems} · ${formatCurrency(total)}` : 'Cart'}
      </button>

      {cartOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      )}

      {/* Phone-only bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300 overflow-hidden ${
          cartOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-muted rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          {orderPanel}
        </div>
      </div>

      {showScanner && (
        <BarcodeScannerModal
          onDetected={(code) => { setShowScanner(false); handleScannedCode(code); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
