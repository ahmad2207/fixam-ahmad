export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { inventoryBatches, products } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { AddBatchForm } from './AddBatchForm';

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function InventoryProductPage({ params }: Props) {
  const { productId } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) notFound();

  const batches = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.createdAt));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
      <p className="text-gray-500 text-sm mb-6">Current stock: <strong>{product.stock}</strong></p>

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
    </div>
  );
}
