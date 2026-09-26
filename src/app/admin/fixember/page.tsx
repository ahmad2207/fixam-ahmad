'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, Upload, Loader2,
  ToggleLeft, ToggleRight, ImageIcon, Gift, Trophy,
} from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import type { FixemberPrize } from '@/db/schema/fixemberPrizes';
import Image from 'next/image';
import Link from 'next/link';

/* ─── types ─── */
type PrizeForm = {
  label: string;
  imageUrl: string;
  isPrize: boolean;
  isActive: boolean;
};

function emptyForm(): PrizeForm {
  return { label: '', imageUrl: '', isPrize: true, isActive: true };
}

interface Winner {
  id: string;
  prizeLabel: string;
  customerName: string | null;
  customerPhone: string | null;
  guestEmail: string | null;
  fulfillmentStatus: string;
  createdAt: string;
  orderId: string;
  orderNumber: string | null;
}

const FULFILLMENT_LABELS: Record<string, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  fulfilled: 'Fulfilled',
};

/* ─── Prize icon upload ─── */
function PrizeImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload('fixember');

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onChange(url);
  };

  return (
    <div
      className={`relative w-24 h-24 border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors flex-shrink-0 ${
        value ? 'border-transparent' : 'border-border hover:border-primary'
      }`}
      onClick={() => fileRef.current?.click()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {value ? (
        <>
          <Image src={value} alt="" fill className="object-contain p-1" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
        </>
      ) : isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

/* ─── Create / Edit form ─── */
function PrizeFormPanel({
  initial, onSave, onCancel, isSaving,
}: {
  initial: PrizeForm;
  onSave: (f: PrizeForm) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<PrizeForm>(initial);
  const set = <K extends keyof PrizeForm>(k: K, v: PrizeForm[K]) => setForm((p) => ({ ...p, [k]: v }));
  const canSave = !!form.label.trim();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex gap-4 items-start">
        <PrizeImageUpload value={form.imageUrl} onChange={(url) => set('imageUrl', url)} />
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Segment Label *</label>
          <input value={form.label} onChange={(e) => set('label', e.target.value)}
            placeholder="e.g. Airfryer, Try Again, Shop With Us Next Time"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
          <p className="text-[11px] text-muted-foreground">Icon is optional — a plain label still shows on the wheel.</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Segment Type</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => set('isPrize', true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
              form.isPrize ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
            }`}>
            <Gift className="w-4 h-4" /> Real prize
          </button>
          <button type="button" onClick={() => set('isPrize', false)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
              !form.isPrize ? 'border-foreground bg-secondary text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
            }`}>
            &quot;You didn&apos;t win&quot; segment
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          This only controls what shows on the wheel — the actual chance of winning is fixed separately at 1 in 100, regardless of how many prize vs. non-prize segments exist.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set('isActive', !form.isActive)}
          className={`transition-colors ${form.isActive ? 'text-emerald-500' : 'text-gray-300'}`}>
          {form.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
        </button>
        <span className="text-sm font-medium text-gray-700">
          {form.isActive ? 'Active — on the wheel' : 'Inactive — hidden from the wheel'}
        </span>
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <button onClick={() => onSave(form)} disabled={isSaving || !canSave}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition disabled:opacity-40 shadow-sm shadow-primary/20">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isSaving ? 'Saving…' : 'Save Segment'}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition text-muted-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
const TABS = ['segments', 'winners'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = { segments: 'Wheel Segments', winners: 'Winners' };

export default function FixemberPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('segments');
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPrize, setEditing] = useState<FixemberPrize | null>(null);

  const { data: prizes = [], isLoading } = useQuery<FixemberPrize[]>({
    queryKey: ['admin-fixember-prizes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/fixember/prizes');
      if (!res.ok) throw new Error('Failed to fetch prizes');
      return res.json();
    },
  });

  const invalidatePrizes = () => qc.invalidateQueries({ queryKey: ['admin-fixember-prizes'] });

  const createMut = useMutation({
    mutationFn: async (form: PrizeForm) => {
      const res = await fetch('/api/admin/fixember/prizes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sortOrder: prizes.length }),
      });
      if (!res.ok) throw new Error('Failed to create');
    },
    onSuccess: () => { toast.success('Segment added'); invalidatePrizes(); setMode('list'); },
    onError: () => toast.error('Failed to add segment'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PrizeForm }) => {
      const res = await fetch(`/api/admin/fixember/prizes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update');
    },
    onSuccess: () => { toast.success('Segment updated'); invalidatePrizes(); setMode('list'); setEditing(null); },
    onError: () => toast.error('Failed to update segment'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/fixember/prizes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => { toast.success('Segment deleted'); invalidatePrizes(); },
    onError: () => toast.error('Failed to delete segment'),
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      await fetch(`/api/admin/fixember/prizes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
    },
    onSuccess: invalidatePrizes,
  });

  const toggleActive = async (prize: FixemberPrize) => {
    await fetch(`/api/admin/fixember/prizes/${prize.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !prize.isActive }),
    });
    invalidatePrizes();
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    moveMut.mutate({ id: prizes[i].id, newOrder: prizes[i - 1].sortOrder });
    moveMut.mutate({ id: prizes[i - 1].id, newOrder: prizes[i].sortOrder });
  };
  const moveDown = (i: number) => {
    if (i === prizes.length - 1) return;
    moveMut.mutate({ id: prizes[i].id, newOrder: prizes[i + 1].sortOrder });
    moveMut.mutate({ id: prizes[i + 1].id, newOrder: prizes[i].sortOrder });
  };

  const handleEdit = (p: FixemberPrize) => {
    setEditing(p);
    setMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancel = () => { setMode('list'); setEditing(null); };

  /* ─── Winners tab ─── */
  const { data: winners = [], isLoading: winnersLoading } = useQuery<Winner[]>({
    queryKey: ['admin-fixember-winners'],
    queryFn: async () => {
      const res = await fetch('/api/admin/fixember/winners');
      if (!res.ok) throw new Error('Failed to fetch winners');
      return res.json();
    },
    enabled: tab === 'winners',
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/admin/fixember/winners/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentStatus: status }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fixember-winners'] }),
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Fixember Spin &amp; Win</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage the wheel&apos;s segments and track winners — customers get one spin per order of ₦150,000+, with a fixed 1-in-100 chance of winning.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-1 flex gap-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'segments' && (
        <>
          {mode === 'list' && (
            <div className="flex justify-end">
              <button onClick={() => setMode('create')}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition shadow-sm shadow-primary/20">
                <Plus className="w-4 h-4" /> Add Segment
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <h2 className="font-bold text-base mb-3">New Segment</h2>
              <PrizeFormPanel initial={emptyForm()} onSave={(f) => createMut.mutate(f)} onCancel={handleCancel} isSaving={createMut.isPending} />
            </div>
          )}

          {mode === 'edit' && editingPrize && (
            <div>
              <h2 className="font-bold text-base mb-3">Edit Segment</h2>
              <PrizeFormPanel
                initial={{
                  label: editingPrize.label,
                  imageUrl: editingPrize.imageUrl ?? '',
                  isPrize: editingPrize.isPrize,
                  isActive: editingPrize.isActive,
                }}
                onSave={(f) => updateMut.mutate({ id: editingPrize.id, form: f })}
                onCancel={handleCancel}
                isSaving={updateMut.isPending}
              />
            </div>
          )}

          {mode === 'list' && (
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)
              ) : prizes.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                  <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No wheel segments yet</p>
                </div>
              ) : (
                prizes.map((prize, i) => (
                  <div key={prize.id} className="bg-card border border-border rounded-2xl overflow-hidden flex items-center gap-4 px-4 py-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {prize.imageUrl ? (
                        <Image src={prize.imageUrl} alt={prize.label} fill className="object-contain p-1" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm text-foreground truncate">{prize.label}</p>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          prize.isPrize ? 'bg-primary/5 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {prize.isPrize ? 'Prize' : "Doesn't win"}
                        </span>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prize.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'}`}>
                          {prize.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveUp(i)} disabled={i === 0}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 transition">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveDown(i)} disabled={i === prizes.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 transition">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => toggleActive(prize)} title={prize.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition ${prize.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                        {prize.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => handleEdit(prize)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${prize.label}"?`)) deleteMut.mutate(prize.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {tab === 'winners' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {winnersLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : winners.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No winners yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left">
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Customer</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prize</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {winners.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${w.orderId}`} className="text-primary font-semibold hover:underline">
                          {w.orderNumber ?? `#${w.orderId.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{w.customerName ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{w.customerPhone ?? w.guestEmail ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{w.prizeLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(w.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={w.fulfillmentStatus}
                          onChange={(e) => statusMut.mutate({ id: w.id, status: e.target.value })}
                          className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {Object.entries(FULFILLMENT_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
