'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CircleCheckBig, Clock, Package, Truck,
  XCircle, Loader2, CreditCard, Banknote, MapPin,
  ChevronRight, MessageSquare,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

/* ─── Types ─── */
export interface OrderDetailData {
  id: string;
  orderNumber: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: string;
  shippingFullName: string | null;
  shippingStreetAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPhone: string | null;
  notes: string | null;
}

export interface OrderItemData {
  id: string;
  productName: string;
  productImage: string | null;
  variation: string | null;
  quantity: number;
  price: string;
}

/* ─── Status config ─── */
const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending:    'Order Placed',
  confirmed:  'Confirmed',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
  refunded:   'Refunded',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending:    'bg-amber-50 text-amber-700 border-amber-200',
    confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-orange-50 text-orange-700 border-orange-200',
    shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered:  'bg-green-50 text-green-700 border-green-200',
    cancelled:  'bg-red-50 text-red-600 border-red-200',
    refunded:   'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${colors[status] ?? colors.pending}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ─── Progress tracker ─── */
function OrderProgress({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'refunded') return null;
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="relative flex items-start justify-between">
      {/* Connecting line */}
      <div className="absolute top-3.5 left-[calc(10%)] right-[calc(10%)] h-0.5 bg-gray-200 z-0" />
      <div
        className="absolute top-3.5 left-[calc(10%)] h-0.5 bg-primary z-0 transition-all duration-700"
        style={{ width: `${Math.max(0, (currentIdx / (STATUS_STEPS.length - 1)) * 80)}%` }}
      />

      {STATUS_STEPS.map((step, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} className="flex flex-col items-center gap-1.5 z-10 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
              done
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-200'
            } ${active ? 'ring-4 ring-primary/20' : ''}`}>
              {done
                ? <CircleCheckBig className="h-4 w-4 text-white" />
                : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              }
            </div>
            <p className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-primary' : 'text-gray-400'}`}>
              {STATUS_LABELS[step]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ─── */
export default function OrderDetailClient({ order, items }: { order: OrderDetailData; items: OrderItemData[] }) {
  const searchParams = useSearchParams();
  const isCallback   = searchParams.get('payment') === 'callback';
  const cbStatus     = searchParams.get('status');

  const isPaid = order.paymentStatus === 'paid';
  const isPod  = order.paymentMethod === 'pod';
  const isCancelled = order.status === 'cancelled';

  const orderRef = order.orderNumber ?? `#${order.id.slice(0, 10).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100 pb-8">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/orders" className="hover:text-primary">My Orders</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold truncate max-w-[120px]">{orderRef}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-4 max-w-2xl">

        {/* ── PAYMENT CALLBACK BANNER ── */}
        {isCallback && (
          <div className={`rounded-2xl p-4 mb-4 flex items-start gap-3 ${
            cbStatus === 'successful' ? 'bg-green-50 border border-green-200'
            : cbStatus === 'cancelled' ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
          }`}>
            {cbStatus === 'successful'
              ? <CircleCheckBig className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              : cbStatus === 'cancelled'
              ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              : <Loader2 className="h-5 w-5 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`font-bold text-sm ${cbStatus === 'successful' ? 'text-green-700' : cbStatus === 'cancelled' ? 'text-red-600' : 'text-amber-700'}`}>
                {cbStatus === 'successful' ? 'Payment Successful!'
                : cbStatus === 'cancelled' ? 'Payment Cancelled'
                : 'Confirming Payment…'}
              </p>
              <p className={`text-xs mt-0.5 ${cbStatus === 'successful' ? 'text-green-600' : cbStatus === 'cancelled' ? 'text-red-500' : 'text-amber-600'}`}>
                {cbStatus === 'successful' ? 'Your payment has been processed. Your order is now being prepared.'
                : cbStatus === 'cancelled' ? 'Your payment was cancelled. You can pay again from your orders.'
                : 'We\'re confirming your payment. This may take a moment…'}
              </p>
            </div>
          </div>
        )}

        {/* ── ORDER STATUS HERO ── */}
        <div className={`rounded-2xl p-6 text-center mb-3 ${
          isCancelled ? 'bg-red-50 border border-red-200'
          : isPaid || isPod ? 'bg-green-50 border border-green-200'
          : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
            isCancelled ? 'bg-red-100'
            : isPaid || isPod ? 'bg-green-100'
            : 'bg-amber-100'
          }`}>
            {isCancelled
              ? <XCircle className="h-7 w-7 text-red-500" />
              : isPaid
              ? <CircleCheckBig className="h-7 w-7 text-green-600" />
              : isPod
              ? <Banknote className="h-7 w-7 text-green-600" />
              : <Clock className="h-7 w-7 text-amber-600" />
            }
          </div>
          <h1 className={`text-xl font-extrabold mb-1 ${
            isCancelled ? 'text-red-700' : isPaid || isPod ? 'text-green-700' : 'text-amber-700'
          }`}>
            {isCancelled ? 'Order Cancelled'
            : isPaid ? 'Order Confirmed!'
            : isPod ? 'Order Placed!'
            : 'Awaiting Payment'}
          </h1>
          <p className={`text-sm ${
            isCancelled ? 'text-red-600' : isPaid || isPod ? 'text-green-600' : 'text-amber-600'
          }`}>
            {isCancelled
              ? 'This order has been cancelled.'
              : isPaid
              ? 'Thank you for your order. It is now being prepared.'
              : isPod
              ? 'Your order is confirmed. Please have cash ready upon delivery.'
              : 'Complete your payment to confirm this order.'}
          </p>
        </div>

        {/* ── ORDER INFO ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Order Number</p>
              <p className="text-lg font-extrabold text-gray-900 mt-0.5">{orderRef}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={order.status} />
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                isPaid ? 'bg-green-50 text-green-700 border-green-200'
                : isPod ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {isPod ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                {isPaid ? 'Paid' : isPod ? 'Pay on Delivery' : 'Unpaid'}
              </span>
            </div>
          </div>

          {/* Progress tracker */}
          {!isCancelled && (
            <div className="pt-2 pb-1">
              <OrderProgress status={order.status} />
            </div>
          )}
        </div>

        {/* ── ORDER ITEMS ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-3">
          <h2 className="font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            Items ({items.length})
          </h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                  {item.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2 leading-snug">{item.productName}</p>
                  {item.variation && (
                    <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.variation}</span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-sm text-primary">{formatCurrency(Number(item.price) * item.quantity)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(Number(item.price))} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-800">{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="font-semibold text-gray-800">{formatCurrency(Number(order.deliveryFee))}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-extrabold text-gray-900">Total</span>
              <span className="font-extrabold text-xl text-primary">{formatCurrency(Number(order.total))}</span>
            </div>
            {isPod && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-2">
                <Banknote className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Please have <strong>{formatCurrency(Number(order.total))}</strong> cash ready for the delivery rider.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── SHIPPING ADDRESS ── */}
        {order.shippingFullName && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <h2 className="font-extrabold text-gray-900">Delivery Address</h2>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed space-y-0.5">
              <p className="font-semibold text-gray-800">{order.shippingFullName}</p>
              {order.shippingStreetAddress && <p>{order.shippingStreetAddress}</p>}
              {(order.shippingCity || order.shippingState) && (
                <p>{[order.shippingCity, order.shippingState].filter(Boolean).join(', ')}</p>
              )}
              {order.shippingPhone && <p className="text-primary font-medium">{order.shippingPhone}</p>}
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 italic">"{order.notes}"</p>
              </div>
            )}
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/orders"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Orders
          </Link>
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors"
          >
            Continue Shopping
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
