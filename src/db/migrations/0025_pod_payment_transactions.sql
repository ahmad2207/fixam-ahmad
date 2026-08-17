DO $$ BEGIN
 CREATE TYPE "payment_provider" AS ENUM ('paystack', 'pod');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN "provider" "payment_provider" NOT NULL DEFAULT 'paystack';
