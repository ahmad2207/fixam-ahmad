import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Fixam Africa',
  description: 'The terms that apply when you shop with Fixam Africa.',
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

export default async function TermsPage() {
  const [s] = await db.select().from(storeSettings).limit(1);
  const storeName = s?.storeName || 'Fixam Africa';
  const email = s?.storeEmail || 'hello@fixam.africa';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-12 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">Terms of Service</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-12 py-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Terms of Service</h1>
          <p className="text-xs text-gray-400 mb-6">Last updated: {LAST_UPDATED}</p>

          <Section title="Using this site">
            <p>By placing an order or creating an account with {storeName}, you agree to these terms. If you're placing an order on behalf of someone else, you're responsible for making sure they agree too.</p>
          </Section>

          <Section title="Orders and pricing">
            <p>Prices are shown in Naira (₦) and include applicable taxes unless stated otherwise. Delivery fees are calculated at checkout based on your delivery location and shown before you pay. We reserve the right to correct a listing that has an obvious pricing error, and to cancel and refund any order affected by one.</p>
          </Section>

          <Section title="Payment">
            <p>We accept card, bank transfer, and USSD payments through Paystack, and Pay on Delivery in eligible areas. For Pay on Delivery orders, payment is due in full to the courier on delivery.</p>
          </Section>

          <Section title="Delivery">
            <p>Delivery timelines shown at checkout are estimates, not guarantees — delays can happen due to traffic, weather, or courier availability. Risk in the goods passes to you once they're delivered to the address you provided.</p>
          </Section>

          <Section title="Returns and refunds">
            <p>See our <Link href="/returns" className="text-primary font-semibold hover:underline">Returns &amp; Refunds page</Link> for what qualifies for a return, how to start one, and refund timelines.</p>
          </Section>

          <Section title="Accounts">
            <p>You're responsible for keeping your account credentials secure and for any activity that happens under your account. Tell us right away if you think your account has been accessed without your permission.</p>
          </Section>

          <Section title="Product information">
            <p>We do our best to describe products, images, and stock levels accurately, but colours can vary slightly by screen, and occasional errors happen. If something you ordered turns out to be unavailable, we'll contact you before charging your card.</p>
          </Section>

          <Section title="Changes to these terms">
            <p>We may update these terms from time to time. If we make a material change, we'll update the date at the top of this page.</p>
          </Section>

          <Section title="Contact us">
            <p>Questions about these terms? Email{' '}
              <a href={`mailto:${email}`} className="text-primary font-semibold hover:underline">{email}</a>, or reach us via our{' '}
              <Link href="/contact" className="text-primary font-semibold hover:underline">Contact page</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
