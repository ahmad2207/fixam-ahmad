import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { and, eq, isNull, or } from 'drizzle-orm';
import { checkSpinEligibility, resolveSpin } from '@/lib/fixember';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Same ownership check as src/app/(store)/orders/[id]/page.tsx — a signed-in
// customer can only reach an order that's actually theirs; a guest can only
// reach a guest order (userId null) by its own unguessable id. This is the
// same trust boundary the order page already relies on, not a new one.
async function canAccessOrder(orderId: string): Promise<boolean> {
  const session = await auth();
  const [order] = session?.user
    ? await db.select({ id: orders.id }).from(orders).where(and(
        eq(orders.id, orderId),
        or(eq(orders.userId, (session.user as any).id as string), eq(orders.guestEmail, session.user?.email ?? '')),
      )).limit(1)
    : await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, orderId), isNull(orders.userId))).limit(1);
  return !!order;
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  if (!(await canAccessOrder(orderId))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await checkSpinEligibility(orderId);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { success: withinLimit } = await checkRateLimit('fixemberSpin', getClientIp(req));
  if (!withinLimit) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  if (!(await canAccessOrder(orderId))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await resolveSpin(orderId);
  return NextResponse.json(result);
}
