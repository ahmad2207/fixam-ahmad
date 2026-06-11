'use client';

import { useState } from 'react';
import {
  useAdminOrders, useAdminOrdersSummary, useUpdateOrderStatus, useGenerateOrderReceipt, useDeleteOrder,
} from '@/hooks/useAdminOrders';
import { formatCurrency } from '@/lib/utils';
import {
  Search, Package, TruckIcon, Clock, DollarSign, ReceiptText,
  Trash2, ChevronDown, ChevronLeft, ChevronRight, ShoppingCart, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
  delivered:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  confirmed:  'bg-blue-50 text-blue-700 border border-blue-200',
  shipped:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
  cancelled:  'bg-red-50 text-red-700 border border-red-200',
  pending:    'bg-amber-50 text-amber-700 border border-amber-200',
  processing: 'bg-orange-50 text-orange-700 border border-orange-200',
  refunded:   'bg-gray-50 text-gray-600 border border-gray-200',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  failed:  'bg-red-50 text-red-700 border border-red-200',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  flutterwave:   'Flutterwave',
  pod:           'Pay on Delivery',
  cash:          'Cash',
  bank_transfer: 'Bank Transfer',
  card:          'Card',
  card_pos:      'Card (POS)',
};

const TAB_COLORS: Record<string, string> = {
  All:       'bg-foreground text-background border-foreground',
  pending:   'bg-amber-500 text-white border-amber-500',
  confirmed: 'bg-blue-500 text-white border-blue-500',
  shipped:   'bg-indigo-500 text-white border-indigo-500',
  delivered: 'bg-emerald-500 text-white border-emerald-500',
  cancelled: 'bg-red-500 text-white border-red-500',
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

  const totalOrders    = summary?.totalOrders ?? 0;
  const totalRevenue   = summary?.totalRevenue ?? 0;
  const inTransit      = summary?.inTransit ?? 0;
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
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalOrders} total orders</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',     value: totalOrders,                    Icon: Package,   accent: 'bg-primary/10 text-primary',     border: 'border-primary/15' },
          { label: 'Total Revenue',    value: formatCurrency(totalRevenue),   Icon: DollarSign, accent: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
          { label: 'In Transit',       value: inTransit,                      Icon: TruckIcon,  accent: 'bg-indigo-50 text-indigo-600',   border: 'border-indigo-100' },
          { label: 'Awaiting Payment', value: awaitingPayment,                Icon: Clock,      accent: 'bg-amber-50 text-amber-600',     border: 'border-amber-100' },
        ].map(({ label, value, Icon, accent, border }) => (
          <div key={label} className={cn('bg-card rounded-2xl p-5 border shadow-sm', border)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 overflow-x-auto border-b border-border flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap capitalize',
                activeTab === tab
                  ? (TAB_COLORS[tab] ?? 'bg-foreground text-background border-foreground')
                  : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:border-border',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + Payment Method */}
        <div className="flex gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order ID, name, or email…"
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
              className="appearance-none pl-3 pr-8 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* ── Table / Cards ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="block lg:hidden divide-y divide-border">
              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{search ? 'No orders match your search.' : 'No orders found.'}</p>
                </div>
              )}
              {filtered.map((row) => (
                <div key={row.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/admin/orders/${row.id}`} className="font-mono font-bold text-primary hover:underline text-sm">
                        #{row.orderNumber ?? row.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(row.createdAt).toLocaleDateString('en-NG')}</p>
                    </div>
                    <span className="font-bold text-sm text-foreground">{formatCurrency(Number(row.total))}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{row.shippingFullName || row.guestEmail || '—'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn('inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[row.status] ?? 'bg-secondary text-secondary-foreground border border-border')}>
                      {row.status}
                    </span>
                    <span className={cn('inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize', PAYMENT_STATUS_STYLES[row.paymentStatus ?? 'pending'] ?? 'bg-secondary text-secondary-foreground border border-border')}>
                      {row.paymentStatus ?? 'pending'}
                    </span>
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border capitalize">
                      {row.saleType}
                    </span>
                  </div>
                  {(row.itemPreviews ?? []).length > 0 && (
                    <div className="flex items-center gap-1">
                      {row.itemPreviews!.map((item, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-background">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                          )}
                        </div>
                      ))}
                      {(row.totalItemCount ?? 0) > 3 && (
                        <span className="text-xs text-muted-foreground ml-1">+{(row.totalItemCount ?? 0) - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={row.status}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      className="flex-1 text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                    >
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleGenerateReceipt(row.id)}
                      disabled={generateReceipt.isPending}
                      title="Generate Receipt"
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      <ReceiptText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(row.id)}
                      title="Delete"
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/orders/${row.id}`} className="text-primary hover:underline font-mono text-xs font-bold">
                          #{row.orderNumber ?? row.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 max-w-[140px] truncate">
                        <span className="text-sm text-foreground">{row.shippingFullName || row.guestEmail || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-0.5">
                          {(row.itemPreviews ?? []).map((item, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-lg overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-card"
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
                            <span className="text-xs text-muted-foreground ml-2">+{(row.totalItemCount ?? 0) - 3}</span>
                          )}
                          {(row.totalItemCount ?? 0) === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(Number(row.total))}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded-md">{row.saleType}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize', PAYMENT_STATUS_STYLES[row.paymentStatus ?? 'pending'] ?? 'bg-secondary text-secondary-foreground')}>
                          {row.paymentStatus ?? 'pending'}
                        </span>
                        {row.paymentMethod && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod.replace('_', ' ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[row.status] ?? 'bg-secondary text-secondary-foreground')}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString('en-NG')}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <select
                            value={row.status}
                            onChange={(e) => handleStatusChange(row.id, e.target.value)}
                            className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleGenerateReceipt(row.id)}
                            disabled={generateReceipt.isPending}
                            title="Generate Receipt"
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          >
                            <ReceiptText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(row.id)}
                            title="Delete Order"
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
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
                <div className="text-center py-16">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{search ? 'No orders match your search.' : 'No orders found.'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages}</span> &middot; {total} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Delete Order?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete the order and all its items.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteOrder.isPending}
                className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:bg-destructive/90 transition disabled:opacity-50"
              >
                {deleteOrder.isPending ? 'Deleting…' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
