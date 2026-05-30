'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Clock, Package, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  '6m': '6 Months',
  '1y': '1 Year',
};

const CATEGORY_COLORS = [
  'hsl(32, 100%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(200, 80%, 50%)',
  'hsl(271, 91%, 65%)',
  'hsl(0, 84%, 60%)',
];

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}k`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

interface Reservation {
  id: string;
  productName: string;
  quantity: number;
  expiresAt: string;
}

interface Props {
  totalRevenue: number;
  estimatedCOGS: number;
  grossProfit: number;
  activeReservations: Reservation[];
}

// ── D1: Sales Chart ──────────────────────────────────────────────
function SalesChart() {
  const [range, setRange] = useState<TimeRange>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-chart', range],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dashboard/chart?range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch chart');
      return res.json() as Promise<{
        data: { label: string; online: number; offline: number }[];
        totalOnline: number;
        totalOffline: number;
      }>;
    },
  });

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-foreground">Sales Analytics</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Online vs Offline / POS</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="h-[220px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="flex gap-6 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
              Online: <span className="font-semibold text-foreground">{formatCurrency(data.totalOnline)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40 inline-block" />
              Offline / POS: <span className="font-semibold text-foreground">{formatCurrency(data.totalOffline)}</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.data} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={data.data.length > 20 ? Math.floor(data.data.length / 10) : 0}
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} width={55} />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [
                    formatCurrency(Number(v)),
                    name === 'online' ? 'Online' : 'Offline / POS',
                  ]}
                />
                <Bar dataKey="online" name="Online" fill="hsl(32, 100%, 50%)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="offline" name="Offline / POS" fill="#9ca3af" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ── D2: Profit Breakdown Card ────────────────────────────────────
function ProfitBreakdownCard({
  totalRevenue,
  estimatedCOGS,
  grossProfit,
}: {
  totalRevenue: number;
  estimatedCOGS: number;
  grossProfit: number;
}) {
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const marginColor =
    profitMargin >= 30 ? 'text-emerald-600' : profitMargin >= 15 ? 'text-amber-600' : 'text-red-600';
  const barColor =
    profitMargin >= 30 ? 'bg-emerald-500' : profitMargin >= 15 ? 'bg-amber-500' : 'bg-red-500';

  const items = [
    { label: 'Total Revenue', value: totalRevenue, color: 'bg-primary', textColor: 'text-primary' },
    { label: 'Est. COGS', value: estimatedCOGS, color: 'bg-red-400', textColor: 'text-red-600' },
    { label: 'Gross Profit', value: grossProfit, color: barColor, textColor: marginColor },
  ];

  const maxVal = Math.max(totalRevenue, 1);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Profit Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All-time (paid orders)</p>
        </div>
        <div className={`text-right`}>
          <p className={`text-2xl font-bold ${marginColor}`}>{profitMargin.toFixed(1)}%</p>
          <p className="text-xs text-gray-400">margin</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={`font-semibold ${item.textColor}`}>{formatCurrency(item.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${Math.min((item.value / maxVal) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Margin health</span>
          <span className={`font-semibold ${marginColor}`}>
            {profitMargin >= 30 ? 'Excellent' : profitMargin >= 15 ? 'Moderate' : 'Low'}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500`}
            style={{ width: `${Math.min(profitMargin, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── D3: Active Reservations Card ─────────────────────────────────
function ActiveReservationsCard({ reservations }: { reservations: Reservation[] }) {
  const now = new Date();
  const expiringCount = reservations.filter(
    (r) => new Date(r.expiresAt).getTime() - now.getTime() < 60 * 60 * 1000,
  ).length;

  const totalQty = reservations.reduce((s, r) => s + r.quantity, 0);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          <h3 className="font-semibold text-foreground">Active Reservations</h3>
        </div>
        {expiringCount > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {expiringCount} expiring soon
          </span>
        )}
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-4">
          <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active reservations</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{reservations.length}</p>
              <p className="text-xs text-amber-600">Checkouts in progress</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{totalQty}</p>
              <p className="text-xs text-blue-600">Units reserved</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {reservations.slice(0, 6).map((r) => {
              const expiresIn = Math.max(
                0,
                Math.floor((new Date(r.expiresAt).getTime() - now.getTime()) / 60_000),
              );
              const isExpiringSoon = expiresIn < 60;
              return (
                <div key={r.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isExpiringSoon ? 'bg-warning' : 'bg-success'}`} />
                    <span className="truncate text-foreground">{r.productName}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">×{r.quantity}</span>
                  </div>
                  <span className={`text-xs flex-shrink-0 ml-2 ${isExpiringSoon ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                    {expiresIn < 1 ? 'Expiring' : `${expiresIn}m`}
                  </span>
                </div>
              );
            })}
          </div>

          {reservations.length > 6 && (
            <p className="text-xs text-gray-400 mt-2 text-center">+{reservations.length - 6} more</p>
          )}
        </>
      )}
    </div>
  );
}

// ── D4: Inventory Category Breakdown ─────────────────────────────
function InventoryCategoryChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/stats');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{
        totalValue: number;
        breakdown: { category: string; value: number; itemCount: number }[];
      }>;
    },
  });

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-foreground">Inventory by Category</h3>
        {data && (
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatCurrency(data.totalValue)}</span>
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">Value at cost price</p>

      {isLoading || !data ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : data.breakdown.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-gray-400">No inventory data yet</p>
        </div>
      ) : (
        <>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.breakdown} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={82} />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(Number(v)), 'Value']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {data.breakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-1.5">
            {data.breakdown.slice(0, 4).map((item, i) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{item.category}</span>
                </div>
                <span className="text-muted-foreground/60">{item.itemCount} units</span>
              </div>
            ))}
          </div>

          <Link href="/admin/inventory" className="block mt-3 text-xs text-primary hover:underline text-center">
            View full inventory →
          </Link>
        </>
      )}
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────
export function DashboardChartsClient({
  totalRevenue,
  estimatedCOGS,
  grossProfit,
  activeReservations,
}: Props) {
  return (
    <div className="space-y-6">
      {/* D1: Sales Chart — full width */}
      <SalesChart />

      {/* D2 + D3 + D4: Profit breakdown, active reservations, inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProfitBreakdownCard
          totalRevenue={totalRevenue}
          estimatedCOGS={estimatedCOGS}
          grossProfit={grossProfit}
        />
        <ActiveReservationsCard reservations={activeReservations} />
        <InventoryCategoryChart />
      </div>
    </div>
  );
}
