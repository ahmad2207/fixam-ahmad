export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { products, categories, inventoryBatches, stockReservations } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { InventoryTabsClient } from '@/components/admin/InventoryTabsClient';

export default async function AdminInventoryPage() {
  const [productRows, batchRows, activeReservations] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        stock: products.stock,
        price: products.price,
        costPrice: products.costPrice,
        isActive: products.isActive,
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
  ]);

  const outOfStock = productRows.filter((r) => r.stock === 0).length;
  const lowStock = productRows.filter((r) => r.stock > 0 && r.stock < 10).length;
  const totalUnits = productRows.reduce((s, r) => s + r.stock, 0);
  const inventoryValue = batchRows.reduce(
    (s, b) => s + Number(b.costPrice) * b.quantityAvailable,
    0,
  );

  const serializedBatches = batchRows.map((b) => ({
    ...b,
    createdAt: b.createdAt ? b.createdAt.toISOString() : null,
  }));

  const serializedReservations = activeReservations.map((r) => ({
    ...r,
    expiresAt: r.expiresAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{productRows.length} products tracked</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Units',      value: totalUnits,                    color: 'text-foreground',       border: 'border-border' },
          { label: 'Inventory Value',  value: formatCurrency(inventoryValue), color: 'text-emerald-600',     border: 'border-emerald-100' },
          { label: 'Out of Stock',     value: outOfStock,                    color: 'text-destructive',      border: 'border-red-100' },
          { label: 'Low Stock (<10)',  value: lowStock,                      color: 'text-amber-600',        border: 'border-amber-100' },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`bg-card rounded-2xl p-5 border shadow-sm ${border}`}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div>
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
      />
      </div>
    </div>
  );
}
