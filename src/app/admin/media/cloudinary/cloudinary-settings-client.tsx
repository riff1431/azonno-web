"use client";

import { useState } from "react";
import { Cloud, Save, RefreshCw, CheckCircle2, AlertTriangle, KeyRound, Folder, Sparkles } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { ModuleTabs } from "@/components/admin/module-settings/module-tabs";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import {
  saveCloudinaryModuleSettings,
  testCloudinaryConnection,
} from "@/features/media/cloudinary-settings-actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface CloudinarySettingsClientProps {
  initialSettings: any;
}

export function CloudinarySettingsClient({ initialSettings }: CloudinarySettingsClientProps) {
  const { t } = useAdminLang();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const tabs = [
    { id: "general", label: "General & Folders" },
    { id: "credentials", label: "API Credentials" },
    { id: "optimization", label: "Image Transformations" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveCloudinaryModuleSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testCloudinaryConnection();
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title="Cloudinary Media & CDN Module"
        description="Direct image and video uploads, WebP/AVIF auto-format delivery, signature generation, and storage folder hierarchy."
        icon={Cloud}
        status={formData.cloud_name ? "connected" : "not_configured"}
        backHref="/admin/settings/modules"
      />

      <div className="flex items-center justify-between">
        <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <Button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          variant="outline"
          size="sm"
          className="text-xs shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} />
          {testing ? t("testing_connection_btn") : t("test_connection_btn")}
        </Button>
      </div>

      {testResult && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-xs font-semibold ${
            testResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{t("store_settings_success")}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* General & Folders Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary-600" />
                Cloudinary Account Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-text mb-1">
                    Cloud Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cloud_name}
                    onChange={(e) => setFormData({ ...formData, cloud_name: e.target.value })}
                    placeholder="e.g. dyvma4kfc"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary-600" />
                Cloudinary Media Hierarchy Folders
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">Products Folder</label>
                  <input
                    type="text"
                    value={formData.product_folder}
                    onChange={(e) => setFormData({ ...formData, product_folder: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Categories Folder</label>
                  <input
                    type="text"
                    value={formData.category_folder}
                    onChange={(e) => setFormData({ ...formData, category_folder: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Brands Folder</label>
                  <input
                    type="text"
                    value={formData.brand_folder}
                    onChange={(e) => setFormData({ ...formData, brand_folder: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Banners Folder</label>
                  <input
                    type="text"
                    value={formData.banner_folder}
                    onChange={(e) => setFormData({ ...formData, banner_folder: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-600" />
              API Authentication Keys
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-text mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="e.g. 682948826151423"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <SecretField
                id="cloudinary_api_secret"
                label="API Secret"
                value={formData.api_secret}
                onChange={(val) => setFormData({ ...formData, api_secret: val })}
                isConfigured={!!formData.api_secret && formData.api_secret.startsWith("••••")}
                description="Used on server-side to sign upload parameters. Stored with AES-256-GCM encryption."
                required
              />
            </div>
          </div>
        )}

        {/* Transformations Tab */}
        {activeTab === "optimization" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Real-time Image Delivery & Optimization
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Auto Optimization (q_auto, f_auto)</span>
                  <span className="text-text-muted text-[11px]">
                    Delivers next-gen WebP/AVIF formats and reduces file sizes automatically according to customer browser support.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_optimization}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_optimization: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">Default Format</label>
                  <select
                    value={formData.default_format}
                    onChange={(e) => setFormData({ ...formData, default_format: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  >
                    <option value="auto">Auto (Best for client device)</option>
                    <option value="webp">WebP</option>
                    <option value="avif">AVIF</option>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Default Quality</label>
                  <select
                    value={formData.default_quality}
                    onChange={(e) => setFormData({ ...formData, default_quality: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  >
                    <option value="auto">Auto (Smart compression)</option>
                    <option value="auto:best">Auto: Best Visual Quality</option>
                    <option value="auto:eco">Auto: Eco (Maximum Bandwidth Saving)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="sm" className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? t("saving_changes_btn") : t("save_cloudinary_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
