'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Search, Terminal } from 'lucide-react';
import Link from 'next/link';

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS: Record<string, string> = {
  online: 'Online',
  pos: 'POS',
  offline: 'Offline',
};

const TYPE_STYLES: Record<string, string> = {
  online: 'bg-blue-100 text-blue-700',
  pos: 'bg-purple-100 text-purple-700',
  offline: 'bg-gray-100 text-gray-600',
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
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt # or customer..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                typeFilter === t
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Open POS quick action */}
        <Link
          href="/admin/pos"
          className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
        >
          <Terminal className="w-4 h-4" />
          Open POS
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Receipt #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Items</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-primary">
                    {row.receiptNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.customerName || row.customerEmail || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[row.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[row.type] ?? row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{row.itemCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(row.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STATUS_STYLES[row.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString('en-NG')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/receipts/${row.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              {search || typeFilter !== 'All' ? 'No receipts match your filters.' : 'No receipts yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
