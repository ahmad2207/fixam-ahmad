export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { products, categories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Edit2, Plus, ExternalLink } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { ComboDealsTimerCard } from '@/components/admin/ComboDealsTimerCard';

export default async function AdminComboDealsPage() {
  const allPromo = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      imageUrl: products.imageUrl,
      stock: products.stock,
      isActive: products.isActive,
      isPromo: products.isPromo,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isPromo, true))
    .orderBy(desc(products.updatedAt));

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Combo Deals</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {allPromo.length} product{allPromo.length !== 1 ? 's' : ''} marked as promo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/combo-deals"
            target="_blank"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View storefront
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </div>
      </div>

      {/* ── Timer ── */}
      <ComboDealsTimerCard />

      {/* ── Tip ── */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
        <Flame className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-orange-800">
          To add or remove a product from combo deals, edit the product and toggle the{' '}
          <span className="font-bold">Promo product</span> checkbox.
        </p>
      </div>

      {/* ── Table ── */}
      {allPromo.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Product</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Price</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allPromo.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[160px]">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Promo
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {p.categoryName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-bold text-foreground">{formatCurrency(Number(p.price))}</span>
                      {p.compareAtPrice && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          {formatCurrency(Number(p.compareAtPrice))}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn(
                      'text-xs font-bold',
                      p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-amber-600' : 'text-foreground',
                    )}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground',
                    )}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/40 transition"
                      title="Edit product"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
            {allPromo.length} product{allPromo.length !== 1 ? 's' : ''} in combo deals
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-4">
            <Flame className="h-7 w-7 text-orange-400" />
          </div>
          <h3 className="font-bold text-foreground mb-1">No combo deals yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Mark products as <span className="font-semibold">Promo product</span> when creating or editing them to add them here.
          </p>
          <Link
            href="/admin/products"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Go to Products →
          </Link>
        </div>
      )}
    </div>
  );
}
