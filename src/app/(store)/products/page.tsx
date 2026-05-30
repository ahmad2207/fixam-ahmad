'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react';
import { ProductCard } from '@/components/store/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRODUCTS_PER_PAGE = 12;

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

function ProductsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') ?? '';
  const initialSearch = searchParams.get('search') ?? '';
  const initialSort = searchParams.get('sort') ?? 'featured';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: products = [], isLoading: productsLoading } = useProducts();

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
  }, [searchParams]);

  // Sync filter state back to URL so links are shareable and back-button works
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategories.length > 0) params.set('category', selectedCategories[0]);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
  }, [searchQuery, selectedCategories, sortBy]);

  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>();
    for (const p of products) {
      if (p.category) {
        const existing = map.get(p.category.id);
        if (existing) {
          existing.count = (existing.count ?? 0) + 1;
        } else {
          map.set(p.category.id, { ...p.category, count: 1 });
        }
      }
    }
    return Array.from(map.values());
  }, [products]);

  const maxPrice = products.length > 0 ? Math.max(...products.map((p) => Number(p.price))) : 100000;

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 100000]);
    setSearchQuery('');
    setSortBy('featured');
    setCurrentPage(1);
    router.replace('/products');
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => p.category && selectedCategories.includes(p.category.slug));
    }

    result = result.filter((p) => {
      const price = Number(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'rating':
        result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'newest':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [products, searchQuery, selectedCategories, priceRange, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount =
    selectedCategories.length + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Categories</h3>
        {productsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={selectedCategories.includes(cat.slug)}
                  onCheckedChange={() => toggleCategory(cat.slug)}
                />
                <span className="flex-1 text-sm">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-4">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={(val) => { setPriceRange(val); setCurrentPage(1); }}
          min={0}
          max={100000}
          step={1000}
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-24"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-24"
          />
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">All Products</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar — Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24">
              <h2 className="text-lg font-semibold mb-6">Filters</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">All Products</h1>
                <p className="text-muted-foreground">{filteredProducts.length} products found</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile filter — Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-1">{activeFiltersCount}</Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View mode */}
                <div className="hidden sm:flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>

            {/* Active filter tags */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategories.map((slug) => {
                  const cat = categories.find((c) => c.slug === slug);
                  return (
                    <Badge
                      key={slug}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => toggleCategory(slug)}
                    >
                      {cat?.name ?? slug}
                      <X className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-4">
                    <Skeleton className="aspect-square rounded-xl mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        categoryName: product.category?.name ?? null,
                      } as any}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-4">No products found</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
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
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-4">
              <Skeleton className="aspect-square rounded-xl mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsInner />
    </Suspense>
  );
}
