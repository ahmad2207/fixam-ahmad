'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
  DollarSign, MousePointerClick, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y';

const CHART_COLORS = [
  'hsl(32, 100%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(0, 84%, 60%)',
  'hsl(200, 80%, 50%)',
];

function fmt(amount: number) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

const RANGES: { id: TimeRange; label: string }[] = [
  { id: '7d',  label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '6m',  label: '6M' },
  { id: '1y',  label: '1Y' },
];

function TrendBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return null;
  const isUp = pct > 0;
  const isDown = pct < 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
      isUp ? 'bg-emerald-50 text-emerald-700' : isDown ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground',
    )}>
      {isUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : isDown ? <ArrowDownRight className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-4 border-b border-border">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Store performance overview</p>
        </div>
        <div className="flex items-center bg-muted/60 border border-border rounded-xl p-1 gap-0.5">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setTimeRange(r.id)}
              className={cn('px-3.5 py-2 rounded-lg text-xs font-bold transition',
                timeRange === r.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* ══ ROW 1: Key Metrics ══ */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Total Revenue',   value: fmt(data.totalRevenue),                            icon: TrendingUp,        accentBg: 'bg-primary/10',  accentText: 'text-primary',     border: 'border-l-4 border-l-primary',     pct: data.pctChange?.totalRevenue },
              { label: 'Total Orders',    value: String(data.totalOrders),                          icon: ShoppingCart,      accentBg: 'bg-blue-50',     accentText: 'text-blue-600',    border: 'border-l-4 border-l-blue-500',    pct: data.pctChange?.totalOrders },
              { label: 'New Customers',   value: String(data.newCustomers),                         icon: Users,             accentBg: 'bg-emerald-50',  accentText: 'text-emerald-600', border: 'border-l-4 border-l-emerald-500', pct: data.pctChange?.newCustomers },
              { label: 'Avg Order Value', value: fmt(data.avgOrderValue),                           icon: Package,           accentBg: 'bg-amber-50',    accentText: 'text-amber-600',   border: 'border-l-4 border-l-amber-400',   pct: data.pctChange?.avgOrderValue },
              { label: 'Gross Profit',    value: fmt(data.grossProfit ?? 0),                        icon: DollarSign,        accentBg: 'bg-violet-50',   accentText: 'text-violet-600',  border: 'border-l-4 border-l-violet-500',  sub: data.profitMargin != null ? `${Number(data.profitMargin).toFixed(1)}% margin` : undefined },
              { label: 'Conversion',      value: `${Number(data.conversionRate ?? 0).toFixed(1)}%`, icon: MousePointerClick, accentBg: 'bg-rose-50',     accentText: 'text-rose-600',    border: 'border-l-4 border-l-rose-400',    pct: data.pctChange?.conversionRate, sub: 'paid / placed' },
            ].map(({ label, value, icon: Icon, accentBg, accentText, border, sub, pct }) => (
              <div key={label} className={cn('bg-card border border-border rounded-2xl p-4 shadow-sm', border)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{label}</p>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', accentBg)}>
                    <Icon className={cn('h-3.5 w-3.5', accentText)} />
                  </div>
                </div>
                <p className="text-xl font-black text-foreground leading-none truncate">{value}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {pct != null && <TrendBadge pct={pct} />}
                  {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* ══ ROW 2: Revenue Trend (wide) + Order Status Donut ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <CardHeader title="Revenue Trend" sub="Daily revenue for selected period" />
              <div className="p-5 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(32,100%,50%)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="hsl(32,100%,50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} width={44} />
                    <Tooltip
                      formatter={(v: unknown) => [fmt(Number(v)), 'Revenue']}
                      contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', fontSize: 12, padding: '6px 12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(32,100%,50%)" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <CardHeader title="Order Status" sub="Distribution by fulfillment" />
              <div className="p-5 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusBreakdown} cx="50%" cy="44%" innerRadius={52} outerRadius={85} paddingAngle={3} dataKey="value">
                      {data.statusBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', fontSize: 12, padding: '6px 12px' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ══ ROW 3: Profit Breakdown (left) + Online vs Offline (right) ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Profit Breakdown */}
            {(data.totalRevenue > 0 || data.estimatedCOGS > 0) && (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader title="Profit Breakdown" sub="Revenue → Cost → Gross Profit" />
                <div className="p-5 space-y-5">
                  {[
                    { label: 'Revenue',          value: data.totalRevenue,       color: 'bg-blue-500',    pct: 100 },
                    { label: 'COGS (estimated)', value: data.estimatedCOGS ?? 0, color: 'bg-red-400',     pct: data.totalRevenue > 0 ? ((data.estimatedCOGS ?? 0) / data.totalRevenue) * 100 : 0 },
                    { label: 'Gross Profit',     value: data.grossProfit ?? 0,
                      color: data.profitMargin >= 30 ? 'bg-emerald-500' : data.profitMargin >= 15 ? 'bg-amber-500' : 'bg-red-500',
                      pct: data.totalRevenue > 0 ? ((data.grossProfit ?? 0) / data.totalRevenue) * 100 : 0,
                    },
                  ].map(({ label, value, color, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-foreground">{fmt(value)}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.max(pct, 0)}%` }} />
                      </div>
                    </div>
                  ))}
                  {data.profitMargin != null && (
                    <div className={cn(
                      'flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl mt-1',
                      data.profitMargin >= 30 ? 'bg-emerald-50 text-emerald-700' :
                      data.profitMargin >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600',
                    )}>
                      <span>Margin: {Number(data.profitMargin).toFixed(1)}%</span>
                      <span className="opacity-60">—</span>
                      <span>{data.profitMargin >= 30 ? 'Healthy' : data.profitMargin >= 15 ? 'Watch margin' : 'Low margin'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Online vs Offline */}
            {data.onlineVsOffline?.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader title="Online vs Offline Sales" sub="Last 6 months" />
                <div className="p-5 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.onlineVsOffline} barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} width={44} />
                      <Tooltip formatter={(v: unknown) => fmt(Number(v))} contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', fontSize: 12, padding: '6px 12px' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                      <Bar dataKey="online"  name="Online"      fill="hsl(32,100%,50%)" radius={[4,4,0,0]} maxBarSize={32} />
                      <Bar dataKey="offline" name="Offline/POS" fill="#94a3b8"           radius={[4,4,0,0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* Fill the right column if no online/offline data */
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader title="Online vs Offline Sales" sub="Last 6 months" />
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No data yet</div>
              </div>
            )}
          </div>

          {/* ══ ROW 4: Top Products + Category chart + Low Stock ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Top Products */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <CardHeader title="Top Products" sub="By revenue in selected period" />
              <div className="p-5">
                {data.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {data.topProducts.map((p: any, i: number) => {
                      const maxRev = data.topProducts[0]?.revenue ?? 1;
                      const pct = (p.revenue / maxRev) * 100;
                      return (
                        <div key={i}>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className={cn(
                              'w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center flex-shrink-0',
                              i === 0 ? 'bg-primary text-white' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground',
                            )}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.quantity} units</p>
                            </div>
                            <span className="text-sm font-black text-foreground tabular-nums">{fmt(p.revenue)}</span>
                          </div>
                          <div className="ml-9 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No confirmed sales yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category + Low Stock stacked */}
            <div className="flex flex-col gap-4">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1">
                <CardHeader title="By Category" sub="Revenue split" />
                <div className="p-5 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={68} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', fontSize: 12, padding: '6px 12px' }} />
                      <Bar dataKey="value" fill="hsl(32,100%,50%)" radius={[0,6,6,0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {data.lowStockProducts?.length > 0 && (
                <div className="bg-card border border-red-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-red-100">
                    <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Low Stock</h3>
                    <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {data.lowStockProducts.length}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {data.lowStockProducts.slice(0, 4).map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-sm truncate max-w-[58%] text-foreground font-medium">{p.name}</span>
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800',
                        )}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
