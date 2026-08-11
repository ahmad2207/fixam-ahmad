import { db } from '@/lib/db';
import {
  inventoryBatches,
  batchAllocations,
  stockReservations,
  orderItems,
  products,
  pendingCheckouts,
} from '@/db/schema';
import { eq, and, gt, asc, sql, inArray } from 'drizzle-orm';
import { calculateDeliveryFee } from '@/lib/deliveryFees';
import { getDeliveryConfigFromDb } from '@/lib/deliveryConfigServer';

// Shared executor type: either the plain `db` connection or an active
// transaction handle (from db.transaction(async (tx) => ...)). Any function
// here that might run inside a caller's transaction MUST thread this through
// consistently rather than falling back to the plain `db` — this pool is
// configured with max: 1 (a single connection, total), so a transaction
// that internally calls a helper using the plain `db` deadlocks: the
// transaction holds the pool's only connection and then blocks forever
// waiting for a second one to run the helper's query on, a connection that
// can never free up until the transaction itself finishes. Confirmed this
// exact deadlock live once already (see git history) — every new function
// added here needs to avoid repeating it.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

// ─── Validate & Price Checkout Items ───────────────────────────────────────
// The client can only choose WHAT to buy — never at what price. This
// recomputes subtotal/delivery fee/total from the live products table and
// the delivery-fee calculator, ignoring whatever price/subtotal/total the
// client submitted. Call this before ever creating a pendingCheckout row or
// a Paystack charge; use ONLY the values this returns downstream.
export interface RawCheckoutItem {
  product_id: string;
  quantity: number;
  variation?: string | null;
}

export interface PricedCheckoutItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  variation: string | null;
}

export interface PricedCheckout {
  items: PricedCheckoutItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export async function priceCheckoutItems(
  rawItems: RawCheckoutItem[],
  shippingState: string,
  abujaZone?: string,
): Promise<PricedCheckout> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Your cart is empty');
  }

  const ids = rawItems.map((i) => i?.product_id).filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (ids.length !== rawItems.length) {
    throw new Error('One of the items in your cart is invalid');
  }

  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((p) => [p.id, p]));

  const items: PricedCheckoutItem[] = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('One of the items in your cart has an invalid quantity');
    }

    const product = byId.get(raw.product_id);
    if (!product || !product.isActive) {
      throw new Error(`"${product?.name ?? raw.product_id}" is no longer available`);
    }
    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} of "${product.name}" left in stock`);
    }

    const price = Number(product.price);
    subtotal += price * quantity;
    items.push({
      product_id: product.id,
      product_name: product.name,
      product_image: product.imageUrl,
      quantity,
      price,
      variation: raw.variation ?? null,
    });
  }

  if (!shippingState) {
    throw new Error('Delivery state is required');
  }

  const deliveryConfig = await getDeliveryConfigFromDb();
  const { fee: deliveryFee } = calculateDeliveryFee(shippingState, subtotal, abujaZone, deliveryConfig);
  const total = subtotal + deliveryFee;

  return { items, subtotal, deliveryFee, total };
}

// ─── Add Inventory Batch ────────────────────────────────────────────────────
// Adds stock at a given cost price and updates products.stock atomically.
export async function addInventoryBatch(
  productId: string,
  quantity: number,
  costPrice: number,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(inventoryBatches)
      .values({ productId, quantityAvailable: quantity, costPrice: String(costPrice) })
      .returning({ id: inventoryBatches.id });

    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${quantity}` })
      .where(eq(products.id, productId));

    return batch.id;
  });
}

// ─── Sync Product Stock From Batches ───────────────────────────────────────
// Recalculates products.stock as the sum of all batch quantities.
// Call after any manual batch edit or delete.
//
// Pass `tx` when calling this from inside an active transaction — see the
// DbOrTx comment above for why this matters with this pool's max: 1 config.
export async function syncProductStockFromBatches(productId: string, tx?: DbOrTx): Promise<number> {
  const executor = tx ?? db;
  const result = await executor
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.quantityAvailable}), 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .then((r) => r[0]?.total ?? 0);

  await executor
    .update(products)
    .set({ stock: result })
    .where(eq(products.id, productId));

  return result;
}

export interface RestoredStockLine {
  productId: string;
  productName: string;
  quantityRestored: number;
  exact: boolean; // false when restored via a new compensating batch rather than the original one(s)
}

// ─── Restore Stock For Order ───────────────────────────────────────────────
// Reverses the inventory deduction for every item on an order — call this
// when an order is cancelled or deleted, before the order/its rows are
// touched (so order_items/batch_allocations are still readable).
//
// Two cases per item:
//  - It has batch_allocations rows (online orders — created by
//    consumeStockReservationsForOrder): restore each allocation's exact
//    quantity back to the exact batch it came from. Precise.
//  - It has none (POS sales — deductPOSInventory never records
//    batch_allocations; POS COGS is estimated separately, see that
//    function's own comment): we know the product and quantity but not
//    which original batch it was drawn from, so create a new compensating
//    batch for that quantity instead, using the product's own cost price
//    as the best available estimate (same approach used for the one-time
//    inventory reconciliation).
//
// Pass `tx` when calling this from inside an active transaction.
export async function restoreStockForOrder(
  orderId: string,
  reason: string,
  tx?: DbOrTx,
): Promise<RestoredStockLine[]> {
  const executor = tx ?? db;

  const items = await executor.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  if (!items.length) return [];

  const itemIds = items.map((i) => i.id);
  const allocations = await executor
    .select()
    .from(batchAllocations)
    .where(inArray(batchAllocations.orderItemId, itemIds));

  const allocByItem = new Map<string, typeof allocations>();
  for (const a of allocations) {
    if (!allocByItem.has(a.orderItemId)) allocByItem.set(a.orderItemId, []);
    allocByItem.get(a.orderItemId)!.push(a);
  }

  const results: RestoredStockLine[] = [];
  const touchedProductIds = new Set<string>();

  for (const item of items) {
    // productId is nullable (set null if the product itself was later
    // deleted) — nothing real to restore stock into in that case.
    if (!item.productId) continue;

    const itemAllocations = allocByItem.get(item.id) ?? [];

    if (itemAllocations.length > 0) {
      for (const alloc of itemAllocations) {
        await executor
          .update(inventoryBatches)
          .set({ quantityAvailable: sql`${inventoryBatches.quantityAvailable} + ${alloc.quantity}` })
          .where(eq(inventoryBatches.id, alloc.batchId));
      }
    } else {
      const [product] = await executor
        .select({ costPrice: products.costPrice })
        .from(products)
        .where(eq(products.id, item.productId));

      await executor.insert(inventoryBatches).values({
        productId: item.productId,
        quantityAvailable: item.quantity,
        costPrice: product?.costPrice ?? '0',
        notes: reason,
      });
    }

    touchedProductIds.add(item.productId);
    results.push({
      productId: item.productId,
      productName: item.productName,
      quantityRestored: item.quantity,
      exact: itemAllocations.length > 0,
    });
  }

  for (const productId of touchedProductIds) {
    await syncProductStockFromBatches(productId, executor);
  }

  return results;
}

// Extracted so deductPOSInventory can either run standalone (opening its own
// transaction, the original self-contained behavior) or participate in a
// caller-supplied transaction — needed by the POS sale route, which wraps
// order creation + every item's deduction + the receipt in one atomic unit.
// Nesting a second top-level db.transaction() inside that outer one would
// NOT actually be atomic with it: a failure on item 3 would still leave
// items 1-2's deductions permanently committed.
async function deductPOSInventoryInner(
  tx: DbOrTx,
  productId: string,
  quantity: number,
): Promise<boolean> {
  const batches = await tx
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.productId, productId),
        gt(inventoryBatches.quantityAvailable, 0),
      ),
    )
    .orderBy(asc(inventoryBatches.createdAt));

  let remaining = quantity;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const deduct = Math.min(batch.quantityAvailable, remaining);
    await tx
      .update(inventoryBatches)
      .set({ quantityAvailable: batch.quantityAvailable - deduct })
      .where(eq(inventoryBatches.id, batch.id));

    remaining -= deduct;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock for product ${productId} — needed ${quantity}, only ${quantity - remaining} available in real inventory batches.`,
    );
  }

  // Sync product stock
  const newStock = await tx
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.quantityAvailable}), 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .then((r) => r[0]?.total ?? 0);

  await tx
    .update(products)
    .set({ stock: newStock })
    .where(eq(products.id, productId));

  return true;
}

// ─── Deduct POS Inventory (FIFO) ───────────────────────────────────────────
// Deducts stock from the oldest batches first for a POS sale.
// Does NOT create batch_allocations (POS COGS is estimated separately).
//
// Pass `tx` (the transaction handle from an outer db.transaction(async (tx)
// => ...)) when this needs to be atomic with other writes in the same
// operation — e.g. the POS sale route. Omit it to run standalone in its own
// self-contained transaction, as before.
export async function deductPOSInventory(
  productId: string,
  quantity: number,
  tx?: DbOrTx,
): Promise<boolean> {
  if (tx) return deductPOSInventoryInner(tx, productId, quantity);
  return db.transaction((innerTx) => deductPOSInventoryInner(innerTx, productId, quantity));
}

// ─── Create Stock Reservations ─────────────────────────────────────────────
// FIFO-locks inventory for a pending checkout (called before Paystack redirect).
export async function createStockReservations(
  checkoutId: string,
  ttlMinutes: number = 30,
): Promise<number> {
  return db.transaction(async (tx) => {
    const checkout = await tx
      .select()
      .from(pendingCheckouts)
      .where(eq(pendingCheckouts.id, checkoutId))
      .limit(1)
      .then((r) => r[0]);

    if (!checkout) throw new Error('Checkout not found');

    const items = checkout.items as Array<{
      product_id: string;
      quantity: number;
    }>;

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    let totalReserved = 0;

    for (const item of items) {
      const batches = await tx
        .select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.productId, item.product_id),
            gt(inventoryBatches.quantityAvailable, 0),
          ),
        )
        .orderBy(asc(inventoryBatches.createdAt));

      let remaining = item.quantity;

      for (const batch of batches) {
        if (remaining <= 0) break;

        const reserve = Math.min(batch.quantityAvailable, remaining);

        await tx
          .update(inventoryBatches)
          .set({ quantityAvailable: batch.quantityAvailable - reserve })
          .where(eq(inventoryBatches.id, batch.id));

        await tx.insert(stockReservations).values({
          checkoutId,
          productId: item.product_id,
          batchId: batch.id,
          quantity: reserve,
          costPrice: batch.costPrice,
          expiresAt,
          status: 'active',
        });

        remaining -= reserve;
        totalReserved += reserve;
      }

      if (remaining > 0) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }
    }

    // Sync product stocks
    const productIds = [...new Set(items.map((i) => i.product_id))];
    for (const pid of productIds) {
      const newStock = await tx
        .select({ total: sql<number>`coalesce(sum(${inventoryBatches.quantityAvailable}), 0)` })
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, pid))
        .then((r) => r[0]?.total ?? 0);

      await tx.update(products).set({ stock: newStock }).where(eq(products.id, pid));
    }

    return totalReserved;
  });
}

// ─── Consume Stock Reservations For Order ─────────────────────────────────
// Converts reservations → order_items + batch_allocations after payment succeeds.
export async function consumeStockReservationsForOrder(
  checkoutId: string,
  orderId: string,
): Promise<number> {
  return db.transaction(async (tx) => {
    const reservations = await tx
      .select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.checkoutId, checkoutId),
          eq(stockReservations.status, 'active'),
        ),
      );

    if (!reservations.length) return 0;

    const checkout = await tx
      .select()
      .from(pendingCheckouts)
      .where(eq(pendingCheckouts.id, checkoutId))
      .limit(1)
      .then((r) => r[0]);

    if (!checkout) return 0;

    const checkoutItems = checkout.items as Array<{
      product_id: string;
      product_name: string;
      product_image: string | null;
      quantity: number;
      price: number;
      variation: string | null;
    }>;

    let consumed = 0;

    for (const item of checkoutItems) {
      const itemReservations = reservations.filter(
        (r) => r.productId === item.product_id,
      );
      if (!itemReservations.length) continue;

      const [orderItem] = await tx
        .insert(orderItems)
        .values({
          orderId,
          productId: item.product_id,
          productName: item.product_name,
          productImage: item.product_image,
          quantity: item.quantity,
          price: String(item.price),
          variation: item.variation,
          fromReservation: true,
        })
        .returning({ id: orderItems.id });

      for (const reservation of itemReservations) {
        await tx.insert(batchAllocations).values({
          orderItemId: orderItem.id,
          batchId: reservation.batchId,
          quantity: reservation.quantity,
          costPriceAtTime: reservation.costPrice,
        });

        await tx
          .update(stockReservations)
          .set({ status: 'consumed', consumedOrderItemId: orderItem.id })
          .where(eq(stockReservations.id, reservation.id));

        consumed += reservation.quantity;
      }
    }

    return consumed;
  });
}

// ─── Release Stock Reservations ───────────────────────────────────────────
// Returns reserved stock to batches when payment fails or is cancelled.
export async function releaseStockReservations(checkoutId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const reservations = await tx
      .select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.checkoutId, checkoutId),
          eq(stockReservations.status, 'active'),
        ),
      );

    let released = 0;

    for (const r of reservations) {
      await tx
        .update(inventoryBatches)
        .set({ quantityAvailable: sql`${inventoryBatches.quantityAvailable} + ${r.quantity}` })
        .where(eq(inventoryBatches.id, r.batchId));

      await tx
        .update(stockReservations)
        .set({ status: 'released' })
        .where(eq(stockReservations.id, r.id));

      released += r.quantity;
    }

    // Sync product stocks
    const productIds = [...new Set(reservations.map((r) => r.productId))];
    for (const pid of productIds) {
      const newStock = await tx
        .select({ total: sql<number>`coalesce(sum(${inventoryBatches.quantityAvailable}), 0)` })
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, pid))
        .then((r) => r[0]?.total ?? 0);

      await tx.update(products).set({ stock: newStock }).where(eq(products.id, pid));
    }

    return released;
  });
}

// ─── Expire Stock Reservations ────────────────────────────────────────────
// Called by a cron job to clean up expired reservations.
export async function expireStockReservations(): Promise<number> {
  const expired = await db
    .select()
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.status, 'active'),
        sql`${stockReservations.expiresAt} < now()`,
      ),
    );

  let count = 0;

  for (const r of expired) {
    await db
      .update(inventoryBatches)
      .set({ quantityAvailable: sql`${inventoryBatches.quantityAvailable} + ${r.quantity}` })
      .where(eq(inventoryBatches.id, r.batchId));

    await db
      .update(stockReservations)
      .set({ status: 'expired' })
      .where(eq(stockReservations.id, r.id));

    count++;
  }

  // Sync stocks for affected products
  const productIds = [...new Set(expired.map((r) => r.productId))];
  for (const pid of productIds) {
    await syncProductStockFromBatches(pid);
  }

  return count;
}

// ─── Generate Receipt Number ───────────────────────────────────────────────
export async function generateReceiptNumber(): Promise<string> {
  const { receipts } = await import('@/db/schema');
  const count = await db.$count(receipts);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RCT-${dateStr}-${String(count + 1).padStart(5, '0')}`;
}

export async function generateOrderNumber(): Promise<string> {
  const { orders } = await import('@/db/schema');
  const count = await db.$count(orders);
  return `FXM-${String(count + 1).padStart(5, '0')}`;
}

// ─── Calculate Order COGS ─────────────────────────────────────────────────
export async function calculateOrderCOGS(orderId: string): Promise<number> {
  const items = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  if (!items.length) return 0;

  const itemIds = items.map((i) => i.id);
  const allocations = await db
    .select({
      quantity: batchAllocations.quantity,
      costPrice: batchAllocations.costPriceAtTime,
    })
    .from(batchAllocations)
    .where(inArray(batchAllocations.orderItemId, itemIds));

  return allocations.reduce(
    (sum, a) => sum + Number(a.quantity) * Number(a.costPrice),
    0,
  );
}
