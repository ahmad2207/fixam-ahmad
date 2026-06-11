import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { MobileBottomNav } from '@/components/store/MobileBottomNav';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <StoreFooter />
      <MobileBottomNav />
    </>
  );
}
