'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Receipt {
  id: string;
  receiptNumber: string;
  orderId: string | null;
  type: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  subtotal: string;
  deliveryFee: string;
  total: string;
  items: string;
  pdfUrl: string | null;
  thermalImageUrl: string | null;
  driveFileId: string | null;
  driveFileUrl: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  notes: string | null;
  createdBy: string | null;
  salesRep: string | null;
  createdAt: string;
}

export function useReceipts() {
  return useQuery<Receipt[]>({
    queryKey: ['receipts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/receipts');
      if (!res.ok) throw new Error('Failed to fetch receipts');
      return res.json();
    },
  });
}

export function useReceipt(id: string) {
  return useQuery<Receipt>({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/receipts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch receipt');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateManualReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      items: Array<{ name: string; qty: number; price: number; variation?: string }>;
      subtotal: number;
      deliveryFee: number;
      total: number;
      notes?: string;
    }) => {
      const res = await fetch('/api/admin/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create receipt');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receipts'] }),
  });
}
