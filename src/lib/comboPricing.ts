// Pure combo-deal pricing helpers — no `db` import, so this is safe to use
// from client components too (see combos.ts for the DB-touching query
// functions that build the shapes below; that file must stay server-only).

export function slugifyCombo(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface ComboComponent {
  itemId: string; // comboDealItems.id — stable across a product swap in this slot
  productId: string | null;
  quantity: number;
  position: number;
  // null when the underlying product was deleted (productId went `set null`)
  // — the admin UI shows this slot as needing a replacement.
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    stock: number;
    isActive: boolean;
  } | null;
}

export interface ComboDealWithComponents {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isActive: boolean;
  components: ComboComponent[];
}

export interface ComboPricing {
  sumOfParts: number;
  savings: number;
  // How many bundles can be purchased right now, given live component stock.
  // 0 whenever any component is missing, inactive, or out of stock.
  maxQuantity: number;
  available: boolean;
}

/**
 * Live pricing/availability for one combo — never stored, always derived
 * from the components' current `products.price`/`stock`/`isActive`, the
 * same way a product's own `compareAtPrice` savings are computed on the fly
 * elsewhere rather than cached.
 */
export function computeComboPricing(combo: { price: number; components: ComboComponent[] }): ComboPricing {
  let sumOfParts = 0;
  let maxQuantity = Infinity;
  let available = combo.components.length > 0;

  for (const c of combo.components) {
    if (!c.product || !c.product.isActive || c.product.stock <= 0) {
      available = false;
      continue;
    }
    sumOfParts += c.product.price * c.quantity;
    maxQuantity = Math.min(maxQuantity, Math.floor(c.product.stock / c.quantity));
  }

  if (!available || !Number.isFinite(maxQuantity)) maxQuantity = 0;

  return {
    sumOfParts,
    savings: Math.max(0, sumOfParts - combo.price),
    maxQuantity,
    available,
  };
}
