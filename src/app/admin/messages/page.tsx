export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { contactMessages } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { MessageSquare, Inbox, MailOpen, CheckCheck } from 'lucide-react';
import MessagesClient from './MessagesClient';

export default async function AdminMessagesPage() {
  const [messages, [newCount], [readCount], [repliedCount]] = await Promise.all([
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
    db.select({ c: count() }).from(contactMessages).where(eq(contactMessages.status, 'new')),
    db.select({ c: count() }).from(contactMessages).where(eq(contactMessages.status, 'read')),
    db.select({ c: count() }).from(contactMessages).where(eq(contactMessages.status, 'replied')),
  ]);

  const stats = {
    total:        messages.length,
    newCount:     Number(newCount?.c ?? 0),
    readCount:    Number(readCount?.c ?? 0),
    repliedCount: Number(repliedCount?.c ?? 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Contact Messages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{stats.total} messages received</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: stats.total,        icon: Inbox,         color: 'bg-primary/10 text-primary',       border: 'border-primary/15' },
          { label: 'Unread (New)',   value: stats.newCount,     icon: MessageSquare, color: 'bg-amber-50 text-amber-600',       border: 'border-amber-100' },
          { label: 'Read',           value: stats.readCount,    icon: MailOpen,      color: 'bg-blue-50 text-blue-600',         border: 'border-blue-100' },
          { label: 'Replied',        value: stats.repliedCount, icon: CheckCheck,    color: 'bg-emerald-50 text-emerald-600',   border: 'border-emerald-100' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-card rounded-2xl p-5 border shadow-sm ${border}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessagesClient messages={messages} stats={stats} />
    </div>
  );
}
