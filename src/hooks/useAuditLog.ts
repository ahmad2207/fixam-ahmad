'use client';

import { useQuery } from '@tanstack/react-query';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export function useAuditLog(params?: { entityType?: string; entityId?: string; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.entityType) searchParams.set('entityType', params.entityType);
  if (params?.entityId) searchParams.set('entityId', params.entityId);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  return useQuery<AuditLogEntry[]>({
    queryKey: ['audit-log', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit?${searchParams}`);
      if (!res.ok) throw new Error('Failed to fetch audit log');
      return res.json();
    },
  });
}
