import { db } from '@/lib/db';
import { comboDeals, comboDealItems, products } from '@/db/schema';
import { eq, inArray, desc, asc } from 'drizzle-orm';
import type { ComboComponent, ComboDealWithComponents } from '@/lib/comboPricing';

// Re-exported so server code can import everything combo-related from one
// place; client components must import from '@/lib/comboPricing' directly
// instead (this file pulls in `db`, which has no business in a client bundle).
export { slugifyCombo, computeComboPricing } from '@/lib/comboPricing';
export type { ComboComponent, ComboDealWithComponents, ComboPricing } from '@/lib/comboPricing';

async function loadComponentsByComboId(comboIds: string[]): Promise<Map<string, ComboComponent[]>> {
  const map = new Map<string, ComboComponent[]>();
  if (!comboIds.length) return map;

  const rows = await db
    .select({
      itemId: comboDealItems.id,
      comboDealId: comboDealItems.comboDealId,
      productId: comboDealItems.productId,
      quantity: comboDealItems.quantity,
      position: comboDealItems.position,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        imageUrl: products.imageUrl,
        stock: products.stock,
        isActive: products.isActive,
      },
    })
    .from(comboDealItems)
    .leftJoin(products, eq(comboDealItems.productId, products.id))
    .where(inArray(comboDealItems.comboDealId, comboIds))
    .orderBy(asc(comboDealItems.position));

  for (const row of rows) {
    const list = map.get(row.comboDealId) ?? [];
    list.push({
      itemId: row.itemId,
      productId: row.productId,
      quantity: row.quantity,
      position: row.position,
      product: row.product?.id
        ? {
            id: row.product.id,
            name: row.product.name,
            slug: row.product.slug,
            price: Number(row.product.price),
            imageUrl: row.product.imageUrl,
            stock: row.product.stock,
            isActive: row.product.isActive,
          }
        : null,
    });
    map.set(row.comboDealId, list);
  }
  return map;
}

function toComboDeal(row: typeof comboDeals.$inferSelect, components: ComboComponent[]): ComboDealWithComponents {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    price: Number(row.price),
    isActive: row.isActive,
    components,
  };
}

export async function getComboDealById(id: string): Promise<ComboDealWithComponents | null> {
  const row = await db.query.comboDeals.findFirst({ where: eq(comboDeals.id, id) });
  if (!row) return null;
  const componentsByCombo = await loadComponentsByComboId([id]);
  return toComboDeal(row, componentsByCombo.get(id) ?? []);
}

export async function getComboDealBySlug(slug: string): Promise<ComboDealWithComponents | null> {
  const row = await db.query.comboDeals.findFirst({ where: eq(comboDeals.slug, slug) });
  if (!row) return null;
  const componentsByCombo = await loadComponentsByComboId([row.id]);
  return toComboDeal(row, componentsByCombo.get(row.id) ?? []);
}

/** Active bundles for storefront listings (combo-deals page, homepage slider). */
export async function getActiveComboDeals(): Promise<ComboDealWithComponents[]> {
  const rows = await db.select().from(comboDeals).where(eq(comboDeals.isActive, true)).orderBy(desc(comboDeals.updatedAt));
  const componentsByCombo = await loadComponentsByComboId(rows.map((r) => r.id));
  return rows.map((r) => toComboDeal(r, componentsByCombo.get(r.id) ?? []));
}

/** Every bundle, active or not, for the admin list page. */
export async function getAllComboDealsForAdmin(): Promise<ComboDealWithComponents[]> {
  const rows = await db.select().from(comboDeals).orderBy(desc(comboDeals.updatedAt));
  const componentsByCombo = await loadComponentsByComboId(rows.map((r) => r.id));
  return rows.map((r) => toComboDeal(r, componentsByCombo.get(r.id) ?? []));
}
