'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, ArrowRight, CircleCheckBig, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setIsLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) { setApiError(data.error ?? 'Failed to reset password'); setIsLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push('/login'), 2500);
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

          {/* Invalid token */}
          {!token && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-2">Invalid Reset Link</h1>
              <p className="text-sm text-gray-500 mb-6">This password reset link is missing a token or has expired.</p>
              <Link href="/forgot-password" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors">
                Request a New Link
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Success state */}
          {token && done && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-5">
                <CircleCheckBig className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-2">Password Reset!</h1>
              <p className="text-sm text-gray-500 mb-6">Your password has been updated. Redirecting to sign in…</p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {/* Form */}
          {token && !done && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Set New Password</h1>
                <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className={`${inputCls} pl-10 pr-11`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`${inputCls} pl-10 pr-11`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {apiError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 mt-2"
                >
                  {isLoading ? 'Saving…' : <><span>Reset Password</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
