'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFlutterwavePayment } from '@/hooks/useFlutterwavePayment';
import { CircleCheckBig, XCircle, Loader2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

function PaymentCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyPayment } = useFlutterwavePayment();
  const [state, setState] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [cancelled, setCancelled] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    const transactionId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');

    if (paymentStatus === 'cancelled') {
      setCancelled(true);
      setState('failed');
      toast.error('Payment cancelled. No charges were made.');
      return;
    }

    const isSuccessful = paymentStatus === 'successful' || paymentStatus === 'completed';
    if (!isSuccessful || !transactionId || !txRef) { setState('failed'); return; }

    verifyPayment(transactionId, txRef).then((result) => {
      if (result?.success) {
        setOrderId(result.orderId ?? null);
        setState('success');
        toast.success('Payment confirmed! Your order is being prepared.');
        setTimeout(() => router.replace(`/orders/${result.orderId}?payment=callback&status=successful`), 2500);
      } else {
        setState('failed');
        toast.error('Payment could not be verified. If you were charged, please contact support.');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── VERIFYING ── */
  if (state === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Verifying Payment…</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Please wait while we confirm your payment and create your order. This only takes a moment.
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary/30 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── SUCCESS ── */
  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
          {/* Success animation */}
          <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-5">
            <CircleCheckBig className="h-10 w-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your order has been placed and is being prepared. Redirecting you to your order…
          </p>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>

          <div className="flex flex-col gap-2">
            {orderId && (
              <Link
                href={`/orders/${orderId}?payment=callback&status=successful`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
              >
                <Package className="h-4 w-4" />
                View My Order
              </Link>
            )}
            <Link
              href="/products"
              className="w-full inline-flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Continue Shopping <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Image src="/logo.png" alt="Fixam Africa" width={80} height={32} className="h-7 w-auto mx-auto mt-8 opacity-30" />
        </div>
      </div>
    );
  }

  /* ── FAILED / CANCELLED ── */
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
          <XCircle className="h-10 w-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {cancelled ? 'Payment Cancelled' : 'Payment Failed'}
        </h1>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
          {cancelled
            ? 'Your payment was cancelled. No order was created and no charges were made.'
            : 'We could not verify your payment. If you were charged, please contact our support team.'}
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/cart"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Return to Cart
          </Link>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Go to Homepage
          </Link>
          {!cancelled && (
            <p className="text-xs text-gray-400 mt-1">
              Charged by mistake?{' '}
              <a href="mailto:support@fixam.africa" className="text-primary font-semibold hover:underline">
                Contact support
              </a>
            </p>
          )}
        </div>

        <Image src="/logo.png" alt="Fixam Africa" width={80} height={32} className="h-7 w-auto mx-auto mt-8 opacity-30" />
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    }>
      <PaymentCallbackInner />
    </Suspense>
  );
}
