ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'ready_for_pickup';--> statement-breakpoint
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'picked_up';--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "delivery_method" AS ENUM ('delivery', 'pickup');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method" "delivery_method" NOT NULL DEFAULT 'delivery';--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD COLUMN "delivery_method" "delivery_method" NOT NULL DEFAULT 'delivery';
