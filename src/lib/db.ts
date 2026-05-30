import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Prevent multiple instances in development (hot reload)
const globalForDb = globalThis as unknown as { _pgClient: postgres.Sql };

const client =
  globalForDb._pgClient ??
  postgres(process.env.DATABASE_URL!, {
    ssl: 'require',
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDb._pgClient = client;

export const db = drizzle(client, { schema });
