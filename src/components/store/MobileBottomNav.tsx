'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingCart, Package, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSession } from 'next-auth/react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { data: session } = useSession();

  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { icon: Home,         label: 'Home',    href: '/',                              badge: 0 },
    { icon: Heart,        label: 'Wishlist', href: session ? '/wishlist' : '/login', badge: wishlistItems.length },
    { icon: ShoppingCart, label: 'Cart',    href: '/cart',                          badge: itemCount },
    { icon: Package,      label: 'Orders',  href: session ? '/orders' : '/login',   badge: 0 },
    { icon: User,         label: 'Account', href: session ? '/account' : '/login',  badge: 0 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/97 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-[58px] px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && item.href !== '/login' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1 relative min-w-0"
            >
              {/* Icon with active pill bg */}
              <div className={`relative flex items-center justify-center rounded-xl transition-all duration-200 ${
                isActive ? 'w-10 h-7 bg-primary/10' : 'w-10 h-7'
              }`}>
                <item.icon
                  className={`h-[19px] w-[19px] transition-all duration-200 ${
                    isActive ? 'text-primary stroke-[2.5]' : 'text-gray-400'
                  }`}
                />
                {/* Badge */}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-semibold leading-none transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
