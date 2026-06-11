import type { BannerType } from '@/db/schema/banners';

type DefaultBanner = {
  bannerType: BannerType;
  title: string;
  imageUrl?: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  theme: string;
  displayOrder: number;
  isActive: boolean;
};

export const DEFAULT_HERO_BANNERS: DefaultBanner[] = [
  {
    bannerType: 'hero',
    title:        'Cookware Collection',
    imageUrl:     '/cookware-banner.png',
    eyebrow:      '🍳 Premium Cookware',
    heading:      'Cook Like a\nProfessional',
    subheading:   'Premium stainless-steel pots, pans & sets for every kitchen',
    ctaLabel:     'Shop Cookware',
    ctaHref:      '/products?category=cookware',
    theme:        'orange',
    displayOrder: 0,
    isActive:     true,
  },
  {
    bannerType: 'hero',
    title:        'Appliances Collection',
    imageUrl:     '/appliances-banner.png',
    eyebrow:      '⚡ New Arrivals',
    heading:      'Smart Kitchen\nAppliances',
    subheading:   'Microwaves, irons, blenders & more — the latest kitchen tech',
    ctaLabel:     'Shop Appliances',
    ctaHref:      '/products?category=appliances',
    theme:        'red',
    displayOrder: 1,
    isActive:     true,
  },
  {
    bannerType: 'hero',
    title:        'Brand Banner',
    imageUrl:     '/hero-kitchen.png',
    eyebrow:      '⭐ Customer Favourites',
    heading:      "Africa's #1 Kitchen\nEssentials Store",
    subheading:   'Trusted by 10,000+ home chefs. Fast nationwide delivery.',
    ctaLabel:     'Browse All Products',
    ctaHref:      '/products',
    theme:        'dark',
    displayOrder: 2,
    isActive:     true,
  },
];

export const DEFAULT_SIDE_BANNERS: DefaultBanner[] = [
  {
    bannerType: 'side',
    title:        'Side Tile — Appliances',
    imageUrl:     '/appliances-banner.png',
    eyebrow:      'New In',
    heading:      'Smart Kitchen\nAppliances',
    ctaLabel:     'Shop Now',
    ctaHref:      '/products?category=appliances',
    theme:        'red',
    displayOrder: 0,
    isActive:     true,
  },
  {
    bannerType: 'side',
    title:        'Side Tile — Cookware',
    imageUrl:     '/cookware-banner.png',
    eyebrow:      'Top Pick',
    heading:      'Premium\nCookware',
    ctaLabel:     'Shop Now',
    ctaHref:      '/products?category=cookware',
    theme:        'orange',
    displayOrder: 1,
    isActive:     true,
  },
];

export const DEFAULT_PROMO_BANNERS: DefaultBanner[] = [
  {
    bannerType: 'promo',
    title:        'Promo — Cookware',
    imageUrl:     '/cookware-banner.png',
    eyebrow:      'Top Category',
    heading:      'Premium Cookware',
    subheading:   'Professional-grade pots & pans',
    ctaLabel:     'Shop Now',
    ctaHref:      '/products?category=cookware',
    theme:        'orange',
    displayOrder: 0,
    isActive:     true,
  },
  {
    bannerType: 'promo',
    title:        'Promo — Appliances',
    imageUrl:     '/appliances-banner.png',
    eyebrow:      'New Arrivals',
    heading:      'Smart Appliances',
    subheading:   'Latest kitchen tech',
    ctaLabel:     'Shop Now',
    ctaHref:      '/products?category=appliances',
    theme:        'red',
    displayOrder: 1,
    isActive:     true,
  },
  {
    bannerType: 'promo',
    title:        'Promo — Bakeware',
    imageUrl:     '/hero-kitchen.png',
    eyebrow:      'Best Sellers',
    heading:      'Bakeware & More',
    subheading:   'Bake like a professional',
    ctaLabel:     'Shop Now',
    ctaHref:      '/products?category=bakeware',
    theme:        'purple',
    displayOrder: 2,
    isActive:     true,
  },
];

export const DEFAULT_CTA_BANNERS: DefaultBanner[] = [
  {
    bannerType: 'cta',
    title:        'Bottom CTA Banner',
    eyebrow:      'New Collection',
    heading:      'Elevate Your Kitchen Today',
    subheading:   'Premium cookware & smart appliances, curated for African homes.',
    ctaLabel:     'Shop Now',
    ctaHref:      '/products',
    theme:        'dark',
    displayOrder: 0,
    isActive:     true,
  },
];

export const DEFAULT_BY_TYPE: Record<BannerType, DefaultBanner[]> = {
  hero:  DEFAULT_HERO_BANNERS,
  side:  DEFAULT_SIDE_BANNERS,
  promo: DEFAULT_PROMO_BANNERS,
  cta:   DEFAULT_CTA_BANNERS,
};
