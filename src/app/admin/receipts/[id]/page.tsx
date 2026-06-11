'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReceipt } from '@/hooks/useReceipts';
import { useStoreSetting } from '@/hooks/useStoreSettings';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Share2, Copy, MessageCircle, Mail, Printer, FileText, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import ThermalReceiptPreview from '@/components/admin/ThermalReceiptPreview';

interface GeneralSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
}

export default function AdminReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: receipt, isLoading } = useReceipt(id);
  const { data: settings } = useStoreSetting<GeneralSettings>('general');
  const [showThermal, setShowThermal] = useState(false);

  const storeName    = settings?.store_name    || 'Fixam Africa';
  const storeAddress = settings?.store_address || 'Abuja, FCT, Nigeria';
  const storePhone   = settings?.store_phone   || '';
  const storeEmail   = settings?.store_email   || '';

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
    const subject = `Receipt ${receipt.receiptNumber} — ${storeName}`;
    const body = `Here is your receipt from ${storeName}.\n\nReceipt: ${receipt.receiptNumber}\nTotal: ${formatCurrency(Number(receipt.total))}\n\nView online: ${getPublicUrl()}`;
    window.open(`mailto:${receipt.customerEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
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

  const subtotal    = Number(receipt.subtotal ?? receipt.total);
  const deliveryFee = Number(receipt.deliveryFee ?? 0);
  const total       = Number(receipt.total);
  const isPaid      = receipt.paymentStatus === 'paid';
  const isPending   = receipt.paymentStatus === 'pending';
  const typeLabel   = ({ online: 'Online Payment', pos: 'Point of Sale', offline: 'Offline Sale' } as Record<string, string>)[receipt.type] ?? receipt.type ?? 'N/A';
  const methodLabel = (receipt.paymentMethod ?? receipt.type ?? 'N/A').replace(/_/g, ' ');

  return (
    <div className="max-w-[560px] mx-auto space-y-4">

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <button
          onClick={() => router.push('/admin/receipts')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm border border-border rounded-xl px-3 py-2 hover:bg-secondary transition bg-card">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={() => {
              const t = document.title;
              document.title = `Receipt-${receipt.receiptNumber}`;
              window.print();
              document.title = t;
            }}
            className="flex items-center gap-1.5 text-sm border border-border rounded-xl px-3 py-2 hover:bg-secondary transition bg-card"
          >
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

      {/* ── Receipt card ── */}
      <div className="bg-white shadow-2xl print:shadow-none overflow-hidden">

        {/* ── Brand header ── */}
        <div className="bg-primary px-8 pt-8 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={storeName} className="h-10 w-auto brightness-0 invert" />
              <p className="text-white/50 text-[11px] font-medium mt-2">{storeName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.18em]">Payment Receipt</p>
              <p className="text-white font-mono font-bold text-lg mt-1 leading-none">{receipt.receiptNumber}</p>
              <p className="text-white/60 text-xs mt-1.5">
                {new Date(receipt.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Perforated tear line ── */}
        <div className="relative h-6 bg-primary">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-neutral-100 rounded-none" />
          <div className="absolute inset-x-0 bottom-0 h-6 flex items-center">
            <div className="w-[26px] h-[26px] rounded-full bg-neutral-100 -ml-[13px] flex-shrink-0 z-10" />
            <div className="flex-1 h-0 border-t-2 border-dashed border-neutral-300" />
            <div className="w-[26px] h-[26px] rounded-full bg-neutral-100 -mr-[13px] flex-shrink-0 z-10" />
          </div>
        </div>

        {/* ── FROM / BILLED TO ── */}
        <div className="grid grid-cols-2 divide-x divide-neutral-100 bg-neutral-50 border-b border-neutral-100">
          <div className="px-6 py-5">
            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2.5">From</p>
            <p className="font-bold text-neutral-900 text-[13px]">{storeName}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{storeAddress}</p>
            {storePhone && <p className="text-[11px] text-neutral-500">{storePhone}</p>}
            {storeEmail && <p className="text-[11px] text-neutral-500">{storeEmail}</p>}
            <p className="text-[11px] text-primary font-medium mt-0.5">fixam.africa</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2.5">Billed To</p>
            <p className="font-bold text-neutral-900 text-[13px]">{receipt.customerName || 'Walk-in Customer'}</p>
            {receipt.customerEmail && <p className="text-[11px] text-neutral-500 mt-0.5">{receipt.customerEmail}</p>}
            {receipt.customerPhone && <p className="text-[11px] text-neutral-500">{receipt.customerPhone}</p>}
          </div>
        </div>

        {/* ── Meta strip ── */}
        <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100 bg-white">
          {[
            { label: 'Receipt No.', value: receipt.receiptNumber },
            { label: 'Sale Type',   value: typeLabel },
            { label: 'Method',      value: methodLabel },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.15em]">{label}</p>
              <p className="text-[11px] font-semibold text-neutral-800 mt-1 truncate capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Items ── */}
        <div className="px-6 pt-5 pb-3 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-900">
                <th className="text-left pb-2 text-[10px] font-black text-neutral-500 uppercase tracking-wider">Description</th>
                <th className="text-center pb-2 text-[10px] font-black text-neutral-500 uppercase tracking-wider w-12">Qty</th>
                <th className="text-right pb-2 text-[10px] font-black text-neutral-500 uppercase tracking-wider w-28">Unit Price</th>
                <th className="text-right pb-2 text-[10px] font-black text-neutral-500 uppercase tracking-wider w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  <td className="py-3 pr-2 font-medium text-neutral-900">
                    {item.product_name}
                    {item.variation && (
                      <span className="text-[11px] text-neutral-400 ml-1.5">({item.variation})</span>
                    )}
                  </td>
                  <td className="py-3 text-center text-neutral-500 text-[13px]">{item.quantity}</td>
                  <td className="py-3 text-right text-neutral-500 text-[13px]">{formatCurrency(Number(item.price))}</td>
                  <td className="py-3 text-right font-semibold text-neutral-900">{formatCurrency(item.quantity * Number(item.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="px-6 pb-5 bg-white">
          <div className="ml-auto max-w-[260px] space-y-1.5 pt-3 border-t border-neutral-100">
            {deliveryFee > 0 && (
              <>
                <div className="flex justify-between text-[13px] text-neutral-500">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] text-neutral-500">
                  <span>Delivery</span><span>{formatCurrency(deliveryFee)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center bg-neutral-900 text-white px-4 py-3 rounded-xl mt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
              <span className="font-black text-xl">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment status banner ── */}
        {isPaid && (
          <div className="mx-6 mb-5 flex items-center gap-3.5 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800 leading-none">Payment Received</p>
              <p className="text-xs text-emerald-600 mt-0.5">This receipt confirms full payment</p>
            </div>
          </div>
        )}
        {isPending && (
          <div className="mx-6 mb-5 flex items-center gap-3.5 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5">
            <Clock className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 leading-none">Payment Pending</p>
              <p className="text-xs text-amber-600 mt-0.5">Awaiting payment confirmation</p>
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {receipt.notes && (
          <div className="mx-6 mb-5 p-3.5 bg-neutral-50 border-l-[3px] border-primary rounded-r-xl">
            <p className="text-[12px] text-neutral-600"><strong className="text-neutral-800">Note:</strong> {receipt.notes}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-neutral-100 bg-neutral-50 px-8 py-5 flex items-center justify-between">
          <p className="text-[11px] text-neutral-400 font-medium">Thank you for shopping with us!</p>
          <p className="text-[11px] text-primary font-semibold">fixam.africa</p>
        </div>
      </div>

      {showThermal && (
        <ThermalReceiptPreview
          receipt={receipt}
          storeAddress={storeAddress}
          storePhone={storePhone}
          onClose={() => setShowThermal(false)}
        />
      )}
    </div>
  );
}
