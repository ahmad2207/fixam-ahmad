'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Bell } from 'lucide-react';
import Link from 'next/link';

interface NotificationSettings {
  notify_new_order: boolean;
  notify_low_stock: boolean;
  low_stock_threshold: number;
  notification_email: string;
  notify_payment_confirmed: boolean;
  notify_order_cancelled: boolean;
}

const DEFAULT: NotificationSettings = {
  notify_new_order: true,
  notify_low_stock: true,
  low_stock_threshold: 5,
  notification_email: '',
  notify_payment_confirmed: false,
  notify_order_cancelled: true,
};

export default function NotificationsSettingsPage() {
  const [form, setForm] = useState<NotificationSettings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/notifications')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.value) setForm({ ...DEFAULT, ...data.value });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = (name: keyof NotificationSettings) => {
    setForm((p) => ({ ...p, [name]: !p[name] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: form }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const toggleItems: { name: keyof NotificationSettings; label: string; description: string }[] = [
    {
      name: 'notify_new_order',
      label: 'New Order Placed',
      description: 'Get notified when a customer places a new order',
    },
    {
      name: 'notify_payment_confirmed',
      label: 'Payment Confirmed',
      description: 'Get notified when a payment is confirmed (Paystack or manual)',
    },
    {
      name: 'notify_order_cancelled',
      label: 'Order Cancelled',
      description: 'Get notified when an order is cancelled',
    },
    {
      name: 'notify_low_stock',
      label: 'Low Stock Alert',
      description: 'Get notified when a product falls below the stock threshold',
    },
  ];

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/settings" className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Notifications & Alerts</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Notification Email */}
        <div className="bg-white border rounded-xl p-6">
          <label className="block text-sm font-semibold mb-1">Notification Email</label>
          <p className="text-xs text-gray-400 mb-3">All alert emails will be sent to this address.</p>
          <input
            name="notification_email"
            type="email"
            value={form.notification_email}
            onChange={handleChange}
            placeholder="admin@yourstore.com"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Alert Toggles */}
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Alert Types</h2>
          </div>

          {toggleItems.map(({ name, label, description }) => (
            <div key={name} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(name)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  form[name] ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form[name] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Low Stock Threshold */}
        {form.notify_low_stock && (
          <div className="bg-white border rounded-xl p-6">
            <label className="block text-sm font-semibold mb-1">Low Stock Threshold</label>
            <p className="text-xs text-gray-400 mb-3">
              You'll receive an alert when a product's stock falls below this number.
            </p>
            <div className="flex items-center gap-3">
              <input
                name="low_stock_threshold"
                type="number"
                min={1}
                max={100}
                value={form.low_stock_threshold}
                onChange={handleChange}
                className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-500">units</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </form>
    </div>
  );
}
