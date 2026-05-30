'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import Link from 'next/link';

interface PaymentSettings {
  bank_name: string;
  account_number: string;
  account_name: string;
  bank_name_2: string;
  account_number_2: string;
  account_name_2: string;
  payment_instructions: string;
}

const DEFAULT: PaymentSettings = {
  bank_name: '',
  account_number: '',
  account_name: '',
  bank_name_2: '',
  account_number_2: '',
  account_name_2: '',
  payment_instructions: '',
};

export default function PaymentSettingsPage() {
  const [form, setForm] = useState<PaymentSettings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/payment')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.value) setForm({ ...DEFAULT, ...data.value });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: form }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Payment settings saved');
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

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/settings" className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Payment & Bank Details</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Primary Account */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Primary Bank Account</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <input
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              placeholder="e.g. First Bank Nigeria"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account Number</label>
            <input
              name="account_number"
              value={form.account_number}
              onChange={handleChange}
              placeholder="10-digit account number"
              maxLength={10}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account Name</label>
            <input
              name="account_name"
              value={form.account_name}
              onChange={handleChange}
              placeholder="Name as it appears on the account"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Secondary Account (optional) */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Secondary Bank Account <span className="text-gray-400 normal-case font-normal">(optional)</span></h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <input
              name="bank_name_2"
              value={form.bank_name_2}
              onChange={handleChange}
              placeholder="e.g. GTBank"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account Number</label>
            <input
              name="account_number_2"
              value={form.account_number_2}
              onChange={handleChange}
              placeholder="10-digit account number"
              maxLength={10}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account Name</label>
            <input
              name="account_name_2"
              value={form.account_name_2}
              onChange={handleChange}
              placeholder="Name as it appears on the account"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Payment instructions shown to customers */}
        <div className="bg-white border rounded-xl p-6">
          <label className="block text-sm font-semibold mb-1">Payment Instructions (shown to customers)</label>
          <p className="text-xs text-gray-400 mb-2">These instructions appear on the checkout page and order confirmation email when bank transfer is selected.</p>
          <textarea
            name="payment_instructions"
            value={form.payment_instructions}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Transfer to the account above and send proof of payment to our WhatsApp..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </form>
    </div>
  );
}
