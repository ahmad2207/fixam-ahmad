/**
 * Full data migration seed script.
 * Reads semicolon-delimited CSV exports from scripts/seed-data/ and inserts into PostgreSQL.
 *
 * Run AFTER clear-db.ts on a blank database:
 *   npx tsx scripts/clear-db.ts
 *   npx tsx scripts/seed.ts
 * Or via npm:
 *   npm run db:seed
 */

import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  users,
  profiles,
  userRoles,
  addresses,
  categories,
  products,
  orders,
  orderItems,
  reviews,
  wishlist,
  inventoryBatches,
  batchAllocations,
  stockReservations,
  paymentTransactions,
  receipts,
  storeSettings,
  adminAuditLog,
} from '../src/db/schema';

// ── Env loader ────────────────────────────────────────────────────────────────
try {
  const envContent = readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* rely on environment */ }

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(filePath: string): Record<string, string>[] {
  const content = readFileSync(filePath, 'utf-8').replace(/\r/g, '');
  const lines = content.split('\n');
  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  let i = 1;
  while (i < lines.length) {
    if (!lines[i].trim()) { i++; continue; }
    let rawLine = lines[i];
    // Join continuation lines when a quoted field contains a newline
    let quoteCount = (rawLine.match(/"/g) || []).length;
    while (quoteCount % 2 !== 0 && i + 1 < lines.length) {
      i++;
      rawLine += '\n' + lines[i];
      quoteCount = (rawLine.match(/"/g) || []).length;
    }
    const values = parseLine(rawLine);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
    i++;
  }
  return rows;
}

const DATA_DIR = path.join(process.cwd(), 'scripts', 'seed-data');

/** Find and parse the first CSV whose filename starts with `prefix`. */
function csv(prefix: string): Record<string, string>[] {
  const files = readdirSync(DATA_DIR).sort();
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.csv'));
  if (!match) throw new Error(`CSV not found with prefix: ${prefix}`);
  console.log(`    reading ${match}`);
  return parseCSV(path.join(DATA_DIR, match));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '');
}

function toDate(s: string): Date { return new Date(s); }

function safeJson<T>(s: string, fallback: T): T {
  if (!s || s === 'null' || s === '') return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function orNull(s: string): string | null {
  return s && s !== 'null' ? s : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 5 });
  const db = drizzle(client);

  console.log('🌱 Starting migration seed...\n');

  // ── 1. Store Settings ──────────────────────────────────────────────────────
  console.log('1/17  Store settings...');
  const [ss] = csv('store_settings');
  await db.insert(storeSettings).values({
    id: ss.id,
    storeName: ss.store_name,
    storeEmail: orNull(ss.store_email),
    storePhone: orNull(ss.store_phone),
    storeAddress: orNull(ss.store_address),
    currency: ss.currency || 'NGN',
    currencySymbol: ss.currency_symbol || '₦',
    logoUrl: orNull(ss.logo_url),
    deliveryFee: ss.delivery_fee || '0',
    freeDeliveryThreshold: orNull(ss.free_delivery_threshold),
    deliveryConfig: safeJson(ss.delivery_config, null),
    bankName: orNull(ss.bank_name),
    accountNumber: orNull(ss.account_number),
    accountName: orNull(ss.account_name),
    notifyNewOrders: ss.notify_new_orders === 'true',
    notifyLowStock: ss.notify_low_stock === 'true',
    lowStockThreshold: parseInt(ss.low_stock_threshold) || 5,
    notifyEmail: orNull(ss.notify_email),
    createdAt: toDate(ss.created_at),
    updatedAt: toDate(ss.updated_at),
  });
  console.log('    ✓ 1 row\n');

  // ── 2. Categories ──────────────────────────────────────────────────────────
  // Inserted with their exact Lovable UUIDs — no conflicts on a clean DB.
  console.log('2/17  Categories...');
  const categoryRows = csv('categories');
  const categoryIdByName: Record<string, string> = {};
  const slugCount: Record<string, number> = {};

  for (const row of categoryRows) {
    let slug = slugify(row.name);
    if (!slug) slug = row.id.slice(0, 8);
    if (slugCount[slug]) { slugCount[slug]++; slug = `${slug}-${slugCount[slug]}`; }
    else slugCount[slug] = 1;

    await db.insert(categories).values({
      id: row.id,
      name: row.name,
      slug,
      icon: orNull(row.icon),
      sortOrder: parseInt(row.sort_order) || 0,
      createdAt: toDate(row.created_at),
    });
    categoryIdByName[row.name] = row.id;
  }
  console.log(`    ✓ ${categoryRows.length} rows\n`);

  // ── 3. Users ───────────────────────────────────────────────────────────────
  // Lovable: profiles.id = separate UUID, profiles.user_id = auth user UUID.
  // Next.js: profiles.id = users.id. We use user_id as the user primary key.
  console.log('3/17  Users...');
  const profileRows = csv('profiles');
  const profileByUserId: Record<string, Record<string, string>> = {};
  for (const p of profileRows) profileByUserId[p.user_id] = p;

  for (const row of profileRows) {
    await db.insert(users).values({
      id: row.user_id,
      name: orNull(row.full_name),
      email: orNull(row.email),
      image: orNull(row.avatar_url),
      hashedPassword: null,   // Supabase Auth managed; users must reset password
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${profileRows.length} rows\n`);

  // ── 4. Profiles ────────────────────────────────────────────────────────────
  console.log('4/17  Profiles...');
  for (const row of profileRows) {
    await db.insert(profiles).values({
      id: row.id,           // Lovable's own profile UUID (separate from auth user)
      userId: row.user_id,  // FK → users.id
      fullName: orNull(row.full_name),
      email: orNull(row.email),
      phone: orNull(row.phone),
      avatarUrl: orNull(row.avatar_url),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${profileRows.length} rows\n`);

  // ── 5. User Roles ──────────────────────────────────────────────────────────
  // 4 users have dual roles (admin + customer) in Lovable — take highest (admin).
  console.log('5/17  User roles...');
  const roleRows = csv('user_roles');
  const rolePriority: Record<string, number> = { admin: 3, staff: 2, customer: 1 };
  const bestRole: Record<string, string> = {};

  for (const row of roleRows) {
    const cur = bestRole[row.user_id];
    if (!cur || (rolePriority[row.role] ?? 0) > (rolePriority[cur] ?? 0)) {
      bestRole[row.user_id] = row.role;
    }
  }
  for (const [userId, role] of Object.entries(bestRole)) {
    await db.insert(userRoles).values({
      userId,
      role: role as 'admin' | 'staff' | 'customer',
      createdAt: new Date(),
    });
  }
  console.log(`    ✓ ${Object.keys(bestRole).length} rows (deduped from ${roleRows.length})\n`);

  // ── 6. Addresses ──────────────────────────────────────────────────────────
  // CSV has no full_name / phone — fill from the matching profile.
  console.log('6/17  Addresses...');
  const addressRows = csv('addresses');
  for (const row of addressRows) {
    const profile = profileByUserId[row.user_id];
    await db.insert(addresses).values({
      id: row.id,
      userId: row.user_id,
      label: orNull(row.label) ?? 'Home',
      fullName: profile?.full_name || '',
      phone: profile?.phone || '',
      streetAddress: row.street_address,
      city: row.city,
      state: row.state,
      country: row.country || 'Nigeria',
      postalCode: orNull(row.postal_code),
      isDefault: row.is_default === 'true',
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${addressRows.length} rows\n`);

  // ── 7. Products ───────────────────────────────────────────────────────────
  // category column is plain text name → resolved to the exact Lovable categoryId.
  console.log('7/17  Products...');
  const productRows = csv('products');
  const productIdSet = new Set<string>();
  const productSlugCount: Record<string, number> = {};

  for (const row of productRows) {
    let slug = slugify(row.name);
    if (!slug) slug = row.id.slice(0, 8);
    if (productSlugCount[slug]) { productSlugCount[slug]++; slug = `${slug}-${productSlugCount[slug]}`; }
    else productSlugCount[slug] = 1;

    const images = safeJson<string[]>(row.images, []);
    const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;

    await db.insert(products).values({
      id: row.id,
      name: row.name,
      slug,
      description: orNull(row.description),
      price: row.price,
      compareAtPrice: orNull(row.original_price),
      costPrice: orNull(row.cost_price) ?? '0',
      categoryId: categoryIdByName[row.category] ?? null,
      collection: orNull(row.collection),
      imageUrl,
      images,
      stock: parseInt(row.stock) || 0,
      status: 'active',
      isActive: true,
      isFeatured: false,
      variations: safeJson(row.variations, []),
      specifications: safeJson(row.specifications, null),
      rating: row.rating || '0',
      reviewsCount: parseInt(row.reviews_count) || 0,
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
    productIdSet.add(row.id);
  }
  console.log(`    ✓ ${productRows.length} rows\n`);

  // ── 8. Orders ─────────────────────────────────────────────────────────────
  // shipping_address JSONB → flat columns.
  console.log('8/17  Orders...');
  const orderRows = csv('orders');
  const validOrderStatuses = new Set([
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
  ]);

  for (const row of orderRows) {
    const sa = safeJson<Record<string, string>>(row.shipping_address, {});
    const status = validOrderStatuses.has(row.status) ? row.status : 'pending';
    await db.insert(orders).values({
      id: row.id,
      orderNumber: orNull(row.order_number),
      userId: orNull(row.user_id),
      addressId: orNull(row.address_id),
      status: status as any,
      paymentMethod: orNull(row.payment_method),
      paymentStatus: row.payment_status || 'pending',
      saleType: 'online',
      subtotal: row.subtotal,
      deliveryFee: row.delivery_fee || '0',
      total: row.total,
      shippingFullName: orNull(sa.fullName ?? ''),
      shippingPhone: orNull(sa.phone ?? ''),
      shippingStreetAddress: orNull(sa.streetAddress ?? ''),
      shippingCity: orNull(sa.city ?? ''),
      shippingState: orNull(sa.state ?? ''),
      shippingAbujaZone: orNull(sa.abujaZone ?? ''),
      notes: orNull(row.notes),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${orderRows.length} rows\n`);

  // ── 9. Order Items ────────────────────────────────────────────────────────
  // Some products were deleted in Lovable before export — set productId = null.
  console.log('9/17  Order items...');
  const orderItemRows = csv('order_items');
  let orphanItems = 0;

  for (const row of orderItemRows) {
    const productId = productIdSet.has(row.product_id) ? row.product_id : null;
    if (!productId) orphanItems++;
    await db.insert(orderItems).values({
      id: row.id,
      orderId: row.order_id,
      productId,
      productName: row.product_name,
      productImage: orNull(row.product_image),
      quantity: parseInt(row.quantity),
      price: row.price,
      variation: orNull(row.variation),
      fromReservation: row.from_reservation === 'true',
      createdAt: toDate(row.created_at),
    });
  }
  if (orphanItems) console.log(`    ⚠  ${orphanItems} items reference deleted products → productId set null`);
  console.log(`    ✓ ${orderItemRows.length} rows\n`);

  // ── 10. Reviews ───────────────────────────────────────────────────────────
  // Lovable column: comment → Next.js column: body
  console.log('10/17 Reviews...');
  const reviewRows = csv('reviews');
  let skippedReviews = 0;

  for (const row of reviewRows) {
    if (!productIdSet.has(row.product_id)) { skippedReviews++; continue; }
    await db.insert(reviews).values({
      id: row.id,
      productId: row.product_id,
      userId: orNull(row.user_id),
      rating: parseInt(row.rating),
      body: orNull(row.comment),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  if (skippedReviews) console.log(`    ⚠  ${skippedReviews} reviews skipped (product not found)`);
  console.log(`    ✓ ${reviewRows.length - skippedReviews} rows\n`);

  // ── 11. Wishlist ──────────────────────────────────────────────────────────
  console.log('11/17 Wishlist...');
  const wishlistRows = csv('wishlist');
  let wishlistInserted = 0;

  for (const row of wishlistRows) {
    if (!productIdSet.has(row.product_id)) {
      console.log(`    ⚠  skipping wishlist item — product ${row.product_id} not found`);
      continue;
    }
    await db.insert(wishlist).values({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      createdAt: toDate(row.created_at),
    });
    wishlistInserted++;
  }
  console.log(`    ✓ ${wishlistInserted} rows\n`);

  // ── 12. Inventory Batches ─────────────────────────────────────────────────
  console.log('12/17 Inventory batches...');
  const batchRows = csv('inventory_batches');
  let batchInserted = 0;

  for (const row of batchRows) {
    if (!productIdSet.has(row.product_id)) continue;
    await db.insert(inventoryBatches).values({
      id: row.id,
      productId: row.product_id,
      quantityAvailable: parseInt(row.quantity_available) || 0,
      costPrice: row.cost_price || '0',
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
    batchInserted++;
  }
  console.log(`    ✓ ${batchInserted} rows (${batchRows.length - batchInserted} orphaned batches skipped)\n`);

  // ── 13. Batch Allocations ─────────────────────────────────────────────────
  console.log('13/17 Batch allocations...');
  const allocationRows = csv('batch_allocations');
  for (const row of allocationRows) {
    await db.insert(batchAllocations).values({
      id: row.id,
      orderItemId: row.order_item_id,
      batchId: row.batch_id,
      quantity: parseInt(row.quantity),
      costPriceAtTime: row.cost_price_at_time || '0',
      createdAt: toDate(row.created_at),
    });
  }
  console.log(`    ✓ ${allocationRows.length} rows\n`);

  // ── 14. Stock Reservations ────────────────────────────────────────────────
  // All rows are released/expired — historical data only.
  console.log('14/17 Stock reservations...');
  const reservationRows = csv('stock_reservations');
  for (const row of reservationRows) {
    await db.insert(stockReservations).values({
      id: row.id,
      checkoutId: row.checkout_id,
      productId: row.product_id,
      batchId: row.batch_id,
      quantity: parseInt(row.quantity),
      costPrice: row.cost_price || '0',
      status: (row.status as any) || 'released',
      consumedOrderItemId: orNull(row.consumed_order_item_id),
      expiresAt: toDate(row.expires_at),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${reservationRows.length} rows\n`);

  // ── 15. Payment Transactions ──────────────────────────────────────────────
  // Two duplicate export files exist — csv() picks the first alphabetically (-47).
  console.log('15/17 Payment transactions...');
  const txRows = csv('payment_transactions');
  const validTxStatuses = new Set(['initiated', 'pending', 'successful', 'failed', 'cancelled']);

  for (const row of txRows) {
    const status = validTxStatuses.has(row.status) ? row.status : 'initiated';
    await db.insert(paymentTransactions).values({
      id: row.id,
      orderId: orNull(row.order_id),
      checkoutId: orNull(row.checkout_id),
      flutterwaveTxRef: orNull(row.tx_ref),
      flutterwaveTransactionId: orNull(row.flutterwave_transaction_id),
      amount: row.amount,
      currency: row.currency || 'NGN',
      customerName: orNull(row.customer_name),
      customerEmail: orNull(row.customer_email),
      status: status as any,
      rawResponse: orNull(row.gateway_response),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${txRows.length} rows\n`);

  // ── 16. Receipts ──────────────────────────────────────────────────────────
  // sale_type → type; items JSONB → stringify to text column.
  console.log('16/17 Receipts...');
  const receiptRows = csv('receipts');
  const validReceiptTypes = new Set(['online', 'pos', 'offline']);

  for (const row of receiptRows) {
    const type = validReceiptTypes.has(row.sale_type) ? row.sale_type : 'online';
    const itemsText = row.items
      ? JSON.stringify(safeJson(row.items, row.items))
      : '[]';
    await db.insert(receipts).values({
      id: row.id,
      receiptNumber: row.receipt_number,
      orderId: orNull(row.order_id),
      type: type as any,
      customerName: orNull(row.customer_name),
      customerEmail: orNull(row.customer_email),
      customerPhone: orNull(row.customer_phone),
      subtotal: row.subtotal,
      deliveryFee: row.delivery_fee || '0',
      total: row.total,
      items: itemsText,
      paymentMethod: orNull(row.payment_method),
      paymentStatus: row.payment_status || 'paid',
      notes: orNull(row.notes),
      createdBy: orNull(row.created_by),
      salesRep: orNull(row.sales_rep),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }
  console.log(`    ✓ ${receiptRows.length} rows\n`);

  // ── 17. Admin Audit Log ───────────────────────────────────────────────────
  console.log('17/17 Admin audit log...');
  const auditRows = csv('admin_audit_log');
  for (const row of auditRows) {
    await db.insert(adminAuditLog).values({
      id: row.id,
      userId: orNull(row.admin_user_id),
      adminName: orNull(row.admin_name),
      action: row.action,
      entityType: orNull(row.entity_type),
      entityId: orNull(row.entity_id),
      details: safeJson(row.details, null),
      createdAt: toDate(row.created_at),
    });
  }
  console.log(`    ✓ ${auditRows.length} rows\n`);

  console.log('✅  Migration complete!');
  await client.end();
}

main().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
