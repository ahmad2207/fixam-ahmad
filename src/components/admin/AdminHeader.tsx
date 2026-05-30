'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, User, Menu, X, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavItems } from './adminNavItems';

export function AdminHeader() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary transition"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:block" />

        {/* User + sign out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{session?.user?.name ?? session?.user?.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />

          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="h-14 flex items-center justify-between px-6 border-b border-sidebar-border shrink-0">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Fixam" width={28} height={28} className="brightness-0 invert" />
                <div>
                  <span className="text-base font-bold text-sidebar-foreground">Fixam</span>
                  <span className="block text-xs text-sidebar-foreground/60">Admin Panel</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 space-y-0.5 border-t border-sidebar-border shrink-0">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              >
                <Store className="h-4 w-4 shrink-0" />
                View Store
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
