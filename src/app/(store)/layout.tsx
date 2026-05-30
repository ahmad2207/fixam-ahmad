import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { MobileBottomNav } from '@/components/store/MobileBottomNav';
import { db } from '@/lib/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categoryOrder = ['cookware', 'cutlery', 'appliances', 'storage', 'bakeware', 'utensils'];

  const rawCategories = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.name));

  const allCategories = [
    ...categoryOrder
      .map((slug) => rawCategories.find((c) => c.slug === slug))
      .filter(Boolean),
    ...rawCategories.filter((c) => !categoryOrder.includes(c.slug)),
  ] as { name: string; slug: string }[];

  return (
    <>
      <StoreHeader categories={allCategories} />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <StoreFooter />
      <MobileBottomNav />
    </>
  );
}
