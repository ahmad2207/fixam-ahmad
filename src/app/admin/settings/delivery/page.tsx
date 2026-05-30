'use client';

import { useState, useEffect } from 'react';
import { useDeliveryConfig } from '@/hooks/useDeliveryConfig';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function DeliverySettingsPage() {
  const { data: config, isLoading } = useDeliveryConfig();
  const [zoneFees, setZoneFees] = useState<Record<string, number>>({});
  const [tiers, setTiers] = useState<{ minSubtotal: number; fee: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!config) return;
    const fees: Record<string, number> = {};
    for (const [zone, data] of Object.entries(config.abuja_zones)) {
      fees[zone] = data.fee;
    }
    setZoneFees(fees);
    setTiers([...config.interstate_tiers].sort((a, b) => b.minSubtotal - a.minSubtotal));
  }, [config]);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const updatedConfig = {
        abuja_zones: Object.fromEntries(
          Object.entries(config.abuja_zones).map(([zone, data]) => [
            zone,
            { ...data, fee: zoneFees[zone] ?? data.fee },
          ])
        ),
        interstate_tiers: tiers,
      };
      const res = await fetch('/api/admin/settings/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Delivery config saved');
    } catch {
      toast.error('Failed to save delivery config');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/settings" className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Delivery Fees</h1>
      </div>

      <div className="space-y-6">
        {/* Abuja Zones */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Abuja (FCT) Zones</h2>
          <div className="space-y-3">
            {Object.entries(config.abuja_zones).map(([zone, data]) => (
              <div key={zone} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{zone}</p>
                  <p className="text-xs text-gray-400 truncate">{data.areas.slice(0, 3).join(', ')}{data.areas.length > 3 ? '…' : ''}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm text-gray-500">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={zoneFees[zone] ?? data.fee}
                    onChange={(e) => setZoneFees((p) => ({ ...p, [zone]: Number(e.target.value) }))}
                    className="w-28 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interstate Tiers */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-1">Interstate Delivery Tiers</h2>
          <p className="text-xs text-gray-400 mb-4">Tiers are applied based on order subtotal (highest match wins)</p>
          <div className="space-y-3">
            {tiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Min subtotal (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={tier.minSubtotal}
                    onChange={(e) => setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, minSubtotal: Number(e.target.value) } : t))}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Fee (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={tier.fee}
                    onChange={(e) => setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, fee: Number(e.target.value) } : t))}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
