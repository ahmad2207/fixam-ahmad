import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { reviews, products, users } from '@/db/schema';
import { eq, avg, count, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const rows = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(sql`${reviews.createdAt} desc`);

  const result = rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: r.userId ? { name: r.userName ?? null, image: r.userImage ?? null } : null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { productId, rating, title, body: reviewBody } = body;

  if (!productId || !rating) {
    return NextResponse.json({ error: 'productId and rating are required' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const [review] = await db
    .insert(reviews)
    .values({
      productId,
      userId: session.user.id,
      rating,
      title: title ?? null,
      body: reviewBody ?? null,
    })
    .returning();

  // Recalculate product rating and review count
  const [stats] = await db
    .select({
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  await db
    .update(products)
    .set({
      rating: stats.avgRating ? String(parseFloat(Number(stats.avgRating).toFixed(2))) : '0',
      reviewsCount: stats.reviewCount ?? 0,
    })
    .where(eq(products.id, productId));

  return NextResponse.json(review, { status: 201 });
}
