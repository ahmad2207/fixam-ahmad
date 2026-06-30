import { db } from '@/lib/db';
import { categories, products } from '@/db/schema';
import { eq, and, gt, count, asc } from 'drizzle-orm';
import Link from 'next/link';

const CATEGORY_ICONS: Record<string, string> = {
  cookware:   '🍳',
  cutlery:    '🔪',
  appliances: '⚡',
  storage:    '🗄️',
  bakeware:   '🧁',
  utensils:   '🥄',
  seasonal:   '🌿',
};

export async function CategoryNavBar() {
  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      count: count(products.id),
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true), gt(products.stock, 0)))
    .groupBy(categories.id, categories.name, categories.slug)
    .having(gt(count(products.id), 0))
    .orderBy(asc(categories.name));

  if (cats.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 lg:px-12">
        <div className="flex items-center gap-1 overflow-x-auto py-2 [&::-webkit-scrollbar]:hidden">

          <Link
            href="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-primary hover:bg-orange-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            🛍️ All Items
          </Link>

          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

          {cats.filter(c => c.slug !== 'bakeware').map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-primary hover:bg-orange-50 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <span>{CATEGORY_ICONS[cat.slug] ?? '📦'}</span>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
