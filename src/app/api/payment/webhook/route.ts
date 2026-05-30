import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const verifyHash = req.headers.get('verif-hash');
  if (verifyHash !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Only process successful charges
  if (body.event !== 'charge.completed' || body.data?.status !== 'successful') {
    return NextResponse.json({ received: true });
  }

  // Idempotent: delegate to verify endpoint
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: body.data.id,
        tx_ref: body.data.tx_ref,
      }),
    });
  } catch {
    // Log but do not fail the webhook acknowledgement
  }

  return NextResponse.json({ received: true });
}
