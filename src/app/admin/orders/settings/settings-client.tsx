"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  ExternalLink,
  KeyRound,
  Lock,
  Globe,
  Radio,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  savePostPurchaseConfig,
  type PostPurchaseConfig,
} from "@/features/automation/post-purchase-actions";
import {
  saveSteadfastSettings,
  testSteadfastConnection,
  savePathaoSettings,
  testPathaoConnection,
} from "@/features/logistics/courier-settings-actions";

export default function OrderAutomationSettingsClient({
  initialConfig,
  initialSteadfast,
  initialPathao,
}: {
  initialConfig: PostPurchaseConfig;
  initialSteadfast: any;
  initialPathao: any;
}) {
  const [form, setForm] = useState<PostPurchaseConfig>(initialConfig);
  const [sfForm, setSfForm] = useState(initialSteadfast);
  const [pathaoForm, setPathaoForm] = useState(initialPathao);

  const [saving, setSaving] = useState(false);
  const [testingSf, setTestingSf] = useState(false);
  const [testingPathao, setTestingPathao] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await Promise.all([
        savePostPurchaseConfig(form),
        saveSteadfastSettings({
          api_key: sfForm.api_key,
          secret_key: sfForm.secret_key,
          api_base_url: sfForm.api_base_url,
          auto_booking: sfForm.auto_booking,
          auto_sync_status: sfForm.auto_sync_status,
          environment: sfForm.environment,
          default_service: sfForm.default_service,
        }),
        savePathaoSettings({
          client_id: pathaoForm.client_id,
          client_secret: pathaoForm.client_secret,
          username: pathaoForm.username,
          password: pathaoForm.password,
          store_id: pathaoForm.store_id,
          auto_booking: pathaoForm.auto_booking,
          environment: pathaoForm.environment,
        }),
      ]);

      setMsg({
        type: "success",
        text: "Order automation rules & Courier API credentials saved successfully!",
      });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.message || "Failed to save courier configurations",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSf = async () => {
    setTestingSf(true);
    const res = await testSteadfastConnection();
    setMsg({
      type: res.success ? "success" : "error",
      text: `SteadFast API: ${res.message}`,
    });
    setTestingSf(false);
    setTimeout(() => setMsg(null), 5000);
  };

  const handleTestPathao = async () => {
    setTestingPathao(true);
    const res = await testPathaoConnection();
    setMsg({
      type: res.success ? "success" : "error",
      text: `Pathao Express: ${res.message}`,
    });
    setTestingPathao(false);
    setTimeout(() => setMsg(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#e91e63]" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Order Automation & Courier Control Hub
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure live API credentials for both SteadFast & Pathao, smart dispatch routing, and return triggers.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#e91e63] hover:bg-[#d81557] text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-xs shrink-0 self-start sm:self-center"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Configurations
        </Button>
      </div>

      {msg && (
        <div
          className={`rounded-2xl border p-4 text-xs font-bold flex items-center gap-2 animate-in fade-in-0 ${
            msg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* ============================================================ */}
        {/* 1. COURIER API GATEWAYS SETUP (BOTH STEADFAST & PATHAO)       */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-emerald-600" />
              Live Courier Gateways (Admin API Setup)
            </h2>
            <Link
              href="/admin/shipping"
              className="text-xs font-bold text-[#e91e63] hover:underline flex items-center gap-1"
            >
              <span>Manage Shipping Dashboard</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SteadFast Courier Setup Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-700 text-xs">
                      SF
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">SteadFast Courier</h3>
                      <p className="text-[10px] text-gray-500">Nationwide 64 Districts Parcel Delivery</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      sfForm.api_key
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {sfForm.api_key ? "API Active" : "Key Required"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      <span>API Key</span>
                      <span className="text-[10px] text-gray-400 font-normal">From SteadFast Portal</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. sf_live_xxxxxxxxxxxxxxxx"
                        value={sfForm.api_key}
                        onChange={(e) => setSfForm({ ...sfForm, api_key: e.target.value })}
                        className="w-full rounded-xl border pl-9 pr-3 py-2 font-mono text-xs font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      <span>Secret Key</span>
                      <span className="text-[10px] text-gray-400 font-normal">Secret Token</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={sfForm.secret_key}
                        onChange={(e) => setSfForm({ ...sfForm, secret_key: e.target.value })}
                        className="w-full rounded-xl border pl-9 pr-3 py-2 font-mono text-xs font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">REST API Base URL</label>
                    <input
                      type="text"
                      value={sfForm.api_base_url}
                      onChange={(e) => setSfForm({ ...sfForm, api_base_url: e.target.value })}
                      className="w-full rounded-xl border px-3 py-2 font-mono text-[11px] text-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSf}
                  disabled={testingSf || !sfForm.api_key}
                  className="text-xs font-bold rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5"
                >
                  {testingSf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  )}
                  Test SteadFast API
                </Button>

                <Link
                  href="/admin/shipping/steadfast"
                  className="text-[11px] font-bold text-gray-500 hover:text-emerald-700 underline"
                >
                  Advanced SF Settings →
                </Link>
              </div>
            </div>

            {/* Pathao Express Setup Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center font-black text-red-600 text-xs">
                      PTH
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm">Pathao Express</h3>
                      <p className="text-[10px] text-gray-500">Same-Day & Express Metro Delivery</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      pathaoForm.client_id
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {pathaoForm.client_id ? "API Active" : "Config Required"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      <span>Client ID</span>
                      <span className="text-[10px] text-gray-400 font-normal">OAuth2 Client ID</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. pathao_client_id_xxxxxxxx"
                        value={pathaoForm.client_id}
                        onChange={(e) => setPathaoForm({ ...pathaoForm, client_id: e.target.value })}
                        className="w-full rounded-xl border pl-9 pr-3 py-2 font-mono text-xs font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      <span>Client Secret</span>
                      <span className="text-[10px] text-gray-400 font-normal">Secret Token</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={pathaoForm.client_secret}
                        onChange={(e) => setPathaoForm({ ...pathaoForm, client_secret: e.target.value })}
                        className="w-full rounded-xl border pl-9 pr-3 py-2 font-mono text-xs font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-800 mb-1">Store ID / Hub</label>
                      <input
                        type="text"
                        placeholder="e.g. 12948"
                        value={pathaoForm.store_id}
                        onChange={(e) => setPathaoForm({ ...pathaoForm, store_id: e.target.value })}
                        className="w-full rounded-xl border px-3 py-2 font-mono text-xs text-gray-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-800 mb-1">Environment</label>
                      <select
                        value={pathaoForm.environment}
                        onChange={(e) => setPathaoForm({ ...pathaoForm, environment: e.target.value })}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                      >
                        <option value="sandbox">Sandbox (Testing)</option>
                        <option value="live">Live Production</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestPathao}
                  disabled={testingPathao || !pathaoForm.client_id}
                  className="text-xs font-bold rounded-xl border-red-200 text-red-700 hover:bg-red-50 px-3 py-1.5"
                >
                  {testingPathao ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 mr-1.5 text-red-600" />
                  )}
                  Test Pathao API
                </Button>

                <Link
                  href="/admin/shipping/pathao"
                  className="text-[11px] font-bold text-gray-500 hover:text-red-700 underline"
                >
                  Advanced Pathao Settings →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. RETURNS (RTO) & INVENTORY SYNCHRONIZATION                */}
        {/* ============================================================ */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <RotateCcw className="h-4 w-4 text-indigo-600" /> Returns (RTO) & Inventory Synchronization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2 sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRestockOnReturn}
                  onChange={(e) => setForm({ ...form, autoRestockOnReturn: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63]"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Auto-Restock Products on Parcel Return</span>
                  <span className="text-[11px] text-gray-500">
                    When courier webhook returns status 'returned' / 'cancelled', automatically restores inventory on-hand count.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. POST-PURCHASE & REPLENISHMENT AUTOMATION                  */}
        {/* ============================================================ */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="h-4 w-4 text-[#e91e63]" /> Post-Purchase & Replenishment Automation
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Product Review Request Delay
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.reviewRequestDays}
                  onChange={(e) => setForm({ ...form, reviewRequestDays: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3.5 py-2 font-bold font-mono text-gray-900 focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">Days after Delivery</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Skincare Restock Reminder
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  max="120"
                  value={form.replenishmentDays}
                  onChange={(e) => setForm({ ...form, replenishmentDays: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3.5 py-2 font-bold font-mono text-gray-900 focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">Days</span>
              </div>
              <span className="text-[10px] text-gray-400">e.g. 45 days for 50ml serums</span>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Auto Loyalty Cashback Points
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={form.autoLoyaltyPoints}
                  onChange={(e) => setForm({ ...form, autoLoyaltyPoints: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3.5 py-2 font-bold font-mono text-gray-900 focus:outline-none"
                />
                <span className="text-gray-500 whitespace-nowrap">Points</span>
              </div>
              <span className="text-[10px] text-gray-400">Credited on status 'delivered'</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
