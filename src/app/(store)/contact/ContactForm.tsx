'use client';

import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

const SUBJECTS = [
  'General Inquiry',
  'Order Issue',
  'Product Question',
  'Return / Refund',
  'Bulk / Wholesale Order',
  'Partnership',
  'Feedback',
  'Other',
];

type Field = { name: string; email: string; phone: string; subject: string; message: string };
const EMPTY: Field = { name: '', email: '', phone: '', subject: '', message: '' };

export function ContactForm() {
  const [form, setForm]     = useState<Field>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof Field, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong. Please try again.'); return; }
      setSent(true);
      setForm(EMPTY);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">
          Thanks for reaching out. We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-sm font-bold text-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="John Doe"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Subject
          </label>
          <select
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50 focus:bg-white appearance-none"
          >
            <option value="">Select a subject…</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Tell us how we can help you…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50 focus:bg-white resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length} chars</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all hover:shadow-lg disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="w-4 h-4" /> Send Message</>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        We typically respond within 24 hours on business days.
      </p>
    </form>
  );
}
