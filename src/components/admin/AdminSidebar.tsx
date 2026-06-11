'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Store, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavGroups } from './adminNavItems';

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? session?.user?.email ?? 'Admin';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const userRole = (session?.user as any)?.role ?? 'admin';

  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">

      {/* ── Logo ── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/30">
          <Image src="/logo.png" alt="Fixam" width={20} height={20} className="brightness-0 invert" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-sidebar-foreground leading-none tracking-tight">Fixam Africa</p>
          <p className="text-[10px] text-sidebar-foreground/35 mt-0.5 font-medium">Admin Console</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-5">
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
                      className={cn(
                        'group relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150',
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
                          'h-[15px] w-[15px] shrink-0 transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70',
                        )}
                      />
                      <span className="flex-1 leading-none">{label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Bottom ── */}
      <div className="p-3 border-t border-sidebar-border flex-shrink-0 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          <Store className="h-[15px] w-[15px] shrink-0" />
          <span className="flex-1">View Store</span>
          <ChevronRight className="h-3 w-3 opacity-30" />
        </Link>

        {/* User card */}
        <div className="mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-primary">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-none">{userName}</p>
            <p className="text-[10px] text-sidebar-foreground/35 mt-0.5 capitalize">{userRole}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            title="Sign out"
            className="p-1.5 rounded-md text-sidebar-foreground/35 hover:text-destructive hover:bg-destructive/15 transition-colors flex-shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
