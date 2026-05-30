export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { receipts } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import ReceiptsClient, { type ReceiptRow } from './ReceiptsClient';

export default async function AdminReceiptsPage() {
  const rows = await db
    .select({
      id: receipts.id,
      receiptNumber: receipts.receiptNumber,
      customerName: receipts.customerName,
      customerEmail: receipts.customerEmail,
      type: receipts.type,
      total: receipts.total,
      paymentStatus: receipts.paymentStatus,
      items: receipts.items,
      createdAt: receipts.createdAt,
    })
    .from(receipts)
    .orderBy(desc(receipts.createdAt));

  const receiptRows: ReceiptRow[] = rows.map((r) => {
    let itemCount = 0;
    try {
      const parsed = JSON.parse(r.items);
      itemCount = Array.isArray(parsed)
        ? parsed.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)
        : 0;
    } catch { /* leave 0 */ }

    return {
      id: r.id,
      receiptNumber: r.receiptNumber,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      type: r.type,
      total: r.total,
      paymentStatus: r.paymentStatus,
      itemCount,
      createdAt: r.createdAt,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <Link
          href="/admin/receipts/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          + Manual Receipt
        </Link>
      </div>

      <ReceiptsClient receipts={receiptRows} />
    </div>
  );
}
