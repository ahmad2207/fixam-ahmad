'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, ArrowRight, CircleCheckBig } from 'lucide-react';
import { toast } from 'sonner';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-7 sm:p-9">

          {/* Logo */}
          <div className="text-center mb-7">
            <Link href="/" className="inline-block mb-5">
              <Image src="/logo.png" alt="Fixam Africa" width={120} height={48} className="h-12 w-auto mx-auto" />
            </Link>
          </div>

          {sent ? (
            /* ── Email sent state ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-green-50 border-4 border-brand-green-100 flex items-center justify-center mx-auto mb-5">
                <CircleCheckBig className="h-8 w-8 text-brand-green-500" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                If an account exists for <strong className="text-gray-700">{email}</strong>, we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              <p className="text-sm text-gray-400">
                Didn&apos;t receive it?{' '}
                <button onClick={() => setSent(false)} className="text-primary font-bold hover:underline">
                  Try again
                </button>
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </div>

          ) : (
            /* ── Request form ── */
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Forgot your password?</h1>
                <p className="text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 mt-2"
                >
                  {isLoading ? 'Sending…' : <><span>Send Reset Link</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between text-sm">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
                <Link href="/signup" className="text-primary font-bold hover:underline">
                  Create account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
