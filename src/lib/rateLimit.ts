import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// This app runs on Vercel (serverless) — an in-memory counter wouldn't work,
// since each request can land on a different, ephemeral function instance
// with no shared state. Upstash's REST-based Redis is the standard fix for
// exactly this: a shared counter reachable over plain HTTP from any runtime.
//
// Rate limiting is OFF (fail-open) until UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set — this lets the app run locally and in
// any environment without those configured, rather than hard-failing every
// guarded route. A single warning is logged the first time a check would
// have run, so a missing config doesn't go unnoticed.

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

let warnedOnce = false;

// Named limiters, one per sensitive surface — separate budgets so a burst
// against one endpoint (e.g. login) can't be worked around by hitting a
// different one, and so each can be tuned independently.
const limiters = redis
  ? {
      // Credential login: brute-force guessing guard.
      login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:login' }),
      // Account creation: prevent mass fake-account signup.
      signup: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:signup' }),
      // Forgot-password: prevent email-bombing a victim address or enumerating accounts.
      forgotPassword: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '60 s'), prefix: 'rl:forgot-pw' }),
      // Checkout: prevent stock-reservation abuse / order spam via scripted requests.
      payment: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s'), prefix: 'rl:payment' }),
      // Contact form: prevent spam submissions.
      contact: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:contact' }),
    }
  : null;

export type RateLimitKind = keyof NonNullable<typeof limiters>;

// Vercel sets x-forwarded-for on every request; NextRequest.ip was removed
// in newer Next versions, so this is the reliable way to get the client IP.
export function getClientIp(req: NextRequest | Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

// identifier should be something like the client IP, optionally combined
// with a per-request value (e.g. `${ip}:${email}`) for tighter scoping.
export async function checkRateLimit(kind: RateLimitKind, identifier: string): Promise<RateLimitResult> {
  if (!limiters) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        '[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled (fail-open).',
      );
    }
    return { success: true };
  }

  const { success, limit, remaining, reset } = await limiters[kind].limit(identifier);
  return { success, limit, remaining, reset };
}
