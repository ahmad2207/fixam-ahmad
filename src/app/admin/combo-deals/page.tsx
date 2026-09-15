export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { Flame, Edit2, Plus, ExternalLink, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { getAllComboDealsForAdmin, computeComboPricing } from '@/lib/combos';
import { ComboDealsTimerCard } from '@/components/admin/ComboDealsTimerCard';
import { DeleteComboDealButton } from '@/components/admin/DeleteComboDealButton';

export default async function AdminComboDealsPage() {
  const combos = await getAllComboDealsForAdmin();

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
            {combos.length} bundle{combos.length !== 1 ? 's' : ''}
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
            href="/admin/combo-deals/new"
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            New Bundle
          </Link>
        </div>
      </div>

      {/* ── Timer ── */}
      <ComboDealsTimerCard />

      {/* ── List ── */}
      {combos.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Bundle</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Products</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Price</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {combos.map((combo) => {
                const pricing = computeComboPricing(combo);
                const needsAttention = combo.components.some((c) => !c.product || !c.product.isActive || c.product.stock <= 0);
                return (
                  <tr key={combo.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                          {combo.imageUrl ? (
                            <Image src={combo.imageUrl} alt={combo.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[200px]">{combo.name}</p>
                          {needsAttention && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide mt-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" /> Needs attention
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {combo.components.length} product{combo.components.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-foreground">{formatCurrency(combo.price)}</span>
                        {pricing.savings > 0 && (
                          <span className="ml-1.5 text-xs text-muted-foreground line-through">
                            {formatCurrency(pricing.sumOfParts)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        combo.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground',
                      )}>
                        {combo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/combo-deals/${combo.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/40 transition"
                          title="Edit bundle"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Link>
                        <DeleteComboDealButton comboId={combo.id} name={combo.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
            {combos.length} bundle{combos.length !== 1 ? 's' : ''} total
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-4">
            <Flame className="h-7 w-7 text-orange-400" />
          </div>
          <h3 className="font-bold text-foreground mb-1">No bundles yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Create a bundle by picking a few products and setting one total price for the set.
          </p>
          <Link
            href="/admin/combo-deals/new"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Create your first bundle →
          </Link>
        </div>
      )}
    </div>
  );
}
