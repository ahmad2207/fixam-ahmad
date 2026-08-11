export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { receipts } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import ReceiptsClient, { type ReceiptRow } from './ReceiptsClient';

export default async function AdminReceiptsPage() {
  let rows: any[] = [];
  try {
    rows = await db
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
  } catch (err) {
    console.error('[AdminReceiptsPage] DB error:', err);
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Receipts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{receiptRows.length} receipts generated</p>
        </div>
        <Link
          href="/admin/receipts/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
        >
          + Manual Receipt
        </Link>
      </div>

      <ReceiptsClient receipts={receiptRows} />
    </div>
  );
}
