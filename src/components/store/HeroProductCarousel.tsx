import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProductPageSlider } from '@/components/store/ProductPageSlider';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  imageUrl?: string | null;
  stock: number;
  isFeatured?: boolean;
  categoryName?: string | null;
  rating?: string | null;
  reviewsCount?: number | null;
}

export function HeroProductCarousel({ products }: { products: Product[] }) {
  return (
    <section className="bg-white shadow-sm pt-4 pb-5">
      <div className="container mx-auto px-4 lg:px-12">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-primary text-white px-4 py-2 shadow-md shadow-primary/20">
              <Zap className="h-4 w-4 fill-white" />
              <span className="font-black text-sm tracking-wide">Daily Picks</span>
            </div>
          </div>
          <Link href="/products" className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            See All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ProductPageSlider products={products} />

      </div>
    </section>
  );
}
