import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '₦'): string {
  return `${symbol}${Number(amount).toLocaleString('en-NG')}`;
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
