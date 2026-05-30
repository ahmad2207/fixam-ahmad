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
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Total Units</p>
          <p className="text-2xl font-bold">{totalUnits}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Inventory Value</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(inventoryValue)}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">Low Stock (&lt;10)</p>
          <p className="text-2xl font-bold text-amber-600">{lowStock}</p>
        </div>
      </div>

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
  );
}
