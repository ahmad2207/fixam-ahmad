import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Fixam Africa',
  description: 'How Fixam Africa collects, uses, and protects your information.',
};

const LAST_UPDATED = 'August 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-6 border-b border-gray-100 last:border-0">
      <h2 className="text-base font-extrabold text-gray-900 mb-2.5">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2.5">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const [s] = await db.select().from(storeSettings).limit(1);
  const email = s?.storeEmail || 'hello@fixam.africa';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Privacy Policy</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-xs text-gray-400 mb-6">Last updated: {LAST_UPDATED}</p>

          <Section title="What we collect">
            <p>When you create an account, place an order, or contact us, we collect what's needed to do that: your name, email, phone number, delivery address, and order details. If you sign in with Google, we receive your name, email, and profile photo from Google — we never see your Google password.</p>
          </Section>

          <Section title="How we use it">
            <p>We use your information to process and deliver your orders, send order and account emails, respond to support requests, and improve the store. We don't sell your personal information to anyone.</p>
          </Section>

          <Section title="Who we share it with">
            <p>We share only what each service needs to do its job:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Paystack</strong> processes card, bank transfer, and USSD payments. We don't store your card details — Paystack handles that directly.</li>
              <li><strong>Google</strong> handles sign-in if you choose that option.</li>
              <li><strong>Resend</strong> delivers our transactional emails (order confirmations, password resets).</li>
              <li>Our delivery partners receive your name, phone number, and delivery address to get your order to you.</li>
            </ul>
          </Section>

          <Section title="Cookies and local storage">
            <p>We use one essential cookie to keep you signed in — nothing else needs your consent to function. Your cart is stored in your browser's local storage, not a cookie, and stays on your device until you clear it or check out. We don't use advertising or analytics cookies. See our <Link href="/cookies" className="text-primary font-semibold hover:underline">Cookie Policy</Link> for details.</p>
          </Section>

          <Section title="How long we keep it">
            <p>We keep account and order records for as long as your account is active, and afterward only as long as needed for tax, accounting, and dispute purposes. You can ask us to delete your account at any time.</p>
          </Section>

          <Section title="Your rights">
            <p>You can review and update your details from your <Link href="/account" className="text-primary font-semibold hover:underline">Account</Link> page at any time, or contact us to request a copy of your data, ask us to correct it, or ask us to delete it.</p>
          </Section>

          <Section title="Contact us">
            <p>Questions about this policy or your data? Email us at{' '}
              <a href={`mailto:${email}`} className="text-primary font-semibold hover:underline">{email}</a>, or reach us via our{' '}
              <Link href="/contact" className="text-primary font-semibold hover:underline">Contact page</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
