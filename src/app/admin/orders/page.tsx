'use client';

import { useState } from 'react';
import {
  useAdminOrders, useAdminOrdersSummary, useUpdateOrderStatus, useGenerateOrderReceipt, useDeleteOrder,
} from '@/hooks/useAdminOrders';
import { formatCurrency } from '@/lib/utils';
import { Search, Package, TruckIcon, Clock, DollarSign, ReceiptText, Trash2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const STATUS_TABS = ['All', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'flutterwave', label: 'Flutterwave' },
  { value: 'pod', label: 'Pay on Delivery' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

const STATUS_STYLES: Record<string, string> = {
  delivered:  'bg-primary/10 text-primary',
  confirmed:  'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  cancelled:  'bg-red-100 text-red-700',
  pending:    'bg-gray-100 text-gray-700',
  processing: 'bg-amber-100 text-amber-700',
  refunded:   'bg-red-50 text-red-500',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid:    'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-700',
  failed:  'bg-red-100 text-red-700',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  flutterwave:   'Flutterwave',
  pod:           'Pay on Delivery',
  cash:          'Cash',
  bank_transfer: 'Bank Transfer',
  card:          'Card',
  card_pos:      'Card (POS)',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>('All');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminOrders({
    ...(activeTab !== 'All' ? { status: activeTab } : {}),
    page,
  });
  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const { data: summary } = useAdminOrdersSummary();
  const updateStatus = useUpdateOrderStatus();
  const generateReceipt = useGenerateOrderReceipt();
  const deleteOrder = useDeleteOrder();

  const filtered = (orders ?? []).filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (o.shippingFullName ?? '').toLowerCase().includes(q) ||
      (o.guestEmail ?? '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.orderNumber ?? '').toLowerCase().includes(q);
    const matchesPayment = !paymentMethod || o.paymentMethod === paymentMethod;
    return matchesSearch && matchesPayment;
  });

  const totalOrders = summary?.totalOrders ?? 0;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const inTransit = summary?.inTransit ?? 0;
  const awaitingPayment = summary?.awaitingPayment ?? 0;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleGenerateReceipt = async (orderId: string) => {
    try {
      const receipt = await generateReceipt.mutateAsync(orderId);
      toast.success(`Receipt #${receipt.receiptNumber} created`);
      router.push(`/admin/receipts/${receipt.id}`);
    } catch {
      toast.error('Failed to generate receipt');
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      await deleteOrder.mutateAsync(orderId);
      setDeletingId(null);
    } catch {
      // toast shown by hook
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: totalOrders, Icon: Package, bg: 'bg-primary/10', ic: 'text-primary' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), Icon: DollarSign, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'In Transit', value: inTransit, Icon: TruckIcon, bg: 'bg-indigo-50', ic: 'text-indigo-600' },
          { label: 'Awaiting Payment', value: awaitingPayment, Icon: Clock, bg: 'bg-amber-50', ic: 'text-amber-600' },
        ].map(({ label, value, Icon, bg, ic }) => (
          <div key={label} className="bg-white border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${ic}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition capitalize ${
              activeTab === tab
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search + Payment Method Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID, name, or email..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>
        {/* O2 — Payment method filter */}
        <div className="relative">
          <select
            value={paymentMethod}
            onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary text-gray-700"
          >
            {PAYMENT_METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Delete Order?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete the order and all its items. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteOrder.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteOrder.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* O3 — Mobile card view */}
            <div className="block lg:hidden divide-y">
              {filtered.length === 0 && (
                <p className="text-center py-10 text-gray-500">
                  {search ? 'No orders match your search.' : 'No orders found.'}
                </p>
              )}
              {filtered.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="font-mono font-semibold text-primary hover:underline text-sm"
                      >
                        #{row.orderNumber ?? row.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(row.createdAt).toLocaleDateString('en-NG')}
                      </p>
                    </div>
                    <span className="font-bold text-sm">{formatCurrency(Number(row.total))}</span>
                  </div>

                  <p className="text-sm text-gray-600">{row.shippingFullName || row.guestEmail || '—'}</p>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {row.status}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STATUS_STYLES[row.paymentStatus ?? 'pending'] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.paymentStatus ?? 'pending'}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-600">
                      {row.saleType}
                    </span>
                  </div>

                  {/* O1 — Item thumbnails on mobile */}
                  {(row.itemPreviews ?? []).length > 0 && (
                    <div className="flex items-center gap-1">
                      {row.itemPreviews!.map((item, i) => (
                        <div key={i} className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0 border border-white shadow-sm">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                          )}
                        </div>
                      ))}
                      {(row.totalItemCount ?? 0) > 3 && (
                        <span className="text-xs text-gray-400 ml-1">+{(row.totalItemCount ?? 0) - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={row.status}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      className="flex-1 text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    >
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleGenerateReceipt(row.id)}
                      disabled={generateReceipt.isPending}
                      title="Generate Receipt"
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition"
                    >
                      <ReceiptText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(row.id)}
                      title="Delete"
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                    {/* O1 — Items preview column */}
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Items</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${row.id}`} className="text-primary hover:underline font-mono text-xs">
                          #{row.orderNumber ?? row.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                        {row.shippingFullName || row.guestEmail || '—'}
                      </td>
                      {/* O1 — Item thumbnails */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          {(row.itemPreviews ?? []).map((item, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm"
                              style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 3 - i }}
                            >
                              {item.image ? (
                                <Image src={item.image} alt={item.name} width={32} height={32} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                              )}
                            </div>
                          ))}
                          {(row.totalItemCount ?? 0) > 3 && (
                            <span className="text-xs text-gray-400 ml-2">+{(row.totalItemCount ?? 0) - 3}</span>
                          )}
                          {(row.totalItemCount ?? 0) === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(row.total))}</td>
                      <td className="px-4 py-3 capitalize text-gray-500 text-xs">{row.saleType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STATUS_STYLES[row.paymentStatus ?? 'pending'] ?? 'bg-gray-100 text-gray-600'}`}>
                          {row.paymentStatus ?? 'pending'}
                        </span>
                        {row.paymentMethod && (
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod.replace('_', ' ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleDateString('en-NG')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <select
                            value={row.status}
                            onChange={(e) => handleStatusChange(row.id, e.target.value)}
                            className="text-xs border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {/* O8 — Generate receipt per row */}
                          <button
                            onClick={() => handleGenerateReceipt(row.id)}
                            disabled={generateReceipt.isPending}
                            title="Generate Receipt"
                            className="p-1 text-gray-400 hover:text-primary hover:bg-primary/5 rounded transition"
                          >
                            <ReceiptText className="w-4 h-4" />
                          </button>
                          {/* O9 — Delete per row */}
                          <button
                            onClick={() => setDeletingId(row.id)}
                            title="Delete Order"
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  {search ? 'No orders match your search.' : 'No orders found.'}
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} &middot; {total} orders total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
