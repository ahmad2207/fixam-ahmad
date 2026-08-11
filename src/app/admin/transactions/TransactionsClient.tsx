'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Search, Download, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  successful: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  initiated: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-800',
};

const STATUS_OPTIONS = ['All', 'successful', 'failed', 'pending', 'initiated', 'cancelled'];

export interface TransactionRow {
  id: string;
  orderId: string | null;
  paystackReference: string | null;
  paystackTransactionId: string | null;
  amount: string;
  currency: string;
  status: string;
  rawResponse: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderStatus: string | null;
  shippingFullName: string | null;
  guestEmail: string | null;
}

interface Props {
  transactions: TransactionRow[];
}

function downloadCSV(transactions: TransactionRow[]) {
  const header = ['Date', 'TX Reference', 'Paystack ID', 'Customer', 'Amount', 'Currency', 'Status', 'Order ID'];
  const rows = transactions.map((tx) => [
    new Date(tx.createdAt).toLocaleDateString('en-NG'),
    tx.paystackReference ?? '',
    tx.paystackTransactionId ?? '',
    tx.shippingFullName ?? tx.guestEmail ?? '',
    String(tx.amount),
    tx.currency,
    tx.status,
    tx.orderId ?? '',
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsClient({ transactions }: Props) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [selected, setSelected] = useState<TransactionRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions
      .filter((tx) => {
        const matchStatus = statusFilter === 'All' || tx.status === statusFilter;
        const matchSearch =
          !q ||
          (tx.paystackReference ?? '').toLowerCase().includes(q) ||
          (tx.paystackTransactionId ?? '').toLowerCase().includes(q) ||
          (tx.shippingFullName ?? '').toLowerCase().includes(q) ||
          (tx.guestEmail ?? '').toLowerCase().includes(q) ||
          (tx.orderId ?? '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
      .sort((a, b) => {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return dateSort === 'desc' ? -diff : diff;
      });
  }, [transactions, statusFilter, search, dateSort]);

  const toggleDateSort = () => setDateSort((prev) => (prev === 'desc' ? 'asc' : 'desc'));

  return (
    <div>
      {/* Search + Filter + Actions */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Row 1: search + CSV */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TX ref, Paystack ID, customer..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>
          <button
            onClick={() => downloadCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition text-gray-700 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Row 2: status filters */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                statusFilter === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  <button
                    onClick={toggleDateSort}
                    className="flex items-center gap-1 hover:text-gray-800 transition"
                  >
                    Date
                    {dateSort === 'desc' ? (
                      <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">TX Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(tx)}
                >
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                      {tx.paystackReference ?? '—'}
                    </code>
                    {tx.paystackTransactionId && (
                      <p className="text-xs text-gray-400 mt-0.5">PSK: {tx.paystackTransactionId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tx.shippingFullName ?? tx.guestEmail ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(Number(tx.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">No transactions found.</div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Transaction Detail</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="TX Reference" value={selected.paystackReference ?? '—'} mono />
              <Row label="Paystack TX ID" value={selected.paystackTransactionId ?? '—'} mono />
              <Row label="Amount" value={`${selected.currency} ${formatCurrency(Number(selected.amount))}`} />
              <Row
                label="Status"
                value={
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[selected.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selected.status}
                  </span>
                }
              />
              <Row label="Customer" value={selected.shippingFullName ?? selected.guestEmail ?? '—'} />
              {selected.orderId && (
                <Row
                  label="Order"
                  value={
                    <a
                      href={`/admin/orders/${selected.orderId}`}
                      className="text-primary hover:underline font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{selected.orderId.slice(0, 8).toUpperCase()}
                    </a>
                  }
                />
              )}
              {selected.orderStatus && (
                <Row label="Order Status" value={<span className="capitalize">{selected.orderStatus}</span>} />
              )}
              <Row label="Created" value={new Date(selected.createdAt).toLocaleString('en-NG')} />
              <Row label="Updated" value={new Date(selected.updatedAt).toLocaleString('en-NG')} />
            </div>

            {selected.rawResponse && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Raw Response (click to expand)
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-60">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selected.rawResponse!), null, 2);
                    } catch {
                      return selected.rawResponse;
                    }
                  })()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
