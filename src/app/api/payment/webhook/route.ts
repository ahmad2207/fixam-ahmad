import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get('x-paystack-signature');
  const expectedSignature = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '')
    .update(rawBody)
    .digest('hex');

  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Only process successful charges
  if (body.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  // Idempotent: delegate to verify endpoint
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: body.data.reference }),
    });
  } catch {
    // Log but do not fail the webhook acknowledgement
  }

  return NextResponse.json({ received: true });
}
