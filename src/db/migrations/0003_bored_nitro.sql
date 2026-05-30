ALTER TABLE "receipts" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "payment_status" text DEFAULT 'paid' NOT NULL;