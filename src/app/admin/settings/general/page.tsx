'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Save, Store, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface GeneralSettings {
  store_name:      string;
  store_email:     string;
  store_phone:     string;
  store_address:   string;
  facebook_url:    string;
  instagram_url:   string;
  twitter_url:     string;
  whatsapp_number: string;
  youtube_url:     string;
  tiktok_url:      string;
}

const DEFAULT: GeneralSettings = {
  store_name:      'Fixam Africa',
  store_email:     '',
  store_phone:     '',
  store_address:   '',
  facebook_url:    '',
  instagram_url:   '',
  twitter_url:     '',
  whatsapp_number: '',
  youtube_url:     '',
  tiktok_url:      '',
};

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

const STORE_FIELDS: { name: keyof GeneralSettings; label: string; type?: string; placeholder?: string; Icon: React.ElementType }[] = [
  { name: 'store_name',    label: 'Store Name',     Icon: Store,          placeholder: 'Fixam Africa' },
  { name: 'store_email',   label: 'Contact Email',  Icon: Mail,   type: 'email', placeholder: 'hello@store.com' },
  { name: 'store_phone',   label: 'Contact Phone',  Icon: Phone,  type: 'tel',   placeholder: '+234 800 000 0000' },
  { name: 'store_address', label: 'Store Address',  Icon: MapPin,         placeholder: 'Lagos, Nigeria' },
];

const SOCIAL_FIELDS: { name: keyof GeneralSettings; label: string; placeholder: string; Icon: React.ElementType; color: string }[] = [
  { name: 'facebook_url',    label: 'Facebook',    placeholder: 'https://facebook.com/yourpage',    Icon: FacebookIcon,   color: 'text-blue-600' },
  { name: 'instagram_url',   label: 'Instagram',   placeholder: 'https://instagram.com/yourhandle', Icon: InstagramIcon,  color: 'text-pink-500' },
  { name: 'twitter_url',     label: 'X / Twitter', placeholder: 'https://x.com/yourhandle',         Icon: XIcon,          color: 'text-gray-900' },
  { name: 'whatsapp_number', label: 'WhatsApp',    placeholder: '+2348000000000',                   Icon: MessageCircle,  color: 'text-emerald-500' },
  { name: 'youtube_url',     label: 'YouTube',     placeholder: 'https://youtube.com/@yourchannel', Icon: YouTubeIcon,    color: 'text-red-500' },
  { name: 'tiktok_url',      label: 'TikTok',      placeholder: 'https://tiktok.com/@yourhandle',   Icon: TikTokIcon,     color: 'text-gray-900' },
];

export default function GeneralSettingsPage() {
  const [form, setForm]       = useState<GeneralSettings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/general')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setForm({ ...DEFAULT, ...data }); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        toast.error('Unauthorized — please sign in as admin and try again');
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      toast.success('Settings saved');
    } catch (err) {
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

      <form onSubmit={handleSave} className="space-y-5">

        {/* Store info */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Store Info</h2>
          {STORE_FIELDS.map(({ name, label, type = 'text', placeholder, Icon }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Social media */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Social Media</h2>
          {SOCIAL_FIELDS.map(({ name, label, placeholder, Icon, color }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${color}`} />
                <input
                  name={name}
                  type={name === 'whatsapp_number' ? 'tel' : 'url'}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
