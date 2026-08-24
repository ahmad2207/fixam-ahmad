import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, receipts, products } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { deductPOSInventory, generateReceiptNumber, generateOrderNumber } from '@/lib/inventory';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'admin' && role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, customerName, customerPhone, customerEmail, subtotal, deliveryFee, total, notes, paymentMethod, salesRep: salesRepBody } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    // A priced-variation product's stock is tracked per option — without
    // knowing which one, deduction below would have to guess. Reject the
    // sale up front rather than deducting from the wrong size's batches.
    const productIds: string[] = [...new Set<string>(items.map((i: any) => i.productId).filter(Boolean))];
    if (productIds.length) {
      const productRows = await db
        .select({ id: products.id, pricedVariationName: products.pricedVariationName })
        .from(products)
        .where(inArray(products.id, productIds));
      const pricedNameById = new Map(
        productRows.filter((p) => p.pricedVariationName).map((p) => [p.id, p.pricedVariationName]),
      );
      for (const item of items) {
        const pricedName = item.productId ? pricedNameById.get(item.productId) : undefined;
        if (pricedName && !item.variation) {
          return NextResponse.json(
            { error: `Please choose a ${pricedName} for "${item.name}"` },
            { status: 400 },
          );
        }
      }
    }

    // Generated against the plain `db` connection, BEFORE opening the
    // transaction below — not inside it. This pool is configured with
    // max: 1 (a single connection, total); generateOrderNumber/
    // generateReceiptNumber each run their own db.$count() query via that
    // same plain `db` reference rather than a passed-in tx handle. Calling
    // them from inside the transaction would mean the transaction (already
    // holding the pool's one and only connection) blocks waiting for a
    // second connection to run the count query on — a connection that can
    // never free up until the transaction itself finishes. Confirmed this
    // exact deadlock live: pg_stat_activity showed a session stuck at
    // "begin" indefinitely, holding the pool hostage.
    const orderNumber = await generateOrderNumber();
    const receiptNumber = await generateReceiptNumber();

    // Everything below runs as one atomic unit: the order, every item, every
    // inventory deduction, and the receipt either all commit together or
    // none of them do. Previously each step ran against the plain `db`
    // connection independently — if item 3 of 5 had insufficient real stock,
    // items 1-2 were already permanently committed (order created, stock
    // actually deducted) with no receipt and no items 3-5, and the thrown
    // error had nothing catching it, so it surfaced as a bare, unparseable
    // 500 instead of a real message.
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          status: 'delivered',
          paymentStatus: 'paid',
          paymentMethod: paymentMethod ?? 'cash',
          saleType: 'pos',
          subtotal: String(subtotal),
          deliveryFee: String(deliveryFee ?? 0),
          total: String(total),
          shippingFullName: customerName,
          shippingPhone: customerPhone,
          notes,
        })
        .returning({ id: orders.id });

      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          productName: item.name,
          productImage: item.imageUrl ?? null,
          quantity: item.quantity,
          price: String(item.price),
          variation: item.variation ?? null,
          fromReservation: false,
        });

        if (item.productId) {
          // Pass this transaction's handle so the deduction participates in
          // it rather than opening a second, independent transaction.
          // `item.variation` is the exact priced-option value for a priced
          // product (see the check above); undefined/null for others.
          await deductPOSInventory(item.productId, item.quantity, tx, item.variation ?? null);
        }
      }

      const [receipt] = await tx
        .insert(receipts)
        .values({
          receiptNumber,
          orderId: order.id,
          type: 'pos',
          customerName,
          customerEmail,
          customerPhone,
          subtotal: String(subtotal),
          deliveryFee: String(deliveryFee ?? 0),
          total: String(total),
          // Stored keyed as product_name/quantity to match what every
          // receipt renderer (ThermalReceiptPreview, the admin and public
          // receipt pages) reads — the request body itself comes in keyed
          // as `name` from the POS cart, which those renderers don't know
          // about, so items silently printed blank on any reprint.
          items: JSON.stringify(
            items.map((item: any) => ({
              product_name: item.name,
              variation: item.variation ?? null,
              quantity: item.quantity,
              price: item.price,
            })),
          ),
          notes,
          createdBy: session.user?.id ?? null,
          salesRep: salesRepBody || (session.user as any)?.name || null,
        })
        .returning();

      return { orderId: order.id, receiptId: receipt.id, receiptNumber: receipt.receiptNumber };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('[pos/sale]', err);
    const message = typeof err?.message === 'string' ? err.message : 'Sale failed';
    // "Insufficient stock" is an expected validation failure — a cashier
    // trying to sell more than actually exists in real inventory batches —
    // not a server bug, so it's worth surfacing to the cashier as a clean
    // 400 with the real reason rather than a generic 500.
    const isInsufficientStock = message.startsWith('Insufficient stock');
    return NextResponse.json(
      { error: isInsufficientStock ? message : 'Could not complete this sale. Please try again.' },
      { status: isInsufficientStock ? 400 : 500 },
    );
  }
}
