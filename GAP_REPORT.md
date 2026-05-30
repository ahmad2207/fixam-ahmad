# Fixam Africa — Replication Gap Report (Stack-Aware)
### Lovable (React + Supabase) → Next.js (Next.js 16 + Drizzle/PostgreSQL)

> **Legend:**
> `✅ Replicated` | `⚠️ Partial` | `❌ Missing`
> `[STACK GAP]` = gap acceptable because of the React → Next.js + Supabase → Drizzle difference
> `[NON-ACCEPTABLE GAP]` = gap that should exist regardless of stack

---

## PART 1 — STORE FRONT: UI / UX (Appearance)

| Screen / Component | Lovable | Next.js | Status | Notes |
|---|---|---|---|---|
| **Homepage — Hero** | Full hero with background image, gradient overlays, badge, stats, CTA buttons, feature cards overlaid at bottom | Same | ✅ 100% | |
| **Homepage — Category Grid** | Emoji icons, product count, hover animations, linked | Same | ✅ 100% | |
| **Homepage — Featured Products** | Grid of product cards, "Hot Picks" label, View All link | Same | ✅ 100% | |
| **Homepage — Promo Banner** | Dark gradient card, Flash Sale badge, discount headline, CTA | Same | ✅ 100% | |
| **Homepage — Trust Badges** | 6-column icon grid (Truck, Returns, Shield, Payment, Award, Headphones) | Same | ✅ 100% | |
| **Products — Breadcrumb** | Home > All Products | Same | ✅ 100% | |
| **Products — Sidebar Filters** | Category multi-select with counts, price range slider + min/max inputs, Clear All button | Same | ✅ 100% | |
| **Products — Mobile Filter Drawer** | Sheet-based, same content, filter count badge on button | Same | ✅ 100% | |
| **Products — Sort + View Toggle** | Sort dropdown (5 options), Grid/List toggle (desktop only) | Same | ✅ 100% | |
| **Products — Active Filter Badges** | Tag chips with X removal | Same | ✅ 100% | |
| **Products — Grid/List Views** | Product cards in both layouts, skeleton loaders | Same | ✅ 100% | |
| **Products — Pagination** | Prev/Next + page numbers, scroll-to-top on change | Same | ✅ 100% | |
| **Product Detail — Image Gallery** | Main image + thumbnail strip, fallback emoji | Same | ✅ 100% | |
| **Product Detail — Discount Badge** | % off badge top-left of image | Same | ✅ 100% | |
| **Product Detail — Out-of-Stock Badge** | Red badge top-right | Same | ✅ 100% | |
| **Product Detail — Rating + Price** | Stars + count, price + strikethrough compare price | Same | ✅ 100% | |
| **Product Detail — Variations** | Button grid for each variation type | Same | ✅ 100% | |
| **Product Detail — Quantity + Actions** | Qty selector, Add to Cart, Buy Now, Wishlist heart | Same | ✅ 100% | |
| **Product Detail — Feature Badges** | Fast Delivery / Warranty / Easy Returns row | Same | ✅ 100% | |
| **Product Detail — Tabs** | Description, Specifications, Reviews | Same | ✅ 100% | |
| **Product Detail — Reviews** | Star selector, title + body form, user's own review editable/deletable, others below | Same | ✅ 100% | |
| **Add to Cart Dialog** | Green checkmark modal, product preview, Continue/Checkout buttons | Same | ✅ 100% | |
| **Cart — Item List** | Image, name, variation, qty controls, remove, clear cart | Same | ✅ 100% | |
| **Cart — Order Summary** | Subtotal, delivery fee, grand total, state/zone estimator, coupon input (UI only) | Same | ✅ 100% | Coupon has no backend in either project |
| **Cart — Empty State** | Icon + message + Continue Shopping | Same | ✅ 100% | |
| **Checkout — Address Selector** | Saved address radio cards with default badge, "Use new address" option | Same | ✅ 100% | |
| **Checkout — New Address Form** | Street, City, State, Abuja Zone dropdowns | Same | ✅ 100% | |
| **Checkout — Payment Method** | Pay Online card with Flutterwave label | Same | ✅ 100% | |
| **Checkout — Order Summary** | Product image previews, stock error alerts, subtotal/delivery/total, Pay Now | Same | ✅ 100% | |
| **Orders — List** | Status badge, payment badge, item thumbnails (+N more), total, View Details | Same | ✅ 100% | |
| **Orders — Detail Page** | Status, items, pricing, customer info, shipping address, notes | Next.js has dedicated `/orders/[id]` page; Lovable embeds detail inside list view | ✅ Next.js better | |
| **Account — Profile Edit** | Name/phone edit mode, email read-only badge, save/cancel | Same | ✅ 100% | |
| **Account — Addresses** | List with label, name, phone, default badge, edit/delete, add dialog | Same | ✅ 100% | |
| **Wishlist Page** | Auth gate, product grid, empty state, skeleton loaders | Same | ✅ 100% | |
| **Public Receipt** | Store header, item list, totals, notes, footer | Same | ✅ 100% | |
| **Payment Callback** | Verifying → Success → Failed states, auto-redirect on success | Same | ✅ 100% | |
| **Store Header** | Logo, search, cart badge, wishlist badge, user dropdown (orders/profile/admin/signout), category nav, mobile hamburger menu | Same | ✅ 100% | |
| **Store Footer** | Brand + contact, shop links, support links, newsletter form, social icons, payment badges | Same structure | ⚠️ 95% | Social links are `href="#"` in both. Newsletter has no backend in both. |
| **Auth — Login Page** | Email/password, show/hide password, Google OAuth, forgot password link, signup link, hero panel | Same | ✅ 100% | |
| **Auth — Signup Page** | Name/email/password, Google OAuth, login link | Same | ✅ 100% | |
| **Auth — Forgot Password** | Relies on Supabase magic link (no custom page) | ✅ Custom page present | ✅ Next.js better | `[STACK GAP — ACCEPTABLE, Next.js advantage]` |
| **Auth — Reset Password** | Relies on Supabase magic link (no custom page) | ✅ Custom page present | ✅ Next.js better | `[STACK GAP — ACCEPTABLE, Next.js advantage]` |

### Store Front UI/UX Score: **98 / 100**

**Acceptable stack gaps:** SSR in Next.js means pages render with real HTML (SEO benefit), whereas Lovable is a SPA. Invisible to the user visually but a technical improvement.

**Non-acceptable gaps:** None identified. Store front appearance is essentially fully replicated.

---

## PART 2 — ADMIN PANEL: UI / UX (Appearance)

| Screen / Component | Lovable | Next.js | Status | Notes |
|---|---|---|---|---|
| **Admin Login** | Basic page | Dark bg-gray-900 theme, logo, Shield icon, password toggle | ✅ Next.js better | |
| **Sidebar Navigation** | 12 items | 13 items (same + Categories) | ✅ Next.js has more | |
| **Dashboard — KPI Cards** | 4 cards (Total Sales, Total Settled, Gross Profit, Total Owed) | Same 4 cards | ✅ 100% | |
| **Dashboard — Mini Metrics** | 5 cards (Orders, Products Sold, New Customers, Inventory Value, Offline Sales) | Same 5 cards | ✅ 100% | |
| **Dashboard — Sales Chart** | Bar chart (Online vs Offline), time range selector (7d/30d/90d/6m/1y) | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | Dashboard has no charts |
| **Dashboard — Profit Breakdown Card** | Stacked progress bars: Revenue → COGS → Profit, margin %, color status | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Dashboard — Active Reservations Card** | Pending stock reservation count + detail card | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Dashboard — Inventory Category Breakdown** | Chart showing inventory split by category | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Dashboard — Recent Orders Table** | Last 5 orders | Same | ✅ 100% | |
| **Dashboard — Low Stock Alerts** | Products below threshold with count/badge | Same | ✅ 100% | |
| **Products — Stat Cards** | Total Retail Value, Inventory Value, Products Sold, Out of Stock | Same | ✅ 100% | |
| **Products — Table Columns** | Product name+image, Collection, Stock badge, Price + strikethrough, Margin %, Status badge | Same columns | ✅ 95% | |
| **Products — Bulk Selection** | Checkbox per row + select all | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Products — Sortable Columns** | Click column header to sort (name, price, stock, margin) | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Products — Row Actions Dropdown** | View in store, Edit, Quick Restock, Delete | Edit link + Stock link only (no dropdown, no Quick Restock inline) | ⚠️ `[NON-ACCEPTABLE GAP]` | Restock exists on inventory page but not inline |
| **Products — Create/Edit: Specifications Editor** | Key-value pair UI editor | Plain JSON/text input | ⚠️ 85% | `[NON-ACCEPTABLE GAP]` |
| **Products — Live Margin Calculator** | Real-time % shown as you type cost + selling price | ✅ Present | ✅ 100% | |
| **Orders — Stat Cards** | 4 cards (Total, Revenue, In Transit, Awaiting Payment) | Same | ✅ 100% | |
| **Orders — Filter Tabs** | All, Pending, Shipped, Delivered, Cancelled | Same | ✅ 100% | |
| **Orders — Payment Method Filter** | Dropdown: All / Card / Cash / Transfer | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Item Preview in Table Row** | Stacked product thumbnails with count | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Mobile Card View** | Compact card layout for mobile | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Row Quick Actions** | Mark shipped, Confirm payment, Cancel, Generate receipt, Delete | Inline status dropdown only | ⚠️ `[NON-ACCEPTABLE GAP]` | No quick confirm-payment or generate-receipt per row |
| **Orders — Detail: Gradient Header** | Primary gradient with order number, date, total (large) | Standard page header | ⚠️ Minor | Design choice difference |
| **Orders — Detail: FIFO Batch Allocations** | Expandable section showing which batches were used, cost per batch, item-level COGS | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Detail: Payment Transactions** | Flutterwave tx ref, status, amount, timestamp | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Detail: COGS + Gross Profit** | Financial summary: subtotal, delivery, COGS, gross profit, margin | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Detail: Confirm Payment Button** | Button to manually confirm payment | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Orders — Detail: Generate Receipt Button** | Action to create/view receipt from order | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Inventory — Stat Cards** | Total Units (+ batch count), Inventory Value, Products In Stock, Avg Cost / Low Stock count | Same 4 cards | ✅ 100% | |
| **Inventory — 3 View Modes** | All Batches (flat table), By Product (expandable grouped), Low Stock (filtered) | ❌ Missing — single overview table only | ❌ `[NON-ACCEPTABLE GAP]` | Detail on separate per-product page |
| **Inventory — By-Product FIFO View** | Expandable product rows showing individual batches with progress bars, stock health indicators | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Inventory — Export CSV** | Button to export inventory data | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Inventory — Per-Batch Edit/Delete** | Edit quantity/cost, delete batch inline | Available on /inventory/[productId] page | ⚠️ 70% | Extra click required |
| **Inventory — Active Reservations Table** | Read-only table of reserved stock | ✅ Present | ✅ 100% | |
| **POS — Product Grid** | Searchable product grid, cart quantity indicator | Same | ✅ 100% | |
| **POS — Cart Panel** | Items with qty controls, customer info, payment method, cash received, change calc, sales rep, notes, total, complete | Same | ✅ 100% | |
| **POS — Mobile Layout** | Bottom sheet overlay cart (85vh height) | Side panel (always visible) | ⚠️ 80% | `[NON-ACCEPTABLE GAP]` — less optimal on small screens |
| **POS — Success Modal** | Receipt number + link to order | Same | ✅ 100% | |
| **Analytics — Metric Cards** | 4 primary + 5 secondary including COGS card and Conversion Rate | 5 metric cards (missing explicit COGS card + Conversion Rate) | ⚠️ 85% | |
| **Analytics — Time Range** | 7d, 30d, 90d | 7d, 30d, 90d, 6m, 1y | ✅ Next.js better | |
| **Analytics — Revenue Trend Chart** | Area chart with gradient fill | Same | ✅ 100% | |
| **Analytics — Order Status Pie** | Donut chart with legend | Same | ✅ 100% | |
| **Analytics — Online vs Offline Bar Chart** | Monthly 6-month comparison | Same | ✅ 100% | |
| **Analytics — Profit Breakdown Card** | Revenue → COGS → Gross Profit visual with margin % | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Analytics — Top Products** | Ranked by revenue with progress bars | Same | ✅ 100% | |
| **Analytics — Category Chart** | Horizontal bar per category | Same | ✅ 100% | |
| **Analytics — Low Stock** | Alert section | Same | ✅ 100% | |
| **Settings — Store Tab** | Name, email, phone, address | Name, tagline, email, phone, address | ✅ 100% | |
| **Settings — Delivery Tab** | Abuja zone fees + interstate tiers | Same | ✅ 100% | |
| **Settings — Payment Tab** | Bank name, account number, account name | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Settings — Notifications Tab** | New order toggle, low stock toggle + threshold, notification email | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Categories Admin Page** | Managed inline in product forms only | ✅ Dedicated CRUD page | ✅ Next.js better | |
| **Receipts** | List, detail, create offline | Same | ✅ 90% | |
| **Customers** | Stats + list | Same | ✅ 85% | |
| **Transactions** | Stats + list | Same | ✅ 85% | |
| **Audit Log** | Search + entity filter + colored action badges | Same | ✅ 90% | |
| **Users** | List + role management | Same | ✅ 85% | |

### Admin UI/UX Score: **72 / 100**

**Key non-acceptable gaps:** Dashboard charts (4 missing), orders detail depth (5 missing features), inventory view modes, settings tabs (Payment + Notifications), analytics profit breakdown, products bulk select + sortable columns.

---

## PART 3 — STORE FRONT: BUSINESS LOGIC

| Feature | Lovable | Next.js | Status | Notes |
|---|---|---|---|---|
| **Cart — State Management** | React Context, in-memory only (lost on page refresh) | React Context + localStorage persistence | ✅ Next.js better | `[STACK GAP — ACCEPTABLE, Next.js advantage]` |
| **Cart — Add/Remove/Qty** | Full CRUD, stock cap on quantity | Same | ✅ 100% | |
| **Cart — Total Calculation** | Subtotal + delivery fee | Same | ✅ 100% | |
| **Delivery Fee — State-Based** | Dynamic fee by Nigerian state from store settings | Same | ✅ 100% | |
| **Delivery Fee — Abuja Zones** | Two-tier (Area Council → District), zone-specific fee | Same | ✅ 100% | |
| **Product Search** | Client-side across name + description + category | API-based (server-side) | ✅ 100% | `[STACK GAP — ACCEPTABLE]` — different implementation, same result |
| **Product Filtering** | Client-side with React Query (category, price range) | API query params | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Product Sorting** | Client-side sort | API sort param | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Stock Display** | Live from DB | Live from DB (server component) | ✅ 100% | |
| **Variations Selection** | Button toggle, stored with cart item | Same | ✅ 100% | |
| **Wishlist — Add/Remove** | Persisted to Supabase | Persisted to PostgreSQL via API | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Wishlist — Auth Gate** | Redirect/prompt if not logged in | Same | ✅ 100% | |
| **Reviews — Create** | POST with productId, rating, title, body | Same | ✅ 100% | |
| **Reviews — Edit Own** | PATCH with review ID | Same | ✅ 100% | |
| **Reviews — Delete Own** | DELETE with review ID + confirmation | Same | ✅ 100% | |
| **Reviews — Display** | User's own review separated, others listed | Same | ✅ 100% | |
| **Checkout — Stock Validation** | Pre-payment check against current stock | Same | ✅ 100% | |
| **Checkout — Pending Checkout** | Creates pending_checkout record before payment | Same | ✅ 100% | |
| **Checkout — Flutterwave Init** | Calls payment init API, redirects to Flutterwave | Same | ✅ 100% | |
| **Checkout — Cart Clear on Pay** | Cart cleared after payment init | Same | ✅ 100% | |
| **Payment Callback — Verification** | Verifies tx_ref with Flutterwave API | Same | ✅ 100% | |
| **Payment Callback — Order Creation** | Creates order + order items on verified payment | Same | ✅ 100% | |
| **Payment Callback — Redirect** | Auto-redirects to orders page after success | Same | ✅ 100% | |
| **Stock Reservations** | Reserves stock on checkout start, releases on expiry | Same | ✅ 100% | |
| **User Profile — Edit** | PATCH name + phone | Same | ✅ 100% | |
| **User Addresses — CRUD** | Create, Read, Update, Delete, set default | Same | ✅ 100% | |
| **Auth — Email/Password Login** | Supabase signIn | NextAuth credentials provider | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Auth — Google OAuth** | Supabase OAuth | NextAuth Google provider | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Auth — Session/Token** | Supabase JWT | NextAuth JWT strategy | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Auth — Forgot Password** | Supabase magic link only, no custom page | Custom forgot + reset with Resend email, token-based | ✅ Next.js better | `[STACK GAP — ACCEPTABLE, Next.js advantage]` |
| **Auth — Role Check** | Supabase user_roles table | NextAuth session carries role via userRoles table | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Coupon Code** | UI present, no backend | UI present, no backend | ⚠️ Both incomplete | Non-acceptable gap in both projects |
| **Newsletter Signup** | UI present, no backend | UI present, no backend | ⚠️ Both incomplete | |
| **SEO / Meta Tags** | SPA — no SSR meta | Server components with `generateMetadata()` | ✅ Next.js better | `[STACK GAP — ACCEPTABLE, Next.js advantage]` |

### Store Front Business Logic Score: **99 / 100**

**Acceptable stack gaps:** Auth mechanism, data fetching approach, and SSR vs SPA are all stack differences with equivalent outcomes.

**Non-acceptable gaps:** None in core functionality. Coupon code has no backend in either project.

---

## PART 4 — ADMIN PANEL: BUSINESS LOGIC

| Feature | Lovable | Next.js | Status | Notes |
|---|---|---|---|---|
| **Dashboard — Time-Ranged Metrics** | All KPIs re-calculated per selected period | Period filter not wired to dashboard KPIs (static 30d) | ⚠️ `[NON-ACCEPTABLE GAP]` | |
| **Dashboard — Sales Chart Data** | FIFO-sourced, online vs offline per date bucket | ❌ No chart on dashboard | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Dashboard — COGS on Dashboard** | Real FIFO-based COGS on dashboard profit card | ❌ Not on dashboard | ❌ `[NON-ACCEPTABLE GAP]` | Exists in Analytics page but not Dashboard |
| **Product — CRUD** | Full create/edit/delete/status toggle | Same | ✅ 100% | |
| **Product — Cost Price Tracking** | costPrice stored per product | Same | ✅ 100% | |
| **Product — Margin Calculation** | (selling - cost) / selling × 100 real time | Same | ✅ 100% | |
| **Product — Specifications Editor** | Key-value pair UI | Plain text/JSON input | ⚠️ 80% | `[NON-ACCEPTABLE GAP]` |
| **Product — Bulk Operations** | Select multiple, bulk status change | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Product — Quick Restock** | Inline dialog on products page: qty + cost → creates batch | Must navigate to /inventory/[productId] | ⚠️ 75% | `[NON-ACCEPTABLE GAP]` — extra navigation required |
| **Product — Audit Logging** | All changes logged | Same | ✅ 100% | |
| **Order — Status Updates** | Inline dropdown with API call | Same | ✅ 100% | |
| **Order — Payment Confirmation** | "Confirm payment" button sets paymentStatus to paid | ❌ Missing from order detail | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Order — Receipt Generation** | "Generate receipt" action on order | ❌ Missing from order management | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Order — FIFO Batch Allocation Display** | Per-order breakdown of batches used, cost per batch | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | Critical for COGS visibility |
| **Order — COGS Per Order** | Gross profit visible per order (total - delivery - COGS) | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Order — Payment Transaction View** | Flutterwave tx ref, status, amount shown per order | ❌ Missing from order detail | ❌ `[NON-ACCEPTABLE GAP]` | Data exists in DB but not exposed in UI |
| **Order — Deletion** | Admin can delete an order | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **FIFO — Batch Creation (Restock)** | Creates inventoryBatch with qty + costPrice | Same (via inventory page) | ✅ 95% | |
| **FIFO — Allocation on Order Fulfillment** | Oldest batches deducted first, batchAllocations records created | Same (API logic) | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **FIFO — Allocation Display** | Visible in order detail + inventory page | Only visible on /inventory/[productId] | ⚠️ 60% | `[NON-ACCEPTABLE GAP]` |
| **FIFO — CSV Export** | Export all batches/stock to CSV | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Inventory — 3 View Modes** | All Batches / By Product / Low Stock with FIFO visual | Single table overview | ⚠️ 65% | `[NON-ACCEPTABLE GAP]` |
| **Inventory — Stock Health Indicators** | Critical (<5) / Low (<10) / Healthy color coding + progress bar | Basic color badge only | ⚠️ 75% | `[NON-ACCEPTABLE GAP]` |
| **POS — Inventory Deduction** | `deduct_pos_inventory` Supabase RPC (atomic) | API route logic | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **POS — Receipt Creation** | Creates receipt with POS type, sales rep, customer info | Same | ✅ 100% | |
| **POS — Order Creation** | Creates order with `saleType: pos` | Same | ✅ 100% | |
| **Analytics — Revenue (Paid Orders Only)** | Only confirmed/paid orders count | Same | ✅ 100% | |
| **Analytics — FIFO COGS** | COGS from batchAllocations (real cost) | Same | ✅ 100% | |
| **Analytics — Conversion Rate** | Paid / Total × 100 | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Analytics — Profit Breakdown Visual** | Revenue → COGS → Gross Profit with % | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Analytics — Prior Period Comparison** | % growth vs previous period on metric cards | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Settings — Payment/Bank Details** | Bank name, account number, account name saved and shown for bank transfer | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | Customers using bank transfer have no account to send to |
| **Settings — Notifications Config** | New order alert toggle, low stock toggle + threshold, notification email | ❌ Missing | ❌ `[NON-ACCEPTABLE GAP]` | |
| **Auth — Admin Middleware** | Supabase session + role check | NextAuth JWT + middleware.ts | ✅ 100% | `[STACK GAP — ACCEPTABLE]` |
| **Auth — Staff Role Access** | Admin + staff access admin panel | Same | ✅ 100% | |
| **Audit Log — Write** | Every admin action logged with before/after JSON | Same | ✅ 100% | |
| **Audit Log — Read/Filter** | Search + entity type filter | Same | ✅ 100% | |
| **Users — Role Assignment** | Admin can promote/demote users | Same | ✅ 85% | |
| **Categories — CRUD** | Managed inline in product forms | Dedicated `/admin/categories` page | ✅ Next.js better | |
| **Stock Reservations — Expiry** | Auto-expires pending checkout reservations | Same | ✅ 100% | |

### Admin Business Logic Score: **71 / 100**

**Acceptable stack gaps:** FIFO deduction via RPC vs API route, Supabase Auth vs NextAuth, direct DB queries vs API layer.

**Non-acceptable gaps (high priority):** Payment/bank settings missing (breaks bank-transfer customers), receipt generation from orders missing, FIFO batch allocation display in orders missing, payment confirmation button missing, order COGS per order missing.

---

## OVERALL SCORES

| Section | Score |
|---|---|
| Store Front — UI/UX | **98%** |
| Store Front — Business Logic | **99%** |
| Admin Panel — UI/UX | **72%** |
| Admin Panel — Business Logic | **71%** |
| **Overall** | **~85%** |

---

## CONSOLIDATED GAP LIST — ITEMS TO FIX

### Admin Dashboard (4 items)
- [x] **D1** — Sales chart with time-range selector (7d/30d/90d/6m/1y) showing online vs offline breakdown
- [x] **D2** — Profit breakdown card (Revenue → COGS → Gross Profit visual with margin %)
- [x] **D3** — Active Reservations card
- [x] **D4** — Inventory Category Breakdown chart

### Admin Orders (9 items)
- [x] **O1** — Item preview thumbnails in the orders table row
- [x] **O2** — Payment method filter dropdown on orders list
- [x] **O3** — Mobile card view for orders table
- [x] **O4** — FIFO batch allocations section in order detail (expandable, shows which batches fulfilled each item)
- [x] **O5** — Payment transactions section in order detail (Flutterwave tx ref, status, amount, timestamp)
- [x] **O6** — COGS + Gross Profit financial summary in order detail
- [x] **O7** — "Confirm Payment" button in order detail
- [x] **O8** — "Generate Receipt" button per order (in table row actions + order detail)
- [x] **O9** — Order deletion action

### Admin Products (4 items)
- [x] **P1** — Bulk selection with checkboxes (select all + individual rows)
- [x] **P2** — Sortable table columns (name, price, stock, margin)
- [x] **P3** — Quick Restock inline dialog on products page (qty + cost price → creates inventory batch)
- [x] **P4** — Specifications key-value editor UI (instead of raw text/JSON input) + costPrice field

### Admin Inventory (3 items)
- [x] **I1** — 3 view modes: All Batches (flat table) / By Product (grouped expandable with FIFO) / Low Stock (filtered)
- [x] **I2** — By-Product FIFO visualization with stock health progress bars (Critical/Low/Healthy)
- [x] **I3** — Export CSV functionality

### Admin Analytics (3 items)
- [x] **A1** — Conversion Rate metric card (paid orders / total orders × 100)
- [x] **A2** — Profit Breakdown card (Revenue → COGS → Gross Profit visual)
- [x] **A3** — Prior period % comparison on metric cards

### Admin Settings (2 items)
- [x] **S1** — Payment/Bank Details tab (bank name, account number, account name — needed for bank transfer customers)
- [x] **S2** — Notifications/Alerts tab (new order toggle, low stock toggle + threshold, notification email)

### Admin POS (1 item)
- [x] **POS1** — Mobile bottom sheet cart (floating button + slide-up 85vh sheet on mobile, desktop side panel unchanged)

### Store Front (0 critical items)
> Store front is at 98–99%. No blocking gaps. Coupon code backend and newsletter backend are nice-to-haves, not blockers.

---

*Total gaps fixed: 26 / 26. All admin panel gaps resolved.*
