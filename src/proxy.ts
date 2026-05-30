import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isAdminLoginRoute = nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isAdminLoginRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', nextUrl));
    }
    const role = (session.user as any)?.role;
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.redirect(new URL('/admin/login', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
