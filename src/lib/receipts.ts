import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Receipts don't store an address of their own, so the delivery address is
 * read from the linked order at display time — which is also what lets
 * receipts issued before this existed show it. Returns a single display line,
 * or null for pickup/POS/manual receipts with no delivery address.
 */
export async function getReceiptCustomerAddress(orderId: string | null | undefined): Promise<string | null> {
  if (!orderId) return null;
  const [order] = await db
    .select({
      deliveryMethod: orders.deliveryMethod,
      street: orders.shippingStreetAddress,
      city: orders.shippingCity,
      state: orders.shippingState,
      abujaZone: orders.shippingAbujaZone,
    })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order || order.deliveryMethod === 'pickup') return null;

  const state = order.state && order.abujaZone ? `${order.state} (${order.abujaZone})` : order.state;
  const line = [order.street, order.city, state].map((s) => s?.trim()).filter(Boolean).join(', ');
  return line || null;
}
