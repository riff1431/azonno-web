"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Globe,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  Save,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { saveCMSPage, togglePageStatus, type CMSPageItem } from "@/features/pages/actions";
import Link from "next/link";
import { useAdminLang } from "@/lib/admin-lang-context";

interface PagesClientProps {
  initialPages: CMSPageItem[];
}

export function PagesClient({ initialPages }: PagesClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [pages, setPages] = useState<CMSPageItem[]>(initialPages);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPage, setEditingPage] = useState<Partial<CMSPageItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handleToggle = async (id: string, currentStatus: "draft" | "published") => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
    await togglePageStatus(id, currentStatus);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;
    setSaving(true);
    try {
      await saveCMSPage(editingPage);
      if (editingPage.id) {
        setPages((prev) =>
          prev.map((p) => (p.id === editingPage.id ? ({ ...p, ...editingPage } as CMSPageItem) : p))
        );
      } else {
        const newP: CMSPageItem = {
          id: `page-${Date.now()}`,
          title: editingPage.title || "Untitled",
          slug: editingPage.slug || "new-page",
          content: editingPage.content || "",
          seo_title: editingPage.seo_title,
          seo_description: editingPage.seo_description,
          status: editingPage.status || "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPages((prev) => [newP, ...prev]);
      }
      setEditingPage(null);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredPages = pages.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ModuleHeader
          title={isBn ? "সিএমএস স্ট্যাটিক ও লিগ্যাল পেজ" : "CMS Static Content & Legal Pages"}
          description={
            isBn
              ? "আমাদের সম্পর্কে, প্রাইভেসী পলিসি, শর্তাবলী, প্রশ্নোত্তর এবং কাস্টম ল্যান্ডিং পেজ তৈরি ও প্রকাশ করুন।"
              : "Create, edit, and publish rich content pages like About Us, Privacy Policy, Terms, FAQ, and custom landing pages."
          }
          icon={FileText}
          badgeLabel={
            isBn
              ? `${pages.filter((p) => p.status === "published").length} টি প্রকাশিত / ${pages.length} টি সর্বমোট`
              : `${pages.filter((p) => p.status === "published").length} Published / ${pages.length} Total`
          }
        />

        <Button
          onClick={() =>
            setEditingPage({
              title: "",
              slug: "",
              content: "",
              seo_title: "",
              seo_description: "",
              status: "published",
            })
          }
          size="sm"
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {isBn ? "নতুন পেজ তৈরি করুন" : "Create New Page"}
        </Button>
      </div>

      {successToast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{isBn ? "পেজটি সফলভাবে সংরক্ষণ করা হয়েছে!" : "Page saved successfully!"}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-card flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder={isBn ? "শিরোনাম বা স্লাগ দিয়ে পেজ খুঁজুন..." : "Search pages by title or slug..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-secondary/50 pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text">
            <thead className="bg-surface-secondary/60 text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
              <tr>
                <th className="px-5 py-3.5">{isBn ? "পেজের শিরোনাম ও স্লাগ" : "Page Title & Slug"}</th>
                <th className="px-5 py-3.5">{isBn ? "এসইও মেটা টাইটেল" : "SEO Meta Title"}</th>
                <th className="px-5 py-3.5">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                <th className="px-5 py-3.5">{isBn ? "সর্বশেষ আপডেট" : "Last Updated"}</th>
                <th className="px-5 py-3.5 text-right">{isBn ? "অ্যাকশন" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPages.map((item) => (
                <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-text text-sm">{item.title}</div>
                    <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono mt-0.5">
                      <Globe className="h-3 w-3" />
                      <span>/{item.slug}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-secondary max-w-xs truncate">
                    {item.seo_title || item.title}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggle(item.id, item.status)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${
                        item.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status === "published" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> {isBn ? "প্রকাশিত" : "Published"}
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> {isBn ? "ড্রাফট" : "Draft"}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-text-muted">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/${item.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" title={isBn ? "প্রিভিউ দেখুন" : "View Preview"}>
                          <Eye className="h-3.5 w-3.5 text-text-muted" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPage(item)}
                        className="text-xs h-7 px-2.5"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-primary-600" />
                        {isBn ? "সম্পাদনা" : "Edit"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPages.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <FileText className="h-8 w-8 text-text-muted mx-auto" />
            <h3 className="text-sm font-bold text-text">
              {isBn ? "কোনো পেজ পাওয়া যায়নি" : "No pages found"}
            </h3>
            <p className="text-xs text-text-secondary">
              {isBn ? '"নতুন পেজ তৈরি করুন" বাটনে ক্লিক করে পেজ যোগ করুন।' : 'Click "Create New Page" to add content.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit / Create Page Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                  {editingPage.id
                    ? (isBn ? "পেজের বিবরণ সম্পাদনা" : "Edit Page Content")
                    : (isBn ? "নতুন স্ট্যাটিক পেজ তৈরি" : "Create New Static Page")}
                </span>
                <h2 className="text-lg font-bold text-text">
                  {editingPage.title || (isBn ? "শিরোনামহীন পেজ" : "Untitled Page")}
                </h2>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                className="text-text-muted hover:text-text p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">
                    {isBn ? "পেজের শিরোনাম" : "Page Title"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPage.title || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    placeholder={isBn ? "যেমন: আমাদের সম্পর্কে" : "e.g. About Our Company"}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">
                    {isBn ? "ইউআরএল স্লাগ" : "URL Slug"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPage.slug || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    placeholder="e.g. about-us"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">
                  {isBn ? "পেজের বডি কন্টেন্ট" : "Page Body Content"}
                </label>
                <textarea
                  rows={8}
                  value={editingPage.content || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  placeholder={
                    isBn
                      ? "এখানে পেজের বিস্তারিত টেক্সট বা মার্কডাউন কন্টেন্ট লিখুন..."
                      : "Enter markdown or plain text page content here..."
                  }
                  className="w-full rounded-xl border border-border bg-white p-3.5 text-xs font-mono leading-relaxed focus:outline-none"
                />
              </div>

              <div className="bg-surface-secondary/40 rounded-2xl p-4 border border-border space-y-3">
                <h4 className="font-bold text-text text-xs uppercase tracking-wider">
                  {isBn ? "এসইও মেটাডাটা" : "SEO Metadata"}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-text mb-1">
                      {isBn ? "এসইও মেটা টাইটেল" : "SEO Meta Title"}
                    </label>
                    <input
                      type="text"
                      value={editingPage.seo_title || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, seo_title: e.target.value })}
                      placeholder={isBn ? "যেমন: আমাদের সম্পর্কে — ecomXbd" : "e.g. About Us — Blush & Budget"}
                      className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-text mb-1">
                      {isBn ? "এসইও মেটা ডেসক্রিপশন" : "SEO Meta Description"}
                    </label>
                    <textarea
                      rows={2}
                      value={editingPage.seo_description || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, seo_description: e.target.value })}
                      placeholder={isBn ? "সংক্ষিপ্ত সার্চ ইঞ্জিন বিবরণ..." : "Brief search engine summary..."}
                      className="w-full rounded-xl border border-border bg-white p-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-text">
                    {isBn ? "স্ট্যাটাস:" : "Status:"}
                  </label>
                  <select
                    value={editingPage.status || "published"}
                    onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as any })}
                    className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="published">{isBn ? "প্রকাশিত" : "Published"}</option>
                    <option value="draft">{isBn ? "ড্রাফট" : "Draft"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingPage(null)}>
                    {isBn ? "বাতিল" : "Cancel"}
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {saving
                      ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                      : (isBn ? "পেজ সংরক্ষণ করুন" : "Save Page")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
