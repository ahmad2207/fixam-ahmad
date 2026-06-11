'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, Mail, Phone, Trash2, CheckCheck, MailOpen,
  MessageSquare, ExternalLink, ChevronDown,
} from 'lucide-react';
import type { ContactMessage } from '@/db/schema';

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  new:     { badge: 'bg-amber-100 text-amber-700',   label: 'New'     },
  read:    { badge: 'bg-blue-100 text-blue-700',     label: 'Read'    },
  replied: { badge: 'bg-emerald-100 text-emerald-700', label: 'Replied' },
};

const TABS = ['all', 'new', 'read', 'replied'] as const;
type Tab = typeof TABS[number];

function MessageDialog({
  message,
  onClose,
  onStatusChange,
  onDelete,
}: {
  message: ContactMessage;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const s = STATUS_STYLES[message.status] ?? STATUS_STYLES.new;

  const setStatus = (status: string) => {
    startTransition(() => onStatusChange(message.id, status));
  };

  const handleDelete = () => {
    if (!confirm('Delete this message permanently?')) return;
    startTransition(() => onDelete(message.id));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {message.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold truncate">{message.name}</h2>
              <p className="text-xs text-gray-400 truncate">{message.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
              {s.label}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={`mailto:${message.email}`} className="text-primary hover:underline truncate">
                {message.email}
              </a>
            </div>
            {message.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${message.phone}`} className="hover:underline">{message.phone}</a>
              </div>
            )}
            {message.subject && (
              <div className="col-span-2 flex items-center gap-2 text-gray-600">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium">{message.subject}</span>
              </div>
            )}
            <div className="col-span-2 text-xs text-gray-400">
              Received{' '}
              {new Date(message.createdAt).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>

          {/* Message body */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{message.message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject ?? 'Your enquiry')}`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Reply via Email
            </a>

            {message.status !== 'read' && (
              <button
                onClick={() => setStatus('read')}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-2 border text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <MailOpen className="w-3.5 h-3.5 text-blue-500" />
                Mark as Read
              </button>
            )}

            {message.status !== 'replied' && (
              <button
                onClick={() => setStatus('replied')}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-2 border text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                Mark as Replied
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto flex items-center gap-2 px-3 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface MessagesStats {
  total: number;
  newCount: number;
  readCount: number;
  repliedCount: number;
}

export default function MessagesClient({
  messages: initial,
  stats,
}: {
  messages: ContactMessage[];
  stats: MessagesStats;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>(initial);

  const filtered = messages.filter((m) => {
    if (tab !== 'all' && m.status !== tab) return false;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.subject ?? '').toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/contact/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  };

  const TAB_LABELS: Record<Tab, string> = {
    all:     `All (${stats.total})`,
    new:     `New (${stats.newCount})`,
    read:    `Read (${stats.readCount})`,
    replied: `Replied (${stats.repliedCount})`,
  };

  return (
    <div>
      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject or message…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Preview</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const s = STATUS_STYLES[m.status] ?? STATUS_STYLES.new;
                return (
                  <tr
                    key={m.id}
                    className={`border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${m.status === 'new' ? 'bg-amber-50/30' : ''}`}
                    onClick={() => {
                      setSelected(m);
                      if (m.status === 'new') handleStatusChange(m.id, 'read');
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className={`font-medium leading-tight ${m.status === 'new' ? 'font-bold' : ''}`}>
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <span className={`truncate block ${m.status === 'new' ? 'font-semibold' : 'text-gray-600'}`}>
                        {m.subject ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-[220px]">
                      <span className="truncate block text-gray-400 text-xs">{m.message}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronDown className="w-3.5 h-3.5 text-gray-300 rotate-[-90deg]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-14 text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {search ? 'No messages match your search.' : tab !== 'all' ? `No ${tab} messages.` : 'No messages yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <MessageDialog
          message={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
