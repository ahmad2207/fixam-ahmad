CREATE TYPE "public"."role" AS ENUM('admin', 'staff', 'customer');--> statement-breakpoint
CREATE TYPE "public"."checkout_status" AS ENUM('pending', 'paid', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'consumed', 'released', 'expired');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('online', 'pos', 'offline');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('initiated', 'pending', 'successful', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."receipt_type" AS ENUM('online', 'pos', 'offline');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" text,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"hashed_password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"street_address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"abuja_zone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"category_id" text,
	"image_url" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"stock" integer DEFAULT 0 NOT NULL,
	"sku" text,
	"variations" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"weight" numeric(8, 3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"cost_price" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"batch_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"cost_price_at_time" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_checkouts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"guest_email" text,
	"items" jsonb NOT NULL,
	"shipping_address" jsonb,
	"subtotal" text NOT NULL,
	"delivery_fee" text NOT NULL,
	"total" text NOT NULL,
	"status" "checkout_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"checkout_id" text NOT NULL,
	"product_id" text NOT NULL,
	"batch_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"cost_price" numeric(12, 2) NOT NULL,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"consumed_order_item_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"guest_email" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"sale_type" "sale_type" DEFAULT 'online' NOT NULL,
	"subtotal" text NOT NULL,
	"delivery_fee" text DEFAULT '0' NOT NULL,
	"total" text NOT NULL,
	"shipping_full_name" text,
	"shipping_phone" text,
	"shipping_street_address" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_abuja_zone" text,
	"notes" text,
	"checkout_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"product_name" text NOT NULL,
	"product_image" text,
	"quantity" integer NOT NULL,
	"price" text NOT NULL,
	"variation" text,
	"from_reservation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"checkout_id" text,
	"flutterwave_tx_ref" text,
	"flutterwave_transaction_id" text,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" "payment_status" DEFAULT 'initiated' NOT NULL,
	"raw_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transactions_flutterwave_tx_ref_unique" UNIQUE("flutterwave_tx_ref")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"receipt_number" text NOT NULL,
	"order_id" text,
	"type" "receipt_type" DEFAULT 'online' NOT NULL,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"subtotal" text NOT NULL,
	"delivery_fee" text DEFAULT '0' NOT NULL,
	"total" text NOT NULL,
	"items" text NOT NULL,
	"pdf_url" text,
	"thermal_image_url" text,
	"drive_file_id" text,
	"drive_file_url" text,
	"notes" text,
	"printed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_allocations" ADD CONSTRAINT "batch_allocations_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;