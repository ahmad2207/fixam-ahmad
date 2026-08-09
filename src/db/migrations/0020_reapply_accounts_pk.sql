-- Migration 0016 was recorded as applied in the migration tracker, but its
-- DDL never actually took effect on production: accounts.expires_at is still
-- text, and neither composite primary key exists. Re-apply the same changes
-- here, guarded so this is safe to run regardless of which parts (if any) of
-- 0016 actually landed.

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'expires_at') = 'text' THEN
    ALTER TABLE "accounts" ALTER COLUMN "expires_at" TYPE integer USING NULLIF("expires_at", '')::integer;
  END IF;
END $$;--> statement-breakpoint

-- Remove any duplicate (provider, provider_account_id) rows before adding the PK.
DELETE FROM "accounts" a
USING "accounts" b
WHERE a.ctid < b.ctid
  AND a.provider = b.provider
  AND a.provider_account_id = b.provider_account_id;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounts_provider_provider_account_id_pk') THEN
    ALTER TABLE "accounts" ADD CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY ("provider", "provider_account_id");
  END IF;
END $$;--> statement-breakpoint

-- Same dedup for verification_tokens before its composite PK.
DELETE FROM "verification_tokens" a
USING "verification_tokens" b
WHERE a.ctid < b.ctid
  AND a.identifier = b.identifier
  AND a.token = b.token;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'verification_tokens_identifier_token_pk') THEN
    ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY ("identifier", "token");
  END IF;
END $$;
