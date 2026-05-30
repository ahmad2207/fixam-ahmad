import { readFileSync } from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';
import { users, profiles, userRoles } from '../src/db/schema';

try {
  const env = readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
} catch {}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });
  const db = drizzle(client);

  const userId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('12345678', 12);

  await db.insert(users).values({
    id: userId,
    name: 'Admin',
    email: 'dmccleptons@gmail.com',
    hashedPassword,
  });

  await db.insert(profiles).values({
    userId,
    fullName: 'Admin',
    email: 'dmccleptons@gmail.com',
  });

  await db.insert(userRoles).values({
    userId,
    role: 'admin',
  });

  console.log('✅ Admin created');
  console.log('   email:   dmccleptons@gmail.com');
  console.log('   user ID:', userId);

  await client.end();
}

main().catch(err => { console.error('❌', err); process.exit(1); });
