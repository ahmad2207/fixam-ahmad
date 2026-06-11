import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import { ContactForm } from './ContactForm';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, MessageCircle, Clock, ChevronRight,
} from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Fixam Africa',
  description: "Get in touch with us. We're here to help.",
};

const HOURS = [
  { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
  { day: 'Saturday',        time: '10:00 AM – 4:00 PM' },
  { day: 'Sunday',          time: 'Closed' },
];

export default async function ContactPage() {
  const [s] = await db.select().from(storeSettings).limit(1);

  const phone    = s?.storePhone     || '+234 800 000 0000';
  const email    = s?.storeEmail     || 'hello@fixam.africa';
  const address  = s?.storeAddress   || 'Lagos, Nigeria';
  const waNumber = s?.whatsappNumber?.replace(/\D/g, '') || null;
  const waHref   = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hello! I have an inquiry about Fixam Africa.')}` : null;

  const infoCards = [
    {
      icon:   MapPin,
      label:  'Our Location',
      value:  address,
      href:   `https://maps.google.com?q=${encodeURIComponent(address)}`,
      action: 'Get directions',
      color:  'bg-orange-50 text-primary',
    },
    {
      icon:   Phone,
      label:  'Call Us',
      value:  phone,
      href:   `tel:${phone.replace(/\s/g, '')}`,
      action: 'Call now',
      color:  'bg-blue-50 text-blue-600',
    },
    {
      icon:   Mail,
      label:  'Email Us',
      value:  email,
      href:   `mailto:${email}`,
      action: 'Send email',
      color:  'bg-purple-50 text-purple-600',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">Contact Us</span>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 lg:py-16 text-center">
          <span className="inline-block bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            We'd love to hear from you
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Have a question, feedback, or want to place a bulk order? Our team is ready to help — reach out through any channel below.
          </p>
        </div>
      </section>

      {/* ── CONTACT INFO CARDS ── */}
      <section className="container mx-auto px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-8">
          {infoCards.map(({ icon: Icon, label, value, href, action, color }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col items-start"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-800 mb-3 leading-snug">{value}</p>
              <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                {action} <ChevronRight className="w-3 h-3" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">

          {/* ── FORM ── */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Send Us a Message</h2>
            <p className="text-sm text-gray-500 mb-6">Fill in the form and we'll be in touch shortly.</p>
            <ContactForm />
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-5">

            {/* WhatsApp CTA */}
            {waHref && (
              <div className="bg-[#25D366] rounded-2xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm">Chat on WhatsApp</p>
                    <p className="text-xs text-white/80">Usually replies within minutes</p>
                  </div>
                </div>
                <p className="text-sm text-white/90 mb-4 leading-relaxed">
                  For the fastest response, reach us directly on WhatsApp — available during business hours.
                </p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-[#25D366] font-extrabold text-sm px-5 py-3 rounded-xl hover:bg-white/90 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Start WhatsApp Chat
                </a>
              </div>
            )}

            {/* Business hours */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-gray-900">Business Hours</p>
                  <p className="text-xs text-gray-400">All times in WAT (GMT+1)</p>
                </div>
              </div>
              <div className="space-y-3">
                {HOURS.map(({ day, time }) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">{day}</span>
                    <span className={`font-bold ${time === 'Closed' ? 'text-red-500' : 'text-gray-900'}`}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Orders placed outside business hours are processed the next working day.
                </p>
              </div>
            </div>

            {/* FAQ teaser */}
            <div className="bg-gradient-to-br from-primary to-orange-600 rounded-2xl p-6 text-white shadow-sm">
              <p className="font-extrabold text-base mb-2">Looking for quick answers?</p>
              <p className="text-sm text-white/80 mb-5 leading-relaxed">
                Check out our most frequently asked questions about orders, delivery, and returns.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 bg-white text-primary font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
              >
                Browse Products <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
