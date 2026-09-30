import { db } from '@/lib/db';
import { addresses } from '@/db/schema';
import { eq } from 'drizzle-orm';

type CheckoutAddress = {
  fullName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  abujaZone?: string;
};

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

/**
 * Saves a delivery address typed at checkout into the signed-in customer's
 * address book, so it shows up for them next time and on the admin Customers
 * page. Reuses an existing entry with the same street/city/state instead of
 * duplicating it. Returns the address id, or null when there's nothing to save
 * (guest, pickup, incomplete address) or the save fails — this must never
 * block the order itself.
 */
export async function saveCheckoutAddress(
  userId: string | null | undefined,
  addr: CheckoutAddress | null | undefined,
): Promise<string | null> {
  if (!userId || !addr?.streetAddress?.trim() || !addr.city?.trim() || !addr.state?.trim()) return null;
  if (!addr.fullName?.trim() || !addr.phone?.trim()) return null;

  try {
    const existing = await db.select().from(addresses).where(eq(addresses.userId, userId));
    const match = existing.find(
      (a) =>
        norm(a.streetAddress) === norm(addr.streetAddress) &&
        norm(a.city) === norm(addr.city) &&
        norm(a.state) === norm(addr.state),
    );
    if (match) return match.id;

    const [row] = await db
      .insert(addresses)
      .values({
        userId,
        fullName: addr.fullName.trim(),
        phone: addr.phone.trim(),
        streetAddress: addr.streetAddress.trim(),
        city: addr.city.trim(),
        state: addr.state.trim(),
        abujaZone: addr.abujaZone ?? null,
        isDefault: existing.length === 0,
      })
      .returning({ id: addresses.id });
    return row.id;
  } catch (err) {
    console.error('Failed to save checkout address', err);
    return null;
  }
}
