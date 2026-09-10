"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Globe,
  Save,
  CheckCircle2,
  Search,
  Share2,
  Sparkles,
  Smartphone,
  Eye,
  FileCode2,
  ShieldCheck,
  Bot,
  Layers,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import { saveSeoSettings, type SeoSettingsPayload } from "@/features/settings/actions";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";
import { getBaseUrl } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";
import { cn } from "@/lib/utils";

interface SeoSettingsClientProps {
  initialSettings: Record<string, any>;
}

export function SeoSettingsClient({ initialSettings }: SeoSettingsClientProps) {
  const { t } = useAdminLang();
  const [activeTab, setActiveTab] = useState<"icons" | "meta" | "social" | "robots" | "previews">("icons");

  const [formData, setFormData] = useState<SeoSettingsPayload>({
    meta_title: initialSettings.meta_title || "Blush & Budget — Premium Authentic Cosmetics & Skincare in Bangladesh",
    meta_description:
      initialSettings.meta_description ||
      "Shop 100% authentic Korean skincare, makeup, and beauty products from trusted global brands in Bangladesh. Best prices & fast nationwide delivery.",
    meta_keywords:
      initialSettings.meta_keywords ||
      "Korean skincare Bangladesh, authentic makeup BD, sunscreen, serum, cleanser, Blush and Budget",
    site_author: initialSettings.site_author || "Blush & Budget",
    canonical_url:
      initialSettings.canonical_url ||
      (typeof window !== "undefined" && window.location?.origin ? window.location.origin : getBaseUrl()),
    favicon_url: initialSettings.favicon_url || "/favicon.ico",
    apple_touch_icon_url: initialSettings.apple_touch_icon_url || "",
    android_icon_url: initialSettings.android_icon_url || "",
    og_image_url: initialSettings.og_image_url || "https://res.cloudinary.com/dyvma4kfc/image/upload/v1/og-default.jpg",
    og_type: initialSettings.og_type || "website",
    twitter_handle: initialSettings.twitter_handle || "@ecomxbangladesh",
    twitter_card: initialSettings.twitter_card || "summary_large_image",
    facebook_app_id: initialSettings.facebook_app_id || "",
    robots_index: initialSettings.robots_index !== false,
    robots_follow: initialSettings.robots_follow !== false,
    enable_structured_data: initialSettings.enable_structured_data !== false,
    enable_breadcrumbs_schema: initialSettings.enable_breadcrumbs_schema !== false,
    custom_robots_txt:
      initialSettings.custom_robots_txt ||
      `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /checkout/\nDisallow: /account/\n\nSitemap: ${getBaseUrl() || (typeof window !== "undefined" ? window.location.origin : "")}/sitemap.xml`,
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      await saveSeoSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-pink-50 text-[#e91e63] rounded-xl">
              <Globe className="h-5 w-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              SEO, Favicon & Social Sharing Center
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500">
            Configure search engine optimization, favicon & mobile icons, social cards, and indexing directives.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="bg-[#e91e63] hover:bg-pink-700 text-white font-bold rounded-2xl px-6 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : successMsg ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : successMsg ? "Saved Successfully!" : "Save SEO Settings"}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>SEO and Favicon settings successfully updated and live on storefront!</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-xs space-y-6">
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("icons")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "icons"
                ? "bg-white text-[#e91e63] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Favicon & App Icons
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("meta")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "meta"
                ? "bg-white text-[#e91e63] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            Meta Tags & Keywords
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "social"
                ? "bg-white text-[#e91e63] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Share2 className="h-3.5 w-3.5" />
            Social Sharing (OG & Twitter)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("robots")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "robots"
                ? "bg-white text-[#e91e63] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            Robots & Indexing
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("previews")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "previews"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Live Search & Social Previews
          </button>
        </div>

        {/* TAB 1: FAVICON & APP ICONS */}
        {activeTab === "icons" && (
          <div className="space-y-6 pt-2">
            <div className="p-4 rounded-2xl bg-linear-to-r from-pink-50/70 to-purple-50/70 border border-pink-100 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#e91e63] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-900">
                  Favicon & Mobile Bookmark Icons:
                </span>
                <p className="text-gray-600 leading-relaxed">
                  Upload your website icon below. The system automatically creates <code className="bg-white px-1.5 py-0.5 rounded text-pink-700 font-mono text-[11px]">&lt;link rel=&quot;icon&quot;&gt;</code> and <code className="bg-white px-1.5 py-0.5 rounded text-pink-700 font-mono text-[11px]">&lt;link rel=&quot;apple-touch-icon&quot;&gt;</code> tags for all browsers, iPhones, and Android devices.
                </p>
              </div>
            </div>

            {/* Live Browser Tab Preview */}
            <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200/80 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Live Browser Tab Mockup
              </span>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 max-w-sm shadow-xs">
                {formData.favicon_url ? (
                  <div className="h-4 w-4 shrink-0 relative overflow-hidden rounded">
                    <img
                      src={formData.favicon_url}
                      alt="Favicon"
                      className="h-4 w-4 object-contain"
                    />
                  </div>
                ) : (
                  <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <span className="text-xs font-semibold text-gray-800 truncate">
                  {formData.meta_title.split("—")[0].trim() || "Blush & Budget"}
                </span>
                <span className="ml-auto text-gray-400 text-xs">×</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Main Favicon */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-[#e91e63]" />
                    Main Favicon (.ico / .png)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Standard 32x32px or 64x64px browser tab icon.
                  </p>
                </div>

                <ImageUploadDropzone
                  label="Upload Favicon"
                  description="Recommended: PNG or ICO (32x32 or 64x64)"
                  value={formData.favicon_url || ""}
                  onChange={(url) => setFormData({ ...formData, favicon_url: url })}
                  folder="branding"
                />
              </div>

              {/* 2. Apple Touch Icon */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-indigo-600" />
                    Apple Touch Icon (iOS)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    180x180px icon for iPhone & iPad home screen bookmarks.
                  </p>
                </div>

                <ImageUploadDropzone
                  label="Upload Apple Touch Icon"
                  description="Recommended: PNG (180x180, solid background)"
                  value={formData.apple_touch_icon_url || ""}
                  onChange={(url) => setFormData({ ...formData, apple_touch_icon_url: url })}
                  folder="branding"
                />
              </div>

              {/* 3. Android / PWA Icon */}
              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    Android / PWA App Icon
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    192x192px icon for Android Chrome install & shortcuts.
                  </p>
                </div>

                <ImageUploadDropzone
                  label="Upload Android Icon"
                  description="Recommended: PNG (192x192 or 512x512)"
                  value={formData.android_icon_url || ""}
                  onChange={(url) => setFormData({ ...formData, android_icon_url: url })}
                  folder="branding"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: META TAGS & KEYWORDS */}
        {activeTab === "meta" && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Default Meta Title
                  </label>
                  <span className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-md",
                    formData.meta_title.length >= 50 && formData.meta_title.length <= 60
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {formData.meta_title.length} / 60 characters (Optimal: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="e.g. Blush & Budget — 100% Authentic Cosmetics & Skincare"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Default Meta Description
                  </label>
                  <span className={cn(
                    "text-[11px] font-bold px-2 py-0.5 rounded-md",
                    formData.meta_description.length >= 120 && formData.meta_description.length <= 160
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {formData.meta_description.length} / 160 characters (Optimal: 120-160)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Write a compelling summary describing your store and offers..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden leading-relaxed font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Meta Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_keywords || ""}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    placeholder="e.g. skincare, makeup, serum, cosmetics BD"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Site Author / Publisher Name
                  </label>
                  <input
                    type="text"
                    value={formData.site_author || ""}
                    onChange={(e) => setFormData({ ...formData, site_author: e.target.value })}
                    placeholder="e.g. Blush & Budget Limited"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOCIAL SHARING (OPENGRAPH & TWITTER) */}
        {activeTab === "social" && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Canonical Base URL</label>
                <input
                  type="url"
                  value={formData.canonical_url}
                  onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Twitter / X Handle</label>
                <input
                  type="text"
                  value={formData.twitter_handle}
                  onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                  placeholder="@blushbudget"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Twitter Card Format</label>
                <select
                  value={formData.twitter_card || "summary_large_image"}
                  onChange={(e) => setFormData({ ...formData, twitter_card: e.target.value as any })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                >
                  <option value="summary_large_image">Summary with Large Image (Recommended)</option>
                  <option value="summary">Small Thumbnail Summary</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Facebook App ID (Optional)</label>
                <input
                  type="text"
                  value={formData.facebook_app_id || ""}
                  onChange={(e) => setFormData({ ...formData, facebook_app_id: e.target.value })}
                  placeholder="e.g. 123456789012345"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploadDropzone
                  label="Default Social Share Image (OG Image 1200x630px)"
                  description="Displayed when your website link is shared on WhatsApp, Facebook Messenger, iMessage, or Twitter"
                  value={formData.og_image_url || ""}
                  onChange={(url) => setFormData({ ...formData, og_image_url: url })}
                  folder="seo"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROBOTS & INDEXING */}
        {activeTab === "robots" && (
          <div className="space-y-5 pt-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Indexing Switch */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">Search Engine Indexing (robots index)</h4>
                  <p className="text-[11px] text-gray-500">Allow Google and search engines to index your store.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.robots_index !== false}
                    onChange={(e) => setFormData({ ...formData, robots_index: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Follow Links Switch */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">Follow Links (robots follow)</h4>
                  <p className="text-[11px] text-gray-500">Allow crawlers to follow links across your pages.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.robots_follow !== false}
                    onChange={(e) => setFormData({ ...formData, robots_follow: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Custom Robots.txt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-[#e91e63]" />
                    Robots.txt Configuration
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Defines rules for search engine spiders crawling your website.
                  </p>
                </div>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#e91e63] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View XML Sitemap (/sitemap.xml)
                </a>
              </div>

              <textarea
                rows={7}
                value={formData.custom_robots_txt || ""}
                onChange={(e) => setFormData({ ...formData, custom_robots_txt: e.target.value })}
                className="w-full font-mono text-xs p-4 rounded-2xl bg-gray-900 text-gray-100 border border-gray-700 focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] outline-hidden leading-relaxed shadow-inner"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* TAB 5: LIVE SEARCH & SOCIAL PREVIEWS */}
        {activeTab === "previews" && (
          <div className="space-y-6 pt-2">
            {/* Google Desktop & Mobile SERP */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                Google Search Result Simulator
              </h3>

              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-1.5 font-sans">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="h-5 w-5 rounded-full bg-pink-100 text-[#e91e63] flex items-center justify-center font-bold text-[10px]">
                    B
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800">Blush & Budget</span>
                    <span className="text-[11px] text-gray-500 truncate max-w-sm">{formData.canonical_url}</span>
                  </div>
                </div>

                <p className="text-sm md:text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-tight">
                  {formData.meta_title}
                </p>

                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {formData.meta_description}
                </p>
              </div>
            </div>

            {/* Social Share Card (Facebook / WhatsApp) */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#e91e63]" />
                WhatsApp & Facebook Link Share Simulator
              </h3>

              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white max-w-md shadow-xs">
                {formData.og_image_url ? (
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={formData.og_image_url}
                      alt="OG Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    No OG image specified
                  </div>
                )}
                <div className="p-3 bg-gray-50 space-y-1 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    {(() => {
                      try {
                        return formData.canonical_url ? new URL(formData.canonical_url).hostname : (typeof window !== "undefined" ? window.location.hostname : "yourdomain.com");
                      } catch {
                        return typeof window !== "undefined" ? window.location.hostname : "yourdomain.com";
                      }
                    })()}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {formData.meta_title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {formData.meta_description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
