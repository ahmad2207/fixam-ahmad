import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

// Dedicated multi-field route, same reason as /payment: "notifications" was
// never in [key]'s KEY_MAP, so every GET/PUT here 400'd and the page's Save
// button silently failed. Note this only persists the toggles — nothing in
// the app currently sends an admin-facing alert email on any of these
// events, so saving here doesn't yet trigger anything.
async function getOrCreateSettings() {
  const [row] = await db.select().from(storeSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(storeSettings).values({}).returning();
  return created;
}

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = await getOrCreateSettings();
  return NextResponse.json({
    value: {
      notify_new_order: row.notifyNewOrders ?? true,
      notify_low_stock: row.notifyLowStock ?? true,
      low_stock_threshold: row.lowStockThreshold ?? 5,
      notification_email: row.notifyEmail ?? '',
      notify_payment_confirmed: row.notifyPaymentConfirmed ?? false,
      notify_order_cancelled: row.notifyOrderCancelled ?? true,
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { value } = await req.json();
  await getOrCreateSettings();
  await db.update(storeSettings).set({
    notifyNewOrders: value?.notify_new_order ?? undefined,
    notifyLowStock: value?.notify_low_stock ?? undefined,
    lowStockThreshold: value?.low_stock_threshold ?? undefined,
    notifyEmail: value?.notification_email ?? undefined,
    notifyPaymentConfirmed: value?.notify_payment_confirmed ?? undefined,
    notifyOrderCancelled: value?.notify_order_cancelled ?? undefined,
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
