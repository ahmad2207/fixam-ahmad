'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, Upload, Loader2, ToggleLeft, ToggleRight, ImageIcon } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { BANNER_THEMES, BANNER_TYPE_META } from '@/db/schema/banners';
import type { Banner, BannerType } from '@/db/schema/banners';
import Image from 'next/image';

/* ─── types ─── */
type BannerForm = {
  bannerType: BannerType;
  title:      string;
  imageUrl:   string;
  eyebrow:    string;
  heading:    string;
  subheading: string;
  ctaLabel:   string;
  ctaHref:    string;
  theme:      string;
  isActive:   boolean;
};

function emptyForm(type: BannerType): BannerForm {
  return { bannerType: type, title: '', imageUrl: '', eyebrow: '', heading: '', subheading: '', ctaLabel: '', ctaHref: '', theme: 'dark', isActive: true };
}

/* ─── Banner image upload zone ─── */
function BannerImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload('banners');

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onChange(url);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
        value ? 'border-transparent' : 'border-border hover:border-primary'
      }`}
      style={{ aspectRatio: '16/6' }}
      onClick={() => fileRef.current?.click()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {value ? (
        <>
          {value.toLowerCase().endsWith('.gif') ? (
            <img src={value} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Image src={value} alt="Banner preview" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-white text-center">
              <Upload className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs font-semibold">Change image</p>
            </div>
          </div>
        </>
      ) : isUploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Uploading…</p>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Click or drop a banner image</p>
          <p className="text-xs text-muted-foreground/60">Recommended: 1600 × 600 px · JPG, PNG or GIF · max 20 MB</p>
        </div>
      )}
      {isUploading && value && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

/* ─── Create / Edit form ─── */
function BannerFormPanel({
  initial, activeType, onSave, onCancel, isSaving,
}: {
  initial: BannerForm;
  activeType: BannerType;
  onSave: (f: BannerForm) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<BannerForm>(initial);
  const set = (k: keyof BannerForm, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const isCta = form.bannerType === 'cta';
  const canSave = !!form.title && !!form.heading && (isCta || !!form.imageUrl);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
      {/* Banner image */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Banner Image{isCta ? ' (optional — overlaid on dark gradient)' : ' *'}
        </label>
        <BannerImageUpload value={form.imageUrl} onChange={(url) => set('imageUrl', url)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Internal title */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Internal Title *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Cookware Sale Jan 2025"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
        </div>
        {/* Eyebrow */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {isCta ? 'Eyebrow Text' : 'Badge Text'}
          </label>
          <input value={form.eyebrow} onChange={(e) => set('eyebrow', e.target.value)}
            placeholder={isCta ? 'New Collection' : '🍳 Premium Cookware'}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
        </div>
        {/* Heading */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Heading * <span className="text-gray-400 font-normal normal-case">(use ↵ for line breaks)</span>
          </label>
          <textarea value={form.heading} onChange={(e) => set('heading', e.target.value)} rows={2}
            placeholder={isCta ? 'Elevate Your Kitchen Today' : 'Cook Like a\nProfessional'}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background" />
        </div>
        {/* Subheading */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subheading</label>
          <input value={form.subheading} onChange={(e) => set('subheading', e.target.value)}
            placeholder="Premium stainless-steel pots, pans & sets for every kitchen"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
        </div>
        {/* CTA */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">CTA Button Label</label>
          <input value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)}
            placeholder="Shop Now"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">CTA Link</label>
          <input value={form.ctaHref} onChange={(e) => set('ctaHref', e.target.value)}
            placeholder="/products?category=cookware"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
        </div>
      </div>

      {/* Theme — hidden for CTA which always uses dark gradient */}
      {!isCta && (
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Overlay Theme</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(BANNER_THEMES).map(([key, { label, swatch }]) => (
              <button
                key={key} type="button"
                onClick={() => set('theme', key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                  form.theme === key ? 'border-foreground bg-secondary text-foreground' : 'border-border hover:border-muted-foreground text-muted-foreground'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${swatch}`} />
                {label}
                {form.theme === key && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set('isActive', !form.isActive)}
          className={`transition-colors ${form.isActive ? 'text-emerald-500' : 'text-gray-300'}`}>
          {form.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
        </button>
        <span className="text-sm font-medium text-gray-700">
          {form.isActive ? 'Active — visible on store' : 'Inactive — hidden from store'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <button onClick={() => onSave(form)} disabled={isSaving || !canSave}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition disabled:opacity-40 shadow-sm shadow-primary/20">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isSaving ? 'Saving…' : 'Save Banner'}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition text-muted-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
const TABS: BannerType[] = ['hero', 'side', 'promo', 'cta'];

export default function BannersPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab]   = useState<BannerType>('hero');
  const [mode, setMode]             = useState<'list' | 'create' | 'edit'>('list');
  const [editingBanner, setEditing] = useState<Banner | null>(null);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners', activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/banners?type=${activeTab}`);
      if (!res.ok) throw new Error('Failed to fetch banners');
      return res.json();
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-banners', activeTab] });

  const createMut = useMutation({
    mutationFn: async (form: BannerForm) => {
      const res = await fetch('/api/admin/banners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, displayOrder: banners.length }),
      });
      if (!res.ok) throw new Error('Failed to create');
    },
    onSuccess: () => { toast.success('Banner created'); invalidate(); setMode('list'); },
    onError: () => toast.error('Failed to create banner'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: BannerForm }) => {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update');
    },
    onSuccess: () => { toast.success('Banner updated'); invalidate(); setMode('list'); setEditing(null); },
    onError: () => toast.error('Failed to update banner'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => { toast.success('Banner deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete banner'),
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: newOrder }),
      });
    },
    onSuccess: invalidate,
  });

  const toggleActive = async (banner: Banner) => {
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    invalidate();
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    moveMut.mutate({ id: banners[i].id, newOrder: banners[i - 1].displayOrder });
    moveMut.mutate({ id: banners[i - 1].id, newOrder: banners[i].displayOrder });
  };
  const moveDown = (i: number) => {
    if (i === banners.length - 1) return;
    moveMut.mutate({ id: banners[i].id, newOrder: banners[i + 1].displayOrder });
    moveMut.mutate({ id: banners[i + 1].id, newOrder: banners[i].displayOrder });
  };

  const handleEdit = (b: Banner) => {
    setEditing(b);
    setMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: BannerType) => {
    setActiveTab(tab);
    setMode('list');
    setEditing(null);
  };

  const handleCancel = () => { setMode('list'); setEditing(null); };

  const typeMeta = BANNER_TYPE_META[activeTab];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Banners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage promotional banners shown on the store homepage</p>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        )}
      </div>

      {/* Type tabs */}
      <div className="bg-card border border-border rounded-xl p-1 flex gap-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {BANNER_TYPE_META[tab].label}
          </button>
        ))}
      </div>

      {/* Type hint */}
      {mode === 'list' && (
        <p className="text-xs text-muted-foreground -mt-3">{typeMeta.hint}</p>
      )}

      {/* Create form */}
      {mode === 'create' && (
        <div>
          <h2 className="font-bold text-base mb-3">New {typeMeta.label} Banner</h2>
          <BannerFormPanel
            initial={emptyForm(activeTab)}
            activeType={activeTab}
            onSave={(form) => createMut.mutate(form)}
            onCancel={handleCancel}
            isSaving={createMut.isPending}
          />
        </div>
      )}

      {/* Edit form */}
      {mode === 'edit' && editingBanner && (
        <div>
          <h2 className="font-bold text-base mb-3">Edit Banner</h2>
          <BannerFormPanel
            initial={{
              bannerType: (editingBanner.bannerType as BannerType) ?? activeTab,
              title:      editingBanner.title,
              imageUrl:   editingBanner.imageUrl ?? '',
              eyebrow:    editingBanner.eyebrow ?? '',
              heading:    editingBanner.heading,
              subheading: editingBanner.subheading ?? '',
              ctaLabel:   editingBanner.ctaLabel ?? '',
              ctaHref:    editingBanner.ctaHref ?? '',
              theme:      editingBanner.theme,
              isActive:   editingBanner.isActive,
            }}
            activeType={activeTab}
            onSave={(form) => updateMut.mutate({ id: editingBanner.id, form })}
            onCancel={handleCancel}
            isSaving={updateMut.isPending}
          />
        </div>
      )}

      {/* Banner list */}
      {mode === 'list' && (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
            ))
          ) : banners.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No {typeMeta.label} banners yet</p>
              <p className="text-sm mt-1">Click "Add Banner" to create your first one</p>
            </div>
          ) : (
            banners.map((banner, i) => {
              const theme = BANNER_THEMES[banner.theme] ?? BANNER_THEMES.dark;
              const isCta = banner.bannerType === 'cta';
              return (
                <div key={banner.id} className="bg-card border border-border rounded-2xl overflow-hidden flex items-stretch shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                  {/* Thumbnail */}
                  <div className="relative w-40 sm:w-56 flex-shrink-0 bg-muted">
                    {isCta ? (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
                        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">CTA</span>
                      </div>
                    ) : banner.imageUrl ? (
                      banner.imageUrl.toLowerCase().endsWith('.gif') ? (
                        <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
                      )
                    ) : null}
                    {!isCta && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${theme.overlayFrom} ${theme.overlayVia} to-transparent opacity-70`} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm text-foreground truncate">{banner.title}</p>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${banner.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{banner.heading.replace('\n', ' ')}</p>
                      {banner.ctaLabel && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">CTA: {banner.ctaLabel} → {banner.ctaHref}</p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveUp(i)} disabled={i === 0}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 transition">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveDown(i)} disabled={i === banners.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 transition">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button onClick={() => toggleActive(banner)} title={banner.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition ${banner.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                        {banner.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>

                      <button onClick={() => handleEdit(banner)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition">
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => { if (confirm(`Delete "${banner.title}"?`)) deleteMut.mutate(banner.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
