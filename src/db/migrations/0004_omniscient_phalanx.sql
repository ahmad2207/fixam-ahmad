ALTER TABLE "store_settings" DROP CONSTRAINT "store_settings_key_unique";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "country" text DEFAULT 'Nigeria' NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "collection" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specifications" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rating" numeric(3, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviews_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD COLUMN "address_id" text;--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD COLUMN "customer_email" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "store_name" text DEFAULT 'Fixam Africa' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "currency" text DEFAULT 'NGN' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "currency_symbol" text DEFAULT '₦' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "store_email" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "store_phone" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "store_address" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "delivery_fee" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "free_delivery_threshold" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "delivery_config" jsonb;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "account_name" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "notify_new_orders" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "notify_low_stock" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "low_stock_threshold" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "notify_email" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD COLUMN "admin_name" text;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "pending_checkouts" ADD CONSTRAINT "pending_checkouts_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN "key";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN "value";