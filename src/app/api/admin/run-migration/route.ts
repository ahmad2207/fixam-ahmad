import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    await db.execute(sql`
      ALTER TABLE "accounts" ALTER COLUMN "expires_at" TYPE integer USING NULLIF("expires_at", '')::integer
    `);
    await db.execute(sql`
      DELETE FROM "accounts" a
      USING "accounts" b
      WHERE a.ctid < b.ctid
        AND a.provider = b.provider
        AND a.provider_account_id = b.provider_account_id
    `);
    await db.execute(sql`
      ALTER TABLE "accounts" ADD CONSTRAINT "accounts_provider_provider_account_id_pk"
      PRIMARY KEY ("provider", "provider_account_id")
    `);
    await db.execute(sql`
      ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk"
      PRIMARY KEY ("identifier", "token")
    `);
    return NextResponse.json({ ok: true, message: 'Migration 0016 applied' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
