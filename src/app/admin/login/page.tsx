'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials or insufficient permissions');
      setLoading(false);
    } else {
      toast.success('Welcome, Admin!');
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Fixam"
              width={48}
              height={48}
              className="brightness-0 invert"
            />
            <div className="text-left">
              <span className="block text-2xl font-bold text-white">Fixam</span>
              <span className="text-sm text-gray-400">Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-white">Administrator Access</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in with your admin credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-300 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-300 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          This portal is for authorized personnel only.
        </p>
      </div>
    </div>
  );
}
