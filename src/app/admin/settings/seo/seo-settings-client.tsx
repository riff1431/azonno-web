"use client";

import { useState } from "react";
import { Globe, Save, CheckCircle2, Search, Share2 } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import { saveSeoSettings } from "@/features/settings/actions";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";
import { useAdminLang } from "@/lib/admin-lang-context";

interface SeoSettingsClientProps {
  initialSettings: Record<string, any>;
}

export function SeoSettingsClient({ initialSettings }: SeoSettingsClientProps) {
  const { t } = useAdminLang();
  const [formData, setFormData] = useState({
    meta_title: initialSettings.meta_title || "Blush & Budget — Premium E-Commerce Platform",
    meta_description:
      initialSettings.meta_description ||
      "Shop authentic international skincare, beauty formulas, and lifestyle essentials in Bangladesh with verified fast nationwide delivery.",
    og_image_url: initialSettings.og_image_url || "https://res.cloudinary.com/dyvma4kfc/image/upload/v1/og-default.jpg",
    canonical_url:
      initialSettings.canonical_url ||
      (typeof window !== "undefined" && window.location?.origin ? window.location.origin : ""),
    twitter_handle: initialSettings.twitter_handle || "@ecomxbangladesh",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveSeoSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title={t("seo_settings_title")}
        description={t("seo_settings_desc")}
        icon={Globe}
        isCore
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{t("store_settings_success")}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SERP Search Preview */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-3">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Search className="h-4 w-4 text-primary-600" />
            Google SERP Snippet Preview
          </h2>

          <div className="rounded-xl border border-border bg-surface-secondary/40 p-4 space-y-1 font-sans">
            <p className="text-[11px] text-text-muted truncate">{formData.canonical_url}</p>
            <p className="text-sm font-semibold text-primary-700 hover:underline cursor-pointer truncate">
              {formData.meta_title}
            </p>
            <p className="text-xs text-text-secondary line-clamp-2">
              {formData.meta_description}
            </p>
          </div>
        </div>

        {/* Core Metadata Fields */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2">
            Default Site Meta Tags
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-text mb-1">
                Default Meta Title <span className="text-text-muted font-normal">({formData.meta_title.length} chars)</span>
              </label>
              <input
                type="text"
                required
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">
                Meta Description <span className="text-text-muted font-normal">({formData.meta_description.length} chars)</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                className="w-full rounded-xl border border-border bg-white p-3 text-xs text-text focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Social Meta OpenGraph */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary-600" />
            Social Sharing (OpenGraph / Facebook / Twitter)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Canonical Base URL</label>
              <input
                type="url"
                value={formData.canonical_url}
                onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Twitter / X Handle</label>
              <input
                type="text"
                value={formData.twitter_handle}
                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUploadDropzone
                label="Default Social Share Image (OG Image 1200x630px)"
                description="Default visual shown when website link is shared on WhatsApp, Facebook, or iMessage"
                value={formData.og_image_url}
                onChange={(url) => setFormData({ ...formData, og_image_url: url })}
                folder="seo"
                previewShape="banner"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="sm" className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? t("saving_changes_btn") : t("save_seo_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
