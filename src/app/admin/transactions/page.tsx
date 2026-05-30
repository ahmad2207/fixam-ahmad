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
      flutterwaveTxRef: paymentTransactions.flutterwaveTxRef,
      flutterwaveTransactionId: paymentTransactions.flutterwaveTransactionId,
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payment Transactions</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold">{rows.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Successful</p>
          <p className="text-2xl font-bold text-emerald-600">{successful.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Failed / Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{rows.filter((r) => r.status === 'failed' || r.status === 'cancelled').length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border rounded-xl py-16 text-center text-gray-500">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No transactions yet.
        </div>
      ) : (
        <TransactionsClient transactions={transactions} />
      )}
    </div>
  );
}
