import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';

type SettingsRow = typeof storeSettings.$inferSelect;

const KEY_MAP: Partial<Record<string, keyof SettingsRow>> = {
  store_name: 'storeName',
  currency: 'currency',
  currency_symbol: 'currencySymbol',
  logo_url: 'logoUrl',
  store_email: 'storeEmail',
  store_phone: 'storePhone',
  store_address: 'storeAddress',
  delivery_fee: 'deliveryFee',
  free_delivery_threshold: 'freeDeliveryThreshold',
  delivery_config: 'deliveryConfig',
  bank_name: 'bankName',
  account_number: 'accountNumber',
  account_name: 'accountName',
  notify_new_orders: 'notifyNewOrders',
  notify_low_stock: 'notifyLowStock',
  low_stock_threshold: 'lowStockThreshold',
  notify_email: 'notifyEmail',
};

async function getOrCreateSettings() {
  const [row] = await db.select().from(storeSettings).limit(1);
  if (row) return row;
  const [created] = await db.insert(storeSettings).values({}).returning();
  return created;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = await params;
  const col = KEY_MAP[key];
  if (!col) return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 });

  const row = await getOrCreateSettings();
  return NextResponse.json({ value: row[col] });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = await params;
  const col = KEY_MAP[key];
  if (!col) return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 });

  const { value } = await req.json();
  const row = await getOrCreateSettings();

  await db.update(storeSettings).set({ [col]: value, updatedAt: new Date() });

  return NextResponse.json({ key, value: row[col] });
}
