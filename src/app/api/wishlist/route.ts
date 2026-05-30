import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { wishlist } from '@/db/schema/wishlist';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 200 });

  const userId = (session.user as any).id as string;
  const rows = await db
    .select({ productId: wishlist.productId })
    .from(wishlist)
    .where(eq(wishlist.userId, userId));

  return NextResponse.json(rows.map((r) => r.productId));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const existing = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

  if (existing.length > 0) {
    await db.delete(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
    return NextResponse.json({ action: 'removed' });
  }

  await db.insert(wishlist).values({ userId, productId });
  return NextResponse.json({ action: 'added' }, { status: 201 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  await db.delete(wishlist).where(eq(wishlist.userId, userId));
  return NextResponse.json({ cleared: true });
}
