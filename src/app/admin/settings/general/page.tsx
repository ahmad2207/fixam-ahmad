'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface GeneralSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_tagline: string;
}

const DEFAULT: GeneralSettings = {
  store_name: 'Fixam Africa',
  store_email: '',
  store_phone: '',
  store_address: 'Lagos, Nigeria',
  store_tagline: 'Premium Kitchen Products',
};

export default function GeneralSettingsPage() {
  const [form, setForm] = useState<GeneralSettings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/general')
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
      const res = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: form }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Settings saved');
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
        <h1 className="text-2xl font-bold">General Settings</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white border rounded-xl p-6 space-y-4">
        {[
          { name: 'store_name',    label: 'Store Name' },
          { name: 'store_tagline', label: 'Tagline' },
          { name: 'store_email',   label: 'Contact Email',   type: 'email' },
          { name: 'store_phone',   label: 'Contact Phone',   type: 'tel' },
          { name: 'store_address', label: 'Store Address' },
        ].map(({ name, label, type = 'text' }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              name={name}
              type={type}
              value={(form as any)[name]}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
