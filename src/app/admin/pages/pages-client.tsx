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
  RefreshCw,
  Sparkles,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import {
  saveCMSPage,
  togglePageStatus,
  deleteCMSPage,
  syncAllOfficialTemplates,
} from "@/features/pages/actions";
import { type CMSPageItem, DEFAULT_CMS_PAGES } from "@/features/pages/types";
import { RichArticleRenderer } from "@/components/blog/rich-article-renderer";
import Link from "next/link";
import { useAdminLang } from "@/lib/admin-lang-context";
import { cn } from "@/lib/utils";

interface PagesClientProps {
  initialPages: CMSPageItem[];
}

export function PagesClient({ initialPages }: PagesClientProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";
  const [pages, setPages] = useState<CMSPageItem[]>(initialPages);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPage, setEditingPage] = useState<Partial<CMSPageItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggle = async (id: string, currentStatus: "draft" | "published") => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
    await togglePageStatus(id, currentStatus);
    showToast(isBn ? "Status Updated successfully!" : "Status updated!");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(isBn ? `Are you sure you want to Confirmedpermanently "${title}" items want to delete?` : `Are you sure you want to delete "${title}"?`)) {
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
    await deleteCMSPage(id);
    showToast(isBn ? "items   successfully!" : "Page deleted!");
  };

  const handleSyncTemplates = async () => {
    if (
      !window.confirm(
        isBn
          ? " English - Policy Template (Return, , , FAQ, About) :00     ?"
          : "Do you want to sync & refresh the database with official Bangladeshi e-commerce policy templates?"
      )
    ) {
      return;
    }

    setSyncing(true);
    try {
      const res = await syncAllOfficialTemplates();
      if (res.success) {
        setPages(res.pages);
        showToast(isBn ? "All  Policy :00 permanently Synced successfully!" : "Official templates synced to database!");
      }
    } finally {
      setSyncing(false);
    }
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
      showToast(isBn ? "items permanently Save  successfully!" : "Page saved successfully!");
    } finally {
      setSaving(false);
    }
  };

  // Helper to insert markdown syntax into content textarea
  const insertMarkdown = (syntax: string, placeholder = "") => {
    if (!editingPage) return;
    const current = editingPage.content || "";
    let newContent = "";
    if (syntax === "table") {
      newContent =
        current +
        "\n\n|  |   Description |  |\n| :--- | :--- | :--- |\n|  1 |      | 0 :00 |\n|  2 | Description   |  |\n\n";
    } else if (syntax === "flow") {
      newContent = current + "\n\n```\n[Step 1. Add ] ➔ [ 2.  ] ➔ [ 3. /Refund]\n```\n\n";
    } else if (syntax === "list") {
      newContent = current + "\n-  \n-  \n-  \n";
    } else if (syntax === "numlist") {
      newContent = current + "\n1.  \n2.  \n3.  \n";
    } else if (syntax.startsWith("#")) {
      newContent = current + `\n\n${syntax} ${placeholder || "  Name"}\n\n`;
    } else {
      newContent = current + `${syntax}${placeholder || ""}${syntax}`;
    }
    setEditingPage({ ...editingPage, content: newContent });
  };

  const loadTemplate = (slugKey: string) => {
    const matched = DEFAULT_CMS_PAGES.find((p) => p.slug === slugKey);
    if (matched && editingPage) {
      setEditingPage({
        ...editingPage,
        title: matched.title,
        slug: matched.slug,
        content: matched.content,
        seo_title: matched.seo_title,
        seo_description: matched.seo_description,
      });
      showToast(isBn ? `"${matched.title}" Template  successfully!` : `Template loaded!`);
    }
  };

  const filteredPages = pages.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ModuleHeader
          title={isBn ? " items    " : "CMS Content & Legal Pages Manager"}
          description={
            isBn
              ? "Return Policy, use ,  ,  :00       from 100% Namepermanently    ।"
              : "100% dynamically manage, edit, and publish rich content pages like Return Policy, Terms, Privacy Policy, and FAQ."
          }
          icon={FileText}
          badgeLabel={
            isBn
              ? `${pages.filter((p) => p.status === "published").length} items  / ${pages.length} items Total`
              : `${pages.filter((p) => p.status === "published").length} Published / ${pages.length} Total`
          }
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleSyncTemplates}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="text-xs bg-white border-zinc-300 hover:bg-zinc-50"
            title=" Policy :00  "
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5 text-[#1D6474]", syncing && "animate-spin")} />
            {syncing
              ? (isBn ? " ..." : "Syncing...")
              : (isBn ? " Template  " : "Sync Official Templates")}
          </Button>

          <Button
            onClick={() => {
              setEditingPage({
                title: "",
                slug: "",
                content: "",
                seo_title: "",
                seo_description: "",
                status: "published",
              });
              setActiveTab("edit");
            }}
            size="sm"
            className="text-xs shrink-0 bg-[#164E63] hover:bg-[#164E63] text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {isBn ? "   " : "Create New Page"}
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Info Banner */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={isBn ? "Name     Search..." : "Search pages by title or slug..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D6474]/20 focus:border-[#1D6474]"
          />
        </div>
        <div className="text-xs text-zinc-500 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{isBn ? "       " : "Changes here reflect dynamically on your live store"}</span>
        </div>
      </div>

      {/* Pages Table */}
      <div className="rounded-3xl border border-zinc-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-800">
            <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-4">{isBn ? " Name  " : "Page Title & Slug"}</th>
                <th className="px-5 py-4">{isBn ? " :00 :00" : "SEO Meta Title"}</th>
                <th className="px-5 py-4">{isBn ? "Status" : "Status"}</th>
                <th className="px-5 py-4">{isBn ? " " : "Last Updated"}</th>
                <th className="px-5 py-4 text-right">{isBn ? "Action" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPages.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-zinc-900 text-sm leading-snug">{item.title}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#1D6474] font-mono mt-1 font-semibold">
                      <Globe className="h-3 w-3 text-zinc-400" />
                      <span>/page/{item.slug}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600 max-w-xs truncate">
                    {item.seo_title || item.title}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggle(item.id, item.status)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-colors",
                        item.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      )}
                    >
                      {item.status === "published" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{isBn ? "" : "Published"}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>{isBn ? "" : "Draft"}</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-zinc-500 font-medium">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString("bn-BD") : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/page/${item.slug}`} target="_blank">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2.5 rounded-xl hover:bg-zinc-100 text-zinc-600"
                          title={isBn ? "  View" : "View Live on Store"}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPage(item);
                          setActiveTab("edit");
                        }}
                        className="text-xs h-8 px-3 rounded-xl border-zinc-200 hover:bg-teal-50/60 hover:text-[#1D6474] hover:border-teal-200 font-bold"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-[#1D6474]" />
                        {isBn ? "Edit" : "Edit"}
                      </Button>
                      {!["page-returns", "page-terms", "page-privacy", "page-faq", "page-about"].includes(item.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="text-xs h-8 px-2 rounded-xl text-red-600 hover:bg-red-50"
                          title={isBn ? " " : "Delete Page"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPages.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-800">
              {isBn ? "   " : "No pages found"}
            </h3>
            <p className="text-xs text-zinc-500">
              {isBn ? '" Template  "       ।' : 'Click "Sync Official Templates" to load default pages.'}
            </p>
          </div>
        )}
      </div>

      {/* Advanced Full-Featured CMS Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1D6474] bg-teal-50/60 px-2.5 py-0.5 rounded-md border border-teal-100 mb-1">
                  <Sparkles className="h-3 w-3 text-[#1D6474]" />
                  {editingPage.id
                    ? (isBn ? " Description   Edit" : "Edit Page Content")
                    : (isBn ? "   " : "Create New CMS Page")}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-zinc-900">
                  {editingPage.title || (isBn ? "Name " : "Untitled Page")}
                </h2>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Template Preset Buttons */}
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#1D6474]" />
                <span>{isBn ? " Policy Template  :" : "Load Recommended Template:"}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadTemplate("returns")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:border-teal-300 hover:text-[#1D6474] shadow-2xs transition-all"
                >
                  🔄 Return Policy
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate("terms")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:border-teal-300 hover:text-[#1D6474] shadow-2xs transition-all"
                >
                  📜 
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate("privacy")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:border-teal-300 hover:text-[#1D6474] shadow-2xs transition-all"
                >
                  🛡️  
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate("faq")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:border-teal-300 hover:text-[#1D6474] shadow-2xs transition-all"
                >
                  ❓ Q&A
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate("about")}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:border-teal-300 hover:text-[#1D6474] shadow-2xs transition-all"
                >
                  🏢  
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              
              {/* Row 1: Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-800 mb-1.5">
                    {isBn ? " Name *" : "Page Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPage.title || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    placeholder={isBn ? "e.g.: 7-Day Easy Return Policy" : "e.g. 7-Day Easy Return Policy"}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 font-medium focus:ring-2 focus:ring-[#1D6474]/20 focus:border-[#1D6474] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 mb-1.5">
                    {isBn ? "  *" : "URL Slug *"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-[11px]">
                      /page/
                    </span>
                    <input
                      type="text"
                      required
                      value={editingPage.slug || ""}
                      onChange={(e) =>
                        setEditingPage({
                          ...editingPage,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
                        })
                      }
                      placeholder="return-policy"
                      className="w-full rounded-2xl border border-zinc-200 bg-white pl-16 pr-4 py-2.5 text-xs font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-[#1D6474]/20 focus:border-[#1D6474] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Edit vs Preview Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label className="font-bold text-zinc-800">
                    {isBn ? "   (Markdown / Rich Text) *" : "Page Body Content (Markdown) *"}
                  </label>
                  <div className="flex items-center rounded-xl bg-zinc-100 p-1 border border-zinc-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className={cn(
                        "px-3 py-1 rounded-lg font-bold transition-all",
                        activeTab === "edit" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      {isBn ? "Edit" : "Write"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={cn(
                        "px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                        activeTab === "preview" ? "bg-white text-[#1D6474] shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{isBn ? " Reviews" : "Live Preview"}</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Formatting Toolbar */}
                {activeTab === "edit" && (
                  <div className="flex flex-wrap items-center gap-1 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", " ")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 font-bold hover:shadow-2xs"
                      title="Bold"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("*", ":00")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 hover:shadow-2xs"
                      title="Italic"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-px bg-zinc-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown("##", " Name")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 font-bold hover:shadow-2xs flex items-center gap-0.5"
                      title="Heading 2"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("###", "-Name / Question")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 font-bold hover:shadow-2xs flex items-center gap-0.5"
                      title="Heading 3"
                    >
                      <Heading3 className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-px bg-zinc-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown("list")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 hover:shadow-2xs"
                      title="Bullet List"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("numlist")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 hover:shadow-2xs"
                      title="Numbered List"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("table")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 hover:shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                      title="Insert Table"
                    >
                      <TableIcon className="h-3.5 w-3.5" />
                      <span>{isBn ? "" : "Table"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("flow")}
                      className="p-1.5 rounded-lg hover:bg-white text-zinc-700 hover:shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                      title="Insert Flow Steps"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-[#1D6474]" />
                      <span>{isBn ? " " : "Flowchart"}</span>
                    </button>
                  </div>
                )}

                {/* Content Editor Tab */}
                {activeTab === "edit" ? (
                  <textarea
                    rows={14}
                    value={editingPage.content || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    placeholder={
                      isBn
                        ? "  View Details , ,    ..."
                        : "Enter markdown formatted page content here..."
                    }
                    className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-xs font-mono leading-relaxed text-zinc-900 focus:ring-2 focus:ring-[#1D6474]/20 focus:border-[#1D6474] focus:outline-none"
                  />
                ) : (
                  /* Live Rendered Preview Tab */
                  <div className="rounded-2xl border border-zinc-200 bg-[#fdfdfd] p-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                    {editingPage.content ? (
                      <RichArticleRenderer content={editingPage.content} />
                    ) : (
                      <div className="text-center py-12 text-zinc-400">
                        {isBn ? "   " : "No content written yet"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SEO Meta Fields */}
              <div className="bg-zinc-50/80 rounded-3xl p-5 border border-zinc-200 space-y-4">
                <h4 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>{isBn ? "    :00:00" : "Search Engine Optimization (SEO)"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      {isBn ? " :00 :00" : "SEO Meta Title"}
                    </label>
                    <input
                      type="text"
                      value={editingPage.seo_title || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, seo_title: e.target.value })}
                      placeholder={isBn ? "e.g.: 7-Day Easy Return Policy — Azonno" : "e.g. Return Policy — Azonno"}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:ring-2 focus:ring-[#1D6474]/20 focus:border-[#1D6474] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      {isBn ? " :00 " : "SEO Meta Description"}
                    </label>
                    <textarea
                      rows={2}
                      value={editingPage.seo_description || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, seo_description: e.target.value })}
                      placeholder={isBn ? "  for  ..." : "Brief search engine summary..."}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:ring-2 focus:ring-[#1D6474]/20 focus:border-[#1D6474] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-zinc-700">
                    {isBn ? " Status:" : "Status:"}
                  </label>
                  <select
                    value={editingPage.status || "published"}
                    onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as any })}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 focus:outline-none"
                  >
                    <option value="published">{isBn ? " (Published)" : "Published"}</option>
                    <option value="draft">{isBn ? " (Draft)" : "Draft"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPage(null)}
                    className="rounded-xl"
                  >
                    {isBn ? "Cancel" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="bg-[#164E63] hover:bg-[#164E63] text-white font-bold rounded-xl shadow-md shadow-pink-600/25 px-5"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {saving
                      ? (isBn ? "Save ..." : "Saving...")
                      : (isBn ? " Save   " : "Save & Publish Page")}
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
