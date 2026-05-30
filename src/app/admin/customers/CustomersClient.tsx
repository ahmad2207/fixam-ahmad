'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Search, Download, X, ShoppingBag, Mail, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export interface CustomerRow {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  primaryAddress: { city: string; state: string } | null;
  recentOrders: { id: string; orderNumber: string | null; total: string; status: string; createdAt: Date }[];
}

interface Props {
  customers: CustomerRow[];
}

function downloadCSV(customers: CustomerRow[]) {
  const header = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Location', 'Joined'];
  const rows = customers.map((c) => [
    c.fullName ?? '',
    c.email ?? '',
    c.phone ?? '',
    String(c.totalOrders),
    String(c.totalSpent),
    c.primaryAddress ? `${c.primaryAddress.city}, ${c.primaryAddress.state}` : '',
    new Date(c.createdAt).toLocaleDateString('en-NG'),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CustomerDetailDialog({ customer, onClose }: { customer: CustomerRow; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {(customer.fullName ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-bold">{customer.fullName ?? 'Unknown'}</h2>
              <p className="text-xs text-gray-400">Customer Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</h3>
            <div className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.primaryAddress && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{customer.primaryAddress.city}, {customer.primaryAddress.state}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Joined {new Date(customer.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-xl font-bold text-primary">{customer.totalOrders}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Total Spent</p>
              <p className="text-xl font-bold">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>

          {/* Recent orders */}
          {customer.recentOrders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Orders</h3>
              <div className="space-y-2">
                {customer.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium font-mono text-xs text-primary">
                          #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ORDER_STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                      <span className="font-medium text-xs">{formatCurrency(Number(order.total))}</span>
                      <Link href={`/admin/orders/${order.id}`} className="text-gray-400 hover:text-primary transition" onClick={onClose}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customer.recentOrders.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomersClient({ customers }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.fullName ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search + Export */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>
        <button
          onClick={() => downloadCSV(customers)}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition text-gray-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Orders</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total Spent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(c)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(c.fullName ?? '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{c.fullName ?? 'Unknown'}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.primaryAddress ? `${c.primaryAddress.city}, ${c.primaryAddress.state}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.totalOrders > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {c.totalOrders}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(c.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <CustomerDetailDialog customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
