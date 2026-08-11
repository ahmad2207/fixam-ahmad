// Server-only barcode helpers (DB access). Keep these out of `@/lib/barcode`
// so client components can import the pure helpers there without pulling in
// the Node-only `postgres` driver.
import { db } from '@/lib/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomInternalEan13, isBarcodeUniqueViolation } from '@/lib/barcode';

/**
 * Generate a barcode that isn't already in use, checked against the live table.
 * Used to pre-fill a form field before a product row exists — the real safety net
 * is still the DB unique constraint at actual insert time (see insertProductWithBarcode).
 */
export async function generateUniqueBarcode(maxAttempts = 8): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = randomInternalEan13();
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.barcode, candidate));
    if (!existing) return candidate;
  }
  throw new Error('Could not generate a unique barcode after several attempts');
}

/**
 * Insert a new product row, auto-generating a barcode when the admin didn't supply
 * one. Retries on a barcode collision (only when we generated it ourselves — a
 * collision on an admin-supplied barcode is a real duplicate and should surface as
 * an error, not silently mutate into a different code).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertProductWithBarcode(values: any, maxAttempts = 5): Promise<any> {
  const adminSupplied = typeof values.barcode === 'string' && values.barcode.trim().length > 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const barcode = adminSupplied ? (values.barcode as string).trim() : randomInternalEan13();
    try {
      const [row] = await db.insert(products).values({ ...values, barcode }).returning();
      return row;
    } catch (err) {
      if (!adminSupplied && isBarcodeUniqueViolation(err)) continue;
      throw err;
    }
  }
  throw new Error('Could not generate a unique barcode after several attempts');
}
