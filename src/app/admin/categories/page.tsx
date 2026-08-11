'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { Plus, Trash2, Tag, Pencil, Check, X } from 'lucide-react';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline edit state: id → { name, description }
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createCategory.mutateAsync({
        name: form.name.trim(),
        slug: slugify(form.name),
        description: form.description.trim() || null,
      });
      toast.success('Category created');
      setForm({ name: '', description: '' });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products in this category will become uncategorized.`)) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete category');
    }
  };

  const startEdit = (cat: { id: string; name: string; description: string | null }) => {
    setEditing(cat.id);
    setEditForm({ name: cat.name, description: cat.description ?? '' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({ name: '', description: '' });
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim()) return;
    try {
      await updateCategory.mutateAsync({
        id,
        name: editForm.name.trim(),
        slug: slugify(editForm.name),
        description: editForm.description.trim() || null,
      });
      toast.success('Category updated');
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground mb-4">Add Category</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Cookware"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50">
              {isSubmitting ? 'Creating…' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No categories yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Slug</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) =>
                editing === cat.id ? (
                  <tr key={cat.id} className="bg-primary/5">
                    <td className="px-5 py-3">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        autoFocus
                        className="w-full border border-border rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {slugify(editForm.name || cat.slug)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Optional"
                        className="w-full border border-border rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleUpdate(cat.id)} disabled={updateCategory.isPending}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50" title="Save">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{cat.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{cat.description ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
