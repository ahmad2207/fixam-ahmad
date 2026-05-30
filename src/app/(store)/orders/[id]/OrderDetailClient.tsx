'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle, AlertCircle, Loader2, CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
};

function StatusIcon({ status }: { status: string }) {
  const props = { className: 'h-3 w-3' };
  switch (status) {
    case 'pending': return <Clock {...props} />;
    case 'processing': return <Package {...props} />;
    case 'shipped': return <Truck {...props} />;
    case 'delivered': return <CheckCircle {...props} />;
    case 'cancelled': return <XCircle {...props} />;
    default: return <Clock {...props} />;
  }
}

export interface OrderDetailData {
  id: string;
  orderNumber: string | null;
  status: string;
  paymentStatus: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: string;
  shippingFullName: string | null;
  shippingStreetAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPhone: string | null;
}

export interface OrderItemData {
  id: string;
  productName: string;
  productImage: string | null;
  variation: string | null;
  quantity: number;
  price: string;
}

interface Props {
  order: OrderDetailData;
  items: OrderItemData[];
}

export default function OrderDetailClient({ order, items }: Props) {
  const searchParams = useSearchParams();
  const isPaymentCallback = searchParams.get('payment') === 'callback';
  const status = searchParams.get('status');

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <div className="max-w-3xl mx-auto">
          {/* Payment callback Alert */}
          {isPaymentCallback && (
            <div className="mb-6">
              {status === 'successful' ? (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-700">Payment Successful!</AlertTitle>
                  <AlertDescription className="text-emerald-600">
                    Your payment has been processed. Your order is now being prepared.
                  </AlertDescription>
                </Alert>
              ) : status === 'cancelled' ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Cancelled</AlertTitle>
                  <AlertDescription>
                    Your payment was cancelled. The order has been saved — you can pay later.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle>Processing Payment</AlertTitle>
                  <AlertDescription>
                    We&apos;re confirming your payment. This may take a moment...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Status banner */}
          <div className={`rounded-2xl p-8 text-center mb-8 ${isPaid ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {isPaid
                ? <CheckCircle className="h-8 w-8 text-emerald-600" />
                : <Clock className="h-8 w-8 text-amber-600" />
              }
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isPaid ? 'Order Confirmed!' : 'Order Placed'}
            </h1>
            <p className="text-muted-foreground">
              {isPaid
                ? 'Thank you for your order. Your order is now being prepared.'
                : 'Awaiting payment confirmation. Complete your payment to proceed.'}
            </p>
          </div>

          {/* Order card */}
          <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-bold">{order.orderNumber ?? `#${order.id.slice(0, 12).toUpperCase()}`}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={`gap-1 ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                  <CreditCard className="h-3 w-3" />
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Confirmation'}
                </Badge>
                <Badge className={`gap-1 ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                  <StatusIcon status={order.status} />
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variation && (
                      <p className="text-sm text-muted-foreground">{item.variation}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingFullName && (
            <div className="bg-card rounded-2xl p-6 shadow-card mb-6">
              <h3 className="font-semibold mb-4">Shipping Address</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {order.shippingFullName}<br />
                {order.shippingStreetAddress}<br />
                {order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ''}<br />
                {order.shippingPhone}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
