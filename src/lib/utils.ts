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
