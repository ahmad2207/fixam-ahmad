import { db } from '@/lib/db';
import { receipts, storeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { FileText, MapPin, Globe } from 'lucide-react';

interface Props {
  params: Promise<{ receiptNumber: string }>;
}

export default async function PublicReceiptPage({ params }: Props) {
  const { receiptNumber } = await params;

  const [receipt, settingsRow] = await Promise.all([
    db.select().from(receipts).where(eq(receipts.receiptNumber, receiptNumber)).limit(1).then((r) => r[0] ?? null),
    db.select().from(storeSettings).limit(1).then((r) => r[0] ?? null),
  ]);

  const storeName = settingsRow?.storeName ?? 'Fixam';
  const storeAddress = settingsRow?.storeAddress ?? 'Abuja, Nigeria';
  const storePhone = settingsRow?.storePhone ?? '';
  const storeEmail = settingsRow?.storeEmail ?? '';
  const currencySymbol = settingsRow?.currencySymbol ?? '₦';

  if (!receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <FileText className="h-16 w-16 mb-4 text-muted-foreground/30" />
        <h1 className="text-xl font-bold mb-2">Receipt Not Found</h1>
        <p className="text-muted-foreground text-center">This receipt link may be invalid or expired.</p>
      </div>
    );
  }

  let items: Array<{ product_name: string; variation?: string; quantity: number; price: string | number }> = [];
  try {
    items = JSON.parse(receipt.items);
  } catch {
    items = [];
  }

  const PAYMENT_STATUS: Record<string, string> = {
    paid:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    failed:  'bg-red-50 text-red-700 border border-red-200',
  };

  const typeLabel = { online: 'Online', pos: 'Point of Sale', offline: 'Offline' }[receipt.type ?? ''] ?? receipt.type;

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white border border-gray-200 shadow-sm overflow-hidden">

        {/* Brand Header */}
        <div className="bg-primary px-8 pt-7 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-sm leading-none">
                    {storeName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white font-black text-2xl tracking-[0.15em]">
                  {storeName.toUpperCase()}
                </span>
              </div>
              <p className="text-white/60 text-xs font-medium">{storeName} Ltd.</p>
            </div>
            <div className="text-right text-xs text-white/60 space-y-0.5 mt-0.5">
              <div className="flex items-center justify-end gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>{storeAddress}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Globe className="h-3 w-3" />
                <span>fixam.africa</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Receipt</p>
              <p className="text-white font-mono font-bold text-base mt-0.5">{receipt.receiptNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Date</p>
              <p className="text-white text-sm font-semibold mt-0.5">
                {new Date(receipt.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
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
          <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 text-sm">
            <span className="font-semibold text-gray-700">Receipt #</span>
            <span className="text-gray-500 font-mono text-xs">{receipt.receiptNumber}</span>
            {receipt.customerName && (
              <>
                <span className="font-semibold text-gray-700">Customer</span>
                <span className="text-gray-500">{receipt.customerName}</span>
              </>
            )}
            <span className="font-semibold text-gray-700">Payment</span>
            <span>
              <span className="inline-block bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                {(receipt.paymentMethod || receipt.type || 'N/A').replace(/_/g, ' ')}
              </span>
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 pb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-4 py-2.5 text-xs font-semibold rounded-tl-lg">Description</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold">Qty</th>
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
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {currencySymbol}{(item.quantity * Number(item.price)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
            {Number(receipt.deliveryFee) > 0 && (
              <div className="flex justify-between text-sm text-gray-500 px-4">
                <span>Delivery</span>
                <span>{currencySymbol}{Number(receipt.deliveryFee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-3 rounded-xl mt-2">
              <span className="font-bold text-sm uppercase tracking-wide">Total</span>
              <span className="font-black text-lg">{currencySymbol}{Number(receipt.total).toLocaleString()}</span>
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
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{storeName}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{storeEmail || storePhone || storeAddress}</p>
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
    </div>
  );
}
