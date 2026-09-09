"use client";

import React, { useState, useTransition } from "react";
import {
  Palette,
  Sparkles,
  Save,
  CheckCircle2,
  Sliders,
  Type,
  Layout,
  Phone,
  Mail,
  Truck,
  ShieldCheck,
  Eye,
  ExternalLink,
  RotateCcw,
  Tag,
  ShoppingBag,
  Percent,
  Check,
  Smartphone,
  Monitor,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { saveThemeSettings, type ThemeSettings } from "@/features/settings/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ThemeClientProps {
  initialSettings: ThemeSettings;
}

interface ThemePaletteDef {
  id: string;
  name: string;
  desc: string;
  primaryColor: string;
  accentColor: string;
  bgClass: string;
  badge: string;
}

const THEME_PALETTES: ThemePaletteDef[] = [
  {
    id: "rose",
    name: "Rose Gold Luxe",
    desc: "Signature K-Beauty aesthetic with soft rose gold and vibrant pink accents",
    primaryColor: "#e91e63",
    accentColor: "#fdf2f8",
    bgClass: "bg-[#e91e63]",
    badge: "Default K-Beauty",
  },
  {
    id: "emerald",
    name: "Korean Botanical Emerald",
    desc: "Natural clean-skincare vibe with soothing herbal green and tea tree tones",
    primaryColor: "#059669",
    accentColor: "#ecfdf5",
    bgClass: "bg-[#059669]",
    badge: "Organic Skincare",
  },
  {
    id: "violet",
    name: "Modern Velvet Plum",
    desc: "High-end luxury salon palette with deep royal violet and lavender accents",
    primaryColor: "#7c3aed",
    accentColor: "#f5f3ff",
    bgClass: "bg-[#7c3aed]",
    badge: "Luxury Glam",
  },
  {
    id: "dark",
    name: "Midnight Monochrome",
    desc: "Sleek editorial dark aesthetic with clean contrast and premium minimalism",
    primaryColor: "#18181b",
    accentColor: "#f4f4f5",
    bgClass: "bg-[#18181b]",
    badge: "Editorial Chic",
  },
  {
    id: "coral",
    name: "Sunset Coral & Peach",
    desc: "Radiant summer beauty glow with warm peach, coral, and golden undertones",
    primaryColor: "#ea580c",
    accentColor: "#fff7ed",
    bgClass: "bg-[#ea580c]",
    badge: "Warm Glow",
  },
  {
    id: "berry",
    name: "Royal Berry & Wine",
    desc: "Deep rich berry, ruby, and wine tones for bold cosmetics and lip aesthetics",
    primaryColor: "#be185d",
    accentColor: "#fdf2f8",
    bgClass: "bg-[#be185d]",
    badge: "Cosmetics & Glam",
  },
  {
    id: "ocean",
    name: "Oceanic Aqua Dew",
    desc: "Fresh hydrating skincare theme with cooling cyan, aqua, and glacier blue",
    primaryColor: "#0891b2",
    accentColor: "#ecfeff",
    bgClass: "bg-[#0891b2]",
    badge: "Hydra & Dewy",
  },
  {
    id: "amber",
    name: "Golden Honey & Propolis",
    desc: "Nourishing barrier care theme inspired by honey, propolis, and ginseng gold",
    primaryColor: "#d97706",
    accentColor: "#fffbeb",
    bgClass: "bg-[#d97706]",
    badge: "Honey & Ginseng",
  },
];

export function ThemeClient({ initialSettings }: ThemeClientProps) {
  const { t } = useAdminLang();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Theme State
  const [themeColor, setThemeColor] = useState(initialSettings.themeColor || "rose");
  const [announcement, setAnnouncement] = useState(initialSettings.announcement || "100% Authentic Korean & UK Skincare | Free Delivery over ৳2,500!");
  const [announcementEnabled, setAnnouncementEnabled] = useState(initialSettings.announcementEnabled !== false);
  const [announcementLink, setAnnouncementLink] = useState(initialSettings.announcementLink || "/shop");
  const [supportPhone, setSupportPhone] = useState(initialSettings.supportPhone || "+880 1753-804797");
  const [supportEmail, setSupportEmail] = useState(initialSettings.supportEmail || "support@blushandbudget.com");
  
  // Shipping & Delivery State
  const [insideDhakaFree, setInsideDhakaFree] = useState(initialSettings.insideDhakaFree || 2500);
  const [outsideDhakaFree, setOutsideDhakaFree] = useState(initialSettings.outsideDhakaFree || 3500);
  const [insideDhakaDeliveryFee, setInsideDhakaDeliveryFee] = useState(initialSettings.insideDhakaDeliveryFee || 70);
  const [outsideDhakaDeliveryFee, setOutsideDhakaDeliveryFee] = useState(initialSettings.outsideDhakaDeliveryFee || 130);
  const [showFreeDeliveryBar, setShowFreeDeliveryBar] = useState(initialSettings.showFreeDeliveryBar !== false);

  // Badges & Visual State
  const [productCardStyle, setProductCardStyle] = useState<"rounded" | "pill" | "square">(initialSettings.productCardStyle || "rounded");
  const [showAuthenticBadge, setShowAuthenticBadge] = useState(initialSettings.showAuthenticBadge !== false);
  const [showDiscountBadge, setShowDiscountBadge] = useState(initialSettings.showDiscountBadge !== false);
  const [showStockBadge, setShowStockBadge] = useState(initialSettings.showStockBadge !== false);
  const [footerTagline, setFooterTagline] = useState(initialSettings.footerTagline || "Authentic Korean & UK Skincare & Cosmetics in Bangladesh");
  const [copyrightText, setCopyrightText] = useState(initialSettings.copyrightText || `© ${new Date().getFullYear()} Blush & Budget. Authentic Skincare & Cosmetics Bangladesh.`);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    startTransition(async () => {
      try {
        await saveThemeSettings({
          themeColor,
          announcement,
          announcementEnabled,
          announcementLink,
          supportPhone,
          supportEmail,
          insideDhakaFree: Number(insideDhakaFree),
          outsideDhakaFree: Number(outsideDhakaFree),
          insideDhakaDeliveryFee: Number(insideDhakaDeliveryFee),
          outsideDhakaDeliveryFee: Number(outsideDhakaDeliveryFee),
          showFreeDeliveryBar,
          productCardStyle,
          showAuthenticBadge,
          showDiscountBadge,
          showStockBadge,
          footerTagline,
          copyrightText,
        });
        showToast("Theme and branding settings saved successfully!");
      } catch (err: any) {
        showToast(err.message || "Failed to save theme settings", "error");
      }
    });
  };

  const activeTheme = THEME_PALETTES.find((p) => p.id === themeColor) || THEME_PALETTES[0];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl transition-all ${
            toast.type === "success"
              ? "bg-slate-900 border-emerald-500/50 text-white"
              : "bg-red-950 border-red-500/50 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t("theme_title") || "Theme & Storefront Customization"}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: activeTheme.primaryColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {activeTheme.name}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t("theme_desc") || "Customize your storefront brand colors, marquee announcement banner, delivery thresholds, and card badges."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="text-xs border-gray-200 hover:bg-gray-50 text-gray-700 bg-white shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
            Live Preview
          </Button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            View Storefront
          </a>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSave()}
            disabled={isPending}
            className="text-xs text-white font-bold px-4 py-2 rounded-xl shadow-md transition"
            style={{ backgroundColor: activeTheme.primaryColor }}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Brand Color Palette & Aesthetic */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Palette className="h-4 w-4" style={{ color: activeTheme.primaryColor }} />
              Brand Color Palette & Store Aesthetic
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">
              Click any aesthetic to apply instantly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {THEME_PALETTES.map((p) => {
              const isSelected = themeColor === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setThemeColor(p.id)}
                  className={`cursor-pointer rounded-2xl border-2 p-3.5 space-y-2.5 transition-all relative ${
                    isSelected
                      ? "border-rose-500 bg-rose-50/40 shadow-sm ring-2 ring-rose-500/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full shadow-xs flex items-center justify-center text-white"
                        style={{ backgroundColor: p.primaryColor }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-gray-900 text-xs">{p.name}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed min-h-[32px]">
                    {p.desc}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {p.badge}
                    </span>
                    <span
                      className="h-2 w-8 rounded-full"
                      style={{ backgroundColor: p.primaryColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Top Announcement Bar & Marquee Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Type className="h-4 w-4" style={{ color: activeTheme.primaryColor }} />
              Top Announcement Bar & Header Marquee
            </h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-2 text-xs font-semibold text-gray-700">
                {announcementEnabled ? "Visible" : "Hidden"}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ann-text" className="mb-1 block font-bold text-gray-800">
                Announcement Marquee Text
              </Label>
              <Input
                id="ann-text"
                type="text"
                required
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g. 100% Authentic Korean & UK Skincare | Free Delivery over ৳2,500!"
                className="text-xs"
              />
              {/* Quick Template chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400 self-center mr-1">Templates:</span>
                {[
                  "100% Authentic Korean & UK Skincare | Free Delivery over ৳2,500!",
                  "⚡ Ramadan & Eid Exclusive Offers • Authentic Imports Guaranteed!",
                  "🎁 Free Travel Size Mini with every order over ৳3,000!",
                  "🚚 Cash on Delivery Available Nationwide • 24-48h Dhaka Delivery!",
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAnnouncement(txt)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 border border-gray-200 transition truncate max-w-xs"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ann-link" className="mb-1 block font-bold text-gray-800">
                  Announcement Destination Link
                </Label>
                <Input
                  id="ann-link"
                  type="text"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  placeholder="e.g. /shop, /categories/sunscreen"
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="support-phone" className="mb-1 block font-bold text-gray-800">
                  Direct Hotline / WhatsApp Support Phone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    id="support-phone"
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="e.g. +880 1753-804797"
                    className="pl-8.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Shipping & Free Delivery Thresholds (BDT) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4" style={{ color: activeTheme.primaryColor }} />
              Shipping & Free Delivery Thresholds (BDT)
            </h2>
            <span className="text-[11px] text-gray-400">
              Synced across checkout fraud and cart drawer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="inside-free" className="mb-1 block font-bold text-gray-800">
                Inside Dhaka Free Shipping (৳)
              </Label>
              <Input
                id="inside-free"
                type="number"
                required
                value={insideDhakaFree}
                onChange={(e) => setInsideDhakaFree(Number(e.target.value))}
                min={0}
                className="text-xs"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Orders &gt; ৳{insideDhakaFree} inside Dhaka get free delivery.
              </span>
            </div>

            <div>
              <Label htmlFor="outside-free" className="mb-1 block font-bold text-gray-800">
                Outside Dhaka Free Shipping (৳)
              </Label>
              <Input
                id="outside-free"
                type="number"
                required
                value={outsideDhakaFree}
                onChange={(e) => setOutsideDhakaFree(Number(e.target.value))}
                min={0}
                className="text-xs"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Orders &gt; ৳{outsideDhakaFree} nationwide get free delivery.
              </span>
            </div>

            <div>
              <Label htmlFor="inside-fee" className="mb-1 block font-bold text-gray-800">
                Standard Inside Dhaka Fee (৳)
              </Label>
              <Input
                id="inside-fee"
                type="number"
                value={insideDhakaDeliveryFee}
                onChange={(e) => setInsideDhakaDeliveryFee(Number(e.target.value))}
                min={0}
                className="text-xs"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Default courier fee inside Dhaka (৳{insideDhakaDeliveryFee}).
              </span>
            </div>

            <div>
              <Label htmlFor="outside-fee" className="mb-1 block font-bold text-gray-800">
                Standard Outside Dhaka Fee (৳)
              </Label>
              <Input
                id="outside-fee"
                type="number"
                value={outsideDhakaDeliveryFee}
                onChange={(e) => setOutsideDhakaDeliveryFee(Number(e.target.value))}
                min={0}
                className="text-xs"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Default nationwide courier fee (৳{outsideDhakaDeliveryFee}).
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cb-free-bar"
                checked={showFreeDeliveryBar}
                onChange={(e) => setShowFreeDeliveryBar(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="cb-free-bar" className="font-semibold text-gray-800 cursor-pointer">
                Display dynamic &quot;Free Delivery Progress Bar&quot; in Cart Drawer & Checkout
              </label>
            </div>
          </div>
        </div>

        {/* 4. Product Card Aesthetics & Trust Badges */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" style={{ color: activeTheme.primaryColor }} />
              Product Card Styling & Authenticity Badges
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showAuthenticBadge}
                onChange={(e) => setShowAuthenticBadge(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-rose-600"
              />
              <div>
                <span className="font-bold text-gray-900 block text-xs">
                  Authentic Guarantee Badge
                </span>
                <span className="text-[10px] text-gray-500">
                  Shows &quot;100% Authentic&quot; seal on catalog cards
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showDiscountBadge}
                onChange={(e) => setShowDiscountBadge(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-rose-600"
              />
              <div>
                <span className="font-bold text-gray-900 block text-xs">
                  Discount Percentage Pill
                </span>
                <span className="text-[10px] text-gray-500">
                  Highlights &quot;-25% OFF&quot; badges on sale items
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showStockBadge}
                onChange={(e) => setShowStockBadge(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-rose-600"
              />
              <div>
                <span className="font-bold text-gray-900 block text-xs">
                  Stock Urgency Status
                </span>
                <span className="text-[10px] text-gray-500">
                  Displays &quot;In Stock&quot; or &quot;Only 2 Left&quot; tags
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 5. Storefront Footer & Legal Tagline */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layout className="h-4 w-4" style={{ color: activeTheme.primaryColor }} />
              Storefront Footer Branding & Copyright
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="footer-tagline" className="mb-1 block font-bold text-gray-800">
                Footer Brand Tagline
              </Label>
              <Input
                id="footer-tagline"
                type="text"
                value={footerTagline}
                onChange={(e) => setFooterTagline(e.target.value)}
                placeholder="Authentic Korean & UK Skincare & Cosmetics in Bangladesh"
                className="text-xs"
              />
            </div>

            <div>
              <Label htmlFor="copyright-text" className="mb-1 block font-bold text-gray-800">
                Copyright Notice
              </Label>
              <Input
                id="copyright-text"
                type="text"
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                placeholder="© 2026 Blush & Budget. All rights reserved."
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Changes take effect immediately across all storefront visitor sessions.
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="text-xs text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            style={{ backgroundColor: activeTheme.primaryColor }}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? "Saving Theme..." : "Save All Theme Customizations"}
          </Button>
        </div>
      </form>

      {/* Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: activeTheme.primaryColor }}
                >
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Live Theme Preview: {activeTheme.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Interactive simulation of storefront header, marquee, and product cards with selected palette.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl border border-gray-300/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      previewMode === "desktop" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      previewMode === "mobile" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body Preview */}
            <div className="flex-1 bg-gray-100 overflow-y-auto p-4 flex items-center justify-center">
              <div
                className={`bg-white shadow-xl overflow-y-auto transition-all ${
                  previewMode === "mobile"
                    ? "w-[390px] h-[680px] rounded-3xl border-4 border-gray-800"
                    : "w-full h-full rounded-2xl border border-gray-200"
                }`}
                data-theme={themeColor}
              >
                {/* Simulated Announcement Bar */}
                {announcementEnabled && (
                  <div
                    className="text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-between"
                    style={{ backgroundColor: activeTheme.primaryColor }}
                  >
                    <span className="mx-auto truncate">{announcement}</span>
                    <span className="hidden sm:inline text-[11px] opacity-90">{supportPhone}</span>
                  </div>
                )}

                {/* Simulated Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                      style={{ backgroundColor: activeTheme.primaryColor }}
                    >
                      BB
                    </div>
                    <span className="font-extrabold text-sm text-gray-900">BLUSH &amp; BUDGET</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 font-medium text-gray-700">
                      Cart (2)
                    </span>
                    <button
                      type="button"
                      className="text-xs font-bold text-white px-3 py-1 rounded-xl shadow-xs"
                      style={{ backgroundColor: activeTheme.primaryColor }}
                    >
                      Checkout
                    </button>
                  </div>
                </div>

                {/* Simulated Free Shipping Banner */}
                {showFreeDeliveryBar && (
                  <div className="p-3 bg-slate-50 border-b border-gray-100 text-center text-xs">
                    <p className="font-bold text-gray-800">
                      🚚 Free delivery inside Dhaka over ৳{insideDhakaFree}! (Nationwide over ৳{outsideDhakaFree})
                    </p>
                    <div className="w-48 mx-auto bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: "70%", backgroundColor: activeTheme.primaryColor }}
                      />
                    </div>
                  </div>
                )}

                {/* Simulated Product Card Grid */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-2xl p-3 space-y-2 bg-white shadow-xs">
                    <div className="h-28 bg-gray-100 rounded-xl flex items-center justify-center relative">
                      <span className="text-gray-400 text-xs">Product Image</span>
                      {showDiscountBadge && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md bg-rose-600">
                          -20%
                        </span>
                      )}
                      {showAuthenticBadge && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded-md border border-emerald-200">
                          Authentic
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate">COSRX Snail 96 Mucin</p>
                      <p className="text-xs font-black mt-0.5" style={{ color: activeTheme.primaryColor }}>
                        ৳1,450
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-full py-1 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: activeTheme.primaryColor }}
                    >
                      Add to Cart
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-2xl p-3 space-y-2 bg-white shadow-xs">
                    <div className="h-28 bg-gray-100 rounded-xl flex items-center justify-center relative">
                      <span className="text-gray-400 text-xs">Product Image</span>
                      {showAuthenticBadge && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded-md border border-emerald-200">
                          Authentic
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate">Beauty of Joseon Sunscreen</p>
                      <p className="text-xs font-black mt-0.5" style={{ color: activeTheme.primaryColor }}>
                        ৳1,320
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-full py-1 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: activeTheme.primaryColor }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* Simulated Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-500 space-y-1 mt-4">
                  <p className="font-semibold text-gray-700">{footerTagline}</p>
                  <p className="text-[10px] text-gray-400">{copyrightText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
