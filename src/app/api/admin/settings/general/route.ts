import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

async function getOrCreateSettings() {
  const [row] = await db.select().from(storeSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(storeSettings).values({}).returning();
  return created;
}

export async function GET() {
  try {
    const row = await getOrCreateSettings();
    return NextResponse.json({
      store_name:      row.storeName,
      store_email:     row.storeEmail     ?? '',
      store_phone:     row.storePhone     ?? '',
      store_address:   row.storeAddress   ?? '',
      facebook_url:    row.facebookUrl    ?? '',
      instagram_url:   row.instagramUrl   ?? '',
      twitter_url:     row.twitterUrl     ?? '',
      whatsapp_number: row.whatsappNumber ?? '',
      youtube_url:     row.youtubeUrl     ?? '',
      tiktok_url:      row.tiktokUrl      ?? '',
    });
  } catch {
    // DB not reachable or columns missing (migrations not run yet)
    return NextResponse.json({
      store_name: 'Fixam Africa', store_email: '', store_phone: '',
      store_address: '', facebook_url: '', instagram_url: '',
      twitter_url: '', whatsapp_number: '', youtube_url: '', tiktok_url: '',
    });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  await getOrCreateSettings();
  await db.update(storeSettings).set({
    storeName:      body.store_name      ?? undefined,
    storeEmail:     body.store_email     ?? undefined,
    storePhone:     body.store_phone     ?? undefined,
    storeAddress:   body.store_address   ?? undefined,
    facebookUrl:    body.facebook_url    ?? undefined,
    instagramUrl:   body.instagram_url   ?? undefined,
    twitterUrl:     body.twitter_url     ?? undefined,
    whatsappNumber: body.whatsapp_number ?? undefined,
    youtubeUrl:     body.youtube_url     ?? undefined,
    tiktokUrl:      body.tiktok_url      ?? undefined,
    updatedAt:      new Date(),
  });

  return NextResponse.json({ ok: true });
}
