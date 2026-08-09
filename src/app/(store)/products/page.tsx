'use client';

import { useState, useMemo, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Grid3X3, List, X, ArrowUpRight } from 'lucide-react';
import { ProductCard } from '@/components/store/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import Link from 'next/link';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

const PRODUCTS_PER_PAGE = 16;

const CATEGORY_ICONS: Record<string, string> = {
  cookware:   '🍳',
  cutlery:    '🔪',
  appliances: '⚡',
  storage:    '🗄️',
  bakeware:   '🧁',
  utensils:   '🥄',
  seasonal:   '🌿',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

/* ─── helpers ─── */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary font-black">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

type SuggestProduct = {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  imageUrl?: string | null;
  barcode?: string | null;
  category?: { id: string; name: string; slug: string } | null;
};

function ProductSearchBar({
  products,
  value,
  onChange,
}: {
  products: SuggestProduct[];
  value: string;
  onChange: (q: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sync when parent resets (e.g. clearFilters)
  useEffect(() => {
    if (value !== inputValue) setInputValue(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo<SuggestProduct[]>(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, inputValue]);

  const showDrop = open && (suggestions.length > 0 || inputValue.trim().length > 0);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applySearch = (q: string) => {
    setInputValue(q);
    onChange(q);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDrop) return;
    const total = suggestions.length + 1; // +1 for "search all" row
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        router.push(`/products/${suggestions[activeIdx].slug}`);
        setOpen(false);
      } else {
        applySearch(inputValue);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const clearSearch = () => {
    setInputValue('');
    onChange('');
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          placeholder="Search by name or barcode…"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-8 h-9 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
        />
        {inputValue && (
          <button
            tabIndex={-1}
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDrop && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((p, i) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    router.push(`/products/${p.slug}`);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    i === activeIdx ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {highlightMatch(p.name, inputValue)}
                    </p>
                    {p.category && (
                      <p className="text-xs text-gray-400 truncate">{p.category.name}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-primary flex-shrink-0">
                    {formatCurrency(Number(p.price))}
                  </p>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-400">No products match "{inputValue}"</div>
          )}

          {/* Search all footer */}
          {inputValue.trim() && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applySearch(inputValue);
              }}
              onMouseEnter={() => setActiveIdx(suggestions.length)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 text-xs font-bold text-primary transition-colors ${
                activeIdx === suggestions.length ? 'bg-orange-50' : 'hover:bg-orange-50'
              }`}
            >
              <Search className="h-3.5 w-3.5 flex-shrink-0" />
              Search all results for &quot;{inputValue}&quot;
              <ArrowUpRight className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PriceRangeFilter({
  value,
  max,
  onChange,
}: {
  value: [number, number];
  max: number;
  onChange: (val: [number, number]) => void;
}) {
  const [inputMin, setInputMin] = useState(String(value[0]));
  const [inputMax, setInputMax] = useState(String(value[1]));

  // Keep inputs in sync when the slider or clear-filters changes the value externally
  useEffect(() => { setInputMin(String(value[0])); }, [value[0]]);
  useEffect(() => { setInputMax(String(value[1])); }, [value[1]]);

  const applyMin = () => {
    const n = Math.max(0, Math.min(parseInt(inputMin) || 0, value[1]));
    setInputMin(String(n));
    if (n !== value[0]) onChange([n, value[1]]);
  };
  const applyMax = () => {
    const n = Math.min(max, Math.max(parseInt(inputMax) || max, value[0]));
    setInputMax(String(n));
    if (n !== value[1]) onChange([value[0], n]);
  };

  const step = Math.max(500, Math.ceil(max / 200 / 500) * 500);
  const isFiltered = value[0] > 0 || value[1] < max;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-gray-800">Price Range</h3>
        {isFiltered && (
          <button
            onClick={() => onChange([0, max])}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <Slider
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        min={0}
        max={max || 100000}
        step={step}
        className="mb-5"
      />

      {/* Min / Max inputs */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Min (₦)</p>
          <input
            type="number"
            min={0}
            max={value[1]}
            value={inputMin}
            onChange={(e) => setInputMin(e.target.value)}
            onBlur={applyMin}
            onKeyDown={(e) => e.key === 'Enter' && applyMin()}
            className="w-full border rounded-lg px-2.5 py-2 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <div className="pb-2 text-gray-300 text-sm select-none">—</div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Max (₦)</p>
          <input
            type="number"
            min={value[0]}
            max={max}
            value={inputMax}
            onChange={(e) => setInputMax(e.target.value)}
            onBlur={applyMax}
            onKeyDown={(e) => e.key === 'Enter' && applyMax()}
            className="w-full border rounded-lg px-2.5 py-2 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Range bounds hint */}
      <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
        <span>{formatCurrency(0)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}

function ProductsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') ?? '';
  const initialSearch   = searchParams.get('search')   ?? '';
  const initialSort     = searchParams.get('sort')     ?? 'featured';

  const [searchQuery,         setSearchQuery]         = useState(initialSearch);
  const [selectedCategories,  setSelectedCategories]  = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [priceRange,          setPriceRange]          = useState<[number, number]>([0, 0]);
  const [sortBy,              setSortBy]              = useState(initialSort);
  const [viewMode,            setViewMode]            = useState<'grid' | 'list'>('grid');
  const [currentPage,         setCurrentPage]         = useState(1);
  const [inStockOnly,         setInStockOnly]         = useState(false);

  const { data: products = [], isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useProducts();

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialise price range once products load
  const priceInitialized = useRef(false);
  useEffect(() => {
    if (products.length > 0 && !priceInitialized.current) {
      priceInitialized.current = true;
      const max = Math.ceil(Math.max(...products.map((p) => Number(p.price))) / 1000) * 1000;
      setPriceRange([0, max]);
    }
  }, [products]);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const params = new URLSearchParams();
    if (searchQuery)                params.set('search',   searchQuery);
    if (selectedCategories.length)  params.set('category', selectedCategories[0]);
    if (sortBy !== 'featured')      params.set('sort',     sortBy);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
  }, [searchQuery, selectedCategories, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>();
    for (const p of products) {
      if (p.category) {
        const ex = map.get(p.category.id);
        if (ex) ex.count = (ex.count ?? 0) + 1;
        else map.set(p.category.id, { ...p.category, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const maxPrice = products.length > 0
    ? Math.ceil(Math.max(...products.map((p) => Number(p.price))) / 1000) * 1000
    : priceRange[1] || 100000;

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  };

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSearchQuery('');
    setSortBy('featured');
    setInStockOnly(false);
    setCurrentPage(1);
    router.replace('/products');
  }, [maxPrice, router]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q)
          || (p.description ?? '').toLowerCase().includes(q)
          || (p.barcode ?? '').toLowerCase().includes(q)
      );
    }
    if (selectedCategories.length) {
      result = result.filter((p) => p.category && selectedCategories.includes(p.category.slug));
    }
    if (priceRange[1] > 0) {
      result = result.filter((p) => {
        const price = Number(p.price);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }
    if (inStockOnly) {
      result = result.filter((p) => (p as any).stock > 0);
    }
    switch (sortBy) {
      case 'price-low':  result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case 'price-high': result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case 'rating':     result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return result;
  }, [products, searchQuery, selectedCategories, priceRange, sortBy, inStockOnly]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPriceFiltered = priceRange[1] > 0 && (priceRange[0] > 0 || priceRange[1] < maxPrice);

  const activeFiltersCount =
    selectedCategories.length +
    (isPriceFiltered ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const pageNumbers = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  const FilterContent = () => (
    <div>
      {/* Categories */}
      <div className="py-4 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-800 mb-3">Categories</h3>
        {productsLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group py-1 rounded-lg px-1 hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={selectedCategories.includes(cat.slug)}
                  onCheckedChange={() => toggleCategory(cat.slug)}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 flex-1 flex items-center gap-1.5 transition-colors">
                  <span>{CATEGORY_ICONS[cat.slug] ?? '📦'}</span>
                  {cat.name}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
                  {cat.count}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="py-4 border-b border-gray-100">
        {priceRange[1] > 0 ? (
          <PriceRangeFilter
            value={priceRange}
            max={maxPrice}
            onChange={(val) => { setPriceRange(val); setCurrentPage(1); }}
          />
        ) : (
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-3">Price Range</h3>
            <div className="h-5 bg-gray-100 animate-pulse rounded" />
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="py-4">
        <h3 className="font-bold text-sm text-gray-800 mb-3">Availability</h3>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(v) => { setInStockOnly(!!v); setCurrentPage(1); }}
          />
          <span className="text-sm text-gray-600">In Stock Only</span>
        </label>
      </div>

      {activeFiltersCount > 0 && (
        <div className="pb-4">
          <button
            onClick={clearFilters}
            className="w-full text-xs font-bold text-destructive border border-destructive/30 rounded-lg py-2 hover:bg-destructive/5 transition-colors"
          >
            Clear All Filters ({activeFiltersCount})
          </button>
        </div>
      )}
    </div>
  );

  const currentCatName = selectedCategories.length === 1
    ? categories.find((c) => c.slug === selectedCategories[0])?.name
    : undefined;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">{currentCatName ?? 'All Products'}</span>
          </div>
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="flex items-center gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => { setSelectedCategories([]); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategories.length === 0
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-primary'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategories([cat.slug]); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  selectedCategories.includes(cat.slug)
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-primary'
                }`}
              >
                <span>{CATEGORY_ICONS[cat.slug] ?? '📦'}</span>
                {cat.name}
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
                  selectedCategories.includes(cat.slug)
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {cat.count ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <main className="container mx-auto px-4 lg:px-12 py-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Sidebar — Desktop */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="bg-white rounded-xl shadow-sm sticky top-24 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Filter
                </h2>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary font-bold hover:underline">
                    Clear ({activeFiltersCount})
                  </button>
                )}
              </div>
              <div className="px-4">
                <FilterContent />
              </div>
            </div>
          </aside>

          {/* Products area */}
          <div className="flex-1 min-w-0">

            {/* ── TOOLBAR ── */}
            <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Mobile filter trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="lg:hidden flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-600 px-3 py-2 rounded-lg transition-colors flex-shrink-0">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filter
                      {activeFiltersCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <SheetTitle className="font-extrabold text-sm text-gray-900">Filter Products</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 overflow-y-auto">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Search */}
                <ProductSearchBar
                  products={products as SuggestProduct[]}
                  value={searchQuery}
                  onChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-gray-800">{filteredProducts.length}</span> results
                </p>

                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs w-[148px] bg-gray-100 border-none rounded-lg focus:ring-0">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {(selectedCategories.length > 0 || isPriceFiltered || inStockOnly) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedCategories.map((slug) => {
                  const cat = categories.find((c) => c.slug === slug);
                  return (
                    <button
                      key={slug}
                      onClick={() => toggleCategory(slug)}
                      className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      {cat?.name ?? slug} <X className="h-3 w-3" />
                    </button>
                  );
                })}
                {isPriceFiltered && (
                  <button
                    onClick={() => { setPriceRange([0, maxPrice]); setCurrentPage(1); }}
                    className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    {formatCurrency(priceRange[0])} – {formatCurrency(priceRange[1])} <X className="h-3 w-3" />
                  </button>
                )}
                {inStockOnly && (
                  <button
                    onClick={() => setInStockOnly(false)}
                    className="flex items-center gap-1 bg-brand-green-100 text-brand-green-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    In Stock Only <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* ── PRODUCT GRID ── */}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-3">
                    <Skeleton className="aspect-square rounded-lg mb-3" />
                    <Skeleton className="h-3 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : productsError ? (
              <div className="bg-white rounded-xl shadow-sm text-center py-20 px-8">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-lg font-bold text-gray-800 mb-2">Couldn't load products</p>
                <p className="text-sm text-gray-500 mb-6">
                  Something went wrong on our end. Please try again.
                </p>
                <button
                  onClick={() => refetchProducts()}
                  className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch'
                      : 'flex flex-col gap-3'
                  }
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{ ...product, categoryName: product.category?.name ?? null } as any}
                    />
                  ))}
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-8 pb-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-semibold bg-white rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ← Prev
                    </button>
                    {pageNumbers.map((page, i) =>
                      page === '...' ? (
                        <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${
                            page === currentPage
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-semibold bg-white rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm text-center py-20 px-8">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-bold text-gray-800 mb-2">No products found</p>
                <p className="text-sm text-gray-500 mb-6">
                  Try adjusting your search or filters to find what you&apos;re looking for
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 lg:px-12 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-3">
                  <Skeleton className="aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-3 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ProductsInner />
    </Suspense>
  );
}
