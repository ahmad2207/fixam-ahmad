'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Store, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavItems as navItems } from './adminNavItems';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-6 border-b border-sidebar-border shrink-0">
        <Image src="/logo.png" alt="Fixam" width={32} height={32} className="brightness-0 invert" />
        <div>
          <span className="text-lg font-bold text-sidebar-foreground">Fixam</span>
          <span className="block text-xs text-sidebar-foreground/60">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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

      {/* Bottom actions */}
      <div className="p-3 space-y-0.5 border-t border-sidebar-border shrink-0">
        <Link
          href="/"
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
  );
}
