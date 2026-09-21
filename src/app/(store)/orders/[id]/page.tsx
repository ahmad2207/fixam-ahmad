import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import OrderDetailClient from './OrderDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

async function OrderDetailFetcher({ id }: { id: string }) {
  const session = await auth();

  // A guest checkout has no account to log into, so the only thing standing
  // in for auth on their own order is the order's own unguessable UUID —
  // the same trust model the public receipt page already uses. Only orders
  // with no userId (real guest orders) are reachable this way; a signed-in
  // user can still only see orders that are actually theirs.
  const order = session?.user
    ? await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.id, id),
          or(eq(orders.userId, (session.user as any).id as string), eq(orders.guestEmail, session.user?.email ?? '')),
        ))
        .limit(1)
        .then((r) => r[0] ?? null)
    : await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, id), isNull(orders.userId)))
        .limit(1)
        .then((r) => r[0] ?? null);

  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  return (
    <OrderDetailClient
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        deliveryMethod: order.deliveryMethod,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        shippingFullName: order.shippingFullName,
        shippingStreetAddress: order.shippingStreetAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPhone: order.shippingPhone,
        notes: order.notes,
      }}
      items={items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productImage: item.productImage,
        variation: item.variation,
        quantity: item.quantity,
        price: item.price,
      }))}
    />
  );
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    }>
      <OrderDetailFetcher id={id} />
    </Suspense>
  );
}
