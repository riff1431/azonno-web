"use client";

import { useState } from "react";
import { Truck, Save, RefreshCw, CheckCircle2, AlertTriangle, KeyRound, Sliders, Store, Webhook, Zap } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { ModuleTabs } from "@/components/admin/module-settings/module-tabs";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import { savePathaoSettings, testPathaoConnection, fetchPathaoStoresAction } from "@/features/logistics/courier-settings-actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface PathaoClientProps {
  initialSettings: any;
}

export function PathaoClient({ initialSettings }: PathaoClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingStores, setFetchingStores] = useState(false);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const tabs = [
    { id: "general", label: isBn ? "General & Store" : "General & Store" },
    { id: "credentials", label: isBn ? "API Credentials" : "API Credentials (OAuth2)" },
    { id: "automation", label: isBn ? "Automation Rules" : "Automation Rules" },
    { id: "webhook", label: isBn ? "Status Webhook" : "Status Webhook" },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await savePathaoSettings(formData);
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
      const res = await testPathaoConnection(formData);
      setTestResult(res);
      if (res.stores && res.stores.length > 0) {
        setAvailableStores(res.stores);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleFetchStores = async () => {
    setFetchingStores(true);
    try {
      const res = await fetchPathaoStoresAction(formData);
      if (res.success && res.stores) {
        setAvailableStores(res.stores);
        if (res.stores.length > 0 && !formData.store_id) {
          setFormData({ ...formData, store_id: String(res.stores[0].store_id || res.stores[0].id) });
        }
        alert(isBn ? `permanently Pathao from ${res.stores.length} items   !` : `Successfully fetched ${res.stores.length} store(s) from Pathao!`);
      } else {
        alert(res.error || (isBn ? "  Failed successfully। Pathao   Verification ।" : "Failed to fetch stores. Please verify your Pathao API credentials."));
      }
    } finally {
      setFetchingStores(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title={isBn ? "Pathao Courier items" : "Pathao Courier Integration"}
        description={
          isBn
            ? "Pathao - Delivery ,   Tracking    Add to Cart।"
            : "Pathao on-demand delivery API, automated parcel tracking, and Cash on Delivery reconciliation for Bangladesh."
        }
        icon={Truck}
        status={formData.client_id ? "connected" : "not_configured"}
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
          <span>Pathao settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {activeTab === "general" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Store className="h-4 w-4 text-primary-600" />
              Pathao Store & Environment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Environment</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="live">Live / Production (api-hermes.pathao.com)</option>
                  <option value="sandbox">Sandbox / Staging (courier-api-sandbox.pathao.com)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-text">Pathao Store ID</label>
                  <button
                    type="button"
                    onClick={handleFetchStores}
                    disabled={fetchingStores}
                    className="text-[11px] font-bold text-primary-600 hover:underline flex items-center gap-1"
                  >
                    {fetchingStores ? <RefreshCw className="h-3 w-3 animate-spin" /> : <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" /> Auto-Fetch Stores</span>}
                  </button>
                </div>

                {availableStores.length > 0 ? (
                  <select
                    value={formData.store_id}
                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  >
                    <option value="">Select a Pathao Store...</option>
                    {availableStores.map((st) => (
                      <option key={st.store_id || st.id} value={st.store_id || st.id}>
                        {st.store_name || st.name} (ID: {st.store_id || st.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.store_id}
                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                    placeholder="e.g. 12345 (Click Auto-Fetch Stores above)"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                )}
                <p className="text-[11px] text-text-muted mt-1">
                  The pickup warehouse store registered under your Pathao Merchant account.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "credentials" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-600" />
              Pathao Hermes OAuth2 API Credentials
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-text mb-1">
                  Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  placeholder="e.g. 1234 or your Pathao Client ID"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <SecretField
                id="pathao_client_secret"
                label="Client Secret"
                value={formData.client_secret}
                onChange={(val) => setFormData({ ...formData, client_secret: val })}
                isConfigured={!!formData.client_secret && formData.client_secret.startsWith("••••")}
                description="OAuth2 secret token from Pathao Developer portal."
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">
                    Merchant Email / Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="merchant@example.com"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  />
                </div>

                <SecretField
                  id="pathao_password"
                  label="Password"
                  value={formData.password}
                  onChange={(val) => setFormData({ ...formData, password: val })}
                  isConfigured={!!formData.password && formData.password.startsWith("••••")}
                  description="Merchant login password for OAuth2 bearer token grants."
                  required
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "automation" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary-600" />
              Automated Dispatch Settings
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                <div>
                  <span className="font-semibold text-text block">Auto-Book Pathao Consignment</span>
                  <span className="text-text-muted text-[11px]">
                    Creates parcel on Pathao system automatically when order moves to Confirmed/Processing.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_booking}
                  onChange={(e) => setFormData({ ...formData, auto_booking: e.target.checked })}
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
                Pathao Courier Webhook Integration
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Configure real-time automated delivery and parcel return callbacks from Pathao.
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

              const computedCallbackUrl = `${baseOrigin}/api/webhooks/courier/pathao`;
              const isLocalhost = baseOrigin.includes("localhost") || baseOrigin.includes("127.0.0.1");

              return (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-text">
                      Callback URL (Paste into Pathao Developer Portal)
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
                        alert("Pathao Callback URL copied to clipboard!");
                      }}
                      className="text-xs shrink-0"
                    >
                      Copy URL
                    </Button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Paste this into your Pathao Merchant Dashboard under <strong>Developer API &gt; Webhook URL</strong>.
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="sm" className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving Changes..." : "Save Pathao Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

