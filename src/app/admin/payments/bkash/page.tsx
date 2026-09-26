"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Sliders,
  Webhook,
  Sparkles,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ArrowRight,
  Info
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { ModuleTabs } from "@/components/admin/module-settings/module-tabs";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import {
  getPaymentGatewayConfig,
  savePaymentGatewayConfig,
  testPaymentGatewayConnection,
  simulatePaymentTransaction,
} from "@/features/payments/actions";

export default function AdminBkashPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState("not_configured");

  const [formData, setFormData] = useState({
    app_key: "",
    app_secret: "",
    username: "",
    password: "",
    environment: "sandbox",
    tokenized: true,
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Human Verification Double-Check Simulator State
  const [simulating, setSimulating] = useState(false);
  const [simAmount, setSimAmount] = useState(500);
  const [simPhone, setSimPhone] = useState("01711223344");
  const [simResult, setSimResult] = useState<any>(null);

  const tabs = [
    { id: "general", label: "General & Mode" },
    { id: "credentials", label: "Merchant Credentials" },
    { id: "verification", label: "Double-Check Verification" },
    { id: "callbacks", label: "Webhook & Callback URLs" },
  ];

  // Fetch Existing Stored Configuration on Mount
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await getPaymentGatewayConfig("bkash");
        setIsEnabled(res.isEnabled);
        setStatus(res.status);

        if (res.settings && Object.keys(res.settings).length > 0) {
          setFormData((prev) => ({
            ...prev,
            app_key: res.settings.app_key || "",
            app_secret: res.settings.app_secret || "",
            username: res.settings.username || "",
            password: res.settings.password || "",
            environment: res.settings.environment || "sandbox",
            tokenized: res.settings.tokenized !== false,
          }));
        }
      } catch (err) {
        console.error("Failed to load bKash config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleFillSandbox = () => {
    setFormData({
      app_key: "4f6o0cjiki2rfm34kfdadl1eqq",
      app_secret: "2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b",
      username: "sandboxTokenizedUser02",
      password: "sandboxTokenizedUser02@12345",
      environment: "sandbox",
      tokenized: true,
    });
    setIsEnabled(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await savePaymentGatewayConfig(
        "bkash",
        {
          app_key: { value: formData.app_key, valueType: "string" },
          app_secret: { value: formData.app_secret, isSecret: true },
          username: { value: formData.username, valueType: "string" },
          password: { value: formData.password, isSecret: true },
          environment: { value: formData.environment, valueType: "string" },
          tokenized: { value: formData.tokenized, valueType: "boolean" },
        },
        isEnabled
      );
      setStatus(isEnabled ? "active" : "inactive");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testPaymentGatewayConnection("bkash");
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await simulatePaymentTransaction("bkash", simAmount, simPhone);
      setSimResult(res);
    } finally {
      setSimulating(false);
    }
  };

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/payments/bkash/callback`
      : "https://yourdomain.com/api/payments/bkash/callback";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title="bKash Payment Gateway (Direct API & Tokenized Checkout)"
          description="Accept instantaneous bKash payments from customer wallets with tokenized 1-click checkout and automated refund handling."
          icon={Smartphone}
          status={isEnabled ? "active" : formData.app_key ? "inactive" : "not_configured"}
          backHref="/admin/payments"
        />

        <div className="flex items-center gap-3">
          {/* Active / Disabled Master Switch */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-border shadow-xs">
            <span className="text-xs font-bold text-text">
              {isEnabled ? "Active" : "Disabled"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1D6474]"></div>
            </label>
          </div>

          <Button
            type="button"
            onClick={handleTest}
            disabled={testing || (!formData.app_key && !formData.username)}
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Credentials"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        
        {/* Quick Sandbox Auto-fill Helper */}
        <button
          type="button"
          onClick={handleFillSandbox}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D6474] hover:text-sg-pink-hover hover:underline transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Auto-Fill Sandbox Simulator Keys
        </button>
      </div>

      {testResult && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border p-4 text-xs font-semibold animate-in fade-in-0 ${
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
          <div>
            <p className="font-bold">{testResult.message}</p>
            {testResult.latencyMs !== undefined && (
              <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                Latency: {testResult.latencyMs}ms • Tokenized Gateway Endpoint Responsive
              </p>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>bKash merchant settings successfully saved and synced across storefront!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {activeTab === "general" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary-600" />
              Environment &amp; Checkout Behavior
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Environment Mode</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="sandbox">Sandbox (bKash PGW Simulator)</option>
                  <option value="live">Live / Production Merchant</option>
                </select>
                <p className="text-[11px] text-text-muted mt-1">
                  Use sandbox mode during staging verification without debiting real customer bKash wallets.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Checkout Flow</label>
                <select
                  value={formData.tokenized ? "tokenized" : "standard"}
                  onChange={(e) =>
                    setFormData({ ...formData, tokenized: e.target.value === "tokenized" })
                  }
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="tokenized">Tokenized Agreement &amp; 1-Click Checkout (Fastest)</option>
                  <option value="standard">Standard PGW Webview Redirect</option>
                </select>
                <p className="text-[11px] text-text-muted mt-1">
                  Tokenized checkout provides higher conversion by remembering customer wallet approvals.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "credentials" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-600" />
              bKash Merchant Portal API Keys
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-text mb-1">
                  App Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.app_key}
                  onChange={(e) => setFormData({ ...formData, app_key: e.target.value })}
                  placeholder="e.g. bkash_app_key_..."
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <SecretField
                id="bkash_app_secret"
                label="App Secret"
                value={formData.app_secret}
                onChange={(val) => setFormData({ ...formData, app_secret: val })}
                description="Issued by bKash PGW onboarding team. Stored encrypted."
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text mb-1">Merchant Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Merchant username"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  />
                </div>

                <SecretField
                  id="bkash_password"
                  label="Merchant Password"
                  value={formData.password}
                  onChange={(val) => setFormData({ ...formData, password: val })}
                  description="Password for token grant endpoint."
                />
              </div>

              {formData.environment === "sandbox" && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/60/60 p-4 space-y-2 mt-4 text-[11px] text-pink-950">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-[#1D6474]">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    Official bKash Developer Portal Sandbox Testing Credentials
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-white/90 rounded-lg p-2.5 border border-teal-200/80 shadow-2xs">
                      <span className="text-gray-500 block text-[10px] uppercase font-sans font-semibold">Test Wallet No</span>
                      <span className="font-bold text-gray-900 tracking-wider">01770618575</span>
                    </div>
                    <div className="bg-white/90 rounded-lg p-2.5 border border-teal-200/80 shadow-2xs">
                      <span className="text-gray-500 block text-[10px] uppercase font-sans font-semibold">Test OTP</span>
                      <span className="font-bold text-gray-900 tracking-wider">123456</span>
                    </div>
                    <div className="bg-white/90 rounded-lg p-2.5 border border-teal-200/80 shadow-2xs">
                      <span className="text-gray-500 block text-[10px] uppercase font-sans font-semibold">Test PIN</span>
                      <span className="font-bold text-gray-900 tracking-wider">12121</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#164E63] font-sans mt-1">
                    API Standard: Tokenized Checkout (v1.2.0-beta). Handshake communicates directly with bKash Sandbox PGW without deducting actual customer funds.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Double-Check Human Verification Simulation Tab */}
        {activeTab === "verification" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-5">
            <div className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-text">
                  Admin Double-Check Human Verification
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Execute a live transaction simulation to double-check that the bKash payment pipeline is functional, logged in the audit trail, and ready for customers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Test Amount (BDT)</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Customer bKash Mobile Number</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleRunSimulation}
              disabled={simulating || (!formData.app_key && !formData.username)}
              className="bg-[#1D6474] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Zap className={`h-3.5 w-3.5 mr-1.5 ${simulating ? "animate-spin" : ""}`} />
              {simulating ? "Verifying Transaction..." : `Execute Double-Check Verification (৳${simAmount})`}
            </Button>

            {simResult && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3 animate-in fade-in-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-extrabold text-emerald-900">
                      Payment Verification Confirmed!
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-900 uppercase">
                    Status: Verified &amp; Logged
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] border-t border-emerald-200/60 font-mono">
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Transaction ID</span>
                    <span className="font-black text-emerald-950">{simResult.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Auth Code</span>
                    <span className="font-black text-emerald-950">{simResult.authCode}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Verified Amount</span>
                    <span className="font-black text-emerald-950">৳{simResult.amount} BDT</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Latency</span>
                    <span className="font-black text-emerald-950">{simResult.latencyMs}ms</span>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 font-medium">
                  {simResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "callbacks" && (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary-600" />
              bKash Callback &amp; IPN Webhook URLs
            </h2>

            <div className="space-y-3">
              <p className="text-xs text-text-secondary">
                Configure this callback endpoint in your bKash merchant dashboard to receive asynchronous payment confirmations:
              </p>

              <div>
                <label className="block font-semibold text-text mb-1">Callback URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-border bg-surface-secondary p-3 font-mono text-xs text-primary-700 select-all overflow-x-auto">
                    {callbackUrl}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(callbackUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="shrink-0 text-xs rounded-xl"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-text-muted">
            Status: <span className="font-bold text-text capitalize">{status}</span>
          </div>
          <Button
            type="submit"
            disabled={saving}
            size="sm"
            className="bg-[#1D6474] hover:bg-[#164E63] text-white text-xs font-bold rounded-xl shadow-xs px-5"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving Changes..." : "Save bKash Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
