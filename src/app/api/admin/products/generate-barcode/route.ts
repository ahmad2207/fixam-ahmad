import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateUniqueBarcode } from '@/lib/barcode-server';

export async function POST() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const barcode = await generateUniqueBarcode();
    return NextResponse.json({ barcode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Generation failed' }, { status: 500 });
  }
}
