"use client";

import { useState } from "react";
import { Palette, Sparkles, Save, CheckCircle2, Sliders, Type, Layout, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { saveThemeSettings, type ThemeSettings } from "@/features/settings/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ThemeClientProps {
  initialSettings: ThemeSettings;
}

const THEMES = [
  { id: "rose", name: "Rose Gold Luxe", desc: "Signature K-Beauty aesthetic with soft rose gold highlights", bg: "bg-rose-500", border: "border-rose-500", activeBg: "bg-rose-50 border-rose-500" },
  { id: "emerald", name: "Korean Botanical Emerald", desc: "Natural clean-skincare vibe with soothing herbal green", bg: "bg-emerald-600", border: "border-emerald-600", activeBg: "bg-emerald-50 border-emerald-600" },
  { id: "violet", name: "Modern Velvet Plum", desc: "High-end luxury salon palette with deep royal violet", bg: "bg-purple-600", border: "border-purple-600", activeBg: "bg-purple-50 border-purple-600" },
  { id: "dark", name: "Midnight Monochrome", desc: "Sleek editorial dark aesthetic with clean contrast", bg: "bg-zinc-900", border: "border-zinc-900", activeBg: "bg-zinc-100 border-zinc-900" },
];

export function ThemeClient({ initialSettings }: ThemeClientProps) {
  const { t } = useAdminLang();
  const [themeColor, setThemeColor] = useState(initialSettings.themeColor || "rose");
  const [announcement, setAnnouncement] = useState(initialSettings.announcement || "100% Authentic Korean & UK Skincare | Free Delivery over ৳2,500!");
  const [insideDhakaFree, setInsideDhakaFree] = useState(initialSettings.insideDhakaFree || 2500);
  const [outsideDhakaFree, setOutsideDhakaFree] = useState(initialSettings.outsideDhakaFree || 3500);
  const [supportPhone, setSupportPhone] = useState(initialSettings.supportPhone || "+880 1700-000000");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await saveThemeSettings({
        themeColor,
        announcement,
        insideDhakaFree: Number(insideDhakaFree),
        outsideDhakaFree: Number(outsideDhakaFree),
        supportPhone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || t("err_failed_save_account"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">{t("theme_title")}</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {t("theme_desc")}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Color Theme Selector */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Palette className="h-4 w-4 text-primary-600" />
            Brand Color Palette & Store Aesthetic
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {THEMES.map((t) => (
              <div
                key={t.id}
                onClick={() => setThemeColor(t.id)}
                className={`cursor-pointer rounded-2xl border-2 p-3.5 space-y-2 transition-all ${
                  themeColor === t.id ? t.activeBg + " shadow-sm ring-1 ring-primary-500" : "border-border hover:border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-5 w-5 rounded-full ${t.bg}`} />
                    <span className="font-bold text-text text-xs">{t.name}</span>
                  </div>
                  {themeColor === t.id && (
                    <span className="text-[10px] font-bold text-primary-700 bg-white px-2 py-0.5 rounded-full border border-primary-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Type className="h-4 w-4 text-primary-600" />
            Top Announcement Bar & Header Marquee
          </h2>

          <div className="space-y-3">
            <div>
              <Label htmlFor="ann-text" className="mb-1 block">Announcement Marquee Text</Label>
              <Input
                id="ann-text"
                type="text"
                required
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g. 100% Authentic Korean & UK Skincare | Free Delivery over ৳2,500!"
              />
            </div>

            <div>
              <Label htmlFor="support-phone" className="mb-1 block">Direct Hotline / WhatsApp Support</Label>
              <Input
                id="support-phone"
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="e.g. +880 1700-000000"
              />
            </div>
          </div>
        </div>

        {/* Delivery Rules */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Sliders className="h-4 w-4 text-primary-600" />
            Shipping & Free Delivery Thresholds (BDT)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inside-free" className="mb-1 block">
                Inside Dhaka Free Shipping Threshold (৳)
              </Label>
              <Input
                id="inside-free"
                type="number"
                required
                value={insideDhakaFree}
                onChange={(e) => setInsideDhakaFree(Number(e.target.value))}
                min={0}
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Orders above this amount inside Dhaka qualify for complimentary delivery.
              </span>
            </div>

            <div>
              <Label htmlFor="outside-free" className="mb-1 block">
                Outside Dhaka Free Shipping Threshold (৳)
              </Label>
              <Input
                id="outside-free"
                type="number"
                required
                value={outsideDhakaFree}
                onChange={(e) => setOutsideDhakaFree(Number(e.target.value))}
                min={0}
              />
              <span className="text-[10px] text-text-muted mt-1 block">
                Orders nationwide above this amount qualify for free parcel transit.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> {t("store_settings_success")}
            </span>
          ) : (
            <div />
          )}

          <Button type="submit" size="sm" disabled={saving} className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1" />
            {saving ? t("saving_changes_btn") : t("save_theme_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
