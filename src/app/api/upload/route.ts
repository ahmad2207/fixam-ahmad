import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToSpaces, generateFileName } from '@/lib/spaces';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const subfolder = (formData.get('subfolder') as string) || 'products';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const maxBytes = 20 * 1024 * 1024; // 20 MB (allows animated GIFs)
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 413 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = generateFileName(file.name);
  const url = await uploadToSpaces(buffer, fileName, file.type, subfolder);

  return NextResponse.json({ url });
}
