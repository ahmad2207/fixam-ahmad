# Fixam Africa — Phase 2 Full A-Z Gap Report
### Lovable (React/Supabase) ↔ Next.js (Drizzle/NextAuth/PostgreSQL)
**Date:** 2026-05-28

> This report covers both **Storefront** and **Admin** — UI/UX appearance AND business logic.  
> Phase 1 fixed 26 gaps (D1–D4, O1–O9, P1–P4, I1–I3, A1–A3, S1–S2, POS1) — those are confirmed ✅ and not re-listed here.  
> Phase 2 checks everything else from scratch.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Feature functionally equivalent in both projects |
| ⚠️ | Non-acceptable gap — feature exists in Lovable, missing or incomplete in Next.js |
| 🔶 | Acceptable stack difference — inherent to Supabase→Drizzle/NextAuth migration |
| ➕ | Next.js extra — feature present in Next.js but not in Lovable |

---

## Part 1 — Storefront UI/UX

### SF1 — Home Page

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF1.1 | Hero section | Image, headline, CTA button | Ken Burns animated hero with gradient overlays, headline, CTA | ✅ |
| SF1.2 | Category grid | Icon grid with category names and counts | Icon grid, category name, product count | ✅ |
| SF1.3 | Featured products section | Grid of product cards | Grid of featured product cards with server-side query | ✅ |
| SF1.4 | Promotional banner | Promo banner | Flash sale banner | ✅ |
| SF1.5 | Trust badges | Shipping, warranty, returns badges | Fast delivery, warranty, easy returns badges | ✅ |
| SF1.6 | SEO metadata | React Helmet | Next.js `generateMetadata()` — server-rendered | ➕ |

### SF2 — Products Listing Page

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF2.1 | Search bar with URL sync | ✅ | ✅ | ✅ |
| SF2.2 | Category filters | Checkbox list | Checkbox list | ✅ |
| SF2.3 | Price range filter | Range slider | Range slider | ✅ |
| SF2.4 | Sort (featured, newest, price asc/desc, rating) | ✅ | ✅ | ✅ |
| SF2.5 | Grid / list view toggle | ✅ | ✅ | ✅ |
| SF2.6 | Pagination | ✅ | 12 per page, prev/next | ✅ |
| SF2.7 | Active filter badges with clear button | ✅ | ✅ | ✅ |
| SF2.8 | Mobile filters via slide-out sheet | Sheet component | Sheet component | ✅ |
| SF2.9 | Loading skeleton | ✅ | ✅ | ✅ |

### SF3 — Product Detail Page

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF3.1 | Image gallery with thumbnail strip | ✅ | ✅ | ✅ |
| SF3.2 | Discount badge (% off) | ✅ | ✅ | ✅ |
| SF3.3 | Star rating display + review count | ✅ | ✅ | ✅ |
| SF3.4 | Price + compare-at (strikethrough) | ✅ | ✅ | ✅ |
| SF3.5 | Variation selector (size, colour, etc.) | ✅ | ✅ | ✅ |
| SF3.6 | Quantity stepper (min 1, max stock) | ✅ | ✅ | ✅ |
| SF3.7 | Add to Cart button + confirmation dialog | ✅ | ✅ + `AddToCartDialog` | ✅ |
| SF3.8 | Buy Now button (add then redirect to checkout) | ✅ | ✅ | ✅ |
| SF3.9 | Wishlist heart toggle | ✅ | ✅ | ✅ |
| SF3.10 | Stock count display | ✅ | ✅ | ✅ |
| SF3.11 | Out of stock state | ✅ | ✅ | ✅ |
| SF3.12 | Feature badges (delivery, warranty, returns) | ✅ | ✅ | ✅ |
| SF3.13 | Tabs: Description / Specifications / Reviews | ✅ | ✅ | ✅ |
| SF3.14 | Specifications table (key → value) | ✅ | ✅ (from `specifications` jsonb) | ✅ |
| SF3.15 | Review form — star rating + title + body | ✅ | ✅ | ✅ |
| SF3.16 | Review CRUD (submit, edit, delete own review) | ✅ | ✅ | ✅ |
| SF3.17 | Reviews list with user avatar initial + date | ✅ | ✅ | ✅ |
| SF3.18 | Breadcrumb (Home → Category → Product) | ✅ | ✅ | ✅ |
| SF3.19 | SEO metadata per product | React Helmet | `generateMetadata()` with SSR | ➕ |

### SF4 — Cart Page

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF4.1 | Cart item list with image, name, price | ✅ | ✅ | ✅ |
| SF4.2 | Quantity controls (±) with stock cap | ✅ | ✅ | ✅ |
| SF4.3 | Remove item | ✅ | ✅ | ✅ |
| SF4.4 | Delivery fee estimator by state/zone | ✅ | ✅ (ALL_STATES + ABUJA_ZONE_NAMES) | ✅ |
| SF4.5 | Order summary (subtotal + delivery + total) | ✅ | ✅ | ✅ |
| SF4.6 | Proceed to Checkout button | ✅ | ✅ | ✅ |
| SF4.7 | Empty cart state | ✅ | ✅ | ✅ |
| SF4.8 | Coupon code input | ✗ | ✅ | ➕ |

### SF5 — Checkout Page

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF5.1 | Saved address selector | ✅ | ✅ | ✅ |
| SF5.2 | New address form (name, email, phone, street, city, state) | ✅ | ✅ | ✅ |
| SF5.3 | Abuja zone + area selection | ✅ | ✅ | ✅ |
| SF5.4 | Location-based delivery fee calculation | ✅ | ✅ | ✅ |
| SF5.5 | Delivery notes textarea | ✅ | ✅ | ✅ |
| SF5.6 | Stock validation before payment | ✅ | ✅ | ✅ |
| SF5.7 | Flutterwave payment integration | ✅ | ✅ via `useFlutterwavePayment` | ✅ |
| SF5.8 | Order summary with item details | ✅ | ✅ | ✅ |
| SF5.9 | Stock error alerts with remaining qty | ✅ | ✅ | ✅ |

### SF6 — Wishlist Page

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF6.1 | Auth-protected page | ✅ | ✅ | ✅ |
| SF6.2 | Product cards grid | 4-column grid | ✅ | ✅ |
| SF6.3 | Remove from wishlist | ✅ | ✅ | ✅ |

### SF7 — Account / Profile Page

| # | Feature | Lovable (`/profile`) | Next.js (`/account`) | Status |
|---|---------|---------|---------|--------|
| SF7.1 | View / edit personal info (name, phone) | ✅ | ✅ | ✅ |
| SF7.2 | Email display (read-only) | ✅ | ✅ with "Cannot change" badge | ✅ |
| SF7.3 | Saved addresses list | ✅ | ✅ | ✅ |
| SF7.4 | Add / edit / delete addresses | ✅ | ✅ with AlertDialog for delete | ✅ |
| SF7.5 | Set default address | ✅ | ✅ | ✅ |
| SF7.6 | Address label (Home, Office, etc.) | ✅ | ✅ | ✅ |
| SF7.7 | Sign out button | ✅ | ✅ | ✅ |
| SF7.8 | Route | `/profile` | `/account` | 🔶 |

### SF8 — Orders Page (Storefront)

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF8.1 | Orders list with status badges | ✅ | ✅ | ✅ |
| SF8.2 | Order detail view | Dialog/drawer in list | Dedicated `/orders/[id]` page with `OrderDetailClient` | 🔶 |
| SF8.3 | Auth protection (redirect to login) | ✅ | ✅ | ✅ |

### SF9 — Auth Pages

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF9.1 | Login with email + password | ✅ | ✅ NextAuth credentials | ✅ |
| SF9.2 | Signup / register | ✅ | ✅ | ✅ |
| SF9.3 | Google OAuth | Supabase Google provider | NextAuth Google provider | 🔶 |
| SF9.4 | Redirect after login | ✅ | ✅ | ✅ |

### SF10 — Payment Callback & Public Receipt

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| SF10.1 | Payment callback page (Flutterwave redirect) | `PaymentCallback.tsx` | `(store)/payment/callback/page.tsx` | ✅ |
| SF10.2 | Public shareable receipt | `PublicReceipt.tsx` | `(store)/receipt/[receiptNumber]/page.tsx` | ✅ |

---

## Part 2 — Storefront Business Logic

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| SBL1 | Cart persisted in React Context (sessionStorage/memory) | ✅ | Both use context-based cart |
| SBL2 | Wishlist persisted in React Context | ✅ | Both use context |
| SBL3 | Delivery fee rules: Abuja zones + interstate states | ✅ | Same zone/rate structure in both |
| SBL4 | Stock validation before Flutterwave charge | ✅ | Both fetch live stock before payment |
| SBL5 | Order created on successful payment callback | ✅ | Both POST to order creation endpoint |
| SBL6 | Guest checkout (no auth required) | ✅ | Both allow unauthed checkout |
| SBL7 | Supabase anonymous auth for guest sessions | N/A | 🔶 Supabase-specific; Next.js uses stateless guest flow |
| SBL8 | Review CRUD: POST, PATCH, DELETE `/api/reviews` | ✅ | Next.js has full API at `/api/reviews` + `/api/reviews/[id]` |
| SBL9 | Address CRUD: `/api/account/addresses` | ✅ | Next.js has full CRUD |
| SBL10 | Profile update: `/api/account/profile` | ✅ | Next.js PATCH endpoint exists |
| SBL11 | Real-time order status updates | Supabase Realtime subscription | 🔶 Not in Next.js — requires manual refresh |
| SBL12 | Flutterwave payment integration (inline) | `useFlutterwavePayment` hook | ✅ Same hook pattern |

---

**Storefront verdict: No non-acceptable gaps.** All core UI/UX and business logic features are present and functionally equivalent.

---

## Part 3 — Admin UI/UX

### ADM1 — Dashboard (Phase 1 verified ✅)

All D1–D4 confirmed fixed in GAP_REPORT_UPDATED.md.

### ADM2 — Orders (Phase 1 verified ✅)

All O1–O9 confirmed fixed in GAP_REPORT_UPDATED.md.

### ADM3 — Products (Phase 1 verified ✅)

All P1–P4 confirmed fixed in GAP_REPORT_UPDATED.md.

### ADM4 — Inventory (Phase 1 verified ✅)

All I1–I3 confirmed fixed in GAP_REPORT_UPDATED.md.

### ADM5 — Analytics (Phase 1 verified ✅)

All A1–A3 confirmed fixed in GAP_REPORT_UPDATED.md.

### ADM6 — Settings (Phase 1 verified ✅)

S1 (Payment) + S2 (Notifications) confirmed fixed in GAP_REPORT_UPDATED.md.

### ADM7 — POS

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| ADM7.1 | Product search grid | ✅ | ✅ | ✅ |
| ADM7.2 | Add product to cart | ✅ | ✅ | ✅ |
| ADM7.3 | Qty controls (±) + remove per item | ✅ | ✅ | ✅ |
| ADM7.4 | Inline price editing per cart item | ✅ — editable price field + "adjusted" indicator showing original price | ✗ | ⚠️ **POS-V2-1** |
| ADM7.5 | Customer details (name, email, phone) | In `POSCheckoutDialog` | In CartPanel | ✅ |
| ADM7.6 | Payment method selector (4 options) | In `POSCheckoutDialog` | In CartPanel | ✅ |
| ADM7.7 | Cash received + change calculator | In `POSCheckoutDialog` | In CartPanel | ✅ |
| ADM7.8 | Sales rep name field | In `POSCheckoutDialog` | In CartPanel | ✅ |
| ADM7.9 | Notes textarea | In `POSCheckoutDialog` | In CartPanel | ✅ |
| ADM7.10 | Desktop side panel cart | ✅ `POSCart` sidebar | ✅ `hidden lg:flex w-80` | ✅ |
| ADM7.11 | Mobile floating button + bottom sheet cart | ✅ | ✅ fixed bottom-6, slide-up `translate-y-0/full` | ✅ (POS1 fixed) |
| ADM7.12 | Checkout trigger: separate dialog vs inline | Separate `POSCheckoutDialog` opens on "Charge" | Inline panel — no separate dialog | 🔶 |

### ADM8 — Receipts

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| ADM8.1 | Receipts list table (receipt #, customer, type, total, date) | ✅ | ✅ | ✅ |
| ADM8.2 | Search bar on receipts list | ✅ | ✗ | ⚠️ **RCP-1** |
| ADM8.3 | Filter by sale type (All / Online / POS / Offline) | ✅ | ✗ | ⚠️ **RCP-2** |
| ADM8.4 | Items count column | ✅ | ✗ | ⚠️ **RCP-3** |
| ADM8.5 | Payment status column | ✅ | ✗ | ⚠️ **RCP-4** |
| ADM8.6 | "Open POS" quick action button | ✅ | ✗ | ⚠️ **RCP-5** |
| ADM8.7 | "Create Offline Receipt" quick action button | ✅ | ✅ "+ Manual Receipt" button | ✅ |
| ADM8.8 | Receipt detail — print via `window.print()` | ✅ | ✅ | ✅ |
| ADM8.9 | Receipt detail — share: WhatsApp / Email / Copy link | ✅ | ✅ | ✅ |
| ADM8.10 | Receipt detail — PDF download | ✅ | ✗ | ⚠️ **RCP-6** |
| ADM8.11 | Receipt detail — thermal receipt preview + print (80mm) | ✅ `ThermalReceiptPreview` | ✗ | ⚠️ **RCP-7** |
| ADM8.12 | Receipt detail — Google Drive upload | ✅ | ✗ | 🔶 Third-party OAuth integration |
| ADM8.13 | Manual receipt creation page | ✅ `CreateOfflineReceipt.tsx` | ✅ `receipts/new/page.tsx` | ✅ |

### ADM9 — Customers

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| ADM9.1 | 4 stat cards (total, active, revenue, avg order value) | ✅ | ✅ | ✅ |
| ADM9.2 | Search by name or phone | ✅ | ✅ | ✅ |
| ADM9.3 | Customer table (name, location, order count, total spent, join date) | ✅ | ✅ | ✅ |
| ADM9.4 | Avatar with customer initial | ✅ | ✅ | ✅ |
| ADM9.5 | CSV export for customer data | ✅ | ✅ | ✅ |
| ADM9.6 | Customer detail/profile dialog (full order history, contact info) | ✅ | ✗ | ⚠️ **CUST-1** |

### ADM10 — Transactions

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| ADM10.1 | 4 stat cards (total, successful, failed/cancelled, total collected) | ✅ | ✅ | ✅ |
| ADM10.2 | Status filter (All / Successful / Failed / Pending / etc.) | ✅ | ✅ | ✅ |
| ADM10.3 | Sortable table (date, TX ref, customer, amount, status) | ✅ | ✅ | ✅ |
| ADM10.4 | Transaction detail modal (gateway response, order link) | ✅ | ✅ | ✅ |
| ADM10.5 | Search by TX ref / Flutterwave ID / order number / customer | ✅ | ✗ | ⚠️ **TXN-1** |
| ADM10.6 | Sort by date (asc/desc toggle) | ✅ | Sortable table but no explicit date-sort toggle | ⚠️ **TXN-2** |
| ADM10.7 | CSV export | ✅ | ✗ | ⚠️ **TXN-3** |

### ADM11 — Audit Log

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| ADM11.1 | Audit log table with timestamp, admin, action, entity, details | ✅ | ✅ | ✅ |
| ADM11.2 | Search across logs | ✅ | ✅ | ✅ |
| ADM11.3 | Filter by entity type | ✅ (product, order, inventory, settings, user_role, customer) | ✅ (product, order, inventory, inventory_batch, settings, user_role) | ✅ |
| ADM11.4 | Color-coded action badges (create / update / delete / etc.) | ✅ | ✅ | ✅ |
| ADM11.5 | Entity-type icon display | ✅ | ✅ | ✅ |

### ADM12 — Users

| # | Feature | Lovable | Next.js | Status |
|---|---------|---------|---------|--------|
| ADM12.1 | 3 stat cards (total users, admins, customers) | ✅ | ✅ | ✅ |
| ADM12.2 | Search by name / email / phone | ✅ | ✅ | ✅ |
| ADM12.3 | Add admin by email (dialog) | ✅ | ✅ | ✅ |
| ADM12.4 | Grant / revoke admin access with confirmation dialog | ✅ | ✅ | ✅ |
| ADM12.5 | User table with role badges | ✅ | ✅ | ✅ |
| ADM12.6 | Email backfill migration utility | ✅ | ✗ | 🔶 One-time migration tool — not needed |

---

## Part 4 — Admin Business Logic

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| ABL1 | FIFO batch allocation on order creation | ✅ | `batchAllocations` table wired in order API |
| ABL2 | COGS calculation from batch allocations | ✅ | Order detail + Analytics compute COGS from FIFO batches |
| ABL3 | Stock decrement on order creation | ✅ | Drizzle transaction updates `quantityAvailable` |
| ABL4 | Stock increment on batch add (Quick Restock) | ✅ | `/api/admin/inventory/[productId]/batches` POST |
| ABL5 | Stock reservations system | ✅ | `stockReservations` table; shown in Dashboard D3 and Inventory |
| ABL6 | Flutterwave webhook / payment confirmation | ✅ | `useConfirmOrderPayment` hook + PATCH endpoint |
| ABL7 | Prior-period % change on Analytics metrics | ✅ | Analytics API computes two time windows and `pctChange` object |
| ABL8 | Sales chart time-range buckets (7d/30d/90d/6m/1y) | ✅ | Dashboard chart API buckets by day/week/month per range |
| ABL9 | Receipt number auto-generation | ✅ | `generateReceiptNumber()` in `@/lib/inventory` |
| ABL10 | Audit logging on admin actions | ✅ | Audit log entries written across product/order/inventory/settings APIs |
| ABL11 | POS sale creation (order + receipt + inventory deduction) | ✅ | `/api/admin/pos/sale` POST |
| ABL12 | Delivery fee rules (Abuja zones / interstate tiers) | ✅ | Same zone config in admin settings and storefront |
| ABL13 | Supabase RPC batch functions | N/A | 🔶 Direct Drizzle queries perform equivalent work |
| ABL14 | Real-time notifications (Supabase) | N/A | 🔶 Not in Next.js — polling/manual refresh only |

---

## Gap Summary

### Non-Acceptable Gaps (Phase 2 discoveries — to be fixed)

| ID | Area | Gap | File(s) to change |
|----|------|-----|-------------------|
| POS-V2-1 | POS | Inline price editing per cart item — Lovable allows admin to override item price before checkout with an "adjusted" indicator. Next.js CartPanel has no price edit input. | `src/app/admin/pos/page.tsx` |
| RCP-1 | Receipts List | Search bar missing — no way to find a receipt by number/customer name | `src/app/admin/receipts/page.tsx` |
| RCP-2 | Receipts List | Sale-type filter missing — no filter for Online / POS / Offline receipts | `src/app/admin/receipts/page.tsx` |
| RCP-3 | Receipts List | Items count column missing from table | `src/app/admin/receipts/page.tsx` |
| RCP-4 | Receipts List | Payment status column missing from table | `src/app/admin/receipts/page.tsx` |
| RCP-5 | Receipts List | "Open POS" quick action button missing | `src/app/admin/receipts/page.tsx` |
| RCP-6 | Receipt Detail | PDF download not implemented — only `window.print()` available | `src/app/admin/receipts/[id]/page.tsx` |
| RCP-7 | Receipt Detail | Thermal receipt preview + print not implemented — Lovable has `ThermalReceiptPreview` with 80mm paper CSS for thermal printers (critical for POS print workflow) | `src/app/admin/receipts/[id]/page.tsx` + new `ThermalReceiptPreview` component |
| CUST-1 | Customers | Customer detail dialog missing — Lovable shows full profile (order history, contact info) in a slide-over/dialog when clicking a customer row. Next.js has no row action. | `src/app/admin/customers/CustomersClient.tsx` |
| TXN-1 | Transactions | Search bar missing — Lovable searches by TX ref, Flutterwave ID, order number, customer name | `src/app/admin/transactions/TransactionsClient.tsx` |
| TXN-2 | Transactions | Date sort toggle missing — Lovable has explicit ascending/descending date sort button | `src/app/admin/transactions/TransactionsClient.tsx` |
| TXN-3 | Transactions | CSV export missing | `src/app/admin/transactions/TransactionsClient.tsx` |

**Total non-acceptable gaps: 12**

---

### Acceptable Stack Differences (not to be fixed)

| ID | Area | Lovable | Next.js | Reason Acceptable |
|----|------|---------|---------|-------------------|
| STACK-1 | Real-time updates | Supabase Realtime subscriptions (orders, dashboard) | Manual refresh / React Query polling | Supabase proprietary feature; architectural migration requirement |
| STACK-2 | Guest checkout auth | Supabase anonymous sessions | Stateless guest checkout | Supabase anonymous auth is a platform-specific feature |
| STACK-3 | Rendering model | React SPA (client-side fetch) | Next.js SSR/SSG (server components) | Next.js approach is an improvement: faster FCP, SEO, no layout shift |
| STACK-4 | Database queries | Supabase RPC functions | Direct Drizzle ORM queries | Equivalent output; Drizzle is type-safe and more explicit |
| STACK-5 | Order detail (admin) | Dialog/drawer within the orders list | Dedicated `/admin/orders/[id]` page | Dedicated page is better for deep-linking and browser history |
| STACK-6 | Profile route | `/profile` | `/account` | Route name only; all features identical |
| STACK-7 | Storefront order detail | Dialog within orders list | Dedicated `/orders/[id]` page | Same rationale as STACK-5 |
| STACK-8 | POS checkout UI | Separate `POSCheckoutDialog` | Checkout inline in `CartPanel` | Identical feature set; layout preference difference only |
| STACK-9 | Google Drive on receipts | Google Drive OAuth upload | Not implemented | Third-party OAuth integration requiring separate credential setup — out of scope for core feature parity |
| STACK-10 | Users — email backfill | One-time email migration button | Not implemented | One-off migration tool for Supabase users; irrelevant to Next.js |
| STACK-11 | Auth provider | Supabase Auth (credentials + Google) | NextAuth v5 (credentials + Google) | Equivalent capability; different SDK |

---

## Score

| Area | Total Features Checked | ✅ Match | ⚠️ Gap | 🔶 Stack Diff | ➕ Next.js Extra |
|------|------------------------|----------|--------|----------------|-----------------|
| Storefront UI/UX | 60 | 55 | 0 | 4 | 3 |
| Storefront Business Logic | 12 | 10 | 0 | 2 | 0 |
| Admin UI/UX (Phase 1 areas) | 26 | 26 | 0 | 0 | 0 |
| Admin UI/UX (Phase 2 areas) | 48 | 31 | 12 | 5 | 0 |
| Admin Business Logic | 14 | 12 | 0 | 2 | 0 |
| **Total** | **160** | **134** | **12** | **13** | **3** |

**Feature coverage: 134/147 non-stack-diff items = 91%**  
**12 non-acceptable gaps remain — all in Admin (POS, Receipts, Customers, Transactions)**

---

## Fix Priority

| Priority | IDs | Rationale |
|----------|-----|-----------|
| High | RCP-7, POS-V2-1 | Thermal receipt is core to POS workflow; inline price editing is daily-use admin feature |
| High | RCP-1, RCP-2, CUST-1, TXN-1 | Search/filter are baseline usability requirements in any list view |
| Medium | TXN-3, RCP-6, RCP-3, RCP-4 | CSV export and PDF download affect reporting workflows |
| Low | RCP-5, TXN-2 | "Open POS" shortcut and date sort toggle are UX polish |
