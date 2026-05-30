'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { Plus, Trash2, Tag } from 'lucide-react';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-4">Add Category</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Cookware"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No categories yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
