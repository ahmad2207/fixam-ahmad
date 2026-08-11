import { NextResponse } from 'next/server';
import { getDeliveryConfigFromDb } from '@/lib/deliveryConfigServer';
import { getDefaultDeliveryConfig } from '@/lib/deliveryFees';

// Public read of the delivery fee schedule — checkout needs this before (and
// without) a login, and none of it is sensitive: it's the same fee schedule
// the customer sees rendered on the page either way.
export async function GET() {
  try {
    const config = await getDeliveryConfigFromDb();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(getDefaultDeliveryConfig());
  }
}
