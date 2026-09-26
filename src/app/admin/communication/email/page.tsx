"use client";

import { useState } from "react";
import { Mail, Save, RefreshCw, CheckCircle2, AlertTriangle, KeyRound, Server } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import { saveEmailProviderConfig, testEmailSend } from "@/features/communication/actions";

export default function AdminEmailSettingsPage() {
  const [formData, setFormData] = useState({
    provider: "smtp",
    host: "smtp.resend.com",
    port: 465,
    username: "resend",
    password: "",
    from_name: "Azonno Orders",
    from_email: "orders@blushbudget.com",
    encryption: "ssl",
  });

  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("admin@blushbudget.com");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveEmailProviderConfig(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testEmailSend(testEmail);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ModuleHeader
        title="Email Notifications & SMTP Gateway"
        description="Configure transactional email dispatch for order confirmations, digital receipts, password resets, and admin dispatch alerts."
        icon={Mail}
        status={formData.host ? "connected" : "not_configured"}
        backHref="/admin/settings/modules"
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Email gateway configuration saved and encrypted!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Settings (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Server className="h-4 w-4 text-primary-600" />
              SMTP Server Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-text mb-1">Provider Engine</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                >
                  <option value="smtp">Custom SMTP Server</option>
                  <option value="resend">Resend API</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="brevo">Brevo (Sendinblue)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-text mb-1">SMTP Host</label>
                  <input
                    type="text"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text mb-1">From Name</label>
                  <input
                    type="text"
                    required
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text mb-1">From Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <SecretField
                id="smtp_password"
                label="SMTP Password / API Key"
                value={formData.password}
                onChange={(val) => setFormData({ ...formData, password: val })}
                description="Encrypted in PostgreSQL database."
              />

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving} size="sm" className="text-xs">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? "Saving..." : "Save Email Settings"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Test Email Dispatch (5 cols) */}
        <div className="lg:col-span-5">
          <form onSubmit={handleTestEmail} className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
            <h2 className="text-sm font-bold text-text border-b border-border pb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary-600" />
              Send Test Email
            </h2>

            {testResult && (
              <div
                className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] font-semibold ${
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

            <div>
              <label className="block font-semibold text-text mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={testing}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} />
              {testing ? "Dispatching..." : "Send Test Email"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
