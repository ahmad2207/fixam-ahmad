import { StoreFooter } from '@/components/store/StoreFooter';
import { MobileBottomNav } from '@/components/store/MobileBottomNav';
import { StickyHeader } from '@/components/store/StickyHeader';
import { TawkChat } from '@/components/store/TawkChat';
import FixemberPromoModal from '@/components/store/FixemberPromoModal';
import { db } from '@/lib/db';
import { categories, products } from '@/db/schema';
import { eq, and, gt, count, asc } from 'drizzle-orm';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let cats: { id: string; name: string; slug: string }[] = [];
  try {
    cats = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .leftJoin(products, and(
        eq(products.categoryId, categories.id),
        eq(products.isActive, true),
        gt(products.stock, 0),
      ))
      .groupBy(categories.id, categories.name, categories.slug)
      .having(gt(count(products.id), 0))
      .orderBy(asc(categories.name));
  } catch {
    // DB temporarily unreachable — render layout without category nav
  }

  return (
    <>
      {/* StickyHeader renders its own spacer sized to its real measured
          height (see that component) — a hardcoded one here would drift out
          of sync with however tall the header actually ends up being. */}
      <StickyHeader categories={cats} />

      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <StoreFooter />
      <MobileBottomNav />
      <TawkChat />
      <FixemberPromoModal />
    </>
  );
}
