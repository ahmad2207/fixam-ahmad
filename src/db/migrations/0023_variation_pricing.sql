ALTER TABLE "products" ADD COLUMN "priced_variation_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "default_variation_option" text;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD COLUMN "variation_option" text;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD COLUMN "delivery_group_id" text;
