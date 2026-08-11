export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { inventoryBatches, products, stockNotifications } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { AddBatchForm } from './AddBatchForm';
import { WaitlistTable } from '@/components/admin/WaitlistTable';

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function InventoryProductPage({ params }: Props) {
  const { productId } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) notFound();

  const [batches, waitlist] = await Promise.all([
    db.select().from(inventoryBatches)
      .where(eq(inventoryBatches.productId, productId))
      .orderBy(asc(inventoryBatches.createdAt)),
    db.select().from(stockNotifications)
      .where(eq(stockNotifications.productId, productId))
      .orderBy(desc(stockNotifications.createdAt)),
  ]);

  const serializedWaitlist = waitlist.map(w => ({
    ...w,
    notifiedAt: w.notifiedAt ? w.notifiedAt.toISOString() : null,
    createdAt:  w.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
          <p className="text-gray-500 text-sm">Current stock: <strong>{product.stock}</strong></p>
        </div>
        {waitlist.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {waitlist.filter(w => !w.notifiedAt).length} waiting
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Add Inventory Batch</h2>
        <AddBatchForm productId={productId} />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Batch History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Qty Available</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cost Price</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 text-gray-500">
                  {new Date(b.createdAt).toLocaleDateString('en-NG')}
                </td>
                <td className={`px-4 py-3 font-medium ${b.quantityAvailable === 0 ? 'text-gray-400' : 'text-primary'}`}>
                  {b.quantityAvailable}
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(b.costPrice))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {batches.length === 0 && (
          <p className="text-center py-6 text-gray-500 text-sm">No batches yet.</p>
        )}
      </div>

      <WaitlistTable entries={serializedWaitlist} />
    </div>
  );
}
