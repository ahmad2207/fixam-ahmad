import { NextRequest, NextResponse } from 'next/server';
import { expireStockReservations } from '@/lib/inventory';

// Called by cron (e.g. Vercel Cron or an external scheduler)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = await expireStockReservations();
  return NextResponse.json({ expired: count });
}

// Support GET for simple cron ping services
export async function GET(req: NextRequest) {
  return POST(req);
}
