import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Fixam Africa',
  description: 'Quality products delivered to you',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans min-h-full flex flex-col antialiased`}>
        <SessionProvider>
          <QueryProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <Toaster richColors position="top-right" />
              </WishlistProvider>
            </CartProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
