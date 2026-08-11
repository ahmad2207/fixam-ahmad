-- Recovery: idempotently re-applies all changes from migrations 0001-0012.
-- Uses IF NOT EXISTS / DO-EXCEPTION blocks throughout so it is safe to run
-- against a DB that already has some or all of these changes applied.

-- 0001: orders new columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending' NOT NULL;
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_unique" UNIQUE("order_number");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 0002: addresses label
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "label" text DEFAULT 'Home';

-- 0003: receipts payment info
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'paid' NOT NULL;

-- 0004: major schema expansion
DO $$ BEGIN
  ALTER TABLE "store_settings" DROP CONSTRAINT "store_settings_key_unique";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'Nigeria' NOT NULL;
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "postal_code" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sort_order" integer;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "collection" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specifications" jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating" numeric(3, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviews_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "pending_checkouts" ADD COLUMN IF NOT EXISTS "address_id" text;
ALTER TABLE "pending_checkouts" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "pending_checkouts" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "stock_reservations" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "address_id" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "store_name" text DEFAULT 'Fixam Africa' NOT NULL;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'NGN' NOT NULL;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "currency_symbol" text DEFAULT '₦' NOT NULL;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "store_email" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "store_phone" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "store_address" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "delivery_fee" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "free_delivery_threshold" numeric(12, 2);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "delivery_config" jsonb;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "bank_name" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "account_number" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "account_name" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "notify_new_orders" boolean DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "notify_low_stock" boolean DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "low_stock_threshold" integer DEFAULT 5;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "notify_email" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "admin_name" text;
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "details" jsonb;

DO $$ BEGIN
  ALTER TABLE "pending_checkouts" ADD CONSTRAINT "pending_checkouts_address_id_addresses_id_fk"
    FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk"
    FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "key";
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "value";

-- 0005: receipts audit columns
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "created_by" text;
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "sales_rep" text;
ALTER TABLE "receipts" DROP COLUMN IF EXISTS "printed_by";

-- 0006: password reset tokens
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
DO $$ BEGIN
  ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 0007: newsletter subscribers
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);

-- 0008: profiles user_id column (replace id-based FK with dedicated user_id)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "user_id" text;
DO $$ BEGIN
  ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_users_id_fk";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
UPDATE "profiles" SET "user_id" = "id" WHERE "user_id" IS NULL;
DO $$ BEGIN
  ALTER TABLE "profiles" ALTER COLUMN "user_id" SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 0009: store settings social links
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "facebook_url" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "instagram_url" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "twitter_url" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "whatsapp_number" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "youtube_url" text;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "tiktok_url" text;

-- 0010: banners table
CREATE TABLE IF NOT EXISTS "banners" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "image_url" text NOT NULL,
  "eyebrow" text,
  "heading" text NOT NULL,
  "subheading" text,
  "cta_label" text,
  "cta_href" text,
  "theme" text DEFAULT 'dark' NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 0011: banners image_url nullable + banner_type
DO $$ BEGIN
  ALTER TABLE "banners" ALTER COLUMN "image_url" DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "banner_type" text DEFAULT 'hero' NOT NULL;

-- 0012: contact messages
CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "subject" text,
  "message" text NOT NULL,
  "status" text DEFAULT 'new' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
