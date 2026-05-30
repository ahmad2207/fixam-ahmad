'use client';

import Link from 'next/link';
import { Settings2, Truck, Shield, CreditCard, Bell } from 'lucide-react';

const settingsLinks = [
  {
    href: '/admin/settings/general',
    label: 'General Settings',
    description: 'Store name, contact info, and other settings',
    icon: Settings2,
  },
  {
    href: '/admin/settings/delivery',
    label: 'Delivery Fees',
    description: 'Configure Abuja zones and interstate delivery tiers',
    icon: Truck,
  },
  {
    href: '/admin/settings/payment',
    label: 'Payment & Bank Details',
    description: 'Bank account numbers shown to customers for transfer payments',
    icon: CreditCard,
  },
  {
    href: '/admin/settings/notifications',
    label: 'Notifications & Alerts',
    description: 'Configure email alerts for new orders, low stock, and more',
    icon: Bell,
  },
  {
    href: '/admin/audit',
    label: 'Audit Log',
    description: 'View all admin actions and changes',
    icon: Shield,
  },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {settingsLinks.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border rounded-xl p-6 hover:shadow-sm transition group"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{label}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
