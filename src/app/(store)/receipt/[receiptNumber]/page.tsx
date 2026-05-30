import { db } from '@/lib/db';
import { receipts, storeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { FileText } from 'lucide-react';

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
  const storeAddress = settingsRow?.storeAddress ?? 'Lagos, Nigeria';
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

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-lg mx-auto bg-card border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-border">
          <h1 className="text-xl font-bold text-foreground">{storeName}</h1>
          <p className="text-xs text-muted-foreground mt-1">{storeAddress}</p>
          {storePhone && <p className="text-xs text-muted-foreground">Tel: {storePhone}</p>}
        </div>

        <div className="bg-primary text-primary-foreground text-center py-3">
          <h2 className="text-base font-bold tracking-wide">Payment Receipt</h2>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 text-sm">
            <span className="font-bold">Receipt #</span>
            <span className="text-muted-foreground font-mono text-xs">{receipt.receiptNumber}</span>
            <span className="font-bold">Date</span>
            <span className="text-muted-foreground">
              {new Date(receipt.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {receipt.customerName && (
              <>
                <span className="font-bold">Customer</span>
                <span className="text-muted-foreground">{receipt.customerName}</span>
              </>
            )}
            <span className="font-bold">Payment</span>
            <span>
              <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded">
                {(receipt.paymentMethod || receipt.type || 'N/A').replace(/_/g, ' ')}
              </span>
            </span>
            <span className="font-bold">Status</span>
            <span>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${receipt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {receipt.paymentStatus}
              </span>
            </span>
          </div>

          <hr className="border-border" />

          {/* Items */}
          <div>
            <h3 className="text-sm font-bold mb-3">Items</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    {item.variation && <span className="text-xs text-muted-foreground ml-1">({item.variation})</span>}
                    <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                  </div>
                  <span className="font-semibold">{currencySymbol}{(item.quantity * Number(item.price)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Totals */}
          {Number(receipt.deliveryFee) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span>{currencySymbol}{Number(receipt.deliveryFee).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{currencySymbol}{Number(receipt.total).toLocaleString()}</span>
          </div>

          {receipt.notes && (
            <div className="p-3 bg-muted/50 border-l-2 border-primary rounded-r text-xs text-muted-foreground">
              <strong className="text-foreground">Notes:</strong> {receipt.notes}
            </div>
          )}
        </div>

        <div className="text-center px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground">{storeName} · {storeEmail || storePhone || storeAddress}</p>
        </div>
      </div>
    </div>
  );
}
