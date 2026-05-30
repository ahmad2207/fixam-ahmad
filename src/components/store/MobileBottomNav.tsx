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
    { icon: Home, label: 'Home', href: '/' },
    { icon: Heart, label: 'Wishlist', href: session ? '/wishlist' : '/login', badge: wishlistItems.length },
    { icon: ShoppingCart, label: 'Cart', href: '/cart', badge: itemCount },
    { icon: Package, label: 'Orders', href: session ? '/orders' : '/login' },
    { icon: User, label: 'Account', href: session ? '/account' : '/login' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
