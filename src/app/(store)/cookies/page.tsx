import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | Fixam Africa',
  description: 'What cookies and local storage Fixam Africa actually uses.',
};

const LAST_UPDATED = 'August 2026';

export default async function CookiesPage() {
  const [s] = await db.select().from(storeSettings).limit(1);
  const email = s?.storeEmail || 'hello@fixam.africa';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Cookie Policy</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Cookie Policy</h1>
          <p className="text-xs text-gray-400 mb-6">Last updated: {LAST_UPDATED}</p>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            We keep this deliberately short, because we keep our actual cookie use short. Here's everything
            that's stored in your browser when you use this site — no more, no less.
          </p>

          <div className="overflow-x-auto -mx-1 mb-6">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs text-gray-700">__Secure-authjs.session-token</td>
                  <td className="py-3 pr-4 text-gray-600">Essential cookie</td>
                  <td className="py-3 pr-4 text-gray-600">Keeps you signed in</td>
                  <td className="py-3 text-gray-600">30 days, or when you sign out</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs text-gray-700">fixam_cart</td>
                  <td className="py-3 pr-4 text-gray-600">Local storage <span className="text-gray-400">(not a cookie)</span></td>
                  <td className="py-3 pr-4 text-gray-600">Remembers what's in your cart</td>
                  <td className="py-3 text-gray-600">Until you clear it or check out</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              That's it — we don't run advertising or analytics cookies, and we don't use cookies to track you
              across other websites. The session cookie is essential to how sign-in works, so there's no
              cookie banner or opt-out for it; if you'd rather not have it set, simply don't sign in and shop
              as a guest.
            </p>
            <p>
              See our <Link href="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link> for
              how we handle the personal information you give us directly. Questions? Email{' '}
              <a href={`mailto:${email}`} className="text-primary font-semibold hover:underline">{email}</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
