"use client";

import { useState } from "react";
import {
  Sparkles,
  Save,
  Check,
  Smartphone,
  ShieldCheck,
  Star,
  MessageSquare,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import {
  type StoreFeatureSettings,
  saveStoreFeatureSettings,
} from "@/features/settings/feature-settings-actions";

interface FeatureSettingsClientProps {
  initialSettings: StoreFeatureSettings;
}

export function FeatureSettingsClient({ initialSettings }: FeatureSettingsClientProps) {
  const [form, setForm] = useState<StoreFeatureSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await saveStoreFeatureSettings(form);
    if (res.success) {
      setMsg({
        text: "Store feature controls saved and live system updated!",
        isError: false,
      });
      setTimeout(() => setMsg(null), 4000);
    } else {
      setMsg({
        text: res.error || "Failed to update feature settings",
        isError: true,
      });
    }
    setSaving(false);
  };

  const updateToggle = <K extends keyof StoreFeatureSettings>(
    key: K,
    value: StoreFeatureSettings[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#1D6474]" />
            <h1 className="text-2xl font-black text-text">Store Feature & UI/UX Controls</h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Toggle frontend features, beauty catalog engines, reviews, mobile floating CTAs, and automated transactional SMS on or off dynamically.
          </p>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="bg-[#164E63] hover:bg-[#164E63] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md transition-all active:scale-95"
        >
          {saving ? (
            "Saving Configuration..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" /> Save Changes
            </>
          )}
        </Button>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs sm:text-sm font-semibold animate-in fade-in-50 duration-200 border ${
            msg.isError
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {msg.isError ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* 1. Beauty Catalog & Multi-Dimensional Filters */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100/70 text-[#164E63]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-text">
              Beauty Catalog &amp; Smart Filters
            </h2>
            <p className="text-xs text-text-secondary">
              Control taxonomy filtering in product listing pages and category hubs.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Toggle: Beauty Filters */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Multi-Dimensional Beauty Filters</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Allow customers to filter products by Skin Type (Oily, Dry, etc.), Skin Concern (Acne, Brightening), and Key Actives.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_beauty_filters}
                onChange={(e) => updateToggle("enable_beauty_filters", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Toggle: Origin Badges */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Country of Origin Badges</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Display origin country tags (e.g. South Korea, Japan) on product cards and listings.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_origin_badges}
                onChange={(e) => updateToggle("enable_origin_badges", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Product Detail Page (PDP) Experience */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-text">
              Product Detail Page (PDP) Conversion Engine
            </h2>
            <p className="text-xs text-text-secondary">
              Mobile sticky buttons, shade swatches, and authenticity verification cards.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Toggle: Sticky Mobile CTA */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Sticky Mobile Buy Bar</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Slide up a floating bottom purchase bar on mobile when the user scrolls past the main buy button.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_sticky_mobile_cta}
                onChange={(e) => updateToggle("enable_sticky_mobile_cta", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Toggle: Authenticity Batch Verification */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Authenticity &amp; Batch Code Card</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Show 100% Genuine Importer seal, batch number, and expiry date freshness meter on PDP.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_authenticity_verification}
                onChange={(e) => updateToggle("enable_authenticity_verification", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Toggle: Frequently Bought Together Combo */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Frequently Bought Together Bundles</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Display dynamic routine combo bundles on PDP with 1-click bundle checkout discount.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_combo_bundle_section}
                onChange={(e) => updateToggle("enable_combo_bundle_section", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Customer Reviews & Verified Buyer UGC */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-text">
              Customer Reviews &amp; Social Proof
            </h2>
            <p className="text-xs text-text-secondary">
              Configure ratings, user photo uploads, and review moderation workflows.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Toggle: Customer Reviews */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Enable Reviews &amp; Q&amp;A</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Allow customers to post star ratings, written feedback, and ask product questions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_customer_reviews}
                onChange={(e) => updateToggle("enable_customer_reviews", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Toggle: Review Photo Uploads */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Review Photo Attachments</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Allow customers to attach real before/after or product unboxing images to their reviews.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_review_photo_uploads}
                onChange={(e) => updateToggle("enable_review_photo_uploads", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Toggle: Auto Approve Reviews */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Auto-Approve Reviews</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                If disabled, reviews will remain in &quot;Pending Moderation&quot; status until approved by an admin.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.auto_approve_reviews}
                onChange={(e) => updateToggle("auto_approve_reviews", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Automated Transactional SMS & Customer Returns */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-text">
              Automated SMS &amp; Return Portal
            </h2>
            <p className="text-xs text-text-secondary">
              Automate customer notifications via Bangladesh SMS gateways and set return policy rules.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Toggle: Order Placed SMS */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Order Confirmation SMS</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Send an immediate SMS confirmation with Order ID and total BDT amount upon placement.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_order_placed_sms}
                onChange={(e) => updateToggle("enable_order_placed_sms", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Toggle: Order Shipped SMS */}
          <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-secondary/40 border border-border">
            <div className="space-y-1 pr-3">
              <h4 className="text-xs font-bold text-text">Dispatch &amp; Tracking SMS</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Send an SMS with live courier tracking link when order status changes to &quot;Shipped&quot;.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.enable_order_shipped_sms}
                onChange={(e) => updateToggle("enable_order_shipped_sms", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#164E63]"></div>
            </label>
          </div>

          {/* Return Window Days */}
          <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-border space-y-2">
            <h4 className="text-xs font-bold text-text">Customer Return Window (Days)</h4>
            <p className="text-[11px] text-text-muted">
              Number of days after delivery that customers can initiate return or exchange requests.
            </p>
            <Input
              type="number"
              min="1"
              max="30"
              value={form.return_window_days}
              onChange={(e) => updateToggle("return_window_days", parseInt(e.target.value) || 7)}
              className="max-w-35 text-xs font-bold"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
