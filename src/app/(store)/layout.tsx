import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { MobileBottomNav } from '@/components/store/MobileBottomNav';
import { db } from '@/lib/db';
import { categories, products } from '@/db/schema';
import { eq, and, gt, count, asc } from 'drizzle-orm';
import { Truck, ShieldCheck, Users } from 'lucide-react';

const TRUST_ITEMS = [
  { Icon: null,        label: 'Why Choose Fixam?', highlight: true },
  { Icon: Truck,       label: 'Fast Delivery' },
  { Icon: ShieldCheck, label: 'Secure Checkout' },
  { Icon: Users,       label: '10,000+ Happy Customers' },
];

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
      <div className="sticky top-0 z-50">
        <StoreHeader categories={cats} />

        {/* ── Trust badge strip ── */}
        <div className="bg-emerald-600 border-b border-emerald-700 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <div className="container mx-auto px-4 lg:px-12">
            <div className="flex items-center justify-center h-10 gap-0 min-w-max lg:min-w-0 lg:w-full">
              {/* Label */}
              <span className="font-black text-white text-[11px] sm:text-xs tracking-widest uppercase whitespace-nowrap border-r border-emerald-400/50 pr-5">
                Why Choose Fixam?
              </span>
              {/* Items */}
              {TRUST_ITEMS.filter(i => !i.highlight).map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-5 border-r border-emerald-400/40 last:border-r-0 whitespace-nowrap">
                  {Icon && (
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <span className="text-[11px] sm:text-xs font-semibold text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <StoreFooter />
      <MobileBottomNav />
    </>
  );
}
