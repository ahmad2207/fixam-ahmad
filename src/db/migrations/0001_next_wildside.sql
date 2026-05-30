ALTER TABLE "orders" ADD COLUMN "order_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_unique" UNIQUE("order_number");