// Pure barcode helpers — no DB import here on purpose. This module is imported
// from client components (e.g. the POS page's scan-burst detection), so pulling
// in `@/lib/db` (which drags the Node-only `postgres` driver) would break the
// browser bundle. DB-dependent generation lives in `@/lib/barcode-server`.

// GS1 reserves the "20" prefix range for retailer/in-store internal use — these
// numbers are never issued to real manufacturers, so generated codes can't collide
// with a genuine carton barcode an admin scans/types in later.
const INTERNAL_PREFIX = '20';
const UNIQUE_VIOLATION = '23505';

/**
 * Standard EAN-13 checksum: for the 12-digit payload (left to right, 0-indexed),
 * even positions are weighted x1 and odd positions x3; the check digit is whatever
 * brings the total to the next multiple of 10.
 */
export function ean13CheckDigit(digits12: string): number {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error('ean13CheckDigit expects exactly 12 digits');
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/** A random, internally-unique-looking EAN-13 (10^10 code space before collisions matter). */
export function randomInternalEan13(): string {
  let body = INTERNAL_PREFIX;
  for (let i = 0; i < 10; i++) body += Math.floor(Math.random() * 10);
  return body + ean13CheckDigit(body);
}

/**
 * Heuristic for telling a barcode-scanner keystroke burst (fast, machine-typed)
 * apart from a human typing a product name. `maxGapMs` is the largest gap observed
 * between consecutive keystrokes in the burst.
 */
export function isLikelyScannerBurst(text: string, maxGapMs: number, minLen = 6): boolean {
  return text.length >= minLen && maxGapMs <= 60;
}

export function isBarcodeUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; constraint_name?: string; constraint?: string } | null;
  return (
    !!e &&
    e.code === UNIQUE_VIOLATION &&
    (e.constraint_name === 'products_barcode_unique' || e.constraint === 'products_barcode_unique')
  );
}
