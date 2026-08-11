ALTER TABLE "store_settings" ADD COLUMN "bank_name_2" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "account_number_2" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "account_name_2" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "payment_instructions" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "notify_payment_confirmed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "notify_order_cancelled" boolean DEFAULT true;
