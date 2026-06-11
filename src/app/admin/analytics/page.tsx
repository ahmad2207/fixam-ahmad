'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle, DollarSign, MousePointerClick } from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y';

const COLORS = [
  'hsl(32, 100%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(0, 84%, 60%)',
  'hsl(200, 80%, 50%)',
];

function formatCurrency(amount: number) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  '6m': '6 Months',
  '1y': '1 Year',
};

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

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Store performance overview</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Store performance overview</p>
        </div>
        <div className="flex bg-card border border-border rounded-xl overflow-hidden text-sm shadow-sm">
          {(['7d', '30d', '90d', '6m', '1y'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3.5 py-2 transition font-medium ${timeRange === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Revenue',    value: formatCurrency(data.totalRevenue),              icon: TrendingUp,       color: 'text-primary',    pct: data.pctChange?.totalRevenue },
          { label: 'Total Orders',     value: data.totalOrders,                               icon: ShoppingCart,     color: 'text-blue-600',   pct: data.pctChange?.totalOrders },
          { label: 'New Customers',    value: data.newCustomers,                              icon: Users,            color: 'text-emerald-600',pct: data.pctChange?.newCustomers },
          { label: 'Avg Order Value',  value: formatCurrency(data.avgOrderValue),             icon: Package,          color: 'text-amber-600',  pct: data.pctChange?.avgOrderValue },
          { label: 'Gross Profit',     value: formatCurrency(data.grossProfit ?? 0),          icon: DollarSign,       color: 'text-violet-600', sub: data.profitMargin != null ? `${Number(data.profitMargin).toFixed(1)}% margin` : undefined },
          { label: 'Conversion Rate',  value: `${Number(data.conversionRate ?? 0).toFixed(1)}%`, icon: MousePointerClick, color: 'text-rose-600', sub: 'orders paid / placed', pct: data.pctChange?.conversionRate },
        ].map(({ label, value, icon: Icon, color, sub, pct }) => {
          const isUp = pct != null && pct > 0;
          const isDown = pct != null && pct < 0;
          return (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 truncate">{label}</p>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
                  {pct != null && (
                    <p className={`text-xs font-semibold mt-1 ${isUp ? 'text-emerald-600' : isDown ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(pct).toFixed(1)}%
                    </p>
                  )}
                </div>
                <Icon className={`h-4 w-4 ${color} mt-1 shrink-0`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart + Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Revenue Trend</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(32, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(32, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(32, 100%, 50%)" strokeWidth={2} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Order Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                  {data.statusBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Profit Breakdown */}
      {(data.totalRevenue > 0 || data.estimatedCOGS > 0) && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Profit Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-5">Revenue → COGS → Gross Profit</p>
          <div className="space-y-4">
            {[
              { label: 'Revenue', value: data.totalRevenue, color: 'bg-blue-500', pct: 100 },
              {
                label: 'COGS (estimated)',
                value: data.estimatedCOGS ?? 0,
                color: 'bg-red-400',
                pct: data.totalRevenue > 0 ? ((data.estimatedCOGS ?? 0) / data.totalRevenue) * 100 : 0,
              },
              {
                label: 'Gross Profit',
                value: data.grossProfit ?? 0,
                color: data.profitMargin >= 30 ? 'bg-emerald-500' : data.profitMargin >= 15 ? 'bg-amber-500' : 'bg-red-500',
                pct: data.totalRevenue > 0 ? ((data.grossProfit ?? 0) / data.totalRevenue) * 100 : 0,
              },
            ].map(({ label, value, color, pct }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">{formatCurrency(value)}</span>
                    <span className="text-xs text-muted-foreground ml-2">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
                  <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${Math.max(pct, 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
          {data.profitMargin != null && (
            <p className={`text-sm font-semibold mt-4 ${
              data.profitMargin >= 30 ? 'text-emerald-600' :
              data.profitMargin >= 15 ? 'text-amber-600' : 'text-red-600'
            }`}>
              Margin: {Number(data.profitMargin).toFixed(1)}%
              {data.profitMargin >= 30 ? ' — Healthy' : data.profitMargin >= 15 ? ' — Watch margin' : ' — Low margin'}
            </p>
          )}
        </div>
      )}

      {/* Online vs Offline Chart */}
      {data.onlineVsOffline && data.onlineVsOffline.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Online vs Offline Sales</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.onlineVsOffline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="online" name="Online" fill="hsl(32, 100%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offline" name="Offline / POS" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Products + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Top Products</h3>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p: any, i: number) => {
                const maxRev = data.topProducts[0]?.revenue ?? 1;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.quantity} units</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="ml-10 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No confirmed sales yet</p>
          )}
        </div>

        <div className="space-y-6">
          {/* Category Chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">By Category</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(32, 100%, 50%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Alert */}
          {data.lowStockProducts?.length > 0 && (
            <div className="bg-card border border-red-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="font-semibold text-foreground">Low Stock</h3>
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{data.lowStockProducts.length}</span>
              </div>
              <div className="space-y-2">
                {data.lowStockProducts.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[60%] text-foreground">{p.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
