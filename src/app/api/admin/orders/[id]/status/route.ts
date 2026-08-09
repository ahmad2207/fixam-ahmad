import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOrderStatusEmail } from '@/lib/orderNotifications';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const [existing] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // `orders.notes` is the customer's own delivery instructions from
  // checkout, not an admin field — this route no longer touches it. (It
  // previously accepted a `note` here and wrote it straight into that
  // column; nothing in the admin UI ever sent one, but the moment something
  // did, it would have silently overwritten the customer's note.)
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only email if the status actually changed — re-saving the same status
  // (e.g. an accidental double-click) shouldn't re-notify the customer.
  // Awaited so the email is guaranteed to attempt before this function
  // returns; see payment/verify's route for why fire-and-forget was unsafe.
  if (status !== existing.status) {
    await sendOrderStatusEmail(id, status);
  }

  return NextResponse.json(updated);
}
