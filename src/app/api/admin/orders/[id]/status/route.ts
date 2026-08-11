import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOrderStatusEmail } from '@/lib/orderNotifications';
import { restoreStockForOrder } from '@/lib/inventory';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const [existing] = await db
    .select({ status: orders.status, orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const becomingCancelled = status === 'cancelled' && existing.status !== 'cancelled';

  // Status update and (when applicable) stock restoration commit together —
  // if one fails, both roll back, so the order never ends up marked
  // cancelled with its stock still shown as unavailable, or vice versa.
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

    // Known gap, not handled here: moving a cancelled order back OUT of
    // 'cancelled' (e.g. cancelled -> processing) does NOT re-deduct the
    // stock this just restored — nothing in the current admin UI does that
    // un-cancel today, but if that ever becomes a real flow, it needs its
    // own re-deduction step or this will silently double-count stock.
    const restored = becomingCancelled
      ? await restoreStockForOrder(id, `Restored: order ${existing.orderNumber ?? id} was cancelled`, tx)
      : [];

    return { updated, restored };
  });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
