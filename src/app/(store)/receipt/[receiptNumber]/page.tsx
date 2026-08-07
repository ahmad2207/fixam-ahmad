import { db } from '@/lib/db';
import { receipts, storeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Props {
  params: Promise<{ receiptNumber: string }>;
}

export default async function PublicReceiptPage({ params }: Props) {
  const { receiptNumber } = await params;

  const [receipt, settingsRow] = await Promise.all([
    db.select().from(receipts).where(eq(receipts.receiptNumber, receiptNumber)).limit(1).then((r) => r[0] ?? null),
    db.select().from(storeSettings).limit(1).then((r) => r[0] ?? null),
  ]);

  const storeName    = settingsRow?.storeName    ?? 'Fixam Africa';
  const storeAddress = settingsRow?.storeAddress ?? 'Abuja, FCT, Nigeria';
  const storePhone   = settingsRow?.storePhone   ?? '';
  const storeEmail   = settingsRow?.storeEmail   ?? '';
  const currencySymbol = settingsRow?.currencySymbol ?? '₦';

  if (!receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 px-4">
        <FileText className="h-16 w-16 mb-4 text-neutral-300" />
        <h1 className="text-xl font-bold mb-2">Receipt Not Found</h1>
        <p className="text-neutral-500 text-center">This receipt link may be invalid or expired.</p>
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
  const typeLabel   = ({ online: 'Online Payment', pos: 'Point of Sale', offline: 'Offline Sale' } as Record<string, string>)[receipt.type ?? ''] ?? receipt.type ?? 'N/A';
  const methodLabel = (receipt.paymentMethod ?? receipt.type ?? 'N/A').replace(/_/g, ' ');

  const fmt = (n: number) => `${currencySymbol}${n.toLocaleString('en-NG')}`;

  return (
    <div className="min-h-screen bg-neutral-100 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-[560px] mx-auto">

        {/* ── Receipt card ── */}
        <div className="bg-white shadow-2xl print:shadow-none overflow-hidden">

          {/* ── Brand header ── */}
          <div className="bg-primary px-8 pt-8 pb-6">
            <div className="flex items-start justify-between gap-6">
              {/* Logo + name */}
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt={storeName} className="h-10 w-auto brightness-0 invert" />
                <p className="text-white/50 text-[11px] font-medium mt-2">{storeName}</p>
              </div>
              {/* Receipt title */}
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
              { label: 'Receipt No.', value: receipt.receiptNumber, mono: true },
              { label: 'Sale Type',   value: typeLabel,             mono: false },
              { label: 'Method',      value: methodLabel,           mono: false },
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
                  <th className="text-right pb-2 text-[10px] font-black text-neutral-500 uppercase tracking-wider w-24">Unit</th>
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
                    <td className="py-3 text-right text-neutral-500 text-[13px]">
                      {fmt(Number(item.price))}
                    </td>
                    <td className="py-3 text-right font-semibold text-neutral-900">
                      {fmt(item.quantity * Number(item.price))}
                    </td>
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
                    <span>Subtotal</span><span>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-neutral-500">
                    <span>Delivery</span><span>{fmt(deliveryFee)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center bg-neutral-900 text-white px-4 py-3 rounded-xl mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
                <span className="font-black text-xl">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ── Payment status banner ── */}
          {isPaid && (
            <div className="mx-6 mb-5 flex items-center gap-3.5 bg-brand-green-50 border border-brand-green-100 rounded-xl px-5 py-3.5">
              <CheckCircle2 className="h-6 w-6 text-brand-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-green-800 leading-none">Payment Received</p>
                <p className="text-xs text-brand-green-600 mt-0.5">This receipt confirms full payment</p>
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

        <p className="text-center text-[11px] text-neutral-400 mt-5 print:hidden">
          {storeName} · {storeAddress}
        </p>
      </div>
    </div>
  );
}
