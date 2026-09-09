"use client";

import { useState } from "react";
import { CreditCard, Save, RefreshCw, CheckCircle2, AlertTriangle, KeyRound, Sliders, Webhook } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import { savePaymentGatewayConfig, testPaymentGatewayConnection } from "@/features/payments/actions";

export default function AdminStripePage() {
  const [formData, setFormData] = useState({
    publishable_key: "",
    secret_key: "",
    webhook_secret: "",
    environment: "sandbox",
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await savePaymentGatewayConfig("stripe", {
        publishable_key: { value: formData.publishable_key, valueType: "string" },
        secret_key: { value: formData.secret_key, isSecret: true },
        webhook_secret: { value: formData.webhook_secret, isSecret: true },
        environment: { value: formData.environment, valueType: "string" },
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testPaymentGatewayConnection("stripe");
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title="Stripe International Card Gateway"
          description="Accept international Visa, MasterCard, Apple Pay, Google Pay with 3D Secure verification."
          icon={CreditCard}
          status={formData.publishable_key ? "connected" : "not_configured"}
          backHref="/admin/payments"
        />

        <Button
          type="button"
          onClick={handleTest}
          disabled={testing}
          variant="outline"
          size="sm"
          className="text-xs shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} />
          {testing ? "Testing..." : "Test Stripe Connection"}
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
          <span>Stripe API keys saved and encrypted!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary-600" />
            Stripe API Keys (Restricted / Standard)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-text mb-1">Environment Mode</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              >
                <option value="sandbox">Test Mode (pk_test_... / sk_test_...)</option>
                <option value="live">Live Mode (pk_live_... / sk_live_...)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">
                Publishable Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.publishable_key}
                onChange={(e) => setFormData({ ...formData, publishable_key: e.target.value })}
                placeholder="pk_test_..."
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
              />
            </div>

            <SecretField
              id="stripe_secret_key"
              label="Secret Key"
              value={formData.secret_key}
              onChange={(val) => setFormData({ ...formData, secret_key: val })}
              placeholder="sk_test_..."
              description="Used on server for PaymentIntent creation. Stored encrypted."
              required
            />

            <SecretField
              id="stripe_webhook_secret"
              label="Webhook Signing Secret"
              value={formData.webhook_secret}
              onChange={(val) => setFormData({ ...formData, webhook_secret: val })}
              placeholder="whsec_..."
              description="Used to cryptographically verify Stripe webhook event signatures."
            />
          </div>
        </div>

        {/* Webhook Endpoint */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary-600" />
            Stripe Webhooks Endpoint
          </h2>

          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Configure this destination in your Stripe Dashboard under <strong>Developers &rarr; Webhooks</strong>:
            </p>

            <div className="rounded-xl border border-border bg-surface-secondary p-3 font-mono text-xs text-primary-700 select-all">
              https://blushbudget.com/api/webhooks/payments/stripe
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="sm" className="text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving Changes..." : "Save Stripe Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
