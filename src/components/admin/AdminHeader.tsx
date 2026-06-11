'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Menu, X, Store, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavGroups } from './adminNavItems';

function usePageMeta(pathname: string): { title: string; group: string } {
  const all = adminNavGroups.flatMap((g) =>
    g.items.map((i) => ({ ...i, group: g.label })),
  );
  const match = all.find((i) =>
    i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href),
  );
  return { title: match?.label ?? 'Admin', group: match?.group ?? '' };
}

export function AdminHeader() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { title, group } = usePageMeta(pathname);

  const userName = session?.user?.name ?? session?.user?.email ?? 'Admin';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="h-14 bg-card border-b border-border flex items-center gap-4 px-4 md:px-6 flex-shrink-0">

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary transition"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          {group && (
            <>
              <span className="text-muted-foreground/50 font-medium">{group}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
            </>
          )}
          <span className="font-semibold text-foreground">{title}</span>
        </div>

        {/* Mobile title */}
        <span className="md:hidden font-semibold text-sm text-foreground truncate">{title}</span>

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition border border-transparent hover:border-border"
          >
            <Store className="w-3.5 h-3.5" />
            View Store
          </Link>

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-primary">{userInitials}</span>
            </div>
            <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[130px] truncate leading-none">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              title="Sign out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col shadow-2xl">

            {/* Drawer header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Image src="/logo.png" alt="Fixam" width={16} height={16} className="brightness-0 invert" />
                </div>
                <span className="text-sm font-bold text-sidebar-foreground">Fixam Africa</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
              {adminNavGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1.5 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.12em]">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const isActive =
                        href === '/admin'
                          ? pathname === '/admin'
                          : pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all',
                            isActive
                              ? 'bg-primary/12 text-primary'
                              : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
                          )}
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-primary' : 'text-sidebar-foreground/40',
                            )}
                          />
                          <span className="flex-1">{label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Drawer bottom */}
            <div className="p-3 border-t border-sidebar-border flex-shrink-0 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent transition"
              >
                <Store className="h-4 w-4 shrink-0" />
                View Store
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/55 hover:text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
