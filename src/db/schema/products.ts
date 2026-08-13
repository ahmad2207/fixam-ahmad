import { pgTable, text, integer, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { categories } from './categories';

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  // Both price and costPrice are derived from inventory batches (see
  // syncProductStockFromBatches in lib/inventory.ts) — the admin product
  // form never sets these directly, only the Inventory page does, per
  // batch. The default of '0' only covers the moment between creating a
  // product and adding its first batch.
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull().default('0'),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  collection: text('collection'),
  imageUrl: text('image_url'),
  images: jsonb('images').$type<string[]>().default([]),
  stock: integer('stock').notNull().default(0),
  sku: text('sku').unique(),
  barcode: text('barcode').unique(),
  status: text('status').notNull().default('active'),
  variations: jsonb('variations').$type<{ name: string; options: string[] }[]>().default([]),
  // Set together: pricedVariationName names which entry in `variations`
  // above (e.g. "Size") determines price/stock — null means this product's
  // variations (if any) are cosmetic labels only, unchanged from before.
  // defaultVariationOption is which of that group's options is "the"
  // storefront price, mirrored into price/costPrice above by
  // syncProductStockFromBatches in lib/inventory.ts.
  pricedVariationName: text('priced_variation_name'),
  defaultVariationOption: text('default_variation_option'),
  specifications: jsonb('specifications'),
  tags: jsonb('tags').$type<string[]>().default([]),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewsCount: integer('reviews_count').notNull().default(0),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isPromo: boolean('is_promo').default(false).notNull(),
  promoEndsAt: timestamp('promo_ends_at', { mode: 'date' }),
  restockAt: timestamp('restock_at', { mode: 'date' }),
  isActive: boolean('is_active').default(true).notNull(),
  weight: numeric('weight', { precision: 8, scale: 3 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
