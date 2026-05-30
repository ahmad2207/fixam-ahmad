'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReceipt } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Share2, Copy, MessageCircle, Mail, Printer, FileText } from 'lucide-react';
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
    const subject = `Receipt ${receipt.receiptNumber} - Fixam`;
    const body = `Here is your receipt from Fixam.\n\nReceipt: ${receipt.receiptNumber}\nTotal: ${formatCurrency(Number(receipt.total))}\n\nView online: ${getPublicUrl()}`;
    window.open(`mailto:${receipt.customerEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePrint = () => {
    window.print();
  };

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
        <p className="text-gray-500 mb-4">Receipt not found</p>
        <Link href="/admin/receipts" className="text-primary hover:underline">Back to Receipts</Link>
      </div>
    );
  }

  let items: Array<{ product_name: string; variation?: string; quantity: number; price: string | number }> = [];
  try { items = JSON.parse(receipt.items); } catch { items = []; }

  const typeLabel = { online: 'Online', pos: 'Point of Sale', offline: 'Offline' }[receipt.type] ?? receipt.type;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => router.push('/admin/receipts')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handlePrint} className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => setShowThermal(true)} className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            <Printer className="h-4 w-4" /> Thermal
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[160px] hidden group-hover:block">
              <button onClick={handleCopyLink} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition">
                <Copy className="h-4 w-4" /> Copy Link
              </button>
              <button onClick={handleShareWhatsApp} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
              <button onClick={handleShareEmail} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition">
                <Mail className="h-4 w-4" /> Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Card */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start p-6 sm:p-8">
          <div>
            <div className="text-2xl font-extrabold text-primary tracking-widest">FIXAM</div>
            <p className="text-xs text-gray-500 mt-1">Lagos, Nigeria</p>
          </div>
          <div className="text-right text-xs text-gray-500 leading-relaxed">
            <p className="font-semibold text-gray-900 text-sm">Fixam Africa</p>
          </div>
        </div>

        <div className="bg-primary text-white text-center py-3.5">
          <h2 className="text-lg font-bold tracking-wide">Payment Receipt</h2>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <h3 className="text-sm font-bold border-b-2 border-gray-900 inline-block pb-1">Invoice to:</h3>
          <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-sm">
            <span className="font-bold">Name</span>
            <span className="text-gray-500">{receipt.customerName || 'Walk-in Customer'}</span>
            {(receipt.customerEmail || receipt.customerPhone) && (
              <>
                <span className="font-bold">Contact</span>
                <span className="text-gray-500">
                  {receipt.customerEmail && <span className="block">{receipt.customerEmail}</span>}
                  {receipt.customerPhone && <span className="block">{receipt.customerPhone}</span>}
                </span>
              </>
            )}
            <span className="font-bold">Date</span>
            <span className="text-gray-500">{format(new Date(receipt.createdAt), 'EEEE, MMMM d, yyyy')}</span>
            <span className="font-bold">Sale Type</span>
            <span className="text-gray-500">{typeLabel}</span>
            <span className="font-bold">Receipt #</span>
            <span className="text-gray-500 font-mono">{receipt.receiptNumber}</span>
          </div>
        </div>

        <hr />

        {/* Products Table */}
        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-bold mb-4">Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="bg-primary text-white text-left px-4 py-2.5 text-xs font-semibold uppercase">Item</th>
                  <th className="bg-primary text-white text-center px-4 py-2.5 text-xs font-semibold uppercase">Qty</th>
                  <th className="bg-primary text-white text-center px-4 py-2.5 text-xs font-semibold uppercase">Unit Price</th>
                  <th className="bg-primary text-white text-right px-4 py-2.5 text-xs font-semibold uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-sm font-semibold">
                      {item.product_name}
                      {item.variation && <span className="text-xs text-gray-400 ml-1">({item.variation})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">{formatCurrency(Number(item.price))}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(item.quantity * Number(item.price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-1">
            {Number(receipt.deliveryFee) > 0 && (
              <>
                <div className="flex justify-end gap-8 text-sm text-gray-500 pr-4">
                  <span>Subtotal</span><span>{formatCurrency(Number(receipt.subtotal))}</span>
                </div>
                <div className="flex justify-end gap-8 text-sm text-gray-500 pr-4">
                  <span>Delivery</span><span>{formatCurrency(Number(receipt.deliveryFee))}</span>
                </div>
              </>
            )}
            <div className="flex justify-end mt-3">
              <div className="bg-primary text-white px-6 py-2.5 rounded font-bold text-base flex items-center gap-4">
                <span>Total</span>
                <span>{formatCurrency(Number(receipt.total))}</span>
              </div>
            </div>
          </div>
        </div>

        {receipt.notes && (
          <div className="mx-6 sm:mx-8 mb-6 p-4 bg-gray-50 border-l-[3px] border-primary rounded-r-lg">
            <p className="text-xs text-gray-500"><strong className="text-gray-900">Notes:</strong> {receipt.notes}</p>
          </div>
        )}

        <div className="text-center px-8 py-5 border-t bg-gray-50">
          <p className="text-[11px] text-gray-400">Fixam Africa</p>
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
