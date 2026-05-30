/**
 * Clears ALL rows from every table in the database.
 * Run this before a fresh migration seed to avoid any leftover data.
 *
 * Usage:
 *   npx tsx scripts/clear-db.ts
 */

import { readFileSync } from 'fs';
import path from 'path';
import postgres from 'postgres';

// ── Env loader ────────────────────────────────────────────────────────────────
try {
  const envContent = readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* rely on environment */ }

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });

  console.log('🗑️  Clearing all tables...\n');

  // Delete in reverse FK order so constraints are never violated.
  // Each group can be cleared together since they don't reference each other.
  const steps: { label: string; tables: string[] }[] = [
    {
      label: 'Audit & tokens',
      tables: ['admin_audit_log', 'password_reset_tokens', 'newsletter_subscribers'],
    },
    {
      label: 'Receipts & payments',
      tables: ['receipts', 'payment_transactions'],
    },
    {
      label: 'Inventory FIFO',
      tables: ['batch_allocations', 'stock_reservations'],
    },
    {
      label: 'Order items & pending checkouts',
      tables: ['order_items', 'pending_checkouts'],
    },
    {
      label: 'Orders',
      tables: ['orders'],
    },
    {
      label: 'Inventory batches',
      tables: ['inventory_batches'],
    },
    {
      label: 'Reviews & wishlist',
      tables: ['reviews', 'wishlist'],
    },
    {
      label: 'Products',
      tables: ['products'],
    },
    {
      label: 'Addresses',
      tables: ['addresses'],
    },
    {
      label: 'Auth (accounts, sessions, tokens)',
      tables: ['accounts', 'sessions', 'verification_tokens'],
    },
    {
      label: 'User roles & profiles',
      tables: ['user_roles', 'profiles'],
    },
    {
      label: 'Users',
      tables: ['users'],
    },
    {
      label: 'Categories & store settings',
      tables: ['categories', 'store_settings'],
    },
  ];

  for (const step of steps) {
    for (const table of step.tables) {
      await client`DELETE FROM ${client(table)}`;
    }
    console.log(`  ✓ ${step.label}`);
  }

  console.log('\n✅  All tables cleared. Database is empty.');
  await client.end();
}

main().catch(err => {
  console.error('❌  Clear failed:', err);
  process.exit(1);
});
