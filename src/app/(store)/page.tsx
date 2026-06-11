import { db } from '@/lib/db';
import { products, categories, orderItems } from '@/db/schema';
import { eq, and, desc, asc, count, sql, gt } from 'drizzle-orm';
import { ProductCard } from '@/components/store/ProductCard';
import { HeroBannerCarousel } from '@/components/store/HeroBannerCarousel';
import { FlashSaleTimer } from '@/components/store/FlashSaleTimer';
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
    sideBanners, promoBanners, ctaBanners,
  ] = await Promise.all([
    // Flash deals — featured products
    db
      .select(productFields)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true), gt(products.stock, 0)))
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

    // All active in-stock products for category sections — capped to avoid slow queries
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

    // Banner sections
    getActiveBanners('side'),
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
  const categoryGroups = Array.from(categoryMap.values()).filter(g => g.items.length > 0);

  const ctaBanner = ctaBanners[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HERO ── */}
      <section className="py-3">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-3">

            {/* Carousel */}
            <HeroBannerCarousel />

            {/* Side promo tiles — desktop only */}
            {sideBanners.length > 0 && (
              <div className="hidden lg:flex flex-col gap-3">
                {sideBanners.slice(0, 2).map((b) => {
                  const theme = BANNER_THEMES[b.theme] ?? BANNER_THEMES.dark;
                  return (
                    <Link
                      key={b.id}
                      href={b.ctaHref ?? '/products'}
                      className="relative rounded-2xl flex-1 overflow-hidden bg-white hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 group"
                    >
                      {b.imageUrl && (
                        <BannerImage
                          src={b.imageUrl}
                          alt={b.title}
                          className="object-cover object-right group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-r ${theme.overlayFrom} ${theme.overlayVia} to-transparent`} />
                      <div className="relative z-10 flex flex-col justify-between h-full p-4">
                        {b.eyebrow && (
                          <span className={`self-start text-[9px] font-black uppercase tracking-widest ${theme.badgeBg} text-white px-2 py-0.5 rounded-full`}>
                            {b.eyebrow}
                          </span>
                        )}
                        <div>
                          <p className="font-black text-base text-white leading-tight mb-2 whitespace-pre-line">{b.heading}</p>
                          {b.ctaLabel && (
                            <span className={`inline-flex items-center gap-1 bg-white ${theme.ctaColor} font-black text-[11px] px-3 py-1.5 rounded-full shadow-md`}>
                              {b.ctaLabel} <ChevronRight className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="bg-white shadow-sm mt-3 py-6">
        <div className="container mx-auto px-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                Shop by Category
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 ml-3">Everything your kitchen needs</p>
            </div>
            <Link href="/products" className="text-primary text-xs sm:text-sm font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile: horizontal scroll — Desktop: auto grid */}
          <div className="grid grid-flow-col auto-cols-[96px] sm:grid-flow-row sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden">

            {/* All Items */}
            <Link href="/products" className="group">
              <div className="flex flex-col items-center gap-2">
                <div className="w-full h-[96px] sm:h-24 lg:h-28 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-transparent group-hover:border-primary/40 group-hover:shadow-lg transition-all duration-200 flex items-center justify-center overflow-hidden relative">
                  <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">🛍️</span>
                </div>
                <div className="text-center">
                  <p className="text-[11px] sm:text-xs font-extrabold text-gray-700 group-hover:text-primary transition-colors leading-tight">All Items</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">Browse all</p>
                </div>
              </div>
            </Link>

            {/* Category cards */}
            {categoriesWithCount.map((cat) => {
              const meta = CATEGORY_META[cat.slug];
              return (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-full h-[96px] sm:h-24 lg:h-28 rounded-2xl bg-gradient-to-br ${meta?.gradient ?? 'from-gray-50 to-gray-100'} border-2 border-transparent ${meta?.hoverBorder ?? 'group-hover:border-gray-300'} group-hover:shadow-lg transition-all duration-200 flex items-center justify-center overflow-hidden relative`}>
                      {meta?.image ? (
                        <Image
                          src={meta.image}
                          alt={cat.name}
                          fill
                          className="object-contain p-3 group-hover:scale-110 transition-transform duration-300"
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
                          {meta?.icon ?? '📦'}
                        </span>
                      )}
                      {/* Product count badge */}
                      <span className="absolute bottom-1.5 right-1.5 bg-white/85 backdrop-blur-sm text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {cat.count}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] sm:text-xs font-extrabold text-gray-700 group-hover:text-primary transition-colors leading-tight">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
                        {meta?.desc ?? `${cat.count} items`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── FLASH DEALS ── */}
      <section className="bg-white shadow-sm mt-3 pt-4 pb-5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-red-500">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Flame className="h-5 w-5 text-red-500" />
                <span className="font-extrabold text-lg text-gray-900 tracking-tight">Flash Deals</span>
              </div>
              <div className="h-4 w-px bg-gray-200 hidden sm:block" />
              <FlashSaleTimer />
            </div>
            <Link
              href="/products"
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1 flex-shrink-0"
            >
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {flashProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {flashProducts.map((product) => (
                  <div key={product.id} className="">
                    <ProductCard product={product as any} />
                  </div>
                ))}
              </div>
              <div className="hidden sm:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-stretch">
                {flashProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No flash deals right now — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── PROMO BANNERS ── */}
      {promoBanners.length > 0 && (
        <section className="mt-3">
          <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-amber-500">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-extrabold text-lg text-gray-900 tracking-tight">Top Sellers</span>
              </div>
              <span className="text-xs text-gray-400 hidden sm:block">Most purchased by our customers</span>
            </div>
            <Link
              href="/products"
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1 flex-shrink-0"
            >
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {topSellerProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {topSellerProducts.map((product) => (
                  <div key={product.id} className="">
                    <ProductCard product={product as any} />
                  </div>
                ))}
              </div>
              <div className="hidden sm:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-stretch">
                {topSellerProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No top sellers yet — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── DEALS STRIP ── */}
      <section className="bg-primary mt-3 py-3">
        <div className="container mx-auto px-4">
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
            <div className="container mx-auto px-4">
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

              <div className="grid grid-cols-2 gap-3 sm:hidden">
                {group.items.map((product) => (
                  <div key={product.id} className="">
                    <ProductCard product={product as any} />
                  </div>
                ))}
              </div>

              <div className="hidden sm:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-stretch">
                {group.items.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>

              <div className="mt-4 text-center">
                <Link
                  href={`/products?category=${group.slug}`}
                  className="inline-flex items-center gap-2 border-2 border-primary text-primary font-bold text-sm px-6 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-200"
                >
                  See All {group.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* ── RECOMMENDED FOR YOU ── */}
      <section className="bg-white shadow-sm mt-3 pt-5 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-5 pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-extrabold text-xl text-gray-900 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full inline-block flex-shrink-0" />
                Recommended For You
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 ml-3">Quality products, curated for your kitchen</p>
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
          <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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
