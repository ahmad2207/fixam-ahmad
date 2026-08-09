import { NextRequest, NextResponse } from 'next/server';
import { sendOrderStatusEmail } from '@/lib/orderNotifications';

// Thin wrapper kept for any external caller — admin/orders/[id]/status now
// calls sendOrderStatusEmail directly rather than looping back through HTTP.
export async function POST(req: NextRequest) {
  const { orderId, status } = await req.json();
  if (!orderId || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await sendOrderStatusEmail(orderId, status);
  return NextResponse.json({ sent: true });
}
