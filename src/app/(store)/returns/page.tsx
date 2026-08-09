import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import Link from 'next/link';
import {
  MessageCircle, Phone, Mail, ChevronRight, CheckCircle2, XCircle,
  ClipboardCheck, PackageCheck, Wallet2, ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Returns & Refunds | Fixam Africa',
  description: '30 days to send it back — see what qualifies, how it works, and when your refund lands.',
};

const ELIGIBLE = [
  { title: 'Arrived damaged or faulty', detail: 'Anytime within 30 days — no questions asked.' },
  { title: 'Wrong item or size sent', detail: "Our mistake, our cost — pickup and refund are free." },
  { title: 'Changed your mind', detail: 'Unused, in its original packaging, with proof of purchase.' },
  { title: 'Missing parts or accessories', detail: 'Tell us what shipped incomplete and we’ll sort it.' },
];

const NOT_ELIGIBLE = [
  { title: 'Shows signs of use', detail: 'Scratches, burns, or stains from cooking on the surface.' },
  { title: 'Missing box or accessories', detail: 'We need the original packaging back with it.' },
  { title: 'Marked as clearance or final sale', detail: 'Called out at checkout — no returns on these.' },
  { title: 'Past the 30-day window', detail: 'Counted from the day your order was delivered.' },
];

const STEPS = [
  {
    Icon: MessageCircle,
    title: 'Message us',
    detail: 'WhatsApp, call, or email within 30 days. Include your order number, and photos if it arrived damaged.',
  },
  {
    Icon: ClipboardCheck,
    title: 'We confirm it',
    detail: 'We’ll tell you within one business day whether it qualifies and how to send it back.',
  },
  {
    Icon: PackageCheck,
    title: 'Send it back',
    detail: 'Original box where possible. We arrange rider pickup in Abuja, or a courier drop-off elsewhere.',
  },
  {
    Icon: Wallet2,
    title: 'Get refunded',
    detail: 'Once we’ve received and checked it, your refund lands in 5–7 business days.',
  },
];

const REFUND_LINES = [
  { label: 'Item cost',    value: 'Refunded in full' },
  { label: 'Delivery fee', value: 'Refunded only if the return is our error' },
  { label: 'Method',       value: 'Original payment, or store credit for Pay on Delivery' },
  { label: 'Timeline',     value: '5–7 business days after inspection' },
];

export default async function ReturnsPage() {
  const [s] = await db.select().from(storeSettings).limit(1);

  const phone    = s?.storePhone || '+234 800 000 0000';
  const email    = s?.storeEmail || 'hello@fixam.africa';
  const waNumber = s?.whatsappNumber?.replace(/\D/g, '') || null;
  const waHref   = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello! I'd like to start a return for my order.")}`
    : null;

  return (
    <div className="min-h-screen bg-background">

      {/* ── BREADCRUMB ── */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 lg:px-12 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Returns &amp; Refunds</span>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="border-b border-border overflow-hidden">
        <div className="container mx-auto px-4 lg:px-12 py-14 lg:py-20">
          <div className="grid lg:grid-cols-[1.1fr_auto] gap-12 lg:gap-16 items-center">

            {/* Copy */}
            <div className="max-w-xl">
              <span className="inline-block bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                Returns &amp; Refunds
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-foreground leading-[1.05] mb-5">
                Didn&rsquo;t work out?<br />You&rsquo;ve got 30 days.
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
                Arrived damaged, isn&rsquo;t what you ordered, or just isn&rsquo;t right for your kitchen —
                send it back within 30 days of delivery for a full refund or exchange.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Start a return on WhatsApp
                  </a>
                )}
                <Link
                  href="/orders"
                  className="flex items-center gap-1.5 text-sm font-bold text-foreground border-2 border-border px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition-colors"
                >
                  Find your order number
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Return slip */}
            <div className="ticket-torn-top mt-3 mx-auto sm:rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 bg-card rounded-b-2xl rounded-t-md shadow-xl border border-border w-[280px] sm:w-[300px] flex-shrink-0">
              <div className="px-6 pt-6 pb-4 text-center">
                <p className="font-receipt text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Fixam Africa &middot; Return Slip
                </p>
                <div className="flex items-baseline justify-center gap-2 mt-4 mb-1">
                  <span className="font-display text-6xl font-bold text-primary leading-none tabular-nums">30</span>
                  <span className="font-display text-xl font-bold text-foreground uppercase tracking-wide">Days</span>
                </div>
                <p className="text-xs text-muted-foreground">from the day your order arrives</p>
              </div>
              <div className="ticket-perforation" />
              <div className="px-6 py-4 text-center">
                <p className="font-receipt text-[10px] tracking-wide text-muted-foreground leading-relaxed">
                  VALID ON ALL FIXAM ORDERS<br />
                  FULL REFUND OR EXCHANGE
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ELIGIBILITY ── */}
      <section className="container mx-auto px-4 lg:px-12 py-14 lg:py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">What we&rsquo;ll take back</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Most returns come down to one of these. If yours doesn&rsquo;t fit either list, message us anyway —
            we&rsquo;ll tell you plainly where it stands.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-success" />
              </div>
              <h3 className="font-display text-sm uppercase tracking-wide font-bold text-foreground">We&rsquo;ll accept it</h3>
            </div>
            <ul className="space-y-4">
              {ELIGIBLE.map(({ title, detail }) => (
                <li key={title} className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground leading-snug">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <h3 className="font-display text-sm uppercase tracking-wide font-bold text-foreground">We can&rsquo;t accept it</h3>
            </div>
            <ul className="space-y-4">
              {NOT_ELIGIBLE.map(({ title, detail }) => (
                <li key={title} className="flex gap-3">
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground leading-snug">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="container mx-auto px-4 lg:px-12 py-14 lg:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-10">How a return actually goes</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {STEPS.map(({ Icon, title, detail }, i) => (
              <div key={title} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-display text-xs text-muted-foreground tracking-widest">
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-8 top-3 w-4 h-4 text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REFUND BREAKDOWN ── */}
      <section className="container mx-auto px-4 lg:px-12 py-14 lg:py-20">
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">Your refund, itemised</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-dashed divide-border">
              {REFUND_LINES.map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 px-6 py-4">
                  <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
                  <span className="font-receipt text-sm text-foreground text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-foreground">
        <div className="container mx-auto px-4 lg:px-12 py-12 lg:py-16 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-background mb-3">Ready to send something back?</h2>
          <p className="text-background/60 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            Have your order number ready and message us — we usually confirm within one business day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>
            )}
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 bg-background/10 text-background font-bold text-sm px-5 py-3 rounded-xl hover:bg-background/15 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 bg-background/10 text-background font-bold text-sm px-5 py-3 rounded-xl hover:bg-background/15 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {email}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
