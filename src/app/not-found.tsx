import Link from 'next/link';
import Image from 'next/image';
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { Home, ShoppingBag, Package, ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <StoreHeader />

      <main className="min-h-[70vh] bg-gray-100 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">

          {/* Big 404 */}
          <div className="relative inline-block mb-6">
            <span className="text-[120px] sm:text-[160px] font-black text-primary/10 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-md flex items-center justify-center text-5xl sm:text-6xl">
                🍳
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Looks like this page left the kitchen
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm px-6 py-3 rounded-xl border-2 border-gray-200 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Link>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl shadow-sm p-5 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Popular Pages</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ShoppingBag, label: 'All Products',  href: '/products' },
                { icon: Package,     label: 'My Orders',     href: '/orders' },
                { icon: Home,        label: 'Cookware',      href: '/products?category=cookware' },
                { icon: Search,      label: 'Appliances',    href: '/products?category=appliances' },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-orange-50 hover:text-primary transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-primary ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div className="mt-8">
            <Image src="/logo.png" alt="Fixam Africa" width={100} height={40} className="h-9 w-auto mx-auto opacity-40" />
          </div>

        </div>
      </main>

      <StoreFooter />
    </>
  );
}
