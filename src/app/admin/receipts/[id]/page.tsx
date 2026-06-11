'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReceipt } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Share2, Copy, MessageCircle, Mail, Printer, FileText, MapPin, Phone, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import ThermalReceiptPreview from '@/components/admin/ThermalReceiptPreview';

export default function AdminReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: receipt, isLoading } = useReceipt(id);
  const [showThermal, setShowThermal] = useState(false);

  const getPublicUrl = () => `${window.location.origin}/receipt/${receipt?.receiptNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    toast.success('Receipt link copied!');
  };

  const handleShareWhatsApp = () => {
    if (!receipt) return;
    const text = `Receipt ${receipt.receiptNumber}\nTotal: ${formatCurrency(Number(receipt.total))}\nView: ${getPublicUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!receipt) return;
    const subject = `Receipt ${receipt.receiptNumber} — Fixam Africa`;
    const body = `Here is your receipt from Fixam Africa.\n\nReceipt: ${receipt.receiptNumber}\nTotal: ${formatCurrency(Number(receipt.total))}\n\nView online: ${getPublicUrl()}`;
    window.open(`mailto:${receipt.customerEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!receipt) return;
    const originalTitle = document.title;
    document.title = `Receipt-${receipt.receiptNumber}`;
    window.print();
    document.title = originalTitle;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground mb-4">Receipt not found</p>
        <Link href="/admin/receipts" className="text-primary hover:underline">Back to Receipts</Link>
      </div>
    );
  }

  let items: Array<{ product_name: string; variation?: string; quantity: number; price: string | number }> = [];
  try { items = JSON.parse(receipt.items); } catch { items = []; }

  const typeLabel = { online: 'Online', pos: 'Point of Sale', offline: 'Offline' }[receipt.type] ?? receipt.type;

  const PAYMENT_STATUS: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    failed: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <button
          onClick={() => router.push('/admin/receipts')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handlePrint} className="flex items-center gap-1.5 text-sm border border-border rounded-xl px-3 py-2 hover:bg-secondary transition bg-card">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-sm border border-border rounded-xl px-3 py-2 hover:bg-secondary transition bg-card">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => setShowThermal(true)} className="flex items-center gap-1.5 text-sm border border-border rounded-xl px-3 py-2 hover:bg-secondary transition bg-card">
            <Printer className="h-4 w-4" /> Thermal
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground rounded-xl px-3 py-2 hover:bg-primary/90 transition">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <div className="absolute right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg z-10 min-w-[160px] hidden group-hover:block overflow-hidden">
              <button onClick={handleCopyLink} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-secondary transition text-foreground">
                <Copy className="h-4 w-4 text-muted-foreground" /> Copy Link
              </button>
              <button onClick={handleShareWhatsApp} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-secondary transition text-foreground">
                <MessageCircle className="h-4 w-4 text-muted-foreground" /> WhatsApp
              </button>
              <button onClick={handleShareEmail} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm hover:bg-secondary transition text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Card */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0">

        {/* Brand Header */}
        <div className="bg-primary px-8 pt-7 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-sm leading-none">F</span>
                </div>
                <span className="text-white font-black text-2xl tracking-[0.15em]">FIXAM</span>
              </div>
              <p className="text-primary-foreground/70 text-xs font-medium">Fixam Africa Ltd.</p>
            </div>
            <div className="text-right text-xs text-primary-foreground/70 space-y-0.5 mt-0.5">
              <div className="flex items-center justify-end gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>Abuja, Nigeria</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Globe className="h-3 w-3" />
                <span>fixam.africa</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/60 text-[10px] font-semibold uppercase tracking-wider">Receipt</p>
              <p className="text-white font-mono font-bold text-base mt-0.5">{receipt.receiptNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/60 text-[10px] font-semibold uppercase tracking-wider">Date</p>
              <p className="text-white text-sm font-semibold mt-0.5">{format(new Date(receipt.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex items-center justify-between px-8 py-2.5 bg-gray-50 border-b border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">{typeLabel}</span>
          <span className={`px-2.5 py-0.5 rounded-full font-semibold capitalize ${PAYMENT_STATUS[receipt.paymentStatus] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
            {receipt.paymentStatus}
          </span>
        </div>

        {/* Billed To */}
        <div className="px-8 py-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Billed To</p>
          <div className="grid grid-cols-[110px_1fr] gap-y-2.5 gap-x-4 text-sm">
            <span className="font-semibold text-gray-700">Name</span>
            <span className="text-gray-500">{receipt.customerName || 'Walk-in Customer'}</span>
            {(receipt.customerEmail || receipt.customerPhone) && (
              <>
                <span className="font-semibold text-gray-700">Contact</span>
                <span className="text-gray-500">
                  {receipt.customerEmail && <span className="block">{receipt.customerEmail}</span>}
                  {receipt.customerPhone && (
                    <span className="flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />{receipt.customerPhone}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="px-8 pb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-4 py-2.5 text-xs font-semibold rounded-tl-lg">Description</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold">Qty</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold">Unit Price</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {item.product_name}
                    {item.variation && <span className="text-xs text-gray-400 ml-1.5 font-normal">({item.variation})</span>}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-500">{item.quantity}</td>
                  <td className="px-3 py-3 text-right text-gray-500">{formatCurrency(Number(item.price))}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.quantity * Number(item.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
            {Number(receipt.deliveryFee) > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500 px-4">
                  <span>Subtotal</span><span>{formatCurrency(Number(receipt.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 px-4">
                  <span>Delivery</span><span>{formatCurrency(Number(receipt.deliveryFee))}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-3 rounded-xl mt-2">
              <span className="font-bold text-sm uppercase tracking-wide">Total</span>
              <span className="font-black text-lg">{formatCurrency(Number(receipt.total))}</span>
            </div>
          </div>
        </div>

        {receipt.notes && (
          <div className="mx-8 mb-6 p-3.5 bg-amber-50 border-l-[3px] border-amber-400 rounded-r-xl">
            <p className="text-xs text-amber-800"><strong>Notes:</strong> {receipt.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fixam Africa</p>
            <p className="text-[10px] text-gray-400 mt-0.5">fixam.africa</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Thank you for your business</p>
            <div className="flex items-center gap-1 mt-1 justify-end">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="h-1.5 w-4 rounded-full bg-primary/40" />
              <div className="h-1.5 w-2 rounded-full bg-primary/20" />
            </div>
          </div>
        </div>
      </div>

      {showThermal && (
        <ThermalReceiptPreview
          receipt={receipt}
          onClose={() => setShowThermal(false)}
        />
      )}
    </div>
  );
}
