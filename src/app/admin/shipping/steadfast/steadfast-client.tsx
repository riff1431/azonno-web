"use client";

import { useState } from "react";
import { Truck, Save, RefreshCw, CheckCircle2, AlertTriangle, KeyRound, Sliders, Webhook, Activity } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { ModuleTabs } from "@/components/admin/module-settings/module-tabs";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import { saveSteadfastSettings, testSteadfastConnection } from "@/features/logistics/courier-settings-actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface SteadfastClientProps {
  initialSettings: any;
}

export function SteadfastClient({ initialSettings }: SteadfastClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const tabs = [
    { id: "general", label: isBn ? "General & Services" : "General & Service" },
    { id: "credentials", label: isBn ? "API Credentials" : "API Credentials" },
    { id: "automation", label: isBn ? "Automation Rules" : "Automation Rules" },
    { id: "webhook", label: isBn ? "Status Webhook" : "Status Webhook" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveSteadfastSettings(formData);
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
      const res = await testSteadfastConnection(formData);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title={isBn ? "items Courier items" : "SteadFast Courier Integration"}
        description={
          isBn
            ? "English   , Cash  Delivery  and Tracking Code   ।"
            : "Automated consignment dispatch, Cash on Delivery remittance reconciliation, and tracking barcode generation across Bangladesh."
        }
        icon={Truck}
        status={formData.api_key ? "connected" : "not_configured"}
        backHref="/admin/shipping"
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
          {testing ? "Testing..." : "Test Connection"}
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
          <span>SteadFast settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {activeTab === "general" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary-600" />
              General Environment & Service Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Environment</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="live">Live / Production</option>
                  <option value="sandbox">Sandbox / Staging</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">API Base URL</label>
                <input
                  type="url"
                  required
                  value={formData.api_base_url}
                  onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "credentials" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-600" />
              SteadFast Merchant API Credentials
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
                  placeholder="e.g. sf_live_key_..."
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <SecretField
                id="steadfast_secret_key"
                label="Secret Key"
                value={formData.secret_key}
                onChange={(val) => setFormData({ ...formData, secret_key: val })}
                isConfigured={!!formData.secret_key && formData.secret_key.startsWith("••••")}
                description="Secret authorization token obtained from your SteadFast merchant dashboard."
                required
              />
            </div>
          </div>
        )}

        {activeTab === "automation" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary-600" />
              Automated Dispatch & Sync
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Auto-Book Consignment on &quot;Shipped&quot; Status</span>
                  <span className="text-text-muted text-[11px]">
                    Automatically posts parcel data to SteadFast and fetches tracking ID when order moves to Shipped.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_booking}
                  onChange={(e) => setFormData({ ...formData, auto_booking: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Auto-Sync Delivery Status via Webhooks</span>
                  <span className="text-text-muted text-[11px]">
                    Automatically updates store orders to &quot;Delivered&quot; or &quot;Returned&quot; when SteadFast updates rider status.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_sync_status}
                  onChange={(e) => setFormData({ ...formData, auto_sync_status: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === "webhook" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary-600" />
                SteadFast Webhook Integration
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Configure real-time automated delivery and tracking updates from the SteadFast Merchant Portal.
              </p>
            </div>

            {/* Custom Live Domain / App URL Override */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text">
                Live Store Domain (Optional Override)
              </label>
              <input
                type="text"
                value={formData.webhook_domain_override || ""}
                onChange={(e) => setFormData({ ...formData, webhook_domain_override: e.target.value })}
                placeholder="e.g. https://yourdomain.com (Leave blank to auto-detect)"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
              />
              <p className="text-[11px] text-text-muted">
                If you are testing locally on <code>localhost</code>, enter your live production domain or ngrok tunnel URL above. When deployed live, it automatically uses your active store domain.
              </p>
            </div>

            {/* Callback URL Field with Dynamic Origin & 1-Click Copy */}
            {(() => {
              const baseOrigin = formData.webhook_domain_override?.trim()
                ? formData.webhook_domain_override.trim().replace(/\/$/, "")
                : typeof window !== "undefined" && window.location?.origin
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_APP_URL || "");

              const computedCallbackUrl = `${baseOrigin}/api/webhooks/courier/steadfast`;
              const isLocalhost = baseOrigin.includes("localhost") || baseOrigin.includes("127.0.0.1");

              return (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-text">
                      Callback URL (Paste into SteadFast Merchant Portal)
                    </label>
                    {isLocalhost && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Running on Localhost (Auto-changes on Live Domain)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border border-border bg-surface-secondary px-3.5 py-2 font-mono text-xs text-primary-700 select-all truncate">
                      {computedCallbackUrl}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(computedCallbackUrl);
                        alert("Callback URL copied to clipboard!");
                      }}
                      className="text-xs shrink-0"
                    >
                      Copy URL
                    </Button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Paste this into your SteadFast Portal under <strong>Webhook Settings &gt; Callback Url</strong>.
                  </p>
                </div>
              );
            })()}

            {/* Auth Token (Bearer) Field */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <label className="block text-xs font-bold text-text">
                Auth Token (Bearer)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.webhook_auth_token || ""}
                  onChange={(e) => setFormData({ ...formData, webhook_auth_token: e.target.value })}
                  placeholder="e.g. sf_wh_sec_99482..."
                  className="flex-1 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const generated = `sf_wh_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
                    setFormData({ ...formData, webhook_auth_token: generated });
                  }}
                  className="text-xs shrink-0"
                >
                  Generate Token
                </Button>
                {formData.webhook_auth_token && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.webhook_auth_token);
                      alert("Auth Token copied to clipboard!");
                    }}
                    className="text-xs shrink-0"
                  >
                    Copy Token
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                Paste this into your SteadFast Portal under <strong>Auth Token(Bearer)</strong>. SteadFast will pass this in the <code>Authorization: Bearer &lt;token&gt;</code> header.
              </p>
            </div>


            {/* SteadFast Webhook Specs Reference Card */}
            <div className="rounded-xl border border-border bg-surface-secondary/50 p-4 text-xs space-y-2 text-text-secondary">
              <span className="font-bold text-text block">Supported SteadFast Notifications:</span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>
                  <strong>delivery_status:</strong> Updates order to <code>Delivered</code> / <code>Cancelled</code> / <code>Returned</code> and reconciles COD payment & inventory restock automatically.
                </li>
                <li>
                  <strong>tracking_update:</strong> Appends real-time rider & sorting center checkpoints to the order audit trail.
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="sm" className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving Changes..." : "Save SteadFast Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
