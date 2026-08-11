export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { products, categories, inventoryBatches, stockReservations, stockNotifications } from '@/db/schema';
import { eq, asc, isNull, count, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { InventoryTabsClient } from '@/components/admin/InventoryTabsClient';
import { Package, DollarSign, AlertTriangle, TrendingDown, Bell } from 'lucide-react';
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

  const metrics = [
    {
      label: 'Total Units',
      value: totalUnits.toLocaleString(),
      icon: Package,
      accentBg: 'bg-primary/10',
      accentText: 'text-primary',
      border: 'border-l-4 border-l-primary',
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(inventoryValue),
      icon: DollarSign,
      accentBg: 'bg-emerald-50',
      accentText: 'text-emerald-600',
      border: 'border-l-4 border-l-emerald-500',
    },
    {
      label: 'Out of Stock',
      value: outOfStock.toString(),
      icon: AlertTriangle,
      accentBg: outOfStock > 0 ? 'bg-red-50' : 'bg-muted',
      accentText: outOfStock > 0 ? 'text-red-500' : 'text-muted-foreground',
      border: outOfStock > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-border',
    },
    {
      label: 'Low Stock (<10)',
      value: lowStock.toString(),
      icon: TrendingDown,
      accentBg: lowStock > 0 ? 'bg-amber-50' : 'bg-muted',
      accentText: lowStock > 0 ? 'text-amber-600' : 'text-muted-foreground',
      border: lowStock > 0 ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-border',
    },
    {
      label: 'Waitlist Alerts',
      value: pendingAlerts.toString(),
      icon: Bell,
      accentBg: pendingAlerts > 0 ? 'bg-violet-50' : 'bg-muted',
      accentText: pendingAlerts > 0 ? 'text-violet-600' : 'text-muted-foreground',
      border: pendingAlerts > 0 ? 'border-l-4 border-l-violet-500' : 'border-l-4 border-l-border',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{productRows.length} products tracked across {batchRows.length} batches</p>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map(({ label, value, icon: Icon, accentBg, accentText, border }) => (
          <div key={label} className={cn('bg-card rounded-2xl px-4 py-3.5 border border-border shadow-sm', border)}>
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 leading-tight">{label}</p>
                <p className="text-lg font-black text-foreground leading-none truncate">{value}</p>
              </div>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', accentBg)}>
                <Icon className={cn('h-3.5 w-3.5', accentText)} />
              </div>
            </div>
          </div>
        ))}
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
