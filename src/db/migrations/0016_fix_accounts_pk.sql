-- Fix accounts table: change expires_at from text to integer and add composite primary key
-- Safe: accounts table is only used for OAuth providers (Google etc.), no credential rows stored here

-- Step 1: change expires_at column type from text to integer
ALTER TABLE "accounts" ALTER COLUMN "expires_at" TYPE integer USING NULLIF("expires_at", '')::integer;--> statement-breakpoint

-- Step 2: remove any duplicate (provider, provider_account_id) rows before adding PK
-- Keep the most recent row (by ctid) if duplicates exist
DELETE FROM "accounts" a
USING "accounts" b
WHERE a.ctid < b.ctid
  AND a.provider = b.provider
  AND a.provider_account_id = b.provider_account_id;--> statement-breakpoint

-- Step 3: add composite primary key
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY ("provider", "provider_account_id");--> statement-breakpoint

-- Step 4: add composite primary key on verification_tokens
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY ("identifier", "token");
