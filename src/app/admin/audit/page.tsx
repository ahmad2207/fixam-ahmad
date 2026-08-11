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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{logs.length} entries recorded</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center border-b border-border bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs…"
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          >
            <option value="">All Types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <ScrollText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto divide-y divide-border">
            {filtered.map((entry) => {
              const Icon = entityIcons[entry.entityType ?? ''] ?? ScrollText;
              return (
                <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getActionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                      {entry.entityType && (
                        <span className="text-xs border border-border bg-secondary text-muted-foreground rounded-lg px-2.5 py-1 capitalize font-medium">
                          {entry.entityType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {!!entry.after && (
                      <p className="text-sm text-muted-foreground mt-1.5 truncate">{String(formatDetails(entry.after))}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d, yyyy · h:mm a') : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">Showing <span className="font-semibold text-foreground">{filtered.length}</span> of <span className="font-semibold text-foreground">{logs.length}</span> entries</p>
        </div>
      </div>
    </div>
  );
}
