'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Search, Terminal } from 'lucide-react';
import Link from 'next/link';

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-red-50 text-red-700 border border-red-200',
  refunded:  'bg-muted text-muted-foreground border border-border',
};

const TYPE_LABELS: Record<string, string> = {
  online:  'Online',
  pos:     'POS',
  offline: 'Offline',
};

const TYPE_STYLES: Record<string, string> = {
  online:  'bg-blue-50 text-blue-700 border border-blue-200',
  pos:     'bg-violet-50 text-violet-700 border border-violet-200',
  offline: 'bg-muted text-muted-foreground border border-border',
};

export interface ReceiptRow {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  type: string;
  total: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: Date;
}

const TYPE_FILTERS = ['All', 'Online', 'POS', 'Offline'] as const;

export default function ReceiptsClient({ receipts }: { receipts: ReceiptRow[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.receiptNumber.toLowerCase().includes(q) ||
      (r.customerName ?? '').toLowerCase().includes(q) ||
      (r.customerEmail ?? '').toLowerCase().includes(q);
    const matchType =
      typeFilter === 'All' || r.type.toLowerCase() === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt # or customer…"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Link
          href="/admin/pos"
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition whitespace-nowrap bg-card"
        >
          <Terminal className="w-4 h-4" />
          Open POS
        </Link>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Receipt #</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-primary">
                    {row.receiptNumber}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {row.customerName || row.customerEmail || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${TYPE_STYLES[row.type] ?? 'bg-muted text-muted-foreground border border-border'}`}>
                      {TYPE_LABELS[row.type] ?? row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">{row.itemCount}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-foreground">{formatCurrency(Number(row.total))}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${PAYMENT_STATUS_STYLES[row.paymentStatus] ?? 'bg-muted text-muted-foreground border border-border'}`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString('en-NG')}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/receipts/${row.id}`} className="text-xs font-semibold text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search || typeFilter !== 'All' ? 'No receipts match your filters.' : 'No receipts yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
