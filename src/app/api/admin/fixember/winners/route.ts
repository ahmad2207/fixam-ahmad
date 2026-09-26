import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { fixemberSpins, orders } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

function isAdminOrStaff(role: unknown) {
  return role === 'admin' || role === 'staff';
}

export async function GET() {
  const session = await auth();
  if (!session || !isAdminOrStaff((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: fixemberSpins.id,
      prizeLabel: fixemberSpins.prizeLabel,
      customerName: fixemberSpins.customerName,
      customerPhone: fixemberSpins.customerPhone,
      guestEmail: fixemberSpins.guestEmail,
      fulfillmentStatus: fixemberSpins.fulfillmentStatus,
      createdAt: fixemberSpins.createdAt,
      orderId: fixemberSpins.orderId,
      orderNumber: orders.orderNumber,
    })
    .from(fixemberSpins)
    .leftJoin(orders, eq(orders.id, fixemberSpins.orderId))
    .where(eq(fixemberSpins.isWin, true))
    .orderBy(desc(fixemberSpins.createdAt));

  return NextResponse.json(rows);
}
