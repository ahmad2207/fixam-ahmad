import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // DigitalOcean Spaces CDN
      {
        protocol: 'https',
        hostname: '**.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: '**.cdn.digitaloceanspaces.com',
      },
      // Supabase Storage (migrated product images)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Google (for OAuth avatars)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Expose only the public Flutterwave key to the browser
  env: {
    NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
};

export default nextConfig;
