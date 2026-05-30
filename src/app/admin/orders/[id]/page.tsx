'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock,
  CreditCard, ReceiptText, Trash2, ChevronDown, ChevronRight,
  DollarSign, TrendingDown, TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  useAdminOrder, useUpdateOrderStatus, useConfirmOrderPayment,
  useGenerateOrderReceipt, useDeleteOrder,
} from '@/hooks/useAdminOrders';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const statusConfig: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  pending:    { icon: <Clock className="w-4 h-4" />,        bg: 'bg-gray-100',    text: 'text-gray-700' },
  confirmed:  { icon: <Package className="w-4 h-4" />,      bg: 'bg-blue-100',    text: 'text-blue-700' },
  processing: { icon: <Package className="w-4 h-4" />,      bg: 'bg-amber-100',   text: 'text-amber-700' },
  shipped:    { icon: <Truck className="w-4 h-4" />,        bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  delivered:  { icon: <CheckCircle className="w-4 h-4" />,  bg: 'bg-primary/10',  text: 'text-primary' },
  cancelled:  { icon: <XCircle className="w-4 h-4" />,      bg: 'bg-red-100',     text: 'text-red-700' },
  refunded:   { icon: <XCircle className="w-4 h-4" />,      bg: 'bg-red-50',      text: 'text-red-500' },
};

const txStatusBadge: Record<string, string> = {
  successful: 'bg-emerald-100 text-emerald-800',
  pending:    'bg-amber-100 text-amber-700',
  failed:     'bg-red-100 text-red-700',
  cancelled:  'bg-red-50 text-red-500',
  initiated:  'bg-gray-100 text-gray-600',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading, refetch } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const confirmPayment = useConfirmOrderPayment();
  const generateReceipt = useGenerateOrderReceipt();
  const deleteOrder = useDeleteOrder();

  const [newStatus, setNewStatus] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync newStatus when order loads
  const currentStatus = order?.status ?? '';
  const statusToShow = newStatus || currentStatus;

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || newStatus === order.status) return;
    try {
      await updateStatus.mutateAsync({ orderId: id, status: newStatus });
      toast.success('Status updated');
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleConfirmPayment = async () => {
    await confirmPayment.mutateAsync(id);
    refetch();
  };

  const handleGenerateReceipt = async () => {
    try {
      const receipt = await generateReceipt.mutateAsync(id);
      toast.success(`Receipt #${receipt.receiptNumber} created`);
      router.push(`/admin/receipts/${receipt.id}`);
    } catch {
      toast.error('Failed to generate receipt');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(id);
      router.push('/admin/orders');
    } catch {
      // toast shown by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-primary hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const cfg = statusConfig[order.status] ?? statusConfig.pending;
  const totalCOGS = order.totalCOGS ?? 0;
  const grossProfit = Number(order.total) - Number(order.deliveryFee) - totalCOGS;
  const profitMargin = Number(order.total) > 0 ? (grossProfit / Number(order.total)) * 100 : 0;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/orders')}
          className="text-gray-400 hover:text-gray-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">
            Order #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400">
            {new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'full' })}
            {' · '}
            <span className="capitalize">{order.saleType}</span>
          </p>
        </div>
        {/* O8 — Generate Receipt */}
        <button
          onClick={handleGenerateReceipt}
          disabled={generateReceipt.isPending}
          className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition text-gray-600 disabled:opacity-50"
        >
          <ReceiptText className="w-4 h-4" />
          <span className="hidden sm:inline">Receipt</span>
        </button>
        {/* O9 — Delete */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-sm hover:bg-red-50 transition text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Delete Order?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete this order and all its items. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteOrder.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteOrder.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Status + Payment */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold mb-3">Status</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.icon}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <select
                  value={statusToShow}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updateStatus.isPending || !newStatus || newStatus === order.status}
                  className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {updateStatus.isPending ? 'Updating…' : 'Update'}
                </button>
              </div>
            </div>

            {/* O7 — Confirm Payment */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-700'
                }`}>
                  <CreditCard className="w-3 h-3" />
                  {order.paymentStatus ?? 'pending'}
                </span>
                {order.paymentMethod && (
                  <span className="text-xs text-gray-400 capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                )}
              </div>
              {order.paymentStatus !== 'paid' && (
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirmPayment.isPending}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
                >
                  {confirmPayment.isPending ? 'Confirming…' : 'Confirm Payment'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* O4 — Items with FIFO Batch Allocations */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Items</h2>
          </div>
          <div className="divide-y">
            {(order.items ?? []).map((item) => {
              const itemCOGS = (item.allocations ?? []).reduce(
                (s, a) => s + a.quantity * Number(a.costPriceAtTime),
                0,
              );
              const isExpanded = expandedItems.has(item.id);
              const hasAllocations = (item.allocations ?? []).length > 0;

              return (
                <div key={item.id}>
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      {item.variation && <p className="text-xs text-gray-400">{item.variation}</p>}
                      {hasAllocations && (
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {isExpanded ? 'Hide' : 'Show'} FIFO batches
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-right flex-shrink-0">
                      <p className="text-gray-500">{formatCurrency(Number(item.price))} × {item.quantity}</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(Number(item.price) * item.quantity)}</p>
                      {hasAllocations && (
                        <p className="text-xs text-red-500 mt-0.5">COGS: {formatCurrency(itemCOGS)}</p>
                      )}
                    </div>
                  </div>

                  {/* O4 — FIFO Batch Allocation Detail */}
                  {isExpanded && hasAllocations && (
                    <div className="mx-6 mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        FIFO Batch Allocations
                      </p>
                      <div className="space-y-2">
                        {item.allocations!.map((alloc, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              <div>
                                <p className="font-medium">
                                  Batch from{' '}
                                  {alloc.batchCreatedAt
                                    ? new Date(alloc.batchCreatedAt).toLocaleDateString('en-NG')
                                    : '—'}
                                </p>
                                <p className="text-gray-400">
                                  {alloc.quantity} unit{alloc.quantity !== 1 ? 's' : ''} @ {formatCurrency(Number(alloc.costPriceAtTime))} each
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-gray-800">
                              {formatCurrency(alloc.quantity * Number(alloc.costPriceAtTime))}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-xs font-semibold">
                        <span className="text-gray-500">Item COGS</span>
                        <span className="text-red-600">{formatCurrency(itemCOGS)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* O6 — COGS + Gross Profit Financial Summary */}
          <div className="px-6 py-4 border-t bg-gray-50 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee</span>
              <span>{formatCurrency(Number(order.deliveryFee))}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>

            {totalCOGS > 0 && (
              <>
                <div className="border-t border-dashed border-gray-300 pt-1.5 mt-1" />
                <div className="flex items-center justify-between text-red-600">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Est. COGS (FIFO)
                  </span>
                  <span className="font-medium">−{formatCurrency(totalCOGS)}</span>
                </div>
                <div className={`flex items-center justify-between font-semibold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Gross Profit
                  </span>
                  <span>
                    {formatCurrency(grossProfit)}{' '}
                    <span className="text-xs font-normal opacity-70">({profitMargin.toFixed(1)}%)</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer + Shipping */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-3">Customer</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.shippingFullName ?? '—'}</p>
              {order.guestEmail && <p>{order.guestEmail}</p>}
              {order.shippingPhone && <p>{order.shippingPhone}</p>}
              <p className="text-xs text-gray-400 mt-1 capitalize">{order.saleType} order</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-3">Shipping Address</h2>
            <div className="space-y-0.5 text-sm text-gray-600">
              {order.shippingStreetAddress && <p>{order.shippingStreetAddress}</p>}
              {order.shippingCity && <p>{order.shippingCity}</p>}
              {order.shippingState && (
                <p>
                  {order.shippingState}
                  {(order as any).shippingAbujaZone ? ` (${(order as any).shippingAbujaZone})` : ''}
                </p>
              )}
              {!order.shippingStreetAddress && (
                <p className="text-gray-400">No address on file</p>
              )}
            </div>
          </div>
        </div>

        {/* O5 — Payment Transactions */}
        {(order.paymentTransactions ?? []).length > 0 && (
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold">Payment Transactions</h2>
            </div>
            <div className="divide-y">
              {order.paymentTransactions!.map((txn) => (
                <div key={txn.id} className="px-6 py-4 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    {txn.flutterwaveTxRef && (
                      <p className="font-mono text-xs text-gray-500 truncate">{txn.flutterwaveTxRef}</p>
                    )}
                    {txn.flutterwaveTransactionId && (
                      <p className="text-xs text-gray-400">TX ID: {txn.flutterwaveTransactionId}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(txn.createdAt).toLocaleDateString('en-NG', {
                        dateStyle: 'medium',
                      })}{' '}
                      {new Date(txn.createdAt).toLocaleTimeString('en-NG', {
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${txStatusBadge[txn.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {txn.status}
                    </span>
                    <span className="font-semibold">{formatCurrency(Number(txn.amount))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
