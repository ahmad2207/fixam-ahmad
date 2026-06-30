'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bell, CheckCircle2, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productImage?: string | null;
}

export function NotifyMeModal({ open, onOpenChange, productId, productName, productImage }: Props) {
  const [name,    setName   ] = useState('');
  const [email,   setEmail  ] = useState('');
  const [phone,   setPhone  ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setName(''); setEmail(''); setPhone('');
    setError(''); setSuccess(false); setLoading(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/notify-me', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId, name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      setSuccess(true);
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">

        {/* Product preview strip */}
        <div className="flex items-center gap-3 bg-gray-50 px-5 py-4 border-b border-gray-100">
          {productImage ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-100">
              <Image src={productImage} alt={productName} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Out of stock</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{productName}</p>
          </div>
        </div>

        <div className="px-5 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-bold text-gray-900">You're on the list!</p>
              <p className="text-sm text-gray-500">We'll notify you at <span className="font-medium text-gray-700">{email}</span> as soon as this product is back in stock.</p>
              <button
                onClick={() => handleOpenChange(false)}
                className="mt-2 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Bell className="h-4 w-4 text-primary" />
                  Notify me when available
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-1">We'll send you a message as soon as it's back in stock.</p>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-gray-50"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Bell className="h-4 w-4" /> Notify Me</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
