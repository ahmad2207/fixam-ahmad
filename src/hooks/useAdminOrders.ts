'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface OrderItemPreview {
  image: string | null;
  name: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: string;
  variation: string | null;
  allocations?: {
    batchId: string;
    quantity: number;
    costPriceAtTime: string;
    batchCreatedAt: string | null;
  }[];
}

export interface PaymentTransaction {
  id: string;
  paystackReference: string | null;
  paystackTransactionId: string | null;
  amount: string;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string | null;
  userId: string | null;
  guestEmail: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  saleType: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  shippingFullName: string | null;
  shippingPhone: string | null;
  shippingStreetAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingAbujaZone: string | null;
  notes: string | null;
  createdAt: string;
  // Enriched fields on list
  itemPreviews?: OrderItemPreview[];
  totalItemCount?: number;
  // Enriched fields on detail
  items?: OrderItem[];
  totalCOGS?: number;
  paymentTransactions?: PaymentTransaction[];
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  inTransit: number;
  awaitingPayment: number;
}

export function useAdminOrders(params?: {
  status?: string;
  saleType?: string;
  paymentMethod?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.saleType) searchParams.set('saleType', params.saleType);
  if (params?.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod);
  if (params?.page) searchParams.set('page', String(params.page));

  return useQuery<{ orders: Order[]; total: number }>({
    queryKey: ['admin-orders', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders?${searchParams}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });
}

export function useAdminOrdersSummary() {
  return useQuery<OrderSummary>({
    queryKey: ['admin-orders-summary'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orders?summary=true');
      if (!res.ok) throw new Error('Failed to fetch order summary');
      return res.json();
    },
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery<Order>({
    queryKey: ['admin-order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json();
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });
}

export function useConfirmOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' }),
      });
      if (!res.ok) throw new Error('Failed to confirm payment');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order'] });
      toast.success('Payment confirmed');
    },
    onError: () => toast.error('Failed to confirm payment'),
  });
}

export function useGenerateOrderReceipt() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}/receipt`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to generate receipt');
      return res.json() as Promise<{ id: string; receiptNumber: string }>;
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete order');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted');
    },
    onError: () => toast.error('Failed to delete order'),
  });
}
