export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { products, categories, inventoryBatches, stockReservations, stockNotifications } from '@/db/schema';
import { eq, asc, isNull, count, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { InventoryTabsClient } from '@/components/admin/InventoryTabsClient';
import { DollarSign, AlertTriangle, TrendingDown, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AdminInventoryPage() {
  const [productRows, batchRows, activeReservations, [waitlistRow], waitlistRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        stock: products.stock,
        price: products.price,
        costPrice: products.costPrice,
        isActive: products.isActive,
        barcode: products.barcode,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.stock)),
    db
      .select({
        id: inventoryBatches.id,
        productId: inventoryBatches.productId,
        quantityAvailable: inventoryBatches.quantityAvailable,
        costPrice: inventoryBatches.costPrice,
        createdAt: inventoryBatches.createdAt,
        productName: products.name,
        productImage: products.imageUrl,
      })
      .from(inventoryBatches)
      .leftJoin(products, eq(inventoryBatches.productId, products.id))
      .orderBy(asc(inventoryBatches.createdAt)),
    db
      .select({
        id: stockReservations.id,
        checkoutId: stockReservations.checkoutId,
        productId: stockReservations.productId,
        quantity: stockReservations.quantity,
        expiresAt: stockReservations.expiresAt,
        productName: products.name,
      })
      .from(stockReservations)
      .leftJoin(products, eq(stockReservations.productId, products.id))
      .where(eq(stockReservations.status, 'active')),
    db.select({ total: count() }).from(stockNotifications).where(isNull(stockNotifications.notifiedAt)),
    db
      .select({
        id: stockNotifications.id,
        productId: stockNotifications.productId,
        name: stockNotifications.name,
        email: stockNotifications.email,
        phone: stockNotifications.phone,
        notifiedAt: stockNotifications.notifiedAt,
        createdAt: stockNotifications.createdAt,
        productName: products.name,
        productImage: products.imageUrl,
        productSlug: products.slug,
      })
      .from(stockNotifications)
      .leftJoin(products, eq(stockNotifications.productId, products.id))
      .orderBy(desc(stockNotifications.createdAt)),
  ]);

  const outOfStock     = productRows.filter((r) => r.stock === 0).length;
  const lowStock       = productRows.filter((r) => r.stock > 0 && r.stock < 10).length;
  const totalUnits     = productRows.reduce((s, r) => s + r.stock, 0);
  const pendingAlerts  = waitlistRow?.total ?? 0;
  const inventoryValue = batchRows.reduce((s, b) => s + Number(b.costPrice) * b.quantityAvailable, 0);

  const serializedBatches = batchRows.map((b) => ({
    ...b,
    createdAt: b.createdAt ? b.createdAt.toISOString() : null,
  }));

  const serializedReservations = activeReservations.map((r) => ({
    ...r,
    expiresAt: r.expiresAt.toISOString(),
  }));

  // Three things that need someone to act on them today — Inventory Value
  // (below) isn't in this set on purpose: it's a level, not an alert.
  const actionMetrics = [
    {
      label: 'Out of Stock',
      value: outOfStock,
      icon: AlertTriangle,
      bg: outOfStock > 0 ? 'bg-red-50' : 'bg-muted',
      text: outOfStock > 0 ? 'text-red-500' : 'text-muted-foreground',
    },
    {
      label: 'Low Stock',
      sub: 'under 10 units',
      value: lowStock,
      icon: TrendingDown,
      bg: lowStock > 0 ? 'bg-amber-50' : 'bg-muted',
      text: lowStock > 0 ? 'text-amber-600' : 'text-muted-foreground',
    },
    {
      label: 'Waitlist Alerts',
      value: pendingAlerts,
      icon: Bell,
      bg: pendingAlerts > 0 ? 'bg-violet-50' : 'bg-muted',
      text: pendingAlerts > 0 ? 'text-violet-600' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{productRows.length} products tracked across {batchRows.length} batches</p>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Inventory Value — the number this page exists to answer, so it
            gets a full-width card of its own rather than competing for space
            with the other stats. Set in the same ledger typeface (font-receipt)
            the POS terminal uses for money, so a Naira figure of any size —
            ₦84,213,500 or ₦8.4bn — always renders in full. */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-800/80 uppercase tracking-widest mb-2">
                Total Inventory Value
              </p>
              <p className="font-receipt font-bold text-emerald-900 tabular-nums leading-none text-[26px] sm:text-3xl lg:text-[34px] break-words">
                {formatCurrency(inventoryValue)}
              </p>
              <p className="text-xs text-emerald-800/70 mt-2.5">
                {totalUnits.toLocaleString()} units in stock across {batchRows.length} {batchRows.length === 1 ? 'batch' : 'batches'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-emerald-700" />
            </div>
          </div>
        </div>

        {/* Stock health — the things that need action */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border h-full">
            {actionMetrics.map(({ label, sub, value, icon: Icon, bg, text }) => (
              <div key={label} className="px-3 sm:px-4 py-4 sm:py-5 flex flex-col gap-2.5">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                  <Icon className={cn('h-3.5 w-3.5', text)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black text-foreground leading-none tabular-nums">{value.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5 leading-tight">{label}</p>
                  {sub && <p className="text-[10px] text-muted-foreground/70 leading-tight">{sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <InventoryTabsClient
        products={productRows.map((r) => ({
          ...r,
          stock: Number(r.stock),
          price: String(r.price),
          costPrice: String(r.costPrice),
          isActive: r.isActive ?? true,
          categoryName: r.categoryName ?? null,
        }))}
        batches={serializedBatches.map((b) => ({
          ...b,
          quantityAvailable: Number(b.quantityAvailable),
          costPrice: String(b.costPrice),
        }))}
        activeReservations={serializedReservations}
        waitlist={waitlistRows.map((w) => ({
          ...w,
          notifiedAt: w.notifiedAt ? w.notifiedAt.toISOString() : null,
          createdAt: w.createdAt ? w.createdAt.toISOString() : '',
          productName: w.productName ?? null,
          productImage: w.productImage ?? null,
          productSlug: w.productSlug ?? null,
        }))}
      />
    </div>
  );
}
