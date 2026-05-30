import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { reviews, products } from '@/db/schema';
import { eq, avg, count } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Only allow editing own reviews (unless admin)
  const existing = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const role = (session.user as any).role;
  if (existing.userId !== session.user.id && role !== 'admin' && role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { rating, title, body: reviewBody } = body;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (rating !== undefined) updateData.rating = rating;
  if (title !== undefined) updateData.title = title;
  if (reviewBody !== undefined) updateData.body = reviewBody;

  const [updated] = await db
    .update(reviews)
    .set(updateData)
    .where(eq(reviews.id, id))
    .returning();

  // Recalculate product rating
  const [stats] = await db
    .select({
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, existing.productId));

  await db
    .update(products)
    .set({
      rating: stats.avgRating ? String(parseFloat(Number(stats.avgRating).toFixed(2))) : '0',
      reviewsCount: stats.reviewCount ?? 0,
    })
    .where(eq(products.id, existing.productId));

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const role = (session.user as any).role;
  if (existing.userId !== session.user.id && role !== 'admin' && role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(reviews).where(eq(reviews.id, id));

  // Recalculate product rating
  const [stats] = await db
    .select({
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, existing.productId));

  await db
    .update(products)
    .set({
      rating: stats.avgRating ? String(parseFloat(Number(stats.avgRating).toFixed(2))) : '0',
      reviewsCount: stats.reviewCount ?? 0,
    })
    .where(eq(products.id, existing.productId));

  return NextResponse.json({ success: true });
}
