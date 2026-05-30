'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFlutterwavePayment } from '@/hooks/useFlutterwavePayment';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function PaymentCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyPayment } = useFlutterwavePayment();
  const [state, setState] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get('status');
    const transactionId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');

    // Handle explicit cancellation
    if (paymentStatus === 'cancelled') {
      setCancelled(true);
      setState('failed');
      toast.error('Payment cancelled. No charges were made.');
      return;
    }

    const isSuccessful = paymentStatus === 'successful' || paymentStatus === 'completed';

    if (!isSuccessful || !transactionId || !txRef) {
      setState('failed');
      return;
    }

    verifyPayment(transactionId, txRef).then((result) => {
      if (result?.success) {
        setState('success');
        toast.success('Payment successful! Your order has been created.');
        setTimeout(() => {
          router.replace(`/orders/${result.orderId}`);
        }, 1500);
      } else {
        setState('failed');
        toast.error('Payment could not be verified. If you were charged, please contact support.');
      }
    });
  }, []);

  if (state === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
          <p className="text-muted-foreground">
            Please wait while we confirm your payment and create your order...
          </p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-emerald-700">Payment Confirmed!</h1>
          <p className="text-muted-foreground">
            Your order has been created. Redirecting to your order details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Not Completed</h1>
        <p className="text-muted-foreground mb-6">
          {cancelled
            ? 'Your payment was cancelled. No order was created and no charges were made.'
            : 'We could not verify your payment. If you were charged, please contact support.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/cart">Back to Cart</Link>
          </Button>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <PaymentCallbackInner />
    </Suspense>
  );
}
