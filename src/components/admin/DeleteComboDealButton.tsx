'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteComboDealButton({ comboId, name }: { comboId: string; name: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/combo-deals/${comboId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Bundle deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete bundle');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-600 border border-border rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition disabled:opacity-50"
      title="Delete bundle"
    >
      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      Delete
    </button>
  );
}
