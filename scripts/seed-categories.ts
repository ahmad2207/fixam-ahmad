import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { categories } from '../src/db/schema';

const client = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });
const db = drizzle(client);

const data = [
  { name: 'Cookware', slug: 'cookware', description: 'Pots, pans, and cooking essentials' },
  { name: 'Cutlery', slug: 'cutlery', description: 'Knives, forks, and serving tools' },
  { name: 'Appliances', slug: 'appliances', description: 'Smart kitchen appliances' },
  { name: 'Storage', slug: 'storage', description: 'Food storage and organisation' },
  { name: 'Bakeware', slug: 'bakeware', description: 'Baking trays, moulds, and tools' },
  { name: 'Utensils', slug: 'utensils', description: 'Spatulas, ladles, and kitchen tools' },
];

async function seed() {
  console.log('Seeding categories...');
  for (const cat of data) {
    await db.insert(categories).values({ id: crypto.randomUUID(), ...cat }).onConflictDoNothing();
    console.log(`  ✓ ${cat.name}`);
  }
  console.log('Done.');
  await client.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
