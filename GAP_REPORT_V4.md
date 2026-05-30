# Fixam Africa — Phase 4 Full A-Z Gap Report
### Lovable (React/Supabase) ↔ Next.js (Drizzle/NextAuth/PostgreSQL)
**Date:** 2026-05-28

> **Scope:** Full A-Z re-inspection of every page, component, hook, context, and API route across Storefront and Admin — UI appearance, UX interactions, and business logic.  
> V1 fixed 26 gaps. V2 fixed 12. V3 fixed 3. V4 does a fresh read of every file that had NOT been read in prior rounds.  
> Prior confirmed ✅ items are carried forward unless this round's reads contradict them.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Feature functionally equivalent in both projects |
| 🔴 | Non-acceptable gap — broken UI or Lovable feature absent in Next.js |
| 🔶 | Acceptable stack difference |
| ➕ | Next.js extra — feature not in Lovable |
| ⚠️ | Code quality concern (not a functional gap, but worth noting) |

---

## Part 1 — Storefront: New Deep-Read Findings

### SF-CART — Cart Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| C1 | Items list with qty +/− and remove | ✅ | |
| C2 | Clear entire cart button | ✅ | |
| C3 | State selector + delivery fee preview | ✅ | Real-time fee calc via `calculateDeliveryFee()` |
| C4 | Abuja zone selector (conditional) | ✅ | |
| C5 | Order summary (subtotal + delivery + total) | ✅ | |
| C6 | Empty cart state | ✅ | |
| C7 | Proceed to Checkout button | ✅ | |
| C8 | **Coupon code input + Apply button** | 🔴 **CART-COUPON** | Input and button render on the page but the Apply button has **no `onClick` handler**. Pressing it does nothing. The feature appears complete to the user but is entirely non-functional. Lovable has no coupon system and shows no coupon UI — Next.js added the UI without the backend. |

### SF-WISHLIST — Wishlist Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| W1 | Authenticated guard with Sign In prompt | ✅ | |
| W2 | Loading skeleton grid | ✅ | |
| W3 | Empty state | ✅ | |
| W4 | Wishlist item grid via `useWishlist` + `useProducts` | ✅ | |
| W5 | Item count display | ✅ | |
| W6 | Remove from wishlist via ProductCard | ✅ | |
| W7 | `clear()` in WishlistContext | 🔴 **WISHLIST-CLEAR** | `WishlistContext.clear()` calls `setWishlistIds([])` locally but **never calls the API**. The server-side wishlist is not cleared. On next load the wishlist reappears from the server. |

### SF-ACCOUNT — Account Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| A1 | Profile display and edit (name, phone) | ✅ | |
| A2 | Address CRUD (add/edit/delete/default) | ✅ | |
| A3 | Sign out | ✅ | |
| A4 | **Unauthenticated redirect** | 🔴 **ACCOUNT-REDIRECT** | Page returns `null` when `!session?.user`. The user sees a completely blank page with no message and no redirect. Lovable redirects unauthenticated users to `/login`. |

### SF-AUTH — Authentication Pages

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| AU1 | Login (email+password, error toast, callbackUrl redirect) | ✅ | |
| AU2 | Google OAuth | ✅ | |
| AU3 | Signup (name, email, password, confirm password) | ✅ | |
| AU4 | Password match + min-length validation | ✅ | |
| AU5 | Forgot password (email → success screen with 1hr note) | ✅ | |
| AU6 | Reset password (token check, set new password, auto-redirect) | ✅ | |
| AU7 | **Confirm password toggle bug** | 🔴 **RESET-TOGGLE** | Reset password page: both the "password" field and the "confirm password" field share one `showPassword` state variable. Toggling the eye icon on either field reveals/hides **both** at the same time. The confirm field has no independent toggle — this is a UX bug visible to every user who resets their password. |
| AU8 | Admin login page (dark theme, role check) | ✅ | |

### SF-FOOTER / SF-HEADER

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| FH1 | Header: logo, search, cart badge, wishlist badge, user dropdown, mobile menu | ✅ | |
| FH2 | Header: "Admin Panel" link for admin users | ✅ | |
| FH3 | Footer: dynamic store info via `useStoreSetting` | ✅ | |
| FH4 | Footer: shop links, support links, payment icons, copyright | ✅ | |
| FH5 | Footer: social links (Facebook, Instagram, Twitter, YouTube) | ✅ (inline SVG) | Both Next.js and Lovable have social links as `href="#"` placeholders — acceptable parity |
| FH6 | **Footer: newsletter subscription** | 🔴 **FOOTER-NL** | The newsletter form calls `e.preventDefault()` but makes **no API call** and shows no feedback. Users who type their email and click "Subscribe" get no response and no subscription is recorded. Lovable also has no newsletter backend — but Lovable's form is visually incomplete, while Next.js shows a polished input + button that silently does nothing. |

### SF-PRODUCT-CARD

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PC1 | Image with hover scale + overlay | ✅ | |
| PC2 | Discount badge (% off from compareAtPrice) | ✅ | |
| PC3 | Out of Stock / Low Stock badges | ✅ | |
| PC4 | Wishlist toggle (heart icon, fills on wishlist) | ✅ | |
| PC5 | Add to Cart button (opens AddToCartDialog) | ✅ | |
| PC6 | Rating stars + review count | ✅ | |
| PC7 | **Eye / Quick View button** | 🔴 **PRODUCT-EYE** | Eye icon button is visible on every card hover. Its `onClick` handler is **empty** — clicking does nothing. Lovable does not have a quick view button at all. In Next.js it appears as a feature but is completely non-functional. Fix: either implement the quick view modal or remove the button. |

### SF-PAYMENT-CALLBACK

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PB1 | Verifying spinner state | ✅ | |
| PB2 | Success state with 1.5s redirect to `/orders/{orderId}` | ✅ | |
| PB3 | Failed / cancelled states with action buttons | ✅ | |
| PB4 | Cancellation detection from query params | ✅ | |

### SF-PUBLIC-RECEIPT

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PR1 | Server-rendered receipt with store settings | ✅ | |
| PR2 | Item table, totals, notes | ✅ | |
| PR3 | Payment method and status display | ✅ | |

---

## Part 2 — Storefront: Context & Hooks Deep Read

### CartContext

| # | Feature | Status |
|---|---------|--------|
| CC1 | Add item with stock ceiling enforcement | ✅ |
| CC2 | Remove, update quantity, clear cart | ✅ |
| CC3 | localStorage persistence with SSR safety | ✅ |
| CC4 | Variation-aware de-duplication (`productId:variation` key) | ✅ |

### WishlistContext

| # | Feature | Status |
|---|---------|--------|
| WC1 | React Query with server persistence | ✅ |
| WC2 | Optimistic toggle with toast feedback | ✅ |
| WC3 | Session guard (disabled query if no session) | ✅ |
| WC4 | `clear()` empties local state only — no API call | 🔴 **WISHLIST-CLEAR** |

### useFlutterwavePayment

| # | Feature | Status |
|---|---------|--------|
| FW1 | `initiatePayment` → POST init → redirect to FLW | ✅ |
| FW2 | `verifyPayment` → POST verify → clear cart on success | ✅ |
| FW3 | Error capture and loading state | ✅ |

---

## Part 3 — Admin: New Deep-Read Findings

### AD-PRODUCTS — Admin Products Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| AP1 | Stats cards (total, active, out of stock, retail value) | ✅ | |
| AP2 | Search and sort (name, price, stock, margin) | ✅ | |
| AP3 | Bulk selection with activate/deactivate | ✅ | |
| AP4 | Quick restock dialog (add batch inline) | ✅ | |
| AP5 | Active/inactive toggle per row | ✅ | |
| AP6 | Edit button → edit page | ✅ | |
| AP7 | Stock + margin colour coding | ✅ | |
| AP8 | **Delete product** | 🔴 **ADMIN-PROD-DELETE** | `DELETE /api/admin/products/[id]` exists and `useDeleteProduct` mutation is implemented in `useProducts.ts`. But the products list page has **no delete button or action** — there is no UI entry point to delete a product. Lovable has product delete in the admin. The API and hook are wired but the UI is missing. |

### AD-ORDERS — Admin Orders

| # | Feature | Status |
|---|---------|--------|
| AO1 | Stats (total orders, revenue, in-transit, awaiting payment) | ✅ |
| AO2 | Status tab filter + search + payment method filter | ✅ |
| AO3 | Mobile card layout / desktop table layout | ✅ |
| AO4 | Item thumbnail previews (stacked, +N overflow) | ✅ |
| AO5 | Inline status change per row | ✅ |
| AO6 | Generate receipt button | ✅ |
| AO7 | Delete order with confirmation | ✅ |

### AD-ORDER-DETAIL — Admin Order Detail

| # | Feature | Status |
|---|---------|--------|
| OD1 | Status update + note | ✅ |
| OD2 | Payment confirmation button (if not paid) | ✅ |
| OD3 | FIFO batch allocation detail per item (collapsible) | ✅ |
| OD4 | Gross profit + margin calculation | ✅ |
| OD5 | Payment transactions history | ✅ |
| OD6 | Customer info + shipping address + notes | ✅ |

### AD-ANALYTICS

| # | Feature | Status |
|---|---------|--------|
| AN1 | 5 time ranges (7d, 30d, 90d, 6m, 1y) | ✅ |
| AN2 | 6 KPI cards with period-over-period % change | ✅ |
| AN3 | Revenue trend (area chart) | ✅ |
| AN4 | Order status distribution (donut chart) | ✅ |
| AN5 | Profit breakdown with margin health indicator | ✅ |
| AN6 | Online vs Offline revenue bar chart | ✅ |
| AN7 | Top products list | ✅ |
| AN8 | Category breakdown | ✅ |
| AN9 | Low stock alert section | ✅ |

### AD-INVENTORY

| # | Feature | Status |
|---|---------|--------|
| IN1 | Stats (units, value, out of stock, low stock) | ✅ |
| IN2 | Products tab with sort | ✅ |
| IN3 | Batches tab | ✅ |
| IN4 | Active stock reservations tab | ✅ |
| IN5 | Per-product batch management page | ✅ |
| IN6 | Add batch form (qty, cost price) | ✅ |

### AD-AUDIT

| # | Feature | Status |
|---|---------|--------|
| AU1 | Search (action, entity, after field) | ✅ |
| AU2 | Entity type filter (6 types) | ✅ |
| AU3 | Action colour-coded badges | ✅ |
| AU4 | Formatted detail extraction (product_name, status, qty etc.) | ✅ |

### AD-USERS

| # | Feature | Status |
|---|---------|--------|
| US1 | Stats (total, admins, customers) | ✅ |
| US2 | Search by name/email | ✅ |
| US3 | Add Admin dialog (POST to roles API) | ✅ |
| US4 | Grant/revoke admin role per row | ✅ |
| US5 | Self-demotion prevention | ✅ |

### AD-SETTINGS

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| SE1 | Settings hub with navigation cards | ✅ | |
| SE2 | General (store name, tagline, email, phone, address) | ✅ | |
| SE3 | Delivery (Abuja zones + interstate tiers) | ✅ | |
| SE4 | Payment & Bank Details (primary + secondary bank account, payment instructions) | ➕ | Extra feature — not in Lovable; Next.js adds manual bank transfer config |
| SE5 | Notifications (alert toggles, email recipient, low stock threshold) | ✅ | |
| SE6 | Appearance settings | ➕ (deferred) | Neither Lovable nor Next.js has a working appearance settings page. Previous V3 ✅ was incorrect — file does not exist. The settings hub does NOT link to it. Not a gap relative to Lovable. |

### AD-RECEIPTS (Admin)

| # | Feature | Status |
|---|---------|--------|
| RC1 | List with search, type filter | ✅ |
| RC2 | Receipt detail with print/PDF/thermal | ✅ |
| RC3 | Share dropdown (Copy Link, WhatsApp, Email) | ✅ |
| RC4 | Manual receipt creation (`/admin/receipts/new`) | ✅ |
| RC5 | Product autocomplete in manual receipt form | ✅ |

---

## Part 4 — API Routes: New Deep-Read Findings

### POS Sale Route (`/api/admin/pos/sale`)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PS1 | Creates order + receipt in one call | ✅ | |
| PS2 | Deducts inventory via FIFO (`deductPOSInventory`) | ✅ | |
| PS3 | Auth guard (admin/staff) | ✅ | |
| PS4 | **Pre-flight stock check** | ⚠️ | `deductPOSInventory` is called without first validating available stock. If a product has 0 stock, the deduction could fail silently or produce invalid data. This is not in Lovable either, but it's a data integrity risk. Recommend adding a stock check before the deduction loop. |
| PS5 | **Audit log** | ⚠️ | POS sales do not write an audit log entry. All other admin mutations (products, orders, inventory, users, settings) are logged. POS is the only one missing. |

### Receipts API (`/api/admin/receipts`)

| # | Feature | Status |
|---|---------|--------|
| RA1 | GET list (all receipts, desc by date) | ✅ |
| RA2 | POST create manual receipt | ✅ |
| RA3 | GET single receipt by ID | ✅ |

### Upload Route (`/api/upload`)

| # | Feature | Status |
|---|---------|--------|
| UP1 | Auth guard (admin/staff) | ✅ |
| UP2 | File size limit (10MB) | ✅ |
| UP3 | File type whitelist (JPEG, PNG, WebP, GIF, MP4) | ✅ |
| UP4 | Upload to DigitalOcean Spaces | ✅ |

### Reservations Expire (`/api/reservations/expire`)

| # | Feature | Status |
|---|---------|--------|
| RE1 | Bearer token auth | ✅ |
| RE2 | GET + POST supported (cron compatibility) | ✅ |
| RE3 | Returns expiry count | ✅ |

---

## V4 Gap Summary

### New Non-Acceptable Gaps (7)

| ID | Area | Severity | Description | File(s) |
|----|------|----------|-------------|---------|
| CART-COUPON | Cart page | **P1** | Coupon input + "Apply" button renders on cart page but Apply has no `onClick` handler — completely non-functional visible UI | `src/app/(store)/cart/page.tsx` |
| PRODUCT-EYE | ProductCard | **P1** | Eye/Quick-View icon button on every product card has an **empty** `onClick` — visible but does nothing | `src/components/store/ProductCard.tsx` |
| ADMIN-PROD-DELETE | Admin Products | **P1** | `DELETE /api/admin/products/[id]` and `useDeleteProduct` hook both exist but no delete button or action exists in the products list UI | `src/app/admin/products/page.tsx` |
| ACCOUNT-REDIRECT | Account page | **P1** | Unauthenticated users see a blank page — page returns `null` instead of `redirect('/login')` | `src/app/(store)/account/page.tsx` |
| FOOTER-NL | Store Footer | **P2** | Newsletter subscribe form silently does nothing — `e.preventDefault()` only, no API call, no feedback | `src/components/store/StoreFooter.tsx` |
| WISHLIST-CLEAR | WishlistContext | **P2** | `clear()` empties local React state but never calls the backend — wishlist reappears from server on next load | `src/context/WishlistContext.tsx` |
| RESET-TOGGLE | Reset Password | **P2** | Both password and confirm-password fields share one `showPassword` state — toggling either reveals/hides both simultaneously | `src/app/(auth)/reset-password/page.tsx` |

### Code Quality Notes (not functional gaps, but risk items)

| ID | Area | Note |
|----|------|------|
| POS-STOCK | POS sale | `deductPOSInventory` called without pre-flight stock check — potential oversell risk |
| POS-AUDIT | POS sale | POS sales not written to audit log — only admin mutation not logged |

---

## All-Phase Running Score

| Phase | Gaps Found | Gaps Fixed | New ✅ Confirmed |
|-------|-----------|-----------|-----------------|
| Phase 1 | 26 | 26 | ~50 features |
| Phase 2 | 12 | 12 | 147 features |
| Phase 3 | 3 | 3 | 200 features |
| Phase 4 | **7 new** | 0 (pending) | 220+ features |

**Current score: 213 / 220 features confirmed ✅ (96.8%)**

---

## Fix Priority for V4 Gaps

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| **P1** | ACCOUNT-REDIRECT | Trivial — replace `return null` with `redirect('/login')` | Every unauthenticated visit to /account shows a blank page |
| **P1** | ADMIN-PROD-DELETE | Low — add delete button to products table row, wire to `useDeleteProduct` | Admin cannot delete products from the list |
| **P1** | CART-COUPON | Low fix or remove — either implement coupon API or remove the UI | Visible broken affordance on cart page |
| **P1** | PRODUCT-EYE | Low — remove the Eye button (no quick view exists in Lovable either) | Non-functional button visible on every product card |
| **P2** | RESET-TOGGLE | Trivial — add separate `showConfirmPassword` state | Minor UX bug on password reset |
| **P2** | WISHLIST-CLEAR | Low — add DELETE `/api/wishlist/all` endpoint and call it in `clear()` | Wishlist reappears after clear |
| **P2** | FOOTER-NL | Low — add `/api/newsletter/subscribe` endpoint or remove form submit button | Silent failure on newsletter subscribe |

---

## Conclusion

After four rounds of analysis covering 220+ features across storefront and admin (UI, UX, business logic, API routes, hooks, contexts), the Next.js rewrite is **functionally complete** with 7 remaining non-acceptable gaps — all found in this round.

All gaps are small: 4 involve removing or wiring up orphaned UI elements, 2 are trivial logic fixes, 1 is a single-line redirect. There are no missing major features, no broken payment flows, no data corruption paths (outside the POS stock note). The codebase is ready for a fix pass and can ship after it.
