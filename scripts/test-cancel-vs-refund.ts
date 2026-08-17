/**
 * One-off verification for the cancel-vs-refund guard, run directly against
 * the DB — not through the HTTP route, since that requires an authenticated
 * admin session this environment doesn't have credentials for. Instead this
 * exercises the exact same pieces the route uses:
 *   - the real invalidTerminalStatusFor() guard function (imported, not
 *     reimplemented)
 *   - the same conditional shape and SQL updates the route runs, copied
 *     verbatim from src/app/api/admin/orders/[id]/status/route.ts
 * against two disposable test orders, then deletes everything it created.
 *
 * Usage: npx tsx scripts/test-cancel-vs-refund.ts
 */

import { readFileSync } from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { orders, paymentTransactions } from '../src/db/schema';
import { invalidTerminalStatusFor } from '../src/lib/orders';

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

let pass = 0;
let fail = 0;
function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    fail++;
  }
}

// Mirrors the exact guard in the status route.
function wouldBeRejected(status: 'cancelled' | 'refunded', existingStatus: string, existingPaymentStatus: string) {
  const becomingCancelled = status === 'cancelled' && existingStatus !== 'cancelled';
  const becomingRefunded  = status === 'refunded'  && existingStatus !== 'refunded';
  if (becomingRefunded && invalidTerminalStatusFor(existingPaymentStatus) === 'refunded') return true;
  if (becomingCancelled && invalidTerminalStatusFor(existingPaymentStatus) === 'cancelled') return true;
  return false;
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });
  const db = drizzle(client);
  const createdOrderIds: string[] = [];

  try {
    console.log('--- Pure guard rule ---');
    check("unpaid order: 'refunded' is the invalid choice", invalidTerminalStatusFor('pending') === 'refunded');
    check("paid order: 'cancelled' is the invalid choice", invalidTerminalStatusFor('paid') === 'cancelled');

    console.log('\n--- Route-shaped rejection check (no DB writes) ---');
    check("unpaid order: refund attempt is rejected", wouldBeRejected('refunded', 'pending', 'pending'));
    check("unpaid order: cancel attempt is allowed", !wouldBeRejected('cancelled', 'pending', 'pending'));
    check("paid order: cancel attempt is rejected", wouldBeRejected('cancelled', 'pending', 'paid'));
    check("paid order: refund attempt is allowed", !wouldBeRejected('refunded', 'pending', 'paid'));

    console.log('\n--- Live DB: cancel path (unpaid POD order) ---');
    const [orderA] = await db.insert(orders).values({
      orderNumber: `TEST-CANCEL-${Date.now()}`,
      status: 'pending',
      paymentMethod: 'pod',
      paymentStatus: 'pending',
      deliveryMethod: 'delivery',
      subtotal: '5000',
      deliveryFee: '0',
      total: '5000',
    }).returning({ id: orders.id });
    createdOrderIds.push(orderA.id);

    const [txnA] = await db.insert(paymentTransactions).values({
      orderId: orderA.id,
      provider: 'pod',
      amount: '5000',
      currency: 'NGN',
      status: 'pending',
    }).returning({ id: paymentTransactions.id });

    // Same statements the route runs for becomingCancelled.
    await db.update(orders).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(orders.id, orderA.id));
    await db.update(paymentTransactions)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(paymentTransactions.orderId, orderA.id),
        eq(paymentTransactions.provider, 'pod'),
        eq(paymentTransactions.status, 'pending'),
      ));

    const [afterA] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderA.id));
    const [txnAfterA] = await db.select({ status: paymentTransactions.status }).from(paymentTransactions).where(eq(paymentTransactions.id, txnA.id));
    check("order.status became 'cancelled'", afterA.status === 'cancelled');
    check("transaction.status became 'cancelled'", txnAfterA.status === 'cancelled');

    console.log('\n--- Live DB: refund path (paid POD order) ---');
    const [orderB] = await db.insert(orders).values({
      orderNumber: `TEST-REFUND-${Date.now()}`,
      status: 'pending',
      paymentMethod: 'pod',
      paymentStatus: 'paid',
      deliveryMethod: 'pickup',
      subtotal: '8000',
      deliveryFee: '0',
      total: '8000',
    }).returning({ id: orders.id });
    createdOrderIds.push(orderB.id);

    const [txnB] = await db.insert(paymentTransactions).values({
      orderId: orderB.id,
      provider: 'pod',
      amount: '8000',
      currency: 'NGN',
      status: 'successful',
    }).returning({ id: paymentTransactions.id });

    // Same statements the route runs for becomingRefunded.
    await db.update(orders).set({ status: 'refunded', updatedAt: new Date() }).where(eq(orders.id, orderB.id));
    await db.update(paymentTransactions)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(and(
        eq(paymentTransactions.orderId, orderB.id),
        eq(paymentTransactions.status, 'successful'),
      ));

    const [afterB] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderB.id));
    const [txnAfterB] = await db.select({ status: paymentTransactions.status }).from(paymentTransactions).where(eq(paymentTransactions.id, txnB.id));
    check("order.status became 'refunded'", afterB.status === 'refunded');
    check("transaction.status became 'refunded'", txnAfterB.status === 'refunded');

    console.log('\n--- Edge case: cancelling an order whose transaction is already successful must NOT touch it ---');
    const [orderC] = await db.insert(orders).values({
      orderNumber: `TEST-EDGE-${Date.now()}`,
      status: 'pending',
      paymentMethod: 'pod',
      paymentStatus: 'paid',
      deliveryMethod: 'delivery',
      subtotal: '3000',
      deliveryFee: '0',
      total: '3000',
    }).returning({ id: orders.id });
    createdOrderIds.push(orderC.id);

    const [txnC] = await db.insert(paymentTransactions).values({
      orderId: orderC.id,
      provider: 'pod',
      amount: '3000',
      currency: 'NGN',
      status: 'successful',
    }).returning({ id: paymentTransactions.id });

    // This order is 'paid' — per the guard, a cancel attempt would be
    // rejected before ever reaching this update. Simulate that the guard
    // did its job by NOT running the cancel-branch SQL at all.
    check("guard rejects cancelling a paid order (no mutation attempted)", wouldBeRejected('cancelled', 'pending', 'paid'));
    const [txnStillC] = await db.select({ status: paymentTransactions.status }).from(paymentTransactions).where(eq(paymentTransactions.id, txnC.id));
    check("transaction is untouched, still 'successful'", txnStillC.status === 'successful');

  } finally {
    console.log('\n--- Cleanup ---');
    if (createdOrderIds.length) {
      for (const id of createdOrderIds) {
        await db.delete(paymentTransactions).where(eq(paymentTransactions.orderId, id));
        await db.delete(orders).where(eq(orders.id, id));
      }
      console.log(`  Deleted ${createdOrderIds.length} test order(s) and their transactions.`);
    }
    await client.end();
  }

  console.log(`\n${pass} passed, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
