'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. It
              expires in 1 hour.
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't get it?{' '}
              <button
                onClick={() => setSent(false)}
                className="text-primary font-medium hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Forgot password?</h1>
              <p className="text-muted-foreground mt-2">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
                {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
