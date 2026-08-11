import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/orderNotifications';

// Thin wrapper kept for any external caller — the actual order-creation
// routes (payment/pod, payment/verify) now call sendOrderConfirmationEmail
// directly rather than looping back through HTTP.
export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  await sendOrderConfirmationEmail(orderId);
  return NextResponse.json({ sent: true });
}
