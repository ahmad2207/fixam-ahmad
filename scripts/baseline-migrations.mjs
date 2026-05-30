/**
 * Baselines existing drizzle migrations so that `drizzle-kit migrate` knows
 * both migrations are already applied (they were pushed directly with push).
 * Run once: node scripts/baseline-migrations.mjs
 */
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

const migrations = [
  { hash: '3ac795bb8deeaad98d72a3d68ceec0c3e2687ac54e551b94c25ad12796f54aad', created_at: 1779780171354n },
  { hash: '1e4ce4adf7bed725be605890e338e0a6b9198e536b2c812c5ee7b5d756d4c390', created_at: 1779826221090n },
];

await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
await sql`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`;

for (const m of migrations) {
  const exists = await sql`
    SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = ${m.hash} LIMIT 1
  `;
  if (exists.length === 0) {
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${m.hash}, ${m.created_at})`;
    console.log(`Marked as applied: ${m.hash.slice(0, 12)}…`);
  } else {
    console.log(`Already recorded: ${m.hash.slice(0, 12)}…`);
  }
}

console.log('Done. Both migrations are now baselined.');
await sql.end();
