# Fixam Africa — Schema Comparison Report
### Lovable (Supabase/PostgreSQL) ↔ Next.js (Drizzle/PostgreSQL)
**Date:** 2026-05-29

> **Scope:** Column-by-column, table-by-table comparison of every schema entity in both projects.  
> The goal is to confirm that every piece of data stored in Lovable has a valid, compatible landing spot in the Next.js schema before any seed files are written.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Identical or functionally equivalent |
| 🔶 | Acceptable stack difference — expected given auth/infrastructure change |
| ➕ | Next.js extra — column or table exists in Next.js but not Lovable |
| ⚠️ | Migration challenge — data exists in Lovable but requires transformation before insert |
| 🔴 | Unacceptable gap — data from Lovable has no home in Next.js schema |

---

## Table Coverage Summary

| Lovable Table | Next.js Table | Status |
|---------------|--------------|--------|
| `auth.users` (Supabase-managed) | `users` + `accounts` + `sessions` | 🔶 Stack difference |
| `profiles` | `profiles` | ✅ |
| `user_roles` | `user_roles` | ✅ |
| `addresses` | `addresses` | ⚠️ |
| `categories` | `categories` | ✅ |
| `products` | `products` | ⚠️ |
| `orders` | `orders` | ⚠️ |
| `order_items` | `order_items` | ✅ |
| `reviews` | `reviews` | ⚠️ |
| `wishlist` | `wishlist` | ✅ |
| `inventory_batches` | `inventory_batches` | ✅ |
| `batch_allocations` | `batch_allocations` | ✅ |
| `stock_reservations` | `stock_reservations` | ✅ |
| `pending_checkouts` | `pending_checkouts` | ✅ |
| `payment_transactions` | `payment_transactions` | ⚠️ |
| `receipts` | `receipts` | ⚠️ |
| `store_settings` | `store_settings` | ✅ |
| `admin_audit_log` | `admin_audit_log` | ✅ |
| *(none)* | `password_reset_tokens` | ➕ |
| *(none)* | `newsletter_subscribers` | ➕ |

**Result: No Lovable table is missing from the Next.js schema. All 18 data tables are covered.**

---

## Part 1 — Auth & Identity

### `auth.users` (Supabase) → `users` (Next.js)

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` (UUID) | `id` (text) | 🔶 | UUID → text, value preserved |
| `email` | `email` | ✅ | |
| `encrypted_password` | `hashed_password` | 🔶 | **Bcrypt (Supabase) ≠ Bcrypt (Next.js)** — different salting/cost. Cannot migrate raw hashes. All existing users must reset password after migration. |
| `raw_user_meta_data.full_name` | `name` | 🔶 | Pulled from Supabase metadata into `profiles.full_name` — map to `users.name` |
| `created_at` | `created_at` | ✅ | |
| *(none)* | `email_verified` | ➕ | Set to `created_at` value for existing users (treat them as verified) |
| *(none)* | `image` | ➕ | Null for all migrated users |

**NextAuth tables** (`accounts`, `sessions`, `verification_tokens`) have no Lovable equivalents — do not migrate, leave empty.

---

### `profiles`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `user_id` (FK, separate PK `id`) | `id` (PK = users.id directly) | 🔶 Use `user_id` value as the profiles `id` |
| `full_name` | `full_name` | ✅ |
| `email` | `email` | ✅ |
| `phone` | `phone` | ✅ |
| `avatar_url` | `avatar_url` | ✅ |
| `created_at` | `created_at` | ✅ |
| `updated_at` | `updated_at` | ✅ |

---

### `user_roles`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `user_id` | `user_id` | ✅ | |
| `role` (enum: `'admin'`, `'customer'`) | `role` (enum: `'admin'`, `'staff'`, `'customer'`) | ✅ | Direct map. Lovable has no `'staff'` value — none in data |
| `created_at` | `created_at` | ✅ | |
| *UNIQUE(user_id, role)* | *userId UNIQUE (one role per user)* | 🔶 | Lovable allows multiple roles per user (e.g. admin + customer). Next.js allows one. If any user has two roles, take the highest (`admin` > `customer`) |

---

## Part 2 — Addresses

### `addresses`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `user_id` | `user_id` | ✅ | |
| `label` | `label` | ✅ | |
| `street_address` | `street_address` | ✅ | |
| `city` | `city` | ✅ | |
| `state` | `state` | ✅ | |
| `postal_code` | `postal_code` | ✅ | |
| `country` | `country` | ✅ | |
| `is_default` | `is_default` | ✅ | |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ | |
| *(none)* | `full_name` (NOT NULL) | ⚠️ | **Migration challenge**: Lovable addresses have no `full_name`. Next.js requires it (NOT NULL). Must fill with empty string `''` or the user's profile `full_name` during migration. |
| *(none)* | `phone` (NOT NULL) | ⚠️ | Same as above — no phone on Lovable addresses. Fill from `profiles.phone` or `''`. |
| *(none)* | `abuja_zone` | ➕ | Leave null — no Lovable data |

---

## Part 3 — Catalogue

### `categories`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` | `id` | ✅ | |
| `name` | `name` | ✅ | |
| `icon` | `icon` | ✅ | |
| `sort_order` | `sort_order` | ✅ | |
| `created_at` | `created_at` | ✅ | |
| *(none)* | `slug` (UNIQUE, NOT NULL) | ➕ | **Must generate during migration**: slugify the `name` (e.g. "Cookware" → `"cookware"`) |
| *(none)* | `description` | ➕ | Leave null |
| *(none)* | `image_url` | ➕ | Leave null |

---

### `products`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` | `id` | ✅ | |
| `name` | `name` | ✅ | |
| `description` | `description` | ✅ | |
| `price` | `price` | ✅ | |
| `original_price` | `compare_at_price` | ✅ | Different name, same concept |
| `cost_price` | `cost_price` | ✅ | |
| `category` (TEXT — stores name) | `category_id` (FK → categories) | ⚠️ | **Migration challenge**: Lovable stores category as a plain text name (e.g. `"Cookware"`). Next.js stores an FK. Seed must look up the category row by name and use its ID. |
| `collection` | `collection` | ✅ | |
| `images` (TEXT[] Postgres array) | `images` (JSONB) | ⚠️ | **Migration challenge**: Lovable stores as a native Postgres array `{url1,url2}`. Next.js expects a JSON array `["url1","url2"]`. CSV export will show as `{url1,url2}` — must convert. Also, Lovable has no separate `image_url` (first image) — derive `image_url` from `images[0]`. |
| `stock` | `stock` | ✅ | |
| `status` (`'active'`, `'draft'`, `'archived'`) | `status` (text) + `is_active` (boolean) | ⚠️ | **Migration challenge**: Map `status='active'` → `isActive=true`, `status='draft'/'archived'` → `isActive=false`. Set `status` column to match. |
| `rating` | `rating` | ✅ | |
| `reviews_count` | `reviews_count` | ✅ | |
| `variations` (TEXT[] — flat strings like `["Red","Blue"]`) | `variations` (JSONB — structured `[{name,options:[]}]`) | ⚠️ | **Migration challenge — most complex transformation**. Lovable stores variations as a flat array of option values. Next.js stores them as objects with a `name` and `options[]`. There is no way to know the variation *name* ("Color", "Size", etc.) from the flat array alone. Options: (a) import as a single group named `"Options"` → `[{name:"Options",options:["Red","Blue"]}]`; (b) leave variations as empty `[]` and let admin re-enter. |
| `specifications` (JSONB) | `specifications` (JSONB) | ✅ | |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ | |
| *(none)* | `slug` (UNIQUE, NOT NULL) | ➕ | **Must generate**: slugify the product name. Handle duplicates by appending a counter. |
| *(none)* | `sku` | ➕ | Leave null |
| *(none)* | `tags` | ➕ | Leave as empty array `[]` |
| *(none)* | `is_featured` | ➕ | Default `false` for all migrated products |
| *(none)* | `weight` | ➕ | Leave null |

---

## Part 4 — Orders

### `orders`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` | `id` | ✅ | |
| `order_number` | `order_number` | ✅ | |
| `user_id` (NOT NULL) | `user_id` (nullable) | ✅ | All Lovable orders have a user — map directly |
| `address_id` | `address_id` | ✅ | |
| `shipping_address` (JSONB `{name,phone,street,city,state}`) | `shipping_full_name`, `shipping_phone`, `shipping_street_address`, `shipping_city`, `shipping_state` | ⚠️ | **Migration challenge**: Lovable stores the full shipping address as one JSONB blob. Next.js splits it into individual columns. Seed must destructure the JSONB and map each key to the correct column. |
| `subtotal` | `subtotal` | ✅ | NUMERIC → text string (use `.toString()`) |
| `delivery_fee` | `delivery_fee` | ✅ | Same conversion |
| `total` | `total` | ✅ | Same conversion |
| `status` (values: `'pending'`, `'paid'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`) | `status` (values: `'pending'`, `'confirmed'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`, `'refunded'`) | ⚠️ | **Migration challenge**: Lovable `'paid'` → Next.js `'confirmed'`. All other values map 1:1. |
| `payment_method` (`'card'`, `'transfer'`, `'cash'`) | `payment_method` (text) | ✅ | |
| `payment_status` (`'pending'`, `'paid'`, `'failed'`, `'refunded'`) | `payment_status` (text) | ✅ | |
| `notes` | `notes` | ✅ | |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ | |
| *(none)* | `guest_email` | ➕ | Leave null — all Lovable orders have a user |
| *(none)* | `sale_type` | ➕ | Default `'online'` for all migrated orders |
| *(none)* | `checkout_id` | ➕ | Leave null |
| *(none)* | `shipping_abuja_zone` | ➕ | Leave null |

---

### `order_items`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `order_id` | `order_id` | ✅ |
| `product_id` | `product_id` | ✅ |
| `product_name` | `product_name` | ✅ |
| `product_image` | `product_image` | ✅ |
| `quantity` | `quantity` | ✅ |
| `price` | `price` | ✅ (NUMERIC → text) |
| `variation` | `variation` | ✅ |
| `from_reservation` | `from_reservation` | ✅ |
| `created_at` | `created_at` | ✅ |

---

## Part 5 — Reviews & Wishlist

### `reviews`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` | `id` | ✅ | |
| `product_id` | `product_id` | ✅ | |
| `user_id` | `user_id` | ✅ | |
| `rating` | `rating` | ✅ | |
| `comment` | `body` | ⚠️ | **Migration challenge**: Column renamed. Lovable `comment` → Next.js `body`. |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ | |
| *(none)* | `title` | ➕ | Leave null for all migrated reviews |

---

### `wishlist`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `user_id` | `user_id` | ✅ |
| `product_id` | `product_id` | ✅ |
| `created_at` | `created_at` | ✅ |

---

## Part 6 — Inventory

### `inventory_batches`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `product_id` | `product_id` | ✅ |
| `quantity_available` | `quantity_available` | ✅ |
| `cost_price` | `cost_price` | ✅ |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ |
| *(none)* | `notes` | ➕ Leave null |

---

### `batch_allocations`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `order_item_id` | `order_item_id` | ✅ |
| `batch_id` | `batch_id` | ✅ |
| `quantity` | `quantity` | ✅ |
| `cost_price_at_time` | `cost_price_at_time` | ✅ |
| `created_at` | `created_at` | ✅ |

---

### `stock_reservations`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `checkout_id` | `checkout_id` | ✅ |
| `product_id` | `product_id` | ✅ |
| `batch_id` | `batch_id` | ✅ |
| `quantity` | `quantity` | ✅ |
| `cost_price` | `cost_price` | ✅ |
| `status` | `status` | ✅ |
| `expires_at` | `expires_at` | ✅ |
| `consumed_order_item_id` | `consumed_order_item_id` | ✅ |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ |

---

## Part 7 — Payments & Receipts

### `payment_transactions`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` | `id` | ✅ | |
| `order_id` | `order_id` | ✅ | |
| `checkout_id` | `checkout_id` | ✅ | |
| `tx_ref` | `flutterwave_tx_ref` | ✅ | Different column name, same data |
| `flutterwave_transaction_id` | `flutterwave_transaction_id` | ✅ | |
| `amount` | `amount` | ✅ | NUMERIC → text |
| `currency` | `currency` | ✅ | |
| `status` | `status` | ✅ | Values align |
| `customer_name` | `customer_name` | ✅ | |
| `customer_email` | `customer_email` | ✅ | |
| `gateway_response` (JSONB) | `raw_response` (TEXT) | ⚠️ | **Migration challenge**: Must `JSON.stringify()` the JSONB value before insert. |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ | |

---

### `receipts`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `id` | `id` | ✅ | |
| `receipt_number` | `receipt_number` | ✅ | |
| `order_id` | `order_id` | ✅ | |
| `sale_type` | `type` | ✅ | Different column name, same enum values |
| `customer_name` | `customer_name` | ✅ | |
| `customer_email` | `customer_email` | ✅ | |
| `customer_phone` | `customer_phone` | ✅ | |
| `items` (JSONB) | `items` (TEXT) | ⚠️ | **Migration challenge**: Must `JSON.stringify()` before insert |
| `subtotal` / `delivery_fee` / `total` | same | ✅ | NUMERIC → text |
| `payment_method` | `payment_method` | ✅ | |
| `payment_status` | `payment_status` | ✅ | |
| `notes` | `notes` | ✅ | |
| `sales_rep` | `sales_rep` | ✅ | |
| `created_by` | `created_by` | ✅ | |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ | |
| *(none)* | `pdf_url`, `thermal_image_url`, `drive_file_id`, `drive_file_url` | ➕ | Leave null |

---

## Part 8 — Settings & Admin

### `store_settings`

| Lovable column | Next.js column | Status |
|----------------|---------------|--------|
| `store_name` | `store_name` | ✅ |
| `store_email` | `store_email` | ✅ |
| `store_phone` | `store_phone` | ✅ |
| `store_address` | `store_address` | ✅ |
| `logo_url` | `logo_url` | ✅ |
| `delivery_fee` | `delivery_fee` | ✅ |
| `free_delivery_threshold` | `free_delivery_threshold` | ✅ |
| `currency` | `currency` | ✅ |
| `currency_symbol` | `currency_symbol` | ✅ |
| `bank_name` | `bank_name` | ✅ |
| `account_number` | `account_number` | ✅ |
| `account_name` | `account_name` | ✅ |
| `notify_new_orders` | `notify_new_orders` | ✅ |
| `notify_low_stock` | `notify_low_stock` | ✅ |
| `low_stock_threshold` | `low_stock_threshold` | ✅ |
| `notify_email` | `notify_email` | ✅ |
| `delivery_config` (JSONB) | `delivery_config` (JSONB) | ✅ |
| `created_at` / `updated_at` | `created_at` / `updated_at` | ✅ |

---

### `admin_audit_log`

| Lovable column | Next.js column | Status | Note |
|----------------|---------------|--------|------|
| `admin_user_id` | `user_id` | ✅ | Different column name |
| `admin_name` | `admin_name` | ✅ | |
| `action` | `action` | ✅ | |
| `entity_type` | `entity_type` | ✅ | |
| `entity_id` | `entity_id` | ✅ | |
| `details` (JSONB) | `details` (JSONB) | ✅ | |
| `created_at` | `created_at` | ✅ | |
| *(none)* | `before`, `after`, `ip_address`, `user_agent` | ➕ | Leave null for migrated rows |

---

## Part 9 — Tables Exclusive to Next.js (Do Not Migrate)

| Table | Reason |
|-------|--------|
| `accounts` | NextAuth OAuth provider accounts — built fresh when users log in via Google |
| `sessions` | NextAuth sessions — built at runtime |
| `verification_tokens` | NextAuth email verification — not needed for migrated users |
| `password_reset_tokens` | No equivalent in Lovable (Supabase handles natively) — starts empty |
| `newsletter_subscribers` | New feature added during rewrite — starts empty |
| `pending_checkouts` | Transient checkout state — do not migrate (stale) |

---

## Summary of All Gaps

### 🔴 Unacceptable Gaps
**None.** Every column and table in the Lovable schema has a valid landing spot in the Next.js schema.

---

### ⚠️ Migration Challenges (data transformation required — 8 total)

| # | Table | Challenge | Resolution in seed script |
|---|-------|-----------|--------------------------|
| M1 | `products` | `variations` is `TEXT[]` flat strings → JSONB structured objects | Wrap as `[{name: "Options", options: [...]}]`. Admin can refine after import. |
| M2 | `products` | `category` is text name → `category_id` FK | Look up `categories.id WHERE name = product.category` during seeding |
| M3 | `products` | `images` is `TEXT[]` Postgres array → JSONB array | Parse `{url1,url2}` CSV format → `["url1","url2"]`. Derive `image_url` from first element. |
| M4 | `products` | `status + is_active` split | `status='active'` → `is_active=true`; `'draft'/'archived'` → `is_active=false` |
| M5 | `orders` | `shipping_address` JSONB blob → 5 flat columns | Destructure `{name→shipping_full_name, phone→shipping_phone, street→shipping_street_address, city, state}` |
| M6 | `orders` | `status='paid'` not in Next.js enum | Map `'paid'` → `'confirmed'` |
| M7 | `reviews` | Column renamed: `comment` → `body` | Direct rename in seed script |
| M8 | `payment_transactions` + `receipts` | JSONB columns → TEXT | `JSON.stringify(value)` before insert |

---

### 🔶 Acceptable Stack Differences (18 total — all expected)

| # | Difference | Why acceptable |
|---|------------|---------------|
| S1 | `auth.users` (Supabase) → custom `users` table | Different auth systems. Passwords cannot be migrated — users must reset. |
| S2 | `accounts`, `sessions`, `verification_tokens` tables (new) | Required for NextAuth adapter — no Lovable equivalent |
| S3 | `password_reset_tokens` table (new) | Supabase handles this natively; Next.js needs its own |
| S4 | `profiles.id` = `users.id` (composite) vs separate UUID in Lovable | Structural refactor, no data loss |
| S5 | RLS policies → server-side auth checks | PostgreSQL RLS replaced by Next.js middleware + auth session checks |
| S6 | Database triggers → application code | FIFO allocation, `updated_at`, order numbers now handled in API routes |
| S7 | `pg_cron` for reservation expiry → external cron hitting `/api/reservations/expire` | Infrastructure difference |
| S8 | Supabase Storage buckets → DigitalOcean Spaces | Image URLs may differ — product images need re-hosting or URL update |
| S9 | `products_public` view → server-side `isActive=true` filter | View replaced by application-level filtering |
| S10 | `user_roles` UNIQUE(user_id, role) → userId UNIQUE (one role) | Simplification. If any user has two roles, keep highest. |
| S11 | Role enum adds `'staff'` | Next.js extension — no Lovable data affected |
| S12 | `addresses` adds `full_name` + `phone` (NOT NULL) | Lovable didn't have these on addresses — fill from `profiles` during migration |
| S13 | `orders.user_id` NOT NULL → nullable + `guest_email` | Guest checkout support added; all Lovable orders have users |
| S14 | `orders` adds `sale_type` enum | POS support added; all Lovable orders are `'online'` |
| S15 | `pending_checkouts` adds `status` + `expires_at` | Better lifecycle management; transient data not migrated anyway |
| S16 | `payment_transactions.gateway_response` (JSONB) → `raw_response` (TEXT) | Same data, different storage type |
| S17 | `receipts.sale_type` → `receipts.type` | Renamed column, same values |
| S18 | `categories` adds `slug` (required) | Must generate from `name` during migration |

---

## ➕ Next.js Extras (columns/tables not in Lovable — no migration needed)

`products`: `slug`, `sku`, `tags`, `is_featured`, `weight`, `image_url`  
`categories`: `slug`, `description`, `image_url`  
`addresses`: `full_name`, `phone`, `abuja_zone`  
`orders`: `guest_email`, `sale_type`, `checkout_id`, `shipping_abuja_zone`  
`inventory_batches`: `notes`  
`admin_audit_log`: `before`, `after`, `ip_address`, `user_agent`  
`receipts`: `pdf_url`, `thermal_image_url`, `drive_file_id`, `drive_file_url`  
Tables: `password_reset_tokens`, `newsletter_subscribers`, `accounts`, `sessions`, `verification_tokens`

---

## Pre-Migration Action Required

Before writing a single seed row, one issue needs a decision:

**Image URLs** — Lovable stores product images in a Supabase Storage bucket (`product-images`). These are public URLs like `https://<project>.supabase.co/storage/v1/object/public/product-images/...`. After migration those URLs will still work (Supabase project stays live), but if the Lovable project is ever shut down the images disappear. Recommendation: re-upload all images to DigitalOcean Spaces before or alongside the migration and update the URLs in the seed data.

**User passwords** — Cannot be migrated. All existing users will need to use "Forgot Password" to set a new password on first login to the new site. Plan a communication to users before go-live.
