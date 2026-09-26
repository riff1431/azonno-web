"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
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
  Building,
  Wallet
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import {
  getPaymentGatewayConfig,
  savePaymentGatewayConfig,
  testPaymentGatewayConnection,
  simulatePaymentTransaction,
} from "@/features/payments/actions";

export default function AdminSslcommerzPage() {
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState("not_configured");

  const [formData, setFormData] = useState({
    store_id: "",
    store_password: "",
    environment: "sandbox",
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Human Verification Double-Check Simulator State
  const [simulating, setSimulating] = useState(false);
  const [simAmount, setSimAmount] = useState(1200);
  const [simPhone, setSimPhone] = useState("01811223344");
  const [simResult, setSimResult] = useState<any>(null);

  // Fetch Existing Stored Configuration on Mount
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await getPaymentGatewayConfig("sslcommerz");
        setIsEnabled(res.isEnabled);
        setStatus(res.status);

        if (res.settings && Object.keys(res.settings).length > 0) {
          setFormData((prev) => ({
            ...prev,
            store_id: res.settings.store_id || "",
            store_password: res.settings.store_password || "",
            environment: res.settings.environment || "sandbox",
          }));
        }
      } catch (err) {
        console.error("Failed to load SSLCommerz config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleFillSandbox = () => {
    setFormData({
      store_id: "ecomxbd_test_sandbox",
      store_password: "ecomxbd_password_live_test",
      environment: "sandbox",
    });
    setIsEnabled(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await savePaymentGatewayConfig(
        "sslcommerz",
        {
          store_id: { value: formData.store_id, valueType: "string" },
          store_password: { value: formData.store_password, isSecret: true },
          environment: { value: formData.environment, valueType: "string" },
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
      const res = await testPaymentGatewayConnection("sslcommerz");
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await simulatePaymentTransaction("sslcommerz", simAmount, simPhone);
      setSimResult(res);
    } finally {
      setSimulating(false);
    }
  };

  const ipnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/payments/sslcommerz/ipn`
      : "https://yourdomain.com/api/payments/sslcommerz/ipn";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title="SSLCommerz Gateway (Cards, Net Banking & Wallets)"
          description="Bangladesh's leading payment aggregator supporting Visa, MasterCard, Amex, bKash, Nagad, Rocket, and Internet Banking."
          icon={CreditCard}
          status={isEnabled ? "active" : formData.store_id ? "inactive" : "not_configured"}
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
            disabled={testing || !formData.store_id}
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Credentials"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end">
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
                Session Initialization Latency: {testResult.latencyMs}ms • Gateway Ready
              </p>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>SSLCommerz merchant configuration saved and synced across storefront!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary-600" />
            Store Identification &amp; Security Passwords
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">
                Store ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                placeholder="e.g. ecomxbangladesh_live"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Environment Mode</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              >
                <option value="sandbox">Sandbox (SSLCommerz Test PGW)</option>
                <option value="live">Live / Production Merchant</option>
              </select>
              <p className="text-[11px] text-text-muted mt-1">
                Select sandbox mode to test credit card, debit card, and MFS payment flows with simulator cards.
              </p>
            </div>

            <div className="sm:col-span-2">
              <SecretField
                id="sslcommerz_password"
                label="Store Password"
                value={formData.store_password}
                onChange={(val) => setFormData({ ...formData, store_password: val })}
                description="Secret store password from SSLCommerz onboarding team. Stored encrypted."
                required
              />
            </div>
          </div>
        </div>

        {/* Double-Check Human Verification Simulation Card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-5">
          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-text">
                Admin Double-Check Human Verification (Multi-Channel Simulation)
              </h2>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Verify that the SSLCommerz gateway session initializer is fully operational and logs valid transactions across Visa, MasterCard, and MFS channels.
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
              <label className="block font-semibold text-text mb-1">Customer Mobile Number</label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                placeholder="018XXXXXXXX"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-text-secondary">
            <span className="font-bold text-text">Simulated Channels:</span>
            <span className="bg-surface-secondary px-2.5 py-1 rounded-lg border border-border">Visa / MasterCard</span>
            <span className="bg-surface-secondary px-2.5 py-1 rounded-lg border border-border">bKash / Nagad</span>
            <span className="bg-surface-secondary px-2.5 py-1 rounded-lg border border-border">Citytouch / EBL NetBanking</span>
          </div>

          <Button
            type="button"
            onClick={handleRunSimulation}
            disabled={simulating || !formData.store_id}
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
                    SSLCommerz Double-Check Verification Confirmed!
                  </span>
                </div>
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-900 uppercase">
                  Status: Verified &amp; Logged
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] border-t border-emerald-200/60 font-mono">
                <div>
                  <span className="text-emerald-700 block text-[10px]">Session / TrxID</span>
                  <span className="font-black text-emerald-950">{simResult.transactionId}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px]">Auth / Bank Ref</span>
                  <span className="font-black text-emerald-950">{simResult.authCode}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px]">Verified Amount</span>
                  <span className="font-black text-emerald-950">৳{simResult.amount} BDT</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px]">Gateway Latency</span>
                  <span className="font-black text-emerald-950">{simResult.latencyMs}ms</span>
                </div>
              </div>

              <p className="text-xs text-emerald-800 font-medium">
                {simResult.message}
              </p>
            </div>
          )}
        </div>

        {/* Webhooks & Return URLs */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary-600" />
            IPN Instant Payment Notification Endpoints
          </h2>

          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Configure this IPN URL in your SSLCommerz Merchant Panel to receive automatic server-to-server transaction validation:
            </p>

            <div>
              <label className="block font-semibold text-text mb-1">IPN Notification URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-surface-secondary p-3 font-mono text-xs text-primary-700 select-all overflow-x-auto">
                  {ipnUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(ipnUrl);
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
            {saving ? "Saving Changes..." : "Save SSLCommerz Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
