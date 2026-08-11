import { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth';

// This catch-all route must never be treated as statically analyzable — every
// request is inherently dynamic (session cookies, OAuth callbacks, CSRF
// tokens). Without this, the dev server's background static-path analysis
// pass can crash its worker pool on this route, which then makes
// /api/auth/session start returning 500s until the server is restarted.
export const dynamic = 'force-dynamic';

const { GET: authGet, POST } = handlers;

export async function GET(req: NextRequest) {
  // Google's OAuth callback sometimes omits the scheme on the "iss" response
  // parameter (sends "accounts.google.com" instead of "https://accounts.google.com").
  // oauth4webapi compares it verbatim against the discovery document's issuer and
  // rejects the sign-in when the scheme is missing, which blocks affected accounts
  // entirely. Normalize it here before Auth.js parses the callback.
  const url = req.nextUrl.clone();
  if (url.searchParams.get('iss') === 'accounts.google.com') {
    url.searchParams.set('iss', 'https://accounts.google.com');
    req = new NextRequest(url, { headers: req.headers });
  }
  return authGet(req);
}

export { POST };
