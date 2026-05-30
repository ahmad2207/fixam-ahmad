import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { receipts } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { generateReceiptNumber } from '@/lib/inventory';

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(receipts).orderBy(desc(receipts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const receiptNumber = await generateReceiptNumber();

  const [receipt] = await db
    .insert(receipts)
    .values({
      receiptNumber,
      type: body.type ?? 'offline',
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      subtotal: String(body.subtotal),
      deliveryFee: String(body.deliveryFee ?? 0),
      total: String(body.total),
      items: JSON.stringify(body.items),
      notes: body.notes,
      createdBy: session.user?.id ?? null,
      salesRep: (session.user as any)?.name ?? null,
    })
    .returning();

  return NextResponse.json(receipt, { status: 201 });
}
