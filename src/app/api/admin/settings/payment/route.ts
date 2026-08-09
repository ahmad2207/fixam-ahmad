import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

// A dedicated multi-field route, not the [key] catch-all — same pattern as
// /general and /delivery. Static segments like this one take precedence over
// [key] in Next's router, which is why this was silently 400-ing before:
// there was no route here, and "payment" isn't in [key]'s KEY_MAP.
async function getOrCreateSettings() {
  const [row] = await db.select().from(storeSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(storeSettings).values({}).returning();
  return created;
}

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = await getOrCreateSettings();
  return NextResponse.json({
    value: {
      bank_name: row.bankName ?? '',
      account_number: row.accountNumber ?? '',
      account_name: row.accountName ?? '',
      bank_name_2: row.bankName2 ?? '',
      account_number_2: row.accountNumber2 ?? '',
      account_name_2: row.accountName2 ?? '',
      payment_instructions: row.paymentInstructions ?? '',
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { value } = await req.json();
  await getOrCreateSettings();
  await db.update(storeSettings).set({
    bankName: value?.bank_name ?? undefined,
    accountNumber: value?.account_number ?? undefined,
    accountName: value?.account_name ?? undefined,
    bankName2: value?.bank_name_2 ?? undefined,
    accountNumber2: value?.account_number_2 ?? undefined,
    accountName2: value?.account_name_2 ?? undefined,
    paymentInstructions: value?.payment_instructions ?? undefined,
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
