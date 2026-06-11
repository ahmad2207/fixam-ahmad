'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart, Search, Heart, Menu, X,
  User, ChevronDown, LogOut, Home, Package, Settings,
} from 'lucide-react';
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

export function StoreHeader() {
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

  return (
    <header className="sticky top-0 z-50 shadow-sm">

      {/* ── Top promotional banner ── */}
      <Link href="/products" className="block w-full">
        <Image
          src="/top-banner.gif"
          alt="Fixam Africa — Everything your kitchen needs"
          width={1920}
          height={90}
          className="w-full h-auto"
          priority
        />
      </Link>

      {/* ── Announcement bar — desktop only ── */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4 text-center font-medium hidden sm:block">
        💰 Pay on Delivery available &nbsp;·&nbsp; 🚚 Fast nationwide delivery &nbsp;·&nbsp; 🔒 Secure checkout &nbsp;·&nbsp; ⭐ 10,000+ happy customers
      </div>

      <div className="bg-card/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">

          {/* ── Main header row ── */}
          <div className="flex items-center justify-between h-14 lg:h-20 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/logo.png" alt="Fixam" className="h-9 lg:h-12 w-auto" width={48} height={48} />
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full flex rounded-full overflow-hidden border border-border/60 focus-within:border-primary focus-within:shadow-md transition-all duration-200">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search for kitchen essentials..."
                    className="w-full pl-10 pr-4 h-11 bg-secondary/50 text-sm focus:outline-none"
                  />
                </div>
                <button type="submit" className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors flex-shrink-0">
                  Search
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1">

              {/* Wishlist — desktop */}
              <Link href="/wishlist" className="hidden lg:flex relative items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold animate-scale-in">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User dropdown — desktop */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="gap-2 hidden lg:flex items-center rounded-full hover:bg-primary/10 px-3 py-2 ml-1 transition-colors">
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
                      <Link href="/account">Profile Settings</Link>
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
                <Link href="/login" className="hidden lg:inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition ml-1">
                  Sign In
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-secondary transition-colors ml-1"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile search bar — always visible on mobile ── */}
          <div className="lg:hidden pb-3">
            <form onSubmit={handleSearch} className="flex rounded-xl overflow-hidden border border-border/50 focus-within:border-primary focus-within:shadow-sm transition-all bg-secondary/40">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 h-10 bg-transparent text-sm focus:outline-none"
                />
              </div>
              <button type="submit" className="h-10 px-4 bg-primary text-white text-sm font-bold flex-shrink-0 hover:bg-primary/90 transition-colors">
                Search
              </button>
            </form>
          </div>

          {/* ── Mobile slide-down menu ── */}
          {menuOpen && (
            <div className="lg:hidden border-t border-border/50 py-4 animate-fade-in">
              <nav className="flex flex-col gap-1">

                {session ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-secondary/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{(session.user as any)?.name || 'My Account'}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                      </div>
                    </div>

                    <Link href="/orders" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-secondary/50 transition-colors text-sm font-medium">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      My Orders
                    </Link>
                    <Link href="/account" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-secondary/50 transition-colors text-sm font-medium">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Profile Settings
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 py-3 px-4 rounded-xl bg-primary/5 text-primary font-semibold text-sm">
                        <Home className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="h-px bg-border my-2" />

                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl text-left text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
                  >
                    <User className="h-4 w-4" />
                    Sign In to Your Account
                  </Link>
                )}
              </nav>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
