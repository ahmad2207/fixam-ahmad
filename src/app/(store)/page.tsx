import { db } from '@/lib/db';
import { products, categories, orderItems } from '@/db/schema';
import { eq, and, desc, asc, count, sql, gt } from 'drizzle-orm';
import { ProductCard } from '@/components/store/ProductCard';
import { FlashSaleTimer } from '@/components/store/FlashSaleTimer';
import { HeroProductCarousel } from '@/components/store/HeroProductCarousel';
import { ProductPageSlider } from '@/components/store/ProductPageSlider';
import { getActiveBanners } from '@/lib/serverBanners';
import { BANNER_THEMES } from '@/db/schema/banners';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, ChevronRight, Truck, Shield, Headphones,
  Flame, RotateCcw, Tag, Trophy, Banknote,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORY_META: Record<string, {
  icon: string; desc: string; gradient: string; hoverBorder: string; image?: string;
}> = {
  cookware:   { icon: '🍳', desc: 'Pots & pans',        gradient: 'from-orange-50 to-amber-100',   hoverBorder: 'group-hover:border-orange-300',  image: '/cookware.png'   },
  cutlery:    { icon: '🔪', desc: 'Knives & blades',     gradient: 'from-blue-50 to-sky-100',       hoverBorder: 'group-hover:border-blue-300',    image: '/cutlery.png'    },
  appliances: { icon: '⚡', desc: 'Kitchen gadgets',     gradient: 'from-violet-50 to-purple-100',  hoverBorder: 'group-hover:border-violet-300',  image: '/Appliances.png' },
  storage:    { icon: '🗄️', desc: 'Jars & containers',  gradient: 'from-green-50 to-emerald-100',  hoverBorder: 'group-hover:border-green-300',   image: '/storage.png'    },
  bakeware:   { icon: '🧁', desc: 'Trays & moulds',      gradient: 'from-pink-50 to-rose-100',      hoverBorder: 'group-hover:border-pink-300',    image: '/bakeware.png'   },
  utensils:   { icon: '🥄', desc: 'Spoons & spatulas',   gradient: 'from-yellow-50 to-amber-100',   hoverBorder: 'group-hover:border-yellow-300',  image: '/utensils.png'   },
  seasonal:   { icon: '🌿', desc: 'Seasonal picks',      gradient: 'from-teal-50 to-emerald-100',   hoverBorder: 'group-hover:border-teal-300'                            },
};

const productFields = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  imageUrl: products.imageUrl,
  images: products.images,
  stock: products.stock,
  isFeatured: products.isFeatured,
  isPromo: products.isPromo,
  isActive: products.isActive,
  rating: products.rating,
  reviewsCount: products.reviewsCount,
  categoryName: categories.name,
} as const;

const PRODUCTS_PER_CATEGORY = 6;

function BannerImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (src.toLowerCase().endsWith('.gif')) {
    return <img src={src} alt={alt} className={`absolute inset-0 w-full h-full ${className}`} />;
  }
  return <Image src={src} alt={alt} fill className={className} />;
}

export default async function HomePage() {
  const [
    flashProducts, topSellerProducts, recommendedProducts,
    categoriesWithCount, allCategoryProducts,
    promoBanners, ctaBanners,
  ] = await Promise.all([
    // Combo deals — featured products
    db
      .select(productFields)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), eq(products.isPromo, true), gt(products.stock, 0)))
      .orderBy(desc(products.createdAt))
      .limit(16),

    // Top sellers — ranked by actual units sold
    db
      .select({
        ...productFields,
        unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.as('units_sold'),
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(orderItems, eq(products.id, orderItems.productId))
      .where(and(eq(products.isActive, true), gt(products.stock, 0)))
      .groupBy(products.id, categories.name)
      .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)`), desc(products.rating))
      .limit(16),

    // Recommended — newest in-stock active products
    db
      .select(productFields)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), gt(products.stock, 0)))
      .orderBy(desc(products.createdAt))
      .limit(24),

    // Categories with product counts
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        count: count(products.id),
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true), gt(products.stock, 0)))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(asc(categories.name)),

    // All active in-stock products for category sections
    db
      .select({
        ...productFields,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), gt(products.stock, 0)))
      .orderBy(asc(categories.name), desc(products.createdAt))
      .limit(120),

    getActiveBanners('promo'),
    getActiveBanners('cta'),
  ]);

  // Group products by category, max PRODUCTS_PER_CATEGORY each
  const categoryMap = new Map<string, { id: string; name: string; slug: string; items: typeof allCategoryProducts }>();
  for (const p of allCategoryProducts) {
    if (!p.categorySlug) continue;
    if (!categoryMap.has(p.categorySlug)) {
      const catMeta = categoriesWithCount.find(c => c.slug === p.categorySlug);
      if (catMeta) categoryMap.set(p.categorySlug, { id: catMeta.id, name: catMeta.name, slug: catMeta.slug, items: [] });
    }
    const group = categoryMap.get(p.categorySlug);
    if (group && group.items.length < PRODUCTS_PER_CATEGORY) group.items.push(p);
  }
  const categoryGroups = Array.from(categoryMap.values()).filter(g => g.items.length > 0 && g.slug !== 'bakeware');

  const ctaBanner = ctaBanners[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── COMBO DEALS ── */}
      <section className="bg-white shadow-sm mt-3 pt-4 pb-5">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-3 mb-4 border-b-2 border-amber-500">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 shadow-md shadow-orange-200/70 font-black text-sm tracking-wide uppercase">
                Combo Deals
              </span>
              <FlashSaleTimer />
            </div>
            <Link
              href="/combo-deals"
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1 flex-shrink-0 sm:ml-auto"
            >
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {flashProducts.length > 0 ? (
            <ProductPageSlider products={flashProducts as any} itemsPerPage={4} />
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No combo deals right now — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── DAILY PICKS ── */}
      {recommendedProducts.length > 0 && (
        <div className="mt-3">
          <HeroProductCarousel products={recommendedProducts.slice(0, 10) as any} />
        </div>
      )}

      {/* ── PROMO BANNERS ── */}
      {promoBanners.length > 0 && (
        <section className="mt-3">
          <div className="container mx-auto px-4 lg:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {promoBanners.slice(0, 3).map((b) => {
                const theme = BANNER_THEMES[b.theme] ?? BANNER_THEMES.dark;
                return (
                  <Link
                    key={b.id}
                    href={b.ctaHref ?? '/products'}
                    className="relative rounded-2xl overflow-hidden bg-white min-h-[170px] sm:min-h-[190px] flex hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    {b.imageUrl && (
                      <BannerImage
                        src={b.imageUrl}
                        alt={b.title}
                        className="object-cover object-right group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.overlayFrom} ${theme.overlayVia} to-transparent`} />
                    <div className="relative z-10 flex flex-col justify-between p-5 sm:p-6 w-[58%]">
                      {b.eyebrow && (
                        <span className="self-start text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                          {b.eyebrow}
                        </span>
                      )}
                      <div>
                        <p className="font-black text-xl sm:text-2xl leading-tight text-white mb-1.5 drop-shadow-sm whitespace-pre-line">
                          {b.heading}
                        </p>
                        {b.subheading && (
                          <p className="text-xs sm:text-sm text-white/75 mb-4 leading-snug">{b.subheading}</p>
                        )}
                        {b.ctaLabel && (
                          <span className={`inline-flex items-center gap-1.5 bg-white ${theme.ctaColor} font-black text-xs px-4 py-2 rounded-full shadow-md group-hover:shadow-lg transition-shadow`}>
                            {b.ctaLabel} <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── TOP SELLERS ── */}
      <section className="bg-white shadow-sm mt-3 pt-4 pb-5">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-amber-500">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 leading-none">#1</span>
              </div>
              <div>
                <span className="font-black text-base text-gray-900 tracking-tight">Top Sellers</span>
                <p className="text-[10px] text-gray-400 hidden sm:block">Most purchased by customers</p>
              </div>
            </div>
            <Link
              href="/products"
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1 flex-shrink-0"
            >
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {topSellerProducts.length > 0 ? (
            <ProductPageSlider products={topSellerProducts as any} />
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No top sellers yet — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── DEALS STRIP ── */}
      <section className="bg-primary mt-3 py-3">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="grid grid-cols-2 sm:flex sm:justify-center sm:gap-8 gap-y-2.5 gap-x-4">
            {[
              { icon: Truck,      text: 'Fast Delivery' },
              { icon: Banknote,   text: 'Pay on Delivery' },
              { icon: RotateCcw,  text: '30-Day Returns' },
              { icon: Shield,     text: 'Secure Checkout' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center sm:justify-start gap-1.5 text-white text-xs sm:text-sm font-semibold">
                <Icon className="h-3.5 w-3.5 opacity-90 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY SECTIONS ── */}
      {categoryGroups.map((group) => {
        const catMeta = CATEGORY_META[group.slug];
        const catImage = catMeta?.image;
        return (
          <section key={group.slug} className="bg-white shadow-sm mt-3 pt-4 pb-5">
            <div className="container mx-auto px-4 lg:px-12">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {catImage && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-gradient-to-br ${catMeta?.gradient ?? 'from-gray-50 to-gray-100'}`}>
                      <Image
                        src={catImage}
                        alt={group.name}
                        width={40}
                        height={40}
                        className="object-contain p-1"
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="font-extrabold text-base text-gray-900">{group.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {categoriesWithCount.find(c => c.slug === group.slug)?.count ?? 0} products available
                    </p>
                  </div>
                </div>
                <Link
                  href={`/products?category=${group.slug}`}
                  className="text-primary text-sm font-bold hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  See All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ProductPageSlider products={group.items as any} />
            </div>
          </section>
        );
      })}

      {/* ── RECOMMENDED FOR YOU ── */}
      <section className="bg-white shadow-sm mt-3 pt-5 pb-6">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="flex items-end justify-between mb-5 pb-3 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Tag className="h-2.5 w-2.5" /> Curated For You
              </p>
              <h2 className="font-black text-lg text-gray-900 flex items-center gap-2">
                Recommended For You
              </h2>
            </div>
            <Link
              href="/products"
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1 flex-shrink-0 mb-0.5"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-stretch">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400">No products available yet — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      {ctaBanner && (
        <section className="mt-3">
          <div className="container mx-auto px-4 lg:px-12">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-8 py-10 lg:px-16 lg:py-14 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Optional background image */}
              {ctaBanner.imageUrl && (
                <BannerImage
                  src={ctaBanner.imageUrl}
                  alt={ctaBanner.title}
                  className="object-cover object-center opacity-30"
                />
              )}
              {/* Blur orbs (only shown when no image) */}
              {!ctaBanner.imageUrl && (
                <>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                </>
              )}
              <div className="text-center lg:text-left relative z-10">
                {ctaBanner.eyebrow && (
                  <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">{ctaBanner.eyebrow}</p>
                )}
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-2">{ctaBanner.heading}</h2>
                {ctaBanner.subheading && (
                  <p className="text-gray-400 text-base">{ctaBanner.subheading}</p>
                )}
              </div>
              {ctaBanner.ctaLabel && ctaBanner.ctaHref && (
                <Link
                  href={ctaBanner.ctaHref}
                  className="relative z-10 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-base transition-all duration-200 hover:shadow-lg hover:scale-105 flex-shrink-0"
                >
                  {ctaBanner.ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── TRUST BADGES ── */}
      <section className="bg-white mt-3 py-5 shadow-sm">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck,      title: 'Fast Delivery',     desc: 'Nationwide delivery' },
              { icon: Banknote,   title: 'Pay on Delivery',  desc: 'Cash at your doorstep' },
              { icon: Shield,     title: 'Secure Checkout',  desc: '100% protected' },
              { icon: RotateCcw,  title: '30-Day Returns',   desc: 'Hassle-free returns' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-gray-800">{title}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
