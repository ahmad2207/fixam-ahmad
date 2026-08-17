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
  // Free-text display label, possibly flattening multiple variation groups
  // (e.g. "24cm / Blue") — shown on cart/receipts, never used for pricing.
  variation?: string | null;
  // The exact option value of the product's *priced* variation group (e.g.
  // just "24cm"), when it has one — this is what pricing/stock is resolved
  // against. Distinct from `variation` above because that field can mix in
  // non-priced groups too.
  variationOption?: string | null;
}

export interface PricedCheckoutItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  variation: string | null;
  variationOption: string | null;
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
  deliveryMethod: 'delivery' | 'pickup' = 'delivery',
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

  // Products with priced variations need their batches grouped by option to
  // resolve price/stock per option — fetch those up front in one query
  // rather than one round-trip per line item.
  const pricedIds = rows.filter((p) => p.pricedVariationName).map((p) => p.id);
  const variationPricingByProduct = pricedIds.length
    ? await getVariationPricingForProducts(pricedIds)
    : new Map<string, VariationPricing[]>();

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

    let price: number;
    let availableStock: number;

    if (product.pricedVariationName) {
      const options = variationPricingByProduct.get(product.id) ?? [];
      const picked = raw.variationOption
        ? options.find((o) => o.option === raw.variationOption)
        : undefined;
      if (!picked) {
        throw new Error(`Please select a ${product.pricedVariationName} for "${product.name}"`);
      }
      price = picked.price;
      availableStock = picked.stock;
    } else {
      price = Number(product.price);
      availableStock = product.stock;
    }

    if (availableStock < quantity) {
      throw new Error(`Only ${availableStock} of "${product.name}" left in stock`);
    }

    subtotal += price * quantity;
    items.push({
      product_id: product.id,
      product_name: product.name,
      product_image: product.imageUrl,
      quantity,
      price,
      variation: raw.variation ?? null,
      variationOption: product.pricedVariationName ? (raw.variationOption ?? null) : null,
    });
  }

  // A pickup order has no delivery leg at all — skip both the state
  // requirement and the fee calculation entirely rather than pretending a
  // state was chosen.
  if (deliveryMethod === 'pickup') {
    return { items, subtotal, deliveryFee: 0, total: subtotal };
  }

  if (!shippingState) {
    throw new Error('Delivery state is required');
  }

  const deliveryConfig = await getDeliveryConfigFromDb();
  const { fee: deliveryFee } = calculateDeliveryFee(shippingState, subtotal, abujaZone, deliveryConfig);
  const total = subtotal + deliveryFee;

  return { items, subtotal, deliveryFee, total };
}

// FIFO pick shared by whole-product and per-variation pricing: the oldest
// line that still has stock, else the most recently added line (a real
// last-known price/cost beats dropping to nothing). `lines` must already be
// ordered oldest-first by createdAt.
function pickActiveLine<T extends { quantityAvailable: number }>(lines: T[]): T | undefined {
  return lines.find((l) => l.quantityAvailable > 0) ?? lines[lines.length - 1];
}

// ─── Add Inventory Batch ────────────────────────────────────────────────────
// Adds stock at a given cost + selling price and re-derives products.stock/
// price/costPrice atomically. Cost and selling price live on the batch —
// products.price/costPrice are just a cached mirror of the active one (see
// syncProductStockFromBatches below). `variationOption` tags this batch as
// belonging to one option of the product's priced variation group; omit it
// (or pass null) for products without priced variations.
export async function addInventoryBatch(
  productId: string,
  quantity: number,
  costPrice: number,
  sellingPrice: number,
  variationOption?: string | null,
  // Informational only — see the column's own comment. Omit (or pass null)
  // for the common case of "landed the same day it was logged."
  landingDate?: Date | null,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(inventoryBatches)
      .values({
        productId,
        quantityAvailable: quantity,
        costPrice: String(costPrice),
        sellingPrice: String(sellingPrice),
        variationOption: variationOption ?? null,
        landingDate: landingDate ?? null,
      })
      .returning({ id: inventoryBatches.id });

    await syncProductStockFromBatches(productId, tx);

    return batch.id;
  });
}

export interface BatchGroupLine {
  variationOption: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
}

// ─── Add Inventory Batch Group ─────────────────────────────────────────────
// One "delivery" containing several priced-variation lines (e.g. 20cm + 24cm
// arriving together), logged in one action. Each line becomes its own
// inventory_batches row — FIFO/deduction/allocation logic keeps operating on
// individual rows exactly as everywhere else in this file — but all rows
// share a freshly generated deliveryGroupId purely so the inventory page can
// display them nested under one "batch" (see the column's own comment in
// the schema). Also updates products.defaultVariationOption when provided,
// in the same transaction, since that's normally chosen right here too.
export async function addInventoryBatchGroup(
  productId: string,
  lines: BatchGroupLine[],
  defaultVariationOption?: string | null,
  // Informational only (see the column's own comment) — one shared landing
  // date for the whole delivery, applied to every line in it. A delivery is
  // one physical arrival event; if a truck showed up with 3 sizes on it,
  // they all landed the same day. Omit (or pass null) for "landed the same
  // day it was logged."
  landingDate?: Date | null,
): Promise<{ deliveryGroupId: string; batchIds: string[] }> {
  if (!lines.length) throw new Error('At least one variation line is required');

  const deliveryGroupId = crypto.randomUUID();

  return db.transaction(async (tx) => {
    const batchIds: string[] = [];
    for (const line of lines) {
      const [batch] = await tx
        .insert(inventoryBatches)
        .values({
          productId,
          quantityAvailable: line.quantity,
          costPrice: String(line.costPrice),
          sellingPrice: String(line.sellingPrice),
          variationOption: line.variationOption,
          deliveryGroupId,
          landingDate: landingDate ?? null,
        })
        .returning({ id: inventoryBatches.id });
      batchIds.push(batch.id);
    }

    if (defaultVariationOption) {
      await tx.update(products).set({ defaultVariationOption }).where(eq(products.id, productId));
    }

    await syncProductStockFromBatches(productId, tx);

    return { deliveryGroupId, batchIds };
  });
}

export interface VariationPricing {
  option: string;
  price: number;
  costPrice: number;
  stock: number;
}

interface VariationBatchRow {
  productId: string;
  variationOption: string | null;
  quantityAvailable: number;
  costPrice: string;
  sellingPrice: string;
}

// ─── Variation Pricing ──────────────────────────────────────────────────────
// Groups each product's batches by variationOption and applies the same
// FIFO-active-else-latest pick per group as syncProductStockFromBatches does
// for the whole product. Batches with no variationOption (non-priced
// products) contribute nothing here. Pass several ids at once to price a
// cart/listing in one query rather than one round-trip per product.
//
// Pass `tx` when calling this from inside an active transaction — see the
// DbOrTx comment above.
export async function getVariationPricingForProducts(
  productIds: string[],
  tx?: DbOrTx,
): Promise<Map<string, VariationPricing[]>> {
  if (!productIds.length) return new Map();
  const executor = tx ?? db;

  const rows: VariationBatchRow[] = await executor
    .select({
      productId: inventoryBatches.productId,
      variationOption: inventoryBatches.variationOption,
      quantityAvailable: inventoryBatches.quantityAvailable,
      costPrice: inventoryBatches.costPrice,
      sellingPrice: inventoryBatches.sellingPrice,
    })
    .from(inventoryBatches)
    .where(inArray(inventoryBatches.productId, productIds))
    .orderBy(asc(inventoryBatches.createdAt));

  const byProduct = new Map<string, Map<string, VariationBatchRow[]>>();
  for (const row of rows) {
    if (!row.variationOption) continue;
    if (!byProduct.has(row.productId)) byProduct.set(row.productId, new Map());
    const byOption = byProduct.get(row.productId)!;
    if (!byOption.has(row.variationOption)) byOption.set(row.variationOption, []);
    byOption.get(row.variationOption)!.push(row);
  }

  const result = new Map<string, VariationPricing[]>();
  for (const [productId, byOption] of byProduct) {
    const options: VariationPricing[] = [];
    for (const [option, lines] of byOption) {
      const active = pickActiveLine(lines);
      if (!active) continue;
      options.push({
        option,
        price: Number(active.sellingPrice),
        costPrice: Number(active.costPrice),
        stock: lines.reduce((sum, l) => sum + l.quantityAvailable, 0),
      });
    }
    result.set(productId, options);
  }
  return result;
}

export async function getVariationPricing(productId: string, tx?: DbOrTx): Promise<VariationPricing[]> {
  const map = await getVariationPricingForProducts([productId], tx);
  return map.get(productId) ?? [];
}

// ─── Sync Product Stock (& Price) From Batches ─────────────────────────────
// Recalculates products.stock as the sum of all batch quantities (always
// the full aggregate, priced variations or not), and mirrors
// products.price/costPrice from whichever batch is "active" under FIFO. For
// a product without priced variations that's the FIFO pick across all its
// batches, same as before.
//
// For a product with priced variations, the mirror prefers the admin's
// chosen *display* variation (products.defaultVariationOption) while it
// still has real stock. Once that variation sells out, it auto-follows
// whichever other variation is actually in stock — picking whichever has
// been sitting longest, the same "sell the oldest first" principle FIFO
// already applies within one variation, just extended across variations for
// this fallback only. If the display variation gets restocked later, the
// mirror reverts back to it automatically (nothing is persisted — this is
// recomputed fresh every call). If literally nothing has stock, it falls
// back to the display variation's own last-known price rather than
// flapping to something arbitrary; if that variation has no batches at all
// yet, price/cost are left untouched.
//
// Call after any batch insert/edit/delete/deduction that could change stock
// or which batch is the active one.
//
// Pass `tx` when calling this from inside an active transaction — see the
// DbOrTx comment above for why this matters with this pool's max: 1 config.
export async function syncProductStockFromBatches(productId: string, tx?: DbOrTx): Promise<number> {
  const executor = tx ?? db;

  const [product] = await executor
    .select({
      pricedVariationName: products.pricedVariationName,
      defaultVariationOption: products.defaultVariationOption,
    })
    .from(products)
    .where(eq(products.id, productId));

  const batches = await executor
    .select({
      variationOption: inventoryBatches.variationOption,
      quantityAvailable: inventoryBatches.quantityAvailable,
      costPrice: inventoryBatches.costPrice,
      sellingPrice: inventoryBatches.sellingPrice,
      createdAt: inventoryBatches.createdAt,
    })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.createdAt));

  const stock = batches.reduce((sum, b) => sum + b.quantityAvailable, 0);

  let activeBatch: (typeof batches)[number] | undefined;

  if (product?.pricedVariationName) {
    const byOption = new Map<string, typeof batches>();
    for (const b of batches) {
      if (!b.variationOption) continue;
      if (!byOption.has(b.variationOption)) byOption.set(b.variationOption, []);
      byOption.get(b.variationOption)!.push(b);
    }

    const defaultLines = product.defaultVariationOption ? byOption.get(product.defaultVariationOption) : undefined;
    const defaultActive = defaultLines ? pickActiveLine(defaultLines) : undefined;

    if (defaultActive && defaultActive.quantityAvailable > 0) {
      activeBatch = defaultActive;
    } else {
      let fallback: (typeof batches)[number] | undefined;
      for (const [option, lines] of byOption) {
        if (option === product.defaultVariationOption) continue;
        const active = pickActiveLine(lines);
        if (active && active.quantityAvailable > 0) {
          if (!fallback || active.createdAt < fallback.createdAt) fallback = active;
        }
      }
      activeBatch = fallback ?? defaultActive;
    }
  } else {
    activeBatch = pickActiveLine(batches);
  }

  const baseUpdate = activeBatch
    ? { stock, price: activeBatch.sellingPrice, costPrice: activeBatch.costPrice }
    : { stock };

  await executor
    .update(products)
    .set(
      // restockAt is only meaningful while a product is out of stock (see
      // its own comment on the schema) — once a delivery brings stock back
      // above 0, clear it so a stale date can't resurface on the next
      // stockout. Never set it TO anything here — only the "Set restock
      // date" action on the admin product list does that, and only while
      // stock is still 0 (see that route's own guard).
      stock > 0 ? { ...baseUpdate, restockAt: null } : baseUpdate,
    )
    .where(eq(products.id, productId));

  return stock;
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
//    batch for that quantity instead, using the product's own current
//    price/cost as the best available estimate (same approach used for the
//    one-time inventory reconciliation).
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
        .select({
          price: products.price,
          costPrice: products.costPrice,
          pricedVariationName: products.pricedVariationName,
        })
        .from(products)
        .where(eq(products.id, item.productId));

      let sellingPrice = product?.price ?? '0';
      let costPrice = product?.costPrice ?? '0';

      // If this product prices by variation and the order line recorded
      // which one, use that variation's own current price/cost instead of
      // the flat product-level mirror — which reflects whichever variation
      // happens to be the *display* one right now, not necessarily this one.
      if (product?.pricedVariationName && item.variation) {
        const options = await getVariationPricing(item.productId, executor);
        const matched = options.find((o) => o.option === item.variation);
        if (matched) {
          sellingPrice = String(matched.price);
          costPrice = String(matched.costPrice);
        }
      }

      await executor.insert(inventoryBatches).values({
        productId: item.productId,
        quantityAvailable: item.quantity,
        costPrice,
        sellingPrice,
        variationOption: product?.pricedVariationName ? (item.variation ?? null) : null,
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
  variationOption?: string | null,
): Promise<boolean> {
  const conditions = [
    eq(inventoryBatches.productId, productId),
    gt(inventoryBatches.quantityAvailable, 0),
  ];
  if (variationOption) conditions.push(eq(inventoryBatches.variationOption, variationOption));

  const batches = await tx
    .select()
    .from(inventoryBatches)
    .where(and(...conditions))
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

  // Deducting from the oldest batch first can deplete it entirely, handing
  // FIFO "active" status (and its price) to the next-oldest batch — re-sync
  // both stock and price/cost together.
  await syncProductStockFromBatches(productId, tx);

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
  variationOption?: string | null,
): Promise<boolean> {
  if (tx) return deductPOSInventoryInner(tx, productId, quantity, variationOption);
  return db.transaction((innerTx) => deductPOSInventoryInner(innerTx, productId, quantity, variationOption));
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
      variationOption?: string | null;
    }>;

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    let totalReserved = 0;

    for (const item of items) {
      const conditions = [
        eq(inventoryBatches.productId, item.product_id),
        gt(inventoryBatches.quantityAvailable, 0),
      ];
      if (item.variationOption) conditions.push(eq(inventoryBatches.variationOption, item.variationOption));

      const batches = await tx
        .select()
        .from(inventoryBatches)
        .where(and(...conditions))
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

    // Sync product stocks (& FIFO price/cost)
    const productIds = [...new Set(items.map((i) => i.product_id))];
    for (const pid of productIds) {
      await syncProductStockFromBatches(pid, tx);
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
    // Joined to the batch it drew from so each reservation's variation is
    // known — needed below to correctly pair a reservation with the right
    // checkout item when a cart has two different variations of the same
    // product (productId alone can't disambiguate that).
    const reservations = await tx
      .select({
        id: stockReservations.id,
        checkoutId: stockReservations.checkoutId,
        productId: stockReservations.productId,
        batchId: stockReservations.batchId,
        quantity: stockReservations.quantity,
        costPrice: stockReservations.costPrice,
        status: stockReservations.status,
        variationOption: inventoryBatches.variationOption,
      })
      .from(stockReservations)
      .leftJoin(inventoryBatches, eq(stockReservations.batchId, inventoryBatches.id))
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
      variationOption?: string | null;
    }>;

    let consumed = 0;

    for (const item of checkoutItems) {
      const itemReservations = reservations.filter(
        (r) => r.productId === item.product_id
          && (r.variationOption ?? null) === (item.variationOption ?? null),
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

    // Sync product stocks (& FIFO price/cost)
    const productIds = [...new Set(reservations.map((r) => r.productId))];
    for (const pid of productIds) {
      await syncProductStockFromBatches(pid, tx);
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
