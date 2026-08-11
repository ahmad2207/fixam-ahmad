export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { paymentTransactions, orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import TransactionsClient, { type TransactionRow } from './TransactionsClient';

export default async function AdminTransactionsPage() {
  const rows = await db
    .select({
      id: paymentTransactions.id,
      orderId: paymentTransactions.orderId,
      paystackReference: paymentTransactions.paystackReference,
      paystackTransactionId: paymentTransactions.paystackTransactionId,
      amount: paymentTransactions.amount,
      currency: paymentTransactions.currency,
      status: paymentTransactions.status,
      rawResponse: paymentTransactions.rawResponse,
      createdAt: paymentTransactions.createdAt,
      updatedAt: paymentTransactions.updatedAt,
      orderStatus: orders.status,
      shippingFullName: orders.shippingFullName,
      guestEmail: orders.guestEmail,
    })
    .from(paymentTransactions)
    .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
    .orderBy(desc(paymentTransactions.createdAt));

  const successful = rows.filter((r) => r.status === 'successful');
  const totalCollected = successful.reduce((s, r) => s + Number(r.amount), 0);

  const transactions: TransactionRow[] = rows.map((r) => ({
    ...r,
    orderStatus: r.orderStatus ?? null,
  }));

  const failedCount = rows.filter((r) => r.status === 'failed' || r.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Payment Transactions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{rows.length} transactions recorded</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',            value: rows.length,                    color: 'text-foreground',   border: 'border-border' },
          { label: 'Successful',       value: successful.length,              color: 'text-emerald-600',  border: 'border-emerald-100' },
          { label: 'Failed / Cancelled', value: failedCount,                  color: 'text-destructive',  border: 'border-red-100' },
          { label: 'Total Collected',  value: formatCurrency(totalCollected), color: 'text-foreground',   border: 'border-border' },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`bg-card rounded-2xl p-5 border shadow-sm ${border}`}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center shadow-sm">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        </div>
      ) : (
        <TransactionsClient transactions={transactions} />
      )}
    </div>
  );
}
