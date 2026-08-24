import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // The screen-mode `h-screen overflow-hidden` chain clips everything to
    // one viewport-sized box — necessary for the fixed sidebar/scrollable
    // main layout on screen, but it means window.print() on any admin page
    // (e.g. a receipt) only rasterizes whatever fits in that clipped box
    // rather than flowing the full document across pages, which is what
    // made a printed receipt look like a cropped screenshot of the app
    // shell instead of a normal printable document. `print:` overrides let
    // the containers size to content and scroll normally under print, and
    // the sidebar/header hide themselves (see their own print:hidden).
    <div className="flex h-screen overflow-hidden bg-muted/40 print:block print:h-auto print:overflow-visible">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden print:block print:overflow-visible">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:overflow-visible print:p-0">
          <div className="max-w-[1400px] mx-auto print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
