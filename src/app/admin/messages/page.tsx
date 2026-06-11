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
    <div>
      <h1 className="text-2xl font-bold mb-6">Contact Messages</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Inbox className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Messages</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Unread (New)</p>
            <p className="text-2xl font-bold">{stats.newCount}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <MailOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Read</p>
            <p className="text-2xl font-bold">{stats.readCount}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Replied</p>
            <p className="text-2xl font-bold">{stats.repliedCount}</p>
          </div>
        </div>
      </div>

      <MessagesClient messages={messages} stats={stats} />
    </div>
  );
}
