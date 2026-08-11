'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShoppingBag, Truck, Shield } from 'lucide-react';
import { toast } from 'sonner';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

const GoogleIcon = () => (
  <svg className="h-4.5 w-4.5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
      router.push(callbackUrl);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">

      {/* ── FORM SIDE ── */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">

            {/* Logo + heading */}
            <div className="text-center mb-5">
              <Link href="/" className="inline-block mb-3">
                <Image src="/logo.png" alt="Fixam Africa" width={100} height={40} className="h-10 w-auto mx-auto" />
              </Link>
              <h1 className="text-xl font-extrabold text-gray-900">Welcome back</h1>
              <p className="text-xs text-gray-500 mt-0.5">Sign in to your Fixam Africa account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${inputCls} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : (
                  <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full h-10 flex items-center justify-center gap-2.5 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 rounded-lg font-semibold text-sm text-gray-700 transition-all"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Sign up link */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── BRAND PANEL — desktop only ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-end">
        <Image src="/hero-kitchen.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-gray-900/20" />
        <div className="relative z-10 p-12 text-white">
          <Image src="/logo.png" alt="Fixam Africa" width={130} height={52} className="h-13 w-auto mb-6 brightness-0 invert" />
          <h2 className="text-4xl font-black leading-tight mb-3">
            Africa&apos;s #1<br />Kitchen Store
          </h2>
          <p className="text-white/75 text-sm mb-6 max-w-xs">
            Premium cookware, smart appliances and culinary essentials — delivered nationwide.
          </p>
          <div className="space-y-2.5">
            {[
              { icon: ShoppingBag, text: '500+ premium products' },
              { icon: Truck,       text: 'Fast nationwide delivery' },
              { icon: Shield,      text: 'Pay on delivery available' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-white/80">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
