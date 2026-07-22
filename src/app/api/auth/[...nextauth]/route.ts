import { handlers } from '@/lib/auth';

const { GET: authGet, POST } = handlers;

export async function GET(req: Request) {
  // Google's OAuth callback sometimes omits the scheme on the "iss" response
  // parameter (sends "accounts.google.com" instead of "https://accounts.google.com").
  // oauth4webapi compares it verbatim against the discovery document's issuer and
  // rejects the sign-in when the scheme is missing, which blocks affected accounts
  // entirely. Normalize it here before Auth.js parses the callback.
  const url = new URL(req.url);
  if (url.searchParams.get('iss') === 'accounts.google.com') {
    url.searchParams.set('iss', 'https://accounts.google.com');
    req = new Request(url, { headers: req.headers });
  }
  return authGet(req);
}

export { POST };
