'use client';

import { useState } from 'react';
import { ScrollText, Search, Package, ShoppingCart, Settings, Shield, Warehouse, Clock } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { format } from 'date-fns';

const entityIcons: Record<string, React.ElementType> = {
  product: Package,
  order: ShoppingCart,
  inventory: Warehouse,
  inventory_batch: Warehouse,
  settings: Settings,
  user_role: Shield,
};

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  status_change: 'bg-amber-100 text-amber-800',
  restock: 'bg-violet-100 text-violet-800',
};

function getActionColor(action: string) {
  const key = Object.keys(actionColors).find((k) => action.toLowerCase().includes(k));
  return key ? actionColors[key] : 'bg-gray-100 text-gray-700';
}

function formatDetails(details: unknown): string {
  const d = details as any;
  if (!d) return '';
  if (d.product_name) return `Product: ${d.product_name}`;
  if (d.order_number) return `Order: ${d.order_number}`;
  if (d.old_status && d.new_status) return `Status: ${d.old_status} → ${d.new_status}`;
  if (d.target_email) return `User: ${d.target_email}`;
  if (d.quantity) return `Quantity: ${d.quantity}`;
  return JSON.stringify(d).slice(0, 100);
}

const ENTITY_TYPES = ['product', 'order', 'inventory', 'inventory_batch', 'settings', 'user_role'];

export default function AdminAuditPage() {
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs = [], isLoading } = useAuditLog({
    entityType: entityFilter || undefined,
    limit: 100,
  });

  const filtered = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.entityType ?? '').toLowerCase().includes(q) ||
      JSON.stringify(log.after ?? {}).toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

      <div className="bg-white border rounded-xl">
        {/* Filters */}
        <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto divide-y">
            {filtered.map((entry) => {
              const Icon = entityIcons[entry.entityType ?? ''] ?? ScrollText;
              return (
                <div key={entry.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getActionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                      {entry.entityType && (
                        <span className="text-xs border border-gray-200 rounded px-2 py-0.5 capitalize">
                          {entry.entityType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {!!entry.after && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{String(formatDetails(entry.after))}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d, yyyy · h:mm a') : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 border-t">
          <p className="text-sm text-gray-500">Showing {filtered.length} of {logs.length} entries</p>
        </div>
      </div>
    </div>
  );
}
