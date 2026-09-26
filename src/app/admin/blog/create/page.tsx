"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  User,
  FolderTree,
  ExternalLink,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  saveBlogPost,
  getBlogAuthors,
  getBlogCategories,
  getBlogPostById,
  type BlogAuthor,
  type BlogCategory,
} from "@/features/blog/actions";
import { RichArticleEditor } from "@/components/admin/rich-article-editor";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";

function BlogCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(!!editId);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const [form, setForm] = useState({
    id: undefined as string | undefined,
    title: "",
    slug: "",
    excerpt: "",
    content: `<h2>Introduction</h2>\n<p>Write your detailed skincare guide here...</p>\n\n<h3>Key Active Ingredients</h3>\n<p>Explain how this formula supports the skin barrier in hot & humid weather.</p>`,
    featured_image: "",
    author_id: "",
    category_id: "",
    tags: [] as string[],
    tagsInput: "Skincare, Routine, K-Beauty",
    reading_time_minutes: 5,
    seo_title: "",
    seo_description: "",
    status: "published" as "published" | "draft",
  });

  useEffect(() => {
    Promise.all([
      getBlogAuthors(),
      getBlogCategories(),
      editId ? getBlogPostById(editId) : Promise.resolve(null),
    ]).then(([auths, cats, existingPost]) => {
      setAuthors(auths);
      setCategories(cats);

      if (existingPost) {
        setForm({
          id: existingPost.id,
          title: existingPost.title,
          slug: existingPost.slug,
          excerpt: existingPost.excerpt || "",
          content: existingPost.content || "",
          featured_image: existingPost.featured_image || "",
          author_id: existingPost.author_id || (auths[0]?.id ?? ""),
          category_id: existingPost.category_id || (cats[0]?.id ?? ""),
          tags: existingPost.tags || [],
          tagsInput: (existingPost.tags || []).join(", "),
          reading_time_minutes: existingPost.reading_time_minutes || 5,
          seo_title: existingPost.seo_title || "",
          seo_description: existingPost.seo_description || "",
          status: existingPost.status as "published" | "draft",
        });
      } else {
        if (auths.length > 0) setForm((f) => ({ ...f, author_id: auths[0].id }));
        if (cats.length > 0) setForm((f) => ({ ...f, category_id: cats[0].id }));
      }
      setLoadingInitial(false);
    });
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFeedback("Please fill in article title and content.");
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const parsedTags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await saveBlogPost({
        ...form,
        tags: parsedTags,
        author_id: form.author_id || null,
        category_id: form.category_id || null,
      });
      router.push("/admin/blog");
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-12 text-center text-xs text-gray-500 font-bold">
        Loading article data...
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-text">
              {form.id ? "Edit Skincare Article" : "Write Skincare & Beauty Article"}
            </h1>
            <p className="text-xs text-text-secondary">
              Rich formatted editorial with dynamic author credits, headings, images, and SEO metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {form.slug && (
            <Link href={`/blog/${form.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Live
              </Button>
            </Link>
          )}
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#1D6474] hover:bg-[#164E63] text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving..." : form.id ? "Update Article" : "Publish Article"}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-800">
          {feedback}
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
          {/* Article Title */}
          <div>
            <label className="block text-xs font-bold text-text mb-1">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5 Best Sunscreens for Oily Skin in Bangladesh Humidity"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-[#1D6474] font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Custom URL Slug (Optional)
              </label>
              <input
                type="text"
                placeholder="auto-generated-from-title"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs font-mono text-text placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div>
              <ImageUploadDropzone
                label="Featured Cover Image"
                description="Upload a high-res cover banner for this article"
                value={form.featured_image}
                onChange={(url) => setForm({ ...form, featured_image: url })}
                folder="blog"
                previewShape="banner"
              />
            </div>
          </div>

          {/* Dynamic Author & Category Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-text flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#1D6474]" /> Author (E-E-A-T)
                </label>
                <Link
                  href="/admin/blog/authors"
                  className="text-[11px] font-bold text-primary-600 hover:underline"
                >
                  + Manage Authors
                </Link>
              </div>
              <select
                value={form.author_id}
                onChange={(e) => setForm({ ...form, author_id: e.target.value })}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs text-text focus:outline-none bg-white font-medium"
              >
                <option value="">Select Author...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.job_title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-text flex items-center gap-1">
                  <FolderTree className="h-3.5 w-3.5 text-[#1D6474]" /> Category
                </label>
                <Link
                  href="/admin/blog/categories"
                  className="text-[11px] font-bold text-primary-600 hover:underline"
                >
                  + Manage Categories
                </Link>
              </div>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs text-text focus:outline-none bg-white font-medium"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="Glass Skin, Routine, K-Beauty"
                value={form.tagsInput}
                onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as "published" | "draft" })
                }
                className="w-full rounded-xl border border-border px-3 py-2 text-xs text-text focus:outline-none bg-white font-bold"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text mb-1">
              Summary / Excerpt (Shows in search results &amp; article cards)
            </label>
            <textarea
              rows={2}
              placeholder="A brief 1-2 sentence hook explaining what the reader will learn..."
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none resize-none"
            />
          </div>

          {/* ======================================================= */}
          {/* RICH ARTICLE CONTENT FORMATTING ENGINE */}
          {/* ======================================================= */}
          <div>
            <label className="text-xs font-bold text-text mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#1D6474]" />
                Article Content (Visual Rich Text, Headings, Lists, Images &amp; HTML)
                <span className="text-red-500">*</span>
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                Use toolbar above editor to format
              </span>
            </label>

            <RichArticleEditor
              value={form.content}
              onChange={(newContent) => setForm((prev) => ({ ...prev, content: newContent }))}
              placeholder="Write your comprehensive skincare guide with headings, bold text, bullet points, and product recommendations..."
            />
          </div>
        </div>

        {/* SEO Metadata Box */}
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#1D6474]" />
            Search Engine Optimization (SEO) Metadata
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-text mb-1">SEO Meta Title</label>
              <input
                type="text"
                placeholder="Custom Google title (Leaves default to Article Title if blank)"
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">SEO Meta Description</label>
              <textarea
                rows={2}
                placeholder="Search engine snippet preview (Recommended 140–160 chars)"
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AdminBlogCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-500 font-bold">
          Loading Article Editor...
        </div>
      }
    >
      <BlogCreateForm />
    </Suspense>
  );
}
