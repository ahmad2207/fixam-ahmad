import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { ProductCard } from '@/components/store/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Truck, Shield, Headphones, Sparkles,
  Flame, Zap, Clock, RotateCcw, CreditCard, Award,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORY_ICONS: Record<string, string> = {
  cookware:    '🍳',
  cutlery:     '🔪',
  appliances:  '📦',
  storage:     '🗄️',
  bakeware:    '🧁',
  utensils:    '🥄',
  seasonal:    '🌿',
};

const DOT_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default async function HomePage() {
  const [featuredProducts, categoriesWithCount] = await Promise.all([
    db
      .select({
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
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(8),
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        count: count(products.id),
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(asc(categories.name)),
  ]);

  return (
    <div className="min-h-screen bg-background">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background image with Ken Burns */}
        <div
          className="absolute inset-0 scale-105"
          style={{ animation: 'kenBurns 20s ease-in-out infinite' }}
        >
          <Image
            src="/hero-kitchen.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Layered gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Animated glow orbs */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div
          className="absolute bottom-1/4 -left-32 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse-soft"
          style={{ animationDelay: '1.5s' }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="py-16 lg:py-24">
            <div className="max-w-4xl mx-auto text-center">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium text-white mb-8 animate-fade-in border border-white/10 shadow-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Premium Kitchen Products</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>

              {/* Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight animate-slide-up">
                <span className="block">Elevate Your</span>
                <span className="block bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Kitchen Experience
                </span>
              </h1>

              {/* Subheading */}
              <p
                className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up font-light"
                style={{ animationDelay: '0.15s' }}
              >
                Discover Africa&apos;s finest collection of premium cookware,
                smart appliances, and culinary essentials.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-wrap justify-center gap-4 animate-slide-up"
                style={{ animationDelay: '0.25s' }}
              >
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 h-14 px-8 text-base font-semibold rounded-full bg-primary hover:bg-primary/90 text-white shadow-glow transition-all duration-300 hover:scale-105 group"
                >
                  Shop Collection
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/products?category=appliances"
                  className="inline-flex items-center h-14 px-8 text-base font-semibold rounded-full border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                >
                  Explore Appliances
                </Link>
              </div>

              {/* Stats */}
              <div
                className="flex flex-wrap justify-center gap-8 mt-14 animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                {[
                  { value: '10K+', label: 'Happy Customers' },
                  { value: '500+', label: 'Products' },
                  { value: '4.9',  label: 'Average Rating' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl lg:text-4xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-white/60 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature cards — overlaid on hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8 lg:pb-12">
            {[
              { icon: Truck,       title: 'Free Delivery',   desc: 'Orders over ₦50,000' },
              { icon: Shield,      title: 'Secure Payment',  desc: '100% protected checkout' },
              { icon: Headphones,  title: '24/7 Support',    desc: 'Dedicated customer care' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 animate-fade-in cursor-default"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{title}</p>
                  <p className="text-sm text-white/60">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade into background */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-3">
              Browse Categories
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our curated collections and find the perfect additions to your kitchen
            </p>
          </div>

          {categoriesWithCount.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
              {categoriesWithCount.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative bg-card rounded-2xl p-6 lg:p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
                    <div className="relative text-5xl lg:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {CATEGORY_ICONS[cat.slug] ?? '🛍️'}
                    </div>
                  </div>

                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base lg:text-lg relative">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 relative">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </p>

                  {/* Hover arrow */}
                  <div className="mt-4 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No categories yet.</p>
          )}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/20 to-background" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12 lg:mb-16">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-3">
                <Flame className="h-4 w-4" />
                <span>Hot Picks</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-3">
                Featured Products
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl">
                Handpicked favorites loved by thousands of home chefs across Africa
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 h-11 px-8 rounded-full border-2 border-border font-semibold text-base hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 group flex-shrink-0"
            >
              View All Products
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {featuredProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <ProductCard product={product as any} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-3xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
                <Flame className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl text-muted-foreground">No products available yet.</p>
              <p className="text-muted-foreground mt-2">Check back soon for amazing products!</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── PROMO BANNER ─── */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90">
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/15 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

            {/* Dot pattern overlay */}
            <div
              className="absolute inset-0 opacity-5"
              style={{ backgroundImage: DOT_PATTERN }}
            />

            <div className="relative z-10 px-8 py-14 lg:px-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-center lg:text-left max-w-2xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Flash Sale</span>
                  <div className="flex items-center gap-1 text-primary/80 text-sm font-medium ml-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Ends in 24hrs</span>
                  </div>
                </div>

                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-card mb-4 leading-tight">
                  Up to <span className="text-primary">40% Off</span>
                  <br />Cookware &amp; Appliances
                </h2>

                <p className="text-card/70 text-lg lg:text-xl leading-relaxed">
                  Upgrade your kitchen with professional-grade pots, pans, knives, and premium appliances.
                  Limited stock available!
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center lg:items-end gap-4 flex-shrink-0">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 h-16 px-10 text-lg font-bold rounded-full bg-primary hover:bg-primary/90 text-white shadow-glow transition-all duration-300 hover:scale-105 group"
                >
                  Shop the Sale
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-card/50 text-sm">*While supplies last. Terms apply.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="py-12 lg:py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
            {[
              { icon: Truck,      title: 'Free Shipping',     desc: 'On orders over ₦50,000' },
              { icon: RotateCcw,  title: '30-Day Returns',    desc: 'Easy hassle-free returns' },
              { icon: Shield,     title: 'Secure Checkout',   desc: '100% payment protection' },
              { icon: CreditCard, title: 'Flexible Payment',  desc: 'Multiple payment options' },
              { icon: Award,      title: 'Quality Guarantee', desc: 'Premium tested products' },
              { icon: Headphones, title: '24/7 Support',      desc: 'Dedicated customer care' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex flex-col items-center text-center group animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground text-sm lg:text-base mb-1">{title}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
