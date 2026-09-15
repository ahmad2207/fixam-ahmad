export const dynamic = 'force-dynamic';

import { getActiveComboDeals } from '@/lib/combos';
import { ComboDealCard } from '@/components/store/ComboDealCard';
import { FlashSaleTimer } from '@/components/store/FlashSaleTimer';
import { Flame } from 'lucide-react';

export const metadata = {
  title: 'Combo Deals — Fixam Africa',
  description: 'Shop exclusive product bundles at one discounted price at Fixam Africa.',
};

export default async function ComboDealsPage() {
  const combos = await getActiveComboDeals();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Banner ── */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 lg:px-12 py-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Combo Deals</h1>
              <p className="text-sm text-orange-100 mt-0.5">
                {combos.length > 0
                  ? `${combos.length} exclusive bundle${combos.length !== 1 ? 's' : ''}`
                  : 'Exclusive product bundles'}
              </p>
            </div>
          </div>
          <div className="sm:ml-auto">
            <FlashSaleTimer />
          </div>
        </div>
      </div>

      {/* ── Bundles Grid ── */}
      <div className="container mx-auto px-4 lg:px-12 py-8">
        {combos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {combos.map((combo) => (
              <ComboDealCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Flame className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No combo deals right now</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Check back soon — our next round of bundle deals is coming up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
