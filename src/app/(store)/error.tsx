'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCcw, Home, ShoppingBag, ArrowRight } from 'lucide-react';

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[StoreError]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-gray-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">

        {/* Icon */}
        <div className="relative inline-block mb-6">
          <span className="text-[120px] font-black text-primary/10 leading-none select-none">!</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-5xl">
              🔧
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          We hit an unexpected error. This has been logged and we&apos;ll look into it. Try refreshing — it usually fixes it.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm px-6 py-3 rounded-xl border-2 border-gray-200 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-sm p-4 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Try these instead</p>
          <div className="space-y-1">
            {[
              { label: 'Browse Products', href: '/products',            icon: ShoppingBag },
              { label: 'My Orders',       href: '/orders',              icon: ArrowRight },
              { label: 'My Cart',         href: '/cart',                icon: ArrowRight },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50 hover:text-primary transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-primary">{label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-300 mt-4 font-mono">Error ID: {error.digest}</p>
        )}

        <div className="mt-6">
          <Image src="/logo.png" alt="Fixam Africa" width={80} height={32} className="h-7 w-auto mx-auto opacity-30" />
        </div>
      </div>
    </div>
  );
}
