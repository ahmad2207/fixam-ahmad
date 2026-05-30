'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Heart, Menu, X, User, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Category {
  name: string;
  slug: string;
}

export function StoreHeader({ categories }: { categories: Category[] }) {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const router = useRouter();

  const isAdmin = (session?.user as any)?.role === 'admin';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'All Products', href: '/products' },
    ...categories.map((c) => ({ name: c.name, href: `/products?category=${c.slug}` })),
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Main header row */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="Fixam" className="h-10 lg:h-12 w-auto" width={48} height={48} />
          </Link>

          {/* Search bar — Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className={`relative w-full transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for kitchen essentials..."
                className="w-full pl-11 pr-4 h-12 rounded-full bg-secondary/50 border border-transparent focus:border-primary focus:bg-card focus:shadow-md transition-all duration-200 text-sm focus:outline-none"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Wishlist — desktop only (mobile has bottom nav) */}
            <Link href="/wishlist" className="hidden lg:flex relative items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Heart className="h-5 w-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                  {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-scale-in">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User dropdown — desktop */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="gap-2 hidden lg:flex items-center rounded-full hover:bg-primary/10 px-4 py-2 ml-2 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{(session.user as any)?.name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl">
                  <div className="px-3 py-2 mb-2 bg-secondary/50 rounded-lg">
                    <p className="font-semibold text-sm">{(session.user as any)?.name || 'Welcome!'}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer bg-primary/5">
                        <Link href="/admin" className="text-primary font-medium">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold px-6 py-2 rounded-full hover:bg-primary/90 transition ml-2"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Category nav — Desktop */}
        <nav className="hidden lg:flex items-center justify-center gap-1 h-12 -mx-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/5 group"
            >
              {link.name}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-1/2" />
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden py-6 border-t border-border animate-fade-in">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-11 h-12 rounded-xl bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-transparent"
              />
            </form>

            {/* Mobile nav links */}
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 px-4 rounded-xl hover:bg-secondary transition-colors font-medium text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-border my-4" />

              {session ? (
                <>
                  <Link href="/orders" className="py-3 px-4 rounded-xl hover:bg-secondary transition-colors text-sm" onClick={() => setMenuOpen(false)}>
                    My Orders
                  </Link>
                  <Link href="/profile" className="py-3 px-4 rounded-xl hover:bg-secondary transition-colors text-sm" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="py-3 px-4 rounded-xl bg-primary/10 text-primary font-semibold text-sm" onClick={() => setMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                    className="py-3 px-4 rounded-xl text-left text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-center text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
