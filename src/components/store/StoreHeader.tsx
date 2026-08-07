'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart, Search, Heart, Menu, X,
  User, ChevronDown, LogOut, Home, Package, Settings,
  Phone, MapPin, MessageCircle,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStoreSetting } from '@/hooks/useStoreSettings';

interface GeneralSettings {
  store_phone?:     string;
  store_address?:   string;
  whatsapp_number?: string;
}

interface Category { id: string; name: string; slug: string; }

const CATEGORY_ICONS: Record<string, string> = {
  cookware:   '🍳',
  cutlery:    '🔪',
  appliances: '⚡',
  storage:    '🗄️',
  bakeware:   '🧁',
  utensils:   '🥄',
  seasonal:   '🌿',
};

export function StoreHeader({ categories = [] }: { categories?: Category[] }) {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showPhone, setShowPhone] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useStoreSetting<GeneralSettings>('general');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const id = setInterval(() => setShowPhone(p => !p), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';
  const visibleCats = categories.filter(c => c.slug !== 'bakeware');
  const selectedCat = visibleCats.find(c => c.slug === selectedCategory);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/products${params.toString() ? '?' + params.toString() : ''}`);
    setSearch('');
    setMenuOpen(false);
  };

  return (
    <header className="shadow-sm">

      {/* ── Promo strip ── */}
      <div className="text-white" style={{ backgroundColor: '#262f68', height: '50px' }}>
        <div className="container mx-auto px-4 lg:px-12 h-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex items-stretch h-full divide-x divide-white/15 text-[11px] sm:text-xs font-medium min-w-max lg:min-w-0 lg:w-full">

            <div className="flex flex-1 items-center justify-start gap-2 pr-5 whitespace-nowrap">
              <span className="text-yellow-300 text-base leading-none">💰</span>
              <span className="font-semibold">Pay on Delivery</span>
            </div>

            <div className="flex flex-1 items-center justify-center gap-2 px-5 whitespace-nowrap">
              <MessageCircle className="h-3.5 w-3.5 text-brand-green-400 flex-shrink-0" />
              <span className="font-semibold">Checkout on WhatsApp</span>
            </div>

            <div className="flex flex-1 items-center justify-center gap-2 px-5 whitespace-nowrap">
              <span className="text-base leading-none">🔄</span>
              <span className="font-semibold">30-Day Return Policy</span>
            </div>

            <div className="flex flex-1 relative h-full overflow-hidden min-w-[190px]">
              <a
                href={`tel:${(settings?.store_phone || '+234 800 000 0000').replace(/\s/g, '')}`}
                className={`absolute inset-0 flex items-center justify-center gap-2 px-5 whitespace-nowrap transition-all duration-500 hover:bg-white/5 ${showPhone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}
              >
                <Phone className="h-3.5 w-3.5 text-blue-300 flex-shrink-0" />
                <span className="font-semibold">{settings?.store_phone || '+234 800 000 0000'}</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.store_address || 'Lagos, Nigeria')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`absolute inset-0 flex items-center justify-center gap-2 px-5 transition-all duration-500 hover:bg-white/5 ${!showPhone ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}
              >
                <MapPin className="h-3.5 w-3.5 text-blue-300 flex-shrink-0" />
                <span className="font-semibold truncate max-w-[180px]">{settings?.store_address || 'Lagos, Nigeria'}</span>
              </a>
            </div>

          </div>
        </div>
      </div>

      <div className="bg-card/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-12">

          {/* ── Main header row ── */}
          <div className="flex items-center justify-between h-14 lg:h-20 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/logo.png" alt="Fixam" className="h-9 lg:h-12 w-auto" width={48} height={48} />
            </Link>

            {/* ── Desktop search bar with category dropdown ── */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full flex rounded-full overflow-visible border border-border/60 focus-within:border-primary focus-within:shadow-md transition-all duration-200 bg-white rounded-full overflow-hidden">

                {/* Category selector */}
                <div className="relative flex-shrink-0" ref={catDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCatDropdownOpen(o => !o)}
                    className={`h-11 pl-4 pr-3 flex items-center gap-1.5 text-xs font-bold border-r border-border/60 bg-secondary/40 hover:bg-secondary/60 transition-colors min-w-[96px] ${catDropdownOpen ? 'text-primary' : 'text-gray-600'}`}
                  >
                    <span className="truncate max-w-[72px]">{selectedCat?.name ?? 'All'}</span>
                    <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${catDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>

                  {catDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-56 bg-white rounded-2xl border border-border/60 shadow-2xl z-[60] overflow-hidden">
                      <div className="px-4 pt-3 pb-1.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Browse by Category</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setSelectedCategory(''); setCatDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 ${!selectedCategory ? 'text-primary font-bold bg-orange-50/60' : 'text-gray-700 font-medium'}`}
                      >
                        <span className="text-base w-5 text-center">🛍️</span>
                        <span>All Categories</span>
                        {!selectedCategory && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>

                      <div className="h-px bg-gray-100 mx-3" />

                      {visibleCats.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setSelectedCategory(cat.slug); setCatDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 ${selectedCategory === cat.slug ? 'text-primary font-bold bg-orange-50/60' : 'text-gray-700 font-medium'}`}
                        >
                          <span className="text-base w-5 text-center">{CATEGORY_ICONS[cat.slug] ?? '📦'}</span>
                          <span>{cat.name}</span>
                          {selectedCategory === cat.slug && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                      ))}

                      <div className="p-2 pt-1.5">
                        <Link
                          href="/products"
                          onClick={() => setCatDropdownOpen(false)}
                          className="flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
                        >
                          View all products →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-900" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={selectedCat ? `Search in ${selectedCat.name}…` : 'Search for kitchen essentials…'}
                    className="w-full pl-10 pr-4 h-11 bg-secondary/50 text-sm focus:outline-none"
                  />
                </div>

                <button type="submit" className="h-11 px-4 flex items-center justify-center text-gray-900 hover:text-primary transition-colors flex-shrink-0">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1">

              {/* Wishlist — desktop */}
              <Link href="/wishlist" className="hidden lg:flex relative items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
                {mounted && wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {mounted && itemCount > 0 && (
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

          {/* ── Mobile: category chips + search bar ── */}
          <div className="lg:hidden pb-3 space-y-2">
            {visibleCats.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${!selectedCategory ? 'bg-primary text-white border-primary shadow-sm' : 'border-border/60 text-gray-500 bg-secondary/40'}`}
                >
                  All
                </button>
                {visibleCats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(s => s === cat.slug ? '' : cat.slug)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${selectedCategory === cat.slug ? 'bg-primary text-white border-primary shadow-sm' : 'border-border/60 text-gray-500 bg-secondary/40'}`}
                  >
                    <span>{CATEGORY_ICONS[cat.slug] ?? '📦'}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSearch} className="flex rounded-xl overflow-hidden border border-border/50 focus-within:border-primary focus-within:shadow-sm transition-all bg-secondary/40">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-900" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={selectedCat ? `Search in ${selectedCat.name}…` : 'Search products…'}
                  className="w-full pl-9 pr-3 h-10 bg-transparent text-sm focus:outline-none"
                />
              </div>
              <button type="submit" className="h-10 px-3 flex items-center justify-center text-gray-900 hover:text-primary transition-colors flex-shrink-0">
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* ── Mobile slide-down menu ── */}
          {menuOpen && (
            <div className="lg:hidden border-t border-border/50 py-4 animate-fade-in">
              <nav className="flex flex-col gap-1">
                {session ? (
                  <>
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
