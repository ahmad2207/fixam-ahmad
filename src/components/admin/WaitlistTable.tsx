'use client';

import { useState } from 'react';
import { Bell, BellOff, CheckCircle2, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notifiedAt: string | null;
  createdAt: string;
}

interface Props {
  entries: WaitlistEntry[];
}

export function WaitlistTable({ entries: initial }: Props) {
  const [entries, setEntries] = useState(initial);
  const [marking, setMarking] = useState<string | null>(null);

  const markNotified = async (id: string) => {
    setMarking(id);
    try {
      const res = await fetch('/api/admin/stock-notifications', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setEntries(prev =>
        prev.map(e => e.id === id ? { ...e, notifiedAt: new Date().toISOString() } : e),
      );
      toast.success('Marked as notified');
    } catch {
      toast.error('Failed to update. Try again.');
    } finally {
      setMarking(null);
    }
  };

  const pending   = entries.filter(e => !e.notifiedAt);
  const notified  = entries.filter(e =>  e.notifiedAt);

  return (
    <div className="bg-white border rounded-2xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold text-gray-900">
            Customer Waitlist
            <span className="ml-2 text-xs font-normal text-gray-400">
              {entries.length} total · {pending.length} pending
            </span>
          </h2>
        </div>
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pending.length} awaiting notification
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-center py-8 text-sm text-gray-400">No customers on the waitlist for this product.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Registered</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map(entry => (
                <tr key={entry.id} className={entry.notifiedAt ? 'opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-800">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {entry.email}
                      </span>
                      {entry.phone && (
                        <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {entry.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString('en-NG', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {entry.notifiedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Notified {new Date(entry.notifiedAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <BellOff className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!entry.notifiedAt && (
                      <button
                        onClick={() => markNotified(entry.id)}
                        disabled={marking === entry.id}
                        className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {marking === entry.id ? 'Saving…' : 'Mark Notified'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
