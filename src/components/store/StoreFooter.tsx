'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { useStoreSetting } from '@/hooks/useStoreSettings';
import { useState } from 'react';
import { toast } from 'sonner';

interface GeneralSettings {
  store_name?: string;
  store_email?: string;
  store_phone?: string;
  store_address?: string;
  store_tagline?: string;
}

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
      if (res.ok) {
        toast.success('Subscribed! Thanks for joining.');
        setEmail('');
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Subscription failed');
      }
    } catch {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-foreground text-card relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image src="/logo.png" alt="Fixam" className="h-12 w-auto brightness-0 invert" width={48} height={48} />
            </Link>

            <p className="text-card/70 mb-6 leading-relaxed">
              {settings?.store_tagline ?? "Nigeria's trusted destination for premium cookware, kitchen appliances, and culinary tools. Elevating African kitchens since 2020."}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-card/60">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{settings?.store_address ?? 'Lagos, Nigeria'}</span>
              </div>
              <div className="flex items-center gap-3 text-card/60">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{settings?.store_phone ?? '+234 800 000 0000'}</span>
              </div>
              <div className="flex items-center gap-3 text-card/60">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{settings?.store_email ?? 'hello@fixam.africa'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { label: 'Facebook', path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                { label: 'Instagram', path: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></> },
                { label: 'Twitter', path: <path d="M4 4l16 16M20 4 4 20" strokeLinecap="round" /> },
                { label: 'YouTube', path: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></> },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-card/10 hover:bg-primary flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6">Shop</h4>
            <ul className="space-y-3">
              {[
                { name: 'All Products',  href: '/products' },
                { name: 'New Arrivals',  href: '/products?sort=newest' },
                { name: 'Best Sellers',  href: '/products?sort=rating' },
                { name: 'Cookware',      href: '/products?category=cookware' },
                { name: 'Appliances',    href: '/products?category=appliances' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-card/60 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-lg mb-6">Support</h4>
            <ul className="space-y-3">
              {[
                { name: 'Contact Us',    href: '/contact' },
                { name: 'Shipping Info', href: '/shipping' },
                { name: 'Returns',       href: '/returns' },
                { name: 'FAQ',           href: '/faq' },
                { name: 'Track Order',   href: '/orders' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-card/60 hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h4 className="font-bold text-lg mb-6">Stay Updated</h4>
            <p className="text-card/60 mb-6 text-sm leading-relaxed">
              Subscribe to our newsletter for exclusive deals, new arrivals, and kitchen tips delivered to your inbox.
            </p>
            <form className="space-y-3" onSubmit={handleSubscribe}>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 bg-card/10 border border-card/20 text-card placeholder:text-card/40 rounded-xl h-12 px-4 text-sm focus:outline-none focus:border-primary transition"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition flex-shrink-0 disabled:opacity-60"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-card/40">By subscribing, you agree to our Privacy Policy.</p>
            </form>

            <div className="mt-8">
              <p className="text-xs text-card/40 mb-3">We accept</p>
              <div className="flex gap-2">
                {['Visa', 'MC', 'Paystack'].map((method) => (
                  <div key={method} className="px-3 py-1.5 bg-card/10 rounded-lg text-xs font-medium text-card/60">
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-card/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-card/50">
            © {new Date().getFullYear()} Fixam Africa. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-card/50">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
