"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Sparkles,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  saveBlogCategory,
  deleteBlogCategory,
  type BlogCategory,
} from "@/features/blog/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface CategoryManagerProps {
  initialCategories: BlogCategory[];
}

export function CategoryManagerClient({ initialCategories }: CategoryManagerProps) {
  const { t } = useAdminLang();
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Partial<BlogCategory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingCategory({
      name: "",
      slug: "",
      description: "",
      icon: "BookOpen",
      position: categories.length + 1,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const saved = await saveBlogCategory(editingCategory as any);
      if (editingCategory.id) {
        setCategories(categories.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        setCategories([...categories, saved]);
      }
      setEditingCategory(null);
      setFeedback(t("category_saved_success"));
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete_category"))) return;
    try {
      await deleteBlogCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 bg-white p-6 rounded-3xl shadow-card">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-[#e91e63]" />
              Blog Categories &amp; Topics
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Organize your beauty articles into navigable topics (Routines, Ingredients, Sun Protection).
            </p>
          </div>
        </div>

        <Button
          onClick={handleCreateNew}
          className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("add_category_btn")}
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in-0">
          {feedback}
        </div>
      )}

      {/* Editor Modal */}
      {editingCategory && (
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5 animate-in fade-in-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#e91e63]" />
              {editingCategory.id ? "Edit Category" : "Create Category"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingCategory(null)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skincare Routines"
                  value={editingCategory.name || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none focus:border-primary-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Custom Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="skincare-routines"
                  value={editingCategory.slug || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, slug: e.target.value })
                  }
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Topic summary shown on category archive pages..."
                value={editingCategory.description || ""}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, description: e.target.value })
                }
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingCategory(null)}
                className="text-xs font-bold rounded-xl"
              >
                {t("cancel_btn")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? t("saving_changes_btn") : t("save_category_btn")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List Table */}
      <div className="rounded-3xl border border-border bg-white shadow-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-secondary/70 border-b border-border text-text-muted font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-4">Category Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-surface-secondary/40 transition-colors">
                <td className="p-4 font-bold text-text">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#e91e63]" />
                    <span>{cat.name}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-text-muted">{cat.slug}</td>
                <td className="p-4 text-text-secondary max-w-xs truncate">
                  {cat.description || "—"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(cat)}
                      className="text-xs font-bold rounded-xl h-8 px-2.5"
                    >
                      <Edit2 className="h-3 w-3 mr-1 text-primary-600" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cat.id)}
                      className="text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl h-8 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-text">No categories created yet</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Click "Add New Category" above to organize your blog guides.
          </p>
        </div>
      )}
    </div>
  );
}
