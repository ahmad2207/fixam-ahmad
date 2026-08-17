/**
 * One-time backfill: create the payment_transactions row that should have
 * existed all along for every POD/pickup order that was already confirmed
 * paid *before* /api/payment/pod and /api/admin/orders/[id] started writing
 * to payment_transactions.
 *
 * Without this, "Total Collected" and every other figure derived from
 * payment_transactions on the admin Transactions page would look like cash
 * revenue suddenly appeared out of nowhere on the day this ships, instead of
 * reflecting money that was actually collected earlier.
 *
 * Safe to re-run: skips any order that already has a payment_transactions
 * row (checked by orderId), so it only ever inserts once per order.
 *
 * Usage:
 *   npx tsx scripts/backfill-pod-transactions.ts          # dry run (default)
 *   npx tsx scripts/backfill-pod-transactions.ts --apply  # actually insert
 */

import { readFileSync } from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { orders, paymentTransactions } from '../src/db/schema';

// .env.local (if present) takes precedence, matching Next.js's own load
// order, but this repo's real env file is plain .env — load both.
for (const file of ['.env.local', '.env']) {
  try {
    const env = readFileSync(path.join(process.cwd(), file), 'utf-8');
    for (const line of env.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}

const apply = process.argv.includes('--apply');

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });
  const db = drizzle(client);

  const podOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.paymentMethod, 'pod'), eq(orders.paymentStatus, 'paid')));

  const existingTxnOrderIds = new Set(
    (await db.select({ orderId: paymentTransactions.orderId }).from(paymentTransactions))
      .map((r) => r.orderId)
      .filter((id): id is string => id !== null),
  );

  const toBackfill = podOrders.filter((o) => !existingTxnOrderIds.has(o.id));

  console.log(`Found ${podOrders.length} paid POD/pickup order(s), ${toBackfill.length} missing a transaction record.`);

  if (!toBackfill.length) {
    console.log('Nothing to do.');
    await client.end();
    return;
  }

  for (const order of toBackfill) {
    const line = `  ${order.orderNumber ?? order.id} — ${order.deliveryMethod} — ₦${order.total} — confirmed ${order.updatedAt.toISOString()}`;
    console.log(apply ? line : `[dry run]${line}`);

    if (apply) {
      await db.insert(paymentTransactions).values({
        orderId: order.id,
        checkoutId: order.checkoutId,
        provider: 'pod',
        amount: order.total,
        currency: 'NGN',
        status: 'successful',
        customerName: order.shippingFullName,
        customerEmail: order.guestEmail,
        // Backdated to when the order last changed — the best available
        // signal for when payment was actually confirmed, since we never
        // recorded the real moment before this script existed.
        createdAt: order.updatedAt,
        updatedAt: order.updatedAt,
      });
    }
  }

  console.log(apply
    ? `✅ Inserted ${toBackfill.length} transaction(s).`
    : `\nDry run only — nothing written. Re-run with --apply to insert.`);

  await client.end();
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
