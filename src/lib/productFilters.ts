import { sql } from 'drizzle-orm';
import { products } from '@/db/schema';

/**
 * A raw SQL condition (for Drizzle's `.where()`) matching products that have
 * a real photo — either a main `imageUrl` or a non-empty `images` gallery.
 * Written as raw SQL rather than Drizzle helpers because it needs to reach
 * into the `images` jsonb array's length, which isn't something `isNotNull`/
 * `ne` can express directly.
 *
 * Use this in server-side queries that feed customer-facing listings
 * (homepage sections, storefront pagination) so a product with no photo is
 * never selected in the first place — filtering it out client-side only,
 * after a query already capped/ranked/paginated without knowing about
 * images, is what let real photographed products get silently pushed out of
 * a "top N" cut by unrelated image-less ones.
 *
 * Do NOT apply this to the shared `/api/products` endpoint by default — POS
 * and the admin panel use it too, and staff need to find and sell every
 * product regardless of whether a photo's been uploaded yet. See
 * `hasProductImage` in `@/lib/utils` for the client-side equivalent used
 * where a shared, unfiltered endpoint's data still needs to be trimmed down
 * for a customer-facing view.
 */
export const hasProductImageSql = sql`(${products.imageUrl} is not null and ${products.imageUrl} <> '') or jsonb_array_length(coalesce(${products.images}, '[]'::jsonb)) > 0`;
