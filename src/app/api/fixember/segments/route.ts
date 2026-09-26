import { NextResponse } from 'next/server';
import { getActiveSegments } from '@/lib/fixember';

// Public, read-only — just the active wheel's contents (label/image/isPrize),
// no order/eligibility context. Used by decorative/marketing surfaces (e.g.
// the homepage promo modal) that want to show the real, current wheel
// without duplicating its segments as hardcoded copy that can drift out of
// sync with what admin has actually configured.
export async function GET() {
  const segments = await getActiveSegments();
  return NextResponse.json({ segments });
}
