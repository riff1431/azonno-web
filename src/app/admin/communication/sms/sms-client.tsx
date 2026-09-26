"use client";

import { useState } from "react";
import {
  MessageSquare,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  Server,
  Wallet,
  RefreshCw,
  Info,
  ShieldCheck,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { SecretField } from "@/components/admin/module-settings/secret-field";
import { Button } from "@/components/shared/ui/button";
import {
  saveSmsProviderConfig,
  sendTestSms,
  checkSmsGatewayBalanceAction,
} from "@/features/communication/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface SmsClientProps {
  initialSettings: any;
}

const PROVIDER_DEFAULTS: Record<
  string,
  {
    url: string;
    senderPlaceholder: string;
    keyLabel: string;
    keyDesc: string;
    showUsername?: boolean;
    usernameLabel?: string;
    usernamePlaceholder?: string;
  }
> = {
  BulkSMSBD: {
    url: "https://bulksmsbd.net/api/smsapi",
    senderPlaceholder: "8809612000000 or ApprovedMasking",
    keyLabel: "BulkSMSBD API Key",
    keyDesc: "Found in your BulkSMSBD Portal -> API Settings.",
  },
  MIMSMS: {
    url: "https://api.mimsms.com/api/V2/SMS",
    senderPlaceholder: "8809612444598 or Approved Sender ID",
    keyLabel: "MiMSMS API Key",
    keyDesc: "Found in sms.mimsms.com → Utility → Developer (Must be Activated).",
    showUsername: true,
    usernameLabel: "MiMSMS Account Email (User Name)",
    usernamePlaceholder: "your_panel_login_email@gmail.com",
  },
  Greenweb: {
    url: "https://api.greenweb.com.bd/api.php",
    senderPlaceholder: "Optional Sender / Masking",
    keyLabel: "Greenweb BD API Token",
    keyDesc: "API Token generated from your Greenweb SMS account.",
  },
  Twilio: {
    url: "https://api.twilio.com",
    senderPlaceholder: "+1234567890 or Twilio Sender ID",
    keyLabel: "Twilio Auth Token",
    keyDesc: "Primary Auth Token from your Twilio Console dashboard.",
    showUsername: true,
    usernameLabel: "Twilio Account SID",
    usernamePlaceholder: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  Onnorokom: {
    url: "https://api2.onnorokomsms.com/HttpSendSms.ashx",
    senderPlaceholder: "Masking Name / Sender ID",
    keyLabel: "Onnorokom SMS API Key",
    keyDesc: "API Key from Onnorokom SMS developer portal.",
  },
  Custom: {
    url: "https://api.example.com/sms/send?apiKey={apiKey}&to={phone}&msg={message}&sender={senderId}",
    senderPlaceholder: "Sender ID",
    keyLabel: "API Key / Authorization Token",
    keyDesc: "Auth token replaced in {apiKey} placeholder or sent via HTTP.",
  },
};

export function SmsClient({ initialSettings }: SmsClientProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("01712345678");
  const [testMessage, setTestMessage] = useState(
    isBn ? "ecomXbd   from  SMS।" : "Test SMS alert from Azonno admin gateway."
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    provider?: string;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Balance Check State
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<{
    success: boolean;
    message: string;
    balance?: string | number;
    currency?: string;
  } | null>(null);

  const currentProvider = formData.provider_name || "BulkSMSBD";
  const providerMeta = PROVIDER_DEFAULTS[currentProvider] || PROVIDER_DEFAULTS.BulkSMSBD;

  const handleProviderChange = (newProvider: string) => {
    const meta = PROVIDER_DEFAULTS[newProvider] || PROVIDER_DEFAULTS.BulkSMSBD;
    setFormData({
      ...formData,
      provider_name: newProvider,
      api_url: meta.url,
    });
    setBalanceResult(null);
    setTestResult(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveSmsProviderConfig(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestSms(testPhone, testMessage, formData);
      setTestResult(res);
    } finally {
      setSendingTest(false);
    }
  };

  const handleCheckBalance = async () => {
    setCheckingBalance(true);
    setBalanceResult(null);
    try {
      const res = await checkSmsGatewayBalanceAction(formData);
      setBalanceResult(res);
    } finally {
      setCheckingBalance(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <ModuleHeader
        title={isBn ? "SMS     " : "SMS Gateway & Bulk Dispatch Providers"}
        description={
          isBn
            ? " items, Order Confirmed    for SMS,  SMS V2,    Add to Cart।"
            : "Configure dynamic HTTP/REST SMS providers (BulkSMSBD, MiMSMS V2, Greenweb, Twilio, Onnorokom, Custom) for instant OTP, order confirmations, and dispatch alerts."
        }
        icon={MessageSquare}
        status={formData.api_key ? "connected" : "not_configured"}
        backHref="/admin/settings/modules"
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{isBn ? "SMS  Settings permanently  successfully!" : "SMS Gateway credentials saved and updated!"}</span>
        </div>
      )}

      {/* Balance & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-text-muted">
              {isBn ? " items " : "Active Gateway"}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-sm text-text">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {currentProvider === "MIMSMS" ? "MiMSMS Official V2" : currentProvider}
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
            {formData.is_active !== false ? (isBn ? "Active" : "Active") : (isBn ? "" : "Disabled")}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center justify-between md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-text-muted">
                {isBn ? " SMS  / " : "Live SMS Account Balance"}
              </div>
              <div className="text-sm font-bold text-text">
                {balanceResult?.balance !== undefined ? (
                  <span className="text-emerald-600">৳{balanceResult.balance}</span>
                ) : balanceResult?.message ? (
                  <span className={balanceResult.success ? "text-text" : "text-amber-600 text-xs font-normal"}>
                    {balanceResult.message}
                  </span>
                ) : (
                  <span className="text-text-muted text-xs font-normal">
                    {isBn ? "    " : "Click to check remaining balance"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={checkingBalance || !formData.api_key}
            onClick={handleCheckBalance}
            className="text-xs shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${checkingBalance ? "animate-spin text-primary-600" : ""}`} />
            {checkingBalance ? (isBn ? " ..." : "Checking...") : (isBn ? " " : "Check Balance")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Provider Configuration (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Server className="h-4 w-4 text-primary-600" />
                {isBn ? " SMS  " : "Primary SMS Gateway Configuration"}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-text mb-1">
                  {isBn ? " Name" : "Provider Name"}
                </label>
                <select
                  value={formData.provider_name}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="BulkSMSBD">BulkSMSBD ({isBn ? "EnglishBangladeshi for " : "Recommended Bangladesh"})</option>
                  <option value="MIMSMS">MiMSMS (Official V2 REST API)</option>
                  <option value="Greenweb">Greenweb BD (Token API)</option>
                  <option value="Twilio">Twilio Global REST API</option>
                  <option value="Onnorokom">Onnorokom SMS</option>
                  <option value="Custom">{isBn ? " itemsitems " : "Custom HTTP Gateway"}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">
                  {isBn ? "  " : "API Endpoint URL"}
                </label>
                <input
                  type="url"
                  required
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {providerMeta.showUsername && (
                <div>
                  <label className="block font-semibold text-text mb-1">
                    {providerMeta.usernameLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username || ""}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={providerMeta.usernamePlaceholder}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {currentProvider === "MIMSMS" && (
                    <p className="text-[10px] text-text-muted mt-1">
                      {isBn
                        ? "your sms.mimsms.com  Login  Email items Enter।"
                        : "Enter your registered login email for the MiMSMS panel."}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-text mb-1">
                  {currentProvider === "Twilio"
                    ? (isBn ? " Phone Number /  ID" : "Twilio Phone Number / Sender ID")
                    : (isBn ? "  ID / " : "Approved Sender ID / Masking")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.sender_id}
                  onChange={(e) => setFormData({ ...formData, sender_id: e.target.value })}
                  placeholder={providerMeta.senderPlaceholder}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  {currentProvider === "MIMSMS"
                    ? (isBn
                        ? "sms.mimsms.com  Utility → Sender ID     Sender ID Enter।"
                        : "Enter the approved Sender ID from sms.mimsms.com → Utility → Sender ID.")
                    : (isBn
                        ? "-   88096...    Brand Name।"
                        : "For non-masking, use your 88096... virtual number or approved alphanumeric brand name.")}
                </p>
              </div>

              <SecretField
                id="sms_api_key"
                label={providerMeta.keyLabel}
                value={formData.api_key}
                onChange={(val) => setFormData({ ...formData, api_key: val })}
                description={providerMeta.keyDesc}
                required
              />

              {currentProvider === "MIMSMS" && (
                <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{isBn ? "MiMSMS V2  :" : "MiMSMS V2 Important Prerequisites:"}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-800 pt-1">
                    <li>
                      {isBn
                        ? "sms.mimsms.com  Utility → Developer from your API Key  'Activate'  ।"
                        : "Your API Key must be Activated under Utility → Developer."}
                    </li>
                    <li>
                      {isBn
                        ? "your   (  ) and  Utility → Developer- Whitelist   ।"
                        : "Your server/hosting IP address and domain must be whitelisted under Utility → Developer."}
                    </li>
                  </ul>
                </div>
              )}

              {currentProvider === "Custom" && (
                <div className="rounded-xl bg-zinc-50 border border-border p-3 text-[11px] text-text-secondary space-y-1">
                  <div className="font-bold flex items-center gap-1 text-text">
                    <Info className="h-3.5 w-3.5 text-primary-600" />
                    <span>{isBn ? "Name  use Rules:" : "Supported dynamic placeholders in URL:"}</span>
                  </div>
                  <div className="font-mono text-[10px] space-y-0.5 pt-1">
                    <div><code>&#123;apiKey&#125;</code>: {isBn ? "SMS  " : "API Key token"}</div>
                    <div><code>&#123;phone&#125;</code>: {isBn ? " Number (8801XXXXXXXXX)" : "Recipient phone (8801XXXXXXXXX)"}</div>
                    <div><code>&#123;mobile&#125;</code>: {isBn ? " Number (01XXXXXXXXX)" : "Local mobile (01XXXXXXXXX)"}</div>
                    <div><code>&#123;message&#125;</code>: {isBn ? " Code " : "URL encoded message text"}</div>
                    <div><code>&#123;senderId&#125;</code>: {isBn ? " ID" : "Sender ID / Masking"}</div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>{isBn ? "SMS   " : "Enable SMS Gateway Service"}</span>
                </label>

                <Button type="submit" disabled={saving} size="sm" className="text-xs">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving
                    ? (isBn ? "Save ..." : "Saving...")
                    : (isBn ? " Settings Save" : "Save Provider Settings")}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Test SMS Sender (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSendTestSms} className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Send className="h-4 w-4 text-primary-600" />
                {isBn ? "  SMS " : "Live Test SMS Dispatch"}
              </h2>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Gateway
              </span>
            </div>

            {testResult && (
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-[11px] font-semibold leading-relaxed animate-in fade-in ${
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
                  <p>{testResult.message}</p>
                  {testResult.latencyMs !== undefined && (
                    <span className="text-[10px] font-normal text-text-muted mt-1 block">
                      Gateway: {testResult.provider || currentProvider} • Latency: {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-text mb-1">
                {isBn ? " Mobile Number (English)" : "Recipient Mobile (Bangladesh)"}
              </label>
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="017XXXXXXXX or 88017XXXXXXXX"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-[10px] text-text-muted mt-0.5 block">
                {isBn ? "permanently 8801...  01...   " : "Auto-normalized to required gateway format (8801... / 01...)"}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">
                {isBn ? " SMS " : "Sample SMS Message"}
              </label>
              <textarea
                rows={3}
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-white p-3 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="flex items-center justify-between text-[10px] text-text-muted mt-1">
                <span>
                  {testMessage.length} {isBn ? "items " : "characters"}
                </span>
                <span>
                  {testMessage.length <= 160 ? "1 Credit (English/Unicode)" : "Multi-part SMS"}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={sendingTest || !formData.api_key}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <Send className={`h-3.5 w-3.5 mr-1.5 ${sendingTest ? "animate-spin" : ""}`} />
              {sendingTest
                ? (isBn ? "SMS  ..." : "Dispatching Test SMS...")
                : (isBn ? " SMS " : "Send Test SMS Now")}
            </Button>
          </form>

          {/* Quick Guide Card */}
          <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4 text-[11px] text-text-secondary space-y-2">
            <h3 className="font-bold text-text text-xs flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary-600" />
              {isBn ? "SMS Notification  " : "Automated SMS System Info"}
            </h3>
            <p className="leading-relaxed">
              {isBn
                ? "     All items, Order ,     SMS permanently    ।"
                : "All transactional SMS (OTP, order confirmations, courier dispatch tracking links, and abandoned cart recovery) are automatically dispatched using this connected gateway."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
