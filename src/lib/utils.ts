import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '₦'): string {
  return `${symbol}${Number(amount).toLocaleString('en-NG')}`;
}

/**
 * Storefront-only price tag formatter. A product's `price` column defaults to
 * '0' and only gets a real value once an admin adds its first inventory batch
 * (see the comment on `products.price` in the schema and
 * `syncProductStockFromBatches` in `@/lib/inventory`) — until then it's not
 * really "priced" yet. Rendering `formatCurrency(0)` for that case prints
 * "₦0", and because the ₦ glyph degrades to a bare "N" in some font fallback
 * stacks, shoppers see the confusing "N0". Use this instead of
 * `formatCurrency` for an actual product's price tag so that state reads as
 * "Price unavailable" rather than a broken-looking amount.
 */
export function formatProductPrice(amount: number | string, symbol = '₦'): string {
  const value = Number(amount);
  if (!value || value <= 0) return 'Price unavailable';
  return formatCurrency(value, symbol);
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Storefront-only guard: a product with no image looks broken to shoppers, so
 * listing/carousel UIs should filter it out of what they render. Admin/POS
 * screens intentionally do NOT use this — staff still need to see and sell
 * every product regardless of whether a photo has been uploaded yet.
 */
export function hasProductImage(product: { imageUrl?: string | null; images?: string[] | null }): boolean {
  return Boolean(product.imageUrl) || Boolean(product.images && product.images.length > 0);
}

/**
 * Storefront-only guard: a product's `price` stays at the schema default of
 * '0' until an admin adds its first inventory batch (see
 * `syncProductStockFromBatches` in `@/lib/inventory`), so a newly-created
 * product can be `isActive` and listed before it really has a price. That
 * reads to shoppers as a broken "N0"/"₦0" price tag (see
 * `formatProductPrice`), so listing/carousel UIs should filter it out the
 * same way they already do for `hasProductImage`. Admin/POS screens
 * intentionally do NOT use this — staff still need to find and manage a
 * product regardless of whether its price has been set yet.
 */
export function hasProductPrice(product: { price: number | string }): boolean {
  return Number(product.price) > 0;
}
