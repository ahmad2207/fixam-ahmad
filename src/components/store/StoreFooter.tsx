'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, ArrowRight, ArrowUp, Truck, RotateCcw, Shield, Banknote, Zap } from 'lucide-react';
import { useStoreSetting } from '@/hooks/useStoreSettings';
import { useState } from 'react';
import { toast } from 'sonner';

interface GeneralSettings {
  store_name?:      string;
  store_email?:     string;
  store_phone?:     string;
  store_address?:   string;
  store_tagline?:   string;
  facebook_url?:    string;
  instagram_url?:   string;
  twitter_url?:     string;
  whatsapp_number?: string;
  youtube_url?:     string;
  tiktok_url?:      string;
}

/* ─── Social icon SVGs ─── */
const FacebookSVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramSVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const XSVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const WhatsAppSVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const YouTubeSVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
  </svg>
);
const TikTokSVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

export function StoreFooter() {
  const { data: settings } = useStoreSetting<GeneralSettings>('general');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { toast.success('Subscribed! Thanks for joining.'); setEmail(''); }
      else { const d = await res.json(); toast.error(d.error ?? 'Subscription failed'); }
    } catch { toast.error('Subscription failed. Please try again.'); }
    finally { setSubscribing(false); }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">

      {/* ── TRUST STRIP ── */}
      <div className="bg-primary/10 border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Banknote, title: 'Pay on Delivery',  sub: 'Cash at your door' },
              { icon: Truck,    title: 'Fast Delivery',    sub: 'Abuja 24–48h · Nationwide 2–5 days' },
              { icon: RotateCcw,title: '7-Day Returns',    sub: 'Hassle-free returns' },
              { icon: Shield,   title: 'Genuine Products', sub: '100% authentic' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{title}</p>
                  <p className="text-[10px] text-white/50 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN FOOTER ── */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-5">
              <Image src="/logo.png" alt="Fixam Africa" className="h-11 w-auto brightness-0 invert" width={120} height={44} />
            </Link>
            <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-xs">
              {settings?.store_tagline || "Nigeria's trusted destination for premium cookware, smart appliances and culinary essentials."}
            </p>

            {/* Contact */}
            <div className="space-y-2.5 mb-7">
              {[
                { icon: MapPin, value: settings?.store_address || 'Lagos, Nigeria' },
                { icon: Phone,  value: settings?.store_phone  || '+234 800 000 0000' },
                { icon: Mail,   value: settings?.store_email  || 'hello@fixam.africa' },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-2.5 text-white/50 hover:text-white/80 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs">{value}</span>
                </div>
              ))}
            </div>

            {/* Social icons — only rendered when a URL is saved */}
            {(() => {
              const whatsappHref = settings?.whatsapp_number
                ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`
                : null;
              const socials = [
                { label: 'Facebook',  href: settings?.facebook_url  || null, icon: FacebookSVG  },
                { label: 'Instagram', href: settings?.instagram_url || null, icon: InstagramSVG },
                { label: 'X',         href: settings?.twitter_url   || null, icon: XSVG         },
                { label: 'WhatsApp',  href: whatsappHref,                    icon: WhatsAppSVG  },
                { label: 'YouTube',   href: settings?.youtube_url   || null, icon: YouTubeSVG   },
                { label: 'TikTok',    href: settings?.tiktok_url    || null, icon: TikTokSVG   },
              ].filter((s) => s.href);
              if (!socials.length) return null;
              return (
                <div className="flex gap-2 flex-wrap">
                  {socials.map(({ label, href, icon }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-9 h-9 rounded-xl bg-white/8 hover:bg-primary text-white/60 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110"
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Shop */}
          <div className="lg:col-span-2">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-widest mb-5">Shop</h4>
            <ul className="space-y-3">
              {[
                { name: 'All Products',  href: '/products' },
                { name: 'New Arrivals',  href: '/products?sort=newest' },
                { name: 'Best Sellers',  href: '/products?sort=rating' },
                { name: 'Cookware',      href: '/products?category=cookware' },
                { name: 'Appliances',    href: '/products?category=appliances' },
                { name: 'Bakeware',      href: '/products?category=bakeware' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-primary transition-colors text-sm inline-flex items-center gap-1.5 group">
                    <span>{link.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-widest mb-5">Help</h4>
            <ul className="space-y-3">
              {[
                { name: 'My Orders',     href: '/orders' },
                { name: 'Track Order',   href: '/orders' },
                { name: 'My Account',    href: '/account' },
                { name: 'Wishlist',      href: '/wishlist' },
                { name: 'Contact Us',    href: '/contact' },
                { name: 'Returns',       href: '/returns' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-primary transition-colors text-sm inline-flex items-center gap-1.5 group">
                    <span>{link.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h4 className="font-extrabold text-sm text-white uppercase tracking-widest mb-5">Stay Updated</h4>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Get exclusive deals, new arrivals and kitchen tips delivered to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-primary transition-colors">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="flex-1 bg-white/5 text-white placeholder:text-white/30 h-11 px-4 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="h-11 px-5 bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {subscribing ? '…' : <><span className="hidden sm:inline">Subscribe</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
              <p className="text-[11px] text-white/30">No spam. Unsubscribe any time.</p>
            </form>

            {/* Payment methods */}
            <div className="mt-8">
              <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Accepted Payments</p>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Pay on Delivery</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Cash payment at your doorstep</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/25 to-red-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Online Payment</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Powered by Flutterwave · Secure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30" suppressHydrationWarning>
            © {new Date().getFullYear()} Fixam Africa. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-white/70 transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-white/70 transition-colors">Cookie Policy</Link>
          </div>
          <button
            onClick={scrollTop}
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-primary text-white/40 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
