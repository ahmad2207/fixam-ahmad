# Fixam Africa — Phase 5 Full A-Z Gap Report
### Lovable (React/Supabase) ↔ Next.js (Drizzle/NextAuth/PostgreSQL)
**Date:** 2026-05-28

> **Scope:** Sixth-pass inspection targeting every area not exhaustively verified in rounds 1–4, plus a re-audit of the admin orders pipeline, storefront product surfaces, home page data logic, and all API routes modified or added during V4 fixes.  
> V1 fixed 26 gaps. V2 fixed 12. V3 fixed 3. V4 fixed 7. V5 does a targeted deep read of areas flagged as "examined but not deeply verified" in prior rounds.  
> Prior confirmed ✅ items are carried forward unless this round's reads contradict them.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Feature functionally equivalent in both projects |
| 🔴 | Non-acceptable gap — broken or misleading behaviour not present in Lovable |
| 🔶 | Acceptable stack difference |
| ➕ | Next.js extra — feature not in Lovable |
| ⚠️ | Code quality concern (not a user-visible functional gap, but a data integrity or maintenance risk) |

---

## Part 1 — Storefront: Deep Re-Read

### SF-HOME — Home Page (`src/app/(store)/page.tsx`)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| H1 | Hero section (image, headline, CTAs, stats) | ✅ | |
| H2 | Feature promise cards (free delivery, secure payment, 24/7 support) | ✅ | |
| H3 | Categories grid (live count per category) | ✅ | Categories fetched with `count()` join — accurate |
| H4 | **Featured Products section** | 🔴 **HOME-FEATURED** | Section is titled "Featured Products" with "Hot Picks" badge. The DB query fetches products with `orderBy(desc(products.createdAt)).limit(8)` — it shows the **8 newest products**, not products marked `isFeatured = true`. The `isFeatured` flag exists in the schema (`products.isFeatured`), is editable in the admin product form, and is used for client-side sort on the `/products` page — but the home page query never filters or orders by it. Lovable's home page uses a featured flag filter. |
| H5 | Flash sale promo banner | ✅ | Static content — no logic gap |
| H6 | Trust badges row (6 icons) | ✅ | |

### SF-PRODUCTS-LISTING — Products Page (`src/app/(store)/products/page.tsx`)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PL1 | Client-side fetch via `useProducts()` | ✅ | |
| PL2 | Search, category filter, price range slider, sort | ✅ | All filter logic correct |
| PL3 | Mobile filter sheet (Sheet component) | ✅ | |
| PL4 | Grid / list view toggle | ✅ | |
| PL5 | Pagination (12 per page, smooth scroll) | ✅ | |
| PL6 | Active filter count badge | ✅ | |
| PL7 | **URL sync for filters** | 🔴 **PRODUCTS-FILTER-URL** | Page reads initial filter values from URL params on mount (`searchParams.get('category')`, `searchParams.get('sort')`, etc.) but **never writes filter changes back to the URL**. Toggling a category, adjusting the price slider, or changing sort order updates React state only — the URL stays at `/products`. Users cannot share a filtered product URL. Browser back button does not restore filter state. Lovable syncs filter state to URL query params on every change. |
| PL8 | `clearFilters()` resets to `/products` | ✅ | `router.replace('/products')` is called on clear |

### SF-PRODUCT-DETAIL — Product Detail Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PD1 | Image gallery with thumbnail nav | ✅ | |
| PD2 | Variation selector (AddToCartDialog) | ✅ | |
| PD3 | Stock / low stock / out of stock badges | ✅ | |
| PD4 | Reviews section (submit + list) | ✅ | |
| PD5 | Related products | ✅ | |
| PD6 | Specs accordion | ✅ | |

---

## Part 2 — Admin: Orders Pipeline Deep Read

### AD-ORDERS-LIST — Admin Orders API + List UI

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| OL1 | Status tab filter, search, payment method filter | ✅ | |
| OL2 | Inline status update per row | ✅ | Calls `PATCH /api/admin/orders/[id]/status` — route exists and correctly updates `status` field |
| OL3 | **Pagination** | 🔴 **ORDERS-PAGINATION** | `GET /api/admin/orders` (line 24–28) executes `db.select().from(orders)` with no `LIMIT` or `OFFSET` — returns **all orders** in one query. The list UI also has no pagination controls. Lovable's admin orders list is paginated. As order volume grows this becomes a hard performance wall. A store with 10,000 orders will load all of them on every page open. |
| OL4 | Generate receipt button per row | ✅ | |
| OL5 | Delete order with confirmation | ✅ | |

### AD-ORDER-DETAIL — Admin Order Detail (`/api/admin/orders/[id]`)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| OD1 | Status update dropdown + "Update Status" button | ✅ | Calls `/api/admin/orders/[id]/status` (separate route) — correctly updates `status` + sends email notification |
| OD2 | Payment confirmation | ✅ | |
| OD3 | FIFO batch allocation detail | ✅ | |
| OD4 | Gross profit + margin calculation | ✅ | |
| OD5 | Customer info, shipping address, notes | ✅ | |
| OD6 | Main PATCH route architecture | ✅ | `PATCH /api/admin/orders/[id]` handles `paymentStatus` only; `PATCH /api/admin/orders/[id]/status` handles `status`. Two intentional separate endpoints — not a gap. |

### AD-RECEIPTS — Receipt Generation

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| RG1 | Generate receipt from order detail | ✅ | |
| RG2 | Receipt list, detail, print/PDF/thermal | ✅ | |
| RG3 | Share dropdown (copy link, WhatsApp, email) | ✅ | |
| RG4 | **Idempotency on receipt generation** | 🔴 **RECEIPT-DUPLICATE** | `POST /api/admin/orders/[id]/receipt` has **no idempotency check** — it does not query existing receipts for the given `orderId` before inserting. Clicking "Generate Receipt" twice on the same order creates two separate receipt records with different receipt numbers, both pointing to the same order. The admin receipts list then shows duplicate entries. Fix: check `where(eq(receipts.orderId, id))` before inserting; return existing receipt if found. |

---

## Part 3 — Admin: Products, Settings, and Inventory

### AD-PRODUCTS — Product Create/Edit Forms

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PF1 | All core fields (name, slug, price, compareAtPrice, description, stock, category) | ✅ | |
| PF2 | Images (primary + additional gallery) | ✅ | |
| PF3 | Variations (JSON builder) | ✅ | |
| PF4 | Specifications (JSON builder) | ✅ | |
| PF5 | `isFeatured` toggle in edit form | ✅ | Toggle exists and saves — but home page never reads this flag (see HOME-FEATURED) |
| PF6 | `isActive` toggle | ✅ | |

### AD-SETTINGS — Notifications Settings

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| NS1 | `notify_low_stock` toggle saved to DB | ✅ | |
| NS2 | `low_stock_threshold` number input saved to DB | ✅ | Saved to `storeSettings.lowStockThreshold` |
| NS3 | **Threshold applied to low-stock displays** | ⚠️ | `admin/page.tsx:77`, `InventoryTabsClient.tsx:126`, `admin/inventory/page.tsx:53`, and `api/admin/analytics/route.ts:117` all hardcode `< 10` for low-stock detection. The saved `low_stock_threshold` value is **never read back** in these queries. Only `useLowStockProducts` hook passes it as a URL param. Users who change the threshold to 5 or 20 will see no change in the dashboard, inventory, or analytics low-stock counts. Not a gap vs Lovable (Lovable doesn't have this setting), but a deceptive internal inconsistency. |

### AD-INVENTORY

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| IV1 | Stats (units, value, out of stock count, low stock count) | ✅ | |
| IV2 | Products tab, Batches tab, Low Stock + Reservations tab | ✅ | |
| IV3 | Per-product batch management + add batch form | ✅ | |

---

## Part 4 — Auth & Schema Confirmations

| # | Area | Status | Notes |
|---|------|--------|-------|
| SC1 | Password reset token schema exists | ✅ | `passwordResetTokens` table in schema — used by forgot-password flow |
| SC2 | `isFeatured` on products schema | ✅ | Field exists; admin can set it; client-side sort on `/products` uses it — home page does not |
| SC3 | Middleware protects `/admin/*` only | 🔶 | Store routes are public — correct by design |
| SC4 | Order schema (no tracking URL, no refund fields) | 🔶 | Not present in Lovable either |
| SC5 | Newsletter subscribers schema + API | ✅ | Added in V4 fix (FOOTER-NL) |

---

## Part 5 — Confirmed Acceptable Stack Differences (New Findings)

These were flagged by research agents but confirmed to be out-of-scope or already parity with Lovable:

| Item | Verdict | Reason |
|------|---------|--------|
| No SEO meta fields on products | 🔶 | Neither project has SEO fields |
| No product barcode / warranty / video URL fields | 🔶 | Neither project has these |
| No tracking URL on orders | 🔶 | Neither project has this |
| No bulk batch delete / edit | 🔶 | Not present in Lovable inventory |
| Social media links hardcoded to `#` in footer | 🔶 | Both projects use `#` placeholder |
| Admin-only product/category PATCH (no staff PATCH) | 🔶 | Intentional design, not a parity gap |
| `status` sub-route for orders is separate from main PATCH | ✅ | Correct architecture — `/status` sub-route handles `status`; main PATCH handles `paymentStatus` only |

---

## V5 Gap Summary

### New Non-Acceptable Gaps (4)

| ID | Area | Severity | Description | File(s) |
|----|------|----------|-------------|---------|
| HOME-FEATURED | Home page | **P1** | "Featured Products" section fetches 8 newest products by `createdAt DESC` — the `isFeatured` flag is never used in the home page query despite being settable in admin | `src/app/(store)/page.tsx:45` |
| ORDERS-PAGINATION | Admin Orders | **P1** | Orders list API returns ALL orders with no `LIMIT`/`OFFSET`. No pagination exists in the UI. Performance wall as order volume grows | `src/app/api/admin/orders/route.ts:24` |
| RECEIPT-DUPLICATE | Admin Receipts | **P2** | Generating a receipt for an order has no idempotency check — clicking the button twice creates two separate receipt records for the same order | `src/app/api/admin/orders/[id]/receipt/route.ts:29` |
| PRODUCTS-FILTER-URL | Products listing | **P2** | Filter state (category, price, sort) reads from URL on mount but is never written back — filtered URLs cannot be shared; browser back does not restore state | `src/app/(store)/products/page.tsx:31–43` |

### Code Quality Notes (not functional gaps, but risk items)

| ID | Area | Note |
|----|------|------|
| LOW-STOCK-THRESHOLD | Settings / Inventory | `low_stock_threshold` setting is saved to DB but dashboard, inventory, and analytics hardcode `< 10` — setting change has no visible effect |
| POS-STOCK | POS sale (from V4) | `deductPOSInventory` called without pre-flight stock check |
| POS-AUDIT | POS sale (from V4) | POS sales not written to audit log |

---

## All-Phase Running Score

| Phase | Gaps Found | Gaps Fixed | Features Confirmed |
|-------|-----------|-----------|-------------------|
| Phase 1 | 26 | 26 | ~50 features |
| Phase 2 | 12 | 12 | 147 features |
| Phase 3 | 3 | 3 | 200 features |
| Phase 4 | 7 | 7 | 220 features |
| Phase 5 | **4 new** | 0 (pending) | 235+ features |

**Current score: 231 / 235 features confirmed ✅ (98.3%)**

---

## Fix Priority for V5 Gaps

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| **P1** | HOME-FEATURED | Trivial — add `eq(products.isFeatured, true)` to the home page query WHERE clause | "Featured Products" section on home page ignores the featured flag entirely — admin-curated picks never appear there |
| **P1** | ORDERS-PAGINATION | Low — add `limit`/`offset` params to orders API, add pagination UI to orders list page | All orders loaded in one round-trip — becomes unusable at scale |
| **P2** | RECEIPT-DUPLICATE | Trivial — add a `select` check for existing receipt with matching `orderId` before insert; return existing if found | Double-clicking "Generate Receipt" creates duplicate receipts visible in the receipts list |
| **P2** | PRODUCTS-FILTER-URL | Medium — add `useEffect` that calls `router.replace()` with updated search params whenever category/sort/price state changes | Users cannot share filtered product URLs; every navigation loses filter context |

---

## Conclusion

After five rounds of analysis covering 235+ features across storefront and admin (UI, UX, business logic, API routes, hooks, contexts, schemas), the Next.js rewrite is **functionally complete** with 4 remaining non-acceptable gaps found in this round.

Two gaps are data-logic bugs (HOME-FEATURED: wrong query; RECEIPT-DUPLICATE: missing idempotency check) and two are UX completeness gaps (ORDERS-PAGINATION: no pagination; PRODUCTS-FILTER-URL: no URL sync). All four are small, isolated fixes. There are no broken flows, no missing major features, and no payment or auth regressions.
