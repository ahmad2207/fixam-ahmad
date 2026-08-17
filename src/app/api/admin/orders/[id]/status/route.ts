import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, paymentTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendOrderStatusEmail } from '@/lib/orderNotifications';
import { restoreStockForOrder } from '@/lib/inventory';
import { logAdminAction } from '@/lib/auditLog';
import { invalidTerminalStatusFor } from '@/lib/orders';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const [existing] = await db
    .select({ status: orders.status, orderNumber: orders.orderNumber, paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const becomingCancelled = status === 'cancelled' && existing.status !== 'cancelled';
  const becomingRefunded  = status === 'refunded'  && existing.status !== 'refunded';

  // 'cancelled' and 'refunded' aren't interchangeable: an unpaid order has
  // nothing to refund (cancel it), and cancelling a paid order would lose
  // track of money already collected (refund it). Reject the mismatched
  // action outright rather than silently letting the ledger drift out of
  // sync with reality — see invalidTerminalStatusFor for the shared rule
  // the admin UI also uses to hide the wrong option in the first place.
  if (becomingRefunded && invalidTerminalStatusFor(existing.paymentStatus) === 'refunded') {
    return NextResponse.json(
      { error: "Payment hasn't been collected on this order yet — cancel it instead of refunding." },
      { status: 400 },
    );
  }
  if (becomingCancelled && invalidTerminalStatusFor(existing.paymentStatus) === 'cancelled') {
    return NextResponse.json(
      { error: 'Payment has already been collected on this order — refund it instead of cancelling.' },
      { status: 400 },
    );
  }

  // Status update and (when applicable) stock restoration commit together —
  // if one fails, both roll back, so the order never ends up marked
  // cancelled/refunded with its stock still shown as unavailable, or vice
  // versa.
  const { updated, restored } = await db.transaction(async (tx) => {
    // `orders.notes` is the customer's own delivery instructions from
    // checkout, not an admin field — this route no longer touches it. (It
    // previously accepted a `note` here and wrote it straight into that
    // column; nothing in the admin UI ever sent one, but the moment something
    // did, it would have silently overwritten the customer's note.)
    const [updated] = await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (!updated) return { updated: null, restored: [] };

    // Known gap, not handled here: moving a cancelled/refunded order back
    // OUT of that state (e.g. refunded -> processing) does NOT re-deduct the
    // stock this just restored — nothing in the current admin UI does that
    // un-cancel/un-refund today, but if that ever becomes a real flow, it
    // needs its own re-deduction step or this will silently double-count
    // stock. Also guards the cancelled -> refunded transition specifically:
    // if this order was already cancelled, its stock was already restored
    // then — restoring it again here would double-count it.
    const shouldRestoreStock = becomingCancelled || (becomingRefunded && existing.status !== 'cancelled');
    const restored = shouldRestoreStock
      ? await restoreStockForOrder(id, `Restored: order ${existing.orderNumber ?? id} was ${status}`, tx)
      : [];

    // If cash/online payment was never actually collected (transaction
    // still 'pending'), cancelling just marks it 'cancelled' so the
    // Transactions ledger doesn't show it hanging around forever for money
    // that's never coming. A transaction that's already 'successful' (money
    // was collected, then the order got cancelled afterwards) is left
    // untouched here — that's a refund, not a cancellation; use the
    // 'refunded' status for that instead (see below).
    if (becomingCancelled) {
      await tx
        .update(paymentTransactions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(and(
          eq(paymentTransactions.orderId, id),
          eq(paymentTransactions.provider, 'pod'),
          eq(paymentTransactions.status, 'pending'),
        ));
    }

    // Refunding only makes sense for a transaction that actually collected
    // money ('successful') — this is a bookkeeping action, not a live
    // gateway call: it records that an admin already reversed the charge in
    // Paystack's dashboard, or handed cash back / issued store credit,
    // outside this app. Not scoped to provider: 'pod' like the cancel
    // branch above, since an online (Paystack) payment can be refunded too.
    if (becomingRefunded) {
      await tx
        .update(paymentTransactions)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(and(
          eq(paymentTransactions.orderId, id),
          eq(paymentTransactions.status, 'successful'),
        ));
    }

    return { updated, restored };
  });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Refunds get an audit log entry — unlike every other status transition
  // through this route, a refund means money already left the business, so
  // it needs its own paper trail (who, when, before/after order state).
  if (becomingRefunded) {
    await logAdminAction({
      userId: session.user?.id ?? '',
      adminName: session.user?.name ?? 'Admin',
      action: 'refund',
      entityType: 'order',
      entityId: id,
      before: existing,
      after: updated,
    });
  }

  // Only email if the status actually changed — re-saving the same status
  // (e.g. an accidental double-click) shouldn't re-notify the customer.
  // Awaited so the email is guaranteed to attempt before this function
  // returns; see payment/verify's route for why fire-and-forget was unsafe.
  // Sent outside the transaction — an email send is a slow external side
  // effect that has no business holding a DB transaction open.
  if (status !== existing.status) {
    await sendOrderStatusEmail(id, status);
  }

  return NextResponse.json({ ...updated, stockRestored: restored });
}
