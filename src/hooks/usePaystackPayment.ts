'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface CheckoutPayload {
  items: Array<{
    product_id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
    variation: string | null;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    streetAddress: string;
    city: string;
    state: string;
    abujaZone?: string;
  };
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
}

export function usePaystackPayment() {
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (payload: CheckoutPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Payment initiation failed');

      // Redirect to Paystack hosted page
      window.location.href = data.link;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');
      clearCart();
      return data as { success: boolean; orderId: string; receiptNumber: string };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { initiatePayment, verifyPayment, isLoading, error };
}
