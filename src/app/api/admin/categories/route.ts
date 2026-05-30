import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(categories).orderBy(asc(categories.name));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const slug = body.slug || slugify(body.name);

  const [category] = await db
    .insert(categories)
    .values({ ...body, slug })
    .returning();

  return NextResponse.json(category, { status: 201 });
}
