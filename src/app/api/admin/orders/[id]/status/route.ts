import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status, note } = await req.json();

  const [updated] = await db
    .update(orders)
    .set({ status, notes: note, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fire status email
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: id, status, note }),
  }).catch(() => {});

  return NextResponse.json(updated);
}
