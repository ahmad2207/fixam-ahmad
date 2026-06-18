import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
images: {
    // Images are served from Supabase CDN / DigitalOcean Spaces CDN which already
    // handle optimisation and caching. Disabling Next.js optimisation bypasses the
    // remotePatterns check that Turbopack's image-optimizer worker fails to load.
    unoptimized: true,
  },
  // Expose only the public Flutterwave key to the browser
  env: {
    NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
};

export default nextConfig;
