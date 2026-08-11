'use client';

import Link from 'next/link';
import { Settings2, Truck, Shield, CreditCard, Bell, ChevronRight } from 'lucide-react';

const settingsLinks = [
  {
    href: '/admin/settings/general',
    label: 'General Settings',
    description: 'Store name, contact info, social links and branding',
    icon: Settings2,
    accent: 'bg-primary/10 text-primary',
  },
  {
    href: '/admin/settings/delivery',
    label: 'Delivery Fees',
    description: 'Configure Abuja zones and interstate delivery tiers',
    icon: Truck,
    accent: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/admin/settings/payment',
    label: 'Payment & Bank Details',
    description: 'Bank account numbers shown to customers for transfer payments',
    icon: CreditCard,
    accent: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/admin/settings/notifications',
    label: 'Notifications & Alerts',
    description: 'Configure email alerts for new orders, low stock, and more',
    icon: Bell,
    accent: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/admin/audit',
    label: 'Audit Log',
    description: 'View all admin actions, changes and activity history',
    icon: Shield,
    accent: 'bg-slate-100 text-slate-600',
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your store configuration and preferences</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {settingsLinks.map(({ href, label, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent} transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
