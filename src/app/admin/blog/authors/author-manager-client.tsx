"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Save,
  X,
  User,
  Globe,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  saveBlogAuthor,
  deleteBlogAuthor,
  type BlogAuthor,
} from "@/features/blog/actions";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";
import { useAdminLang } from "@/lib/admin-lang-context";

interface AuthorManagerProps {
  initialAuthors: BlogAuthor[];
}

export function AuthorManagerClient({ initialAuthors }: AuthorManagerProps) {
  const { t } = useAdminLang();
  const [authors, setAuthors] = useState<BlogAuthor[]>(initialAuthors);
  const [editingAuthor, setEditingAuthor] = useState<Partial<BlogAuthor> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingAuthor({
      name: "",
      slug: "",
      job_title: "Beauty Editor & Skincare Specialist",
      bio: "",
      avatar_url: "",
      social_links: {
        instagram: "",
        linkedin: "",
        twitter: "",
        facebook: "",
      },
      website_url: "",
      is_verified_expert: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuthor || !editingAuthor.name?.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const saved = await saveBlogAuthor(editingAuthor as any);
      if (editingAuthor.id) {
        setAuthors(authors.map((a) => (a.id === saved.id ? saved : a)));
      } else {
        setAuthors([...authors, saved]);
      }
      setEditingAuthor(null);
      setFeedback(t("author_saved_success"));
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete_author"))) return;
    try {
      await deleteBlogAuthor(id);
      setAuthors(authors.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(`Error deleting author: ${err.message}`);
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
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e91e63] animate-pulse" />
              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 uppercase">
                Google E-E-A-T Control Plane
              </span>
            </div>
            <h1 className="text-xl font-bold text-text mt-1 flex items-center gap-2">
              <User className="h-5 w-5 text-[#e91e63]" />
              Blog Authors &amp; Expert Contributors
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Manage clinical credentials, author bios, verified expert status, and social profiles.
            </p>
          </div>
        </div>

        <Button
          onClick={handleCreateNew}
          className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("add_author_btn")}
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in-0">
          {feedback}
        </div>
      )}

      {/* Editor Modal / Drawer */}
      {editingAuthor && (
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5 animate-in fade-in-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#e91e63]" />
              {editingAuthor.id ? "Edit Author Profile" : "Create Author Profile"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingAuthor(null)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Samia Rahman, MD"
                  value={editingAuthor.name || ""}
                  onChange={(e) =>
                    setEditingAuthor({ ...editingAuthor, name: e.target.value })
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
                  placeholder="dr-samia-rahman"
                  value={editingAuthor.slug || ""}
                  onChange={(e) =>
                    setEditingAuthor({ ...editingAuthor, slug: e.target.value })
                  }
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Professional Title / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Beauty Editor & Esthetician"
                  value={editingAuthor.job_title || ""}
                  onChange={(e) =>
                    setEditingAuthor({ ...editingAuthor, job_title: e.target.value })
                  }
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none"
                />
              </div>

              <div>
                <ImageUploadDropzone
                  label="Avatar Photo"
                  description="Drag & drop author / editor photo, or click to upload"
                  value={editingAuthor.avatar_url || ""}
                  onChange={(url) =>
                    setEditingAuthor({ ...editingAuthor, avatar_url: url })
                  }
                  folder="authors"
                  previewShape="circle"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Author Bio (Clinical Background &amp; Expertise)
              </label>
              <textarea
                rows={3}
                placeholder="Brief professional background, certifications, and skincare focus..."
                value={editingAuthor.bio || ""}
                onChange={(e) =>
                  setEditingAuthor({ ...editingAuthor, bio: e.target.value })
                }
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none resize-none"
              />
            </div>

            {/* Social Links & Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Instagram Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={editingAuthor.social_links?.instagram || ""}
                  onChange={(e) =>
                    setEditingAuthor({
                      ...editingAuthor,
                      social_links: {
                        ...editingAuthor.social_links,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={editingAuthor.social_links?.linkedin || ""}
                  onChange={(e) =>
                    setEditingAuthor({
                      ...editingAuthor,
                      social_links: {
                        ...editingAuthor.social_links,
                        linkedin: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="is_verified"
                checked={editingAuthor.is_verified_expert ?? true}
                onChange={(e) =>
                  setEditingAuthor({
                    ...editingAuthor,
                    is_verified_expert: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded text-[#e91e63] focus:ring-[#e91e63]"
              />
              <label htmlFor="is_verified" className="text-xs font-bold text-text cursor-pointer">
                Display "Verified Beauty &amp; Skincare Expert" Badge on Storefront
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAuthor(null)}
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
                {saving ? t("saving_changes_btn") : t("save_author_btn")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Authors List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {authors.map((author) => (
          <div
            key={author.id}
            className="rounded-3xl border border-border bg-white p-6 shadow-card flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-4">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.name}
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-primary-100 shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 font-black text-lg shrink-0">
                  {author.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-text truncate">{author.name}</h3>
                  {author.is_verified_expert && (
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] font-semibold text-[#e91e63] truncate">
                  {author.job_title}
                </p>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {author.bio || "No biography provided."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
              <Link
                href={`/author/${author.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-text-muted hover:text-text transition-colors"
              >
                Preview Profile <ExternalLink className="h-3 w-3" />
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAuthor(author)}
                  className="text-xs font-bold rounded-xl h-8 px-3"
                >
                  <Edit2 className="h-3 w-3 mr-1 text-primary-600" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(author.id)}
                  className="text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl h-8 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {authors.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center space-y-3">
          <User className="h-10 w-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-text">No authors added yet</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Click "Add New Author" above to add your team members, beauty specialists, and content creators.
          </p>
        </div>
      )}
    </div>
  );
}
