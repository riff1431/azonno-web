"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Phone,
  Globe,
  Mail,
  AlertTriangle,
  Search,
  CheckCircle2,
  Loader2,
  X,
  Truck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Settings2,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { addBlacklistEntry, removeBlacklistEntry, type FraudProfile } from "@/features/fraud/actions";
import {
  saveBDCourierSettings,
  verifyBDCourierApiKey,
  type BDCourierConfig,
  type BDCourierReport,
} from "@/features/fraud/bdcourier-service";
import { BDCourierHistoryCard } from "@/features/fraud/bdcourier-card";
import { useAdminLang } from "@/lib/admin-lang-context";

interface FraudBlacklistClientProps {
  initialProfiles: FraudProfile[];
  initialBDCourierSettings?: BDCourierConfig;
}

export default function FraudBlacklistClient({
  initialProfiles,
  initialBDCourierSettings = {
    apiKey: "",
    enabled: true,
    autoCheckOnOrder: true,
    minSuccessRatioWarning: 70,
    blockThresholdRatio: 40,
  },
}: FraudBlacklistClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [activeTab, setActiveTab] = useState<"blacklist" | "lookup" | "settings">("blacklist");
  const [profiles, setProfiles] = useState<FraudProfile[]>(initialProfiles);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"phone" | "ip" | "email">("phone");
  const [addValue, setAddValue] = useState("");
  const [addReason, setAddReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // BDCourier Settings State
  const [bdSettings, setBdSettings] = useState<BDCourierConfig>(initialBDCourierSettings);
  const [apiKeyInput, setApiKeyInput] = useState(initialBDCourierSettings.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    message: string;
    isLive: boolean;
    data?: any;
  } | null>(null);

  const searchParams = useSearchParams();
  const [lookupPhone, setLookupPhone] = useState(searchParams.get("phone") || "");
  const [activeLookupPhone, setActiveLookupPhone] = useState(searchParams.get("phone") || "");

  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    const tabParam = searchParams.get("tab");
    if (phoneParam) {
      setLookupPhone(phoneParam);
      setActiveLookupPhone(phoneParam);
      setActiveTab("lookup");
    } else if (tabParam === "lookup" || tabParam === "settings") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const showFeedback = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValue.trim()) return;
    setSaving(true);

    const res = await addBlacklistEntry({
      type: addType,
      value: addValue,
      reason: addReason,
    });

    if (res.success && res.profile) {
      setProfiles([res.profile, ...profiles]);
      setAddValue("");
      setAddReason("");
      setShowAddModal(false);
      showFeedback(isBn ? "Security to blocklist added  successfully!" : "Entry added to security blacklist!");
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    await removeBlacklistEntry(id);
    setProfiles(profiles.filter((p) => p.id !== id));
    showFeedback(isBn ? " from   successfully।" : "Entry removed from blacklist.");
  };

  // Save BDCourier Settings
  const handleSaveBDCourierSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const res = await saveBDCourierSettings({
      ...bdSettings,
      apiKey: apiKeyInput.trim(),
    });
    if (res.success && res.settings) {
      setBdSettings(res.settings);
      showFeedback(isBn ? "Courier  permanently  successfully!" : "BDCourier configuration saved successfully!");
    } else {
      showFeedback(res.error || (isBn ? "Settings Save Failed successfully।" : "Failed to save settings."));
    }
    setSavingSettings(false);
  };

  // Test & Verify API Key
  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setVerifyResult({
        success: false,
        message: isBn ? " your Courier   Enter।" : "Please enter your BDCourier API Key first.",
        isLive: false,
      });
      return;
    }

    setVerifyingKey(true);
    setVerifyResult(null);

    const result = await verifyBDCourierApiKey(apiKeyInput.trim());
    setVerifyResult(result);
    setVerifyingKey(false);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupPhone.trim()) {
      setActiveLookupPhone(lookupPhone.trim());
    }
  };

  const blacklistedCount = profiles.filter((p) => p.is_blacklisted).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              {isBn ? "   Courier items-Courier " : "Fraud Detection & BDCourier Multi-Courier Hub"}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn
              ? "Courier via  Delivery   Verification ,   Order   and   ।"
              : "Cross-check customer delivery success ratio via BDCourier, prevent fake Cash on Delivery orders, and manage security blocklists."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "blacklist" && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {isBn ? "to blocklist Add to Cart" : "Add to Blacklist"}
            </Button>
          )}
        </div>
      </div>

      {msg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex justify-between animate-in fade-in-0">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("blacklist")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "blacklist"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>{isBn ? " " : "Fraud Blacklist"} ({blacklistedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lookup")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "lookup"
              ? "bg-primary-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>{isBn ? "Courier  Number Verification" : "BDCourier Live Phone Lookup"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "settings"
              ? "bg-primary-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>{isBn ? "Courier Settings" : "BDCourier API Settings"}</span>
        </button>
      </div>

      {/* TAB 1: BDCourier API Integration Settings */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary-600" />
                  <div>
                    <h2 className="text-base font-black text-gray-900">BDCourier API Configuration</h2>
                    <p className="text-xs text-gray-500">
                      Integrate your official BDCourier account to automatically query customer delivery success ratios across SteadFast, Pathao, RedX, and Paperfly.
                    </p>
                  </div>
                </div>
              </div>

              {verifyResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-2.5 ${
                    verifyResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {verifyResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p>{verifyResult.message}</p>
                    {verifyResult.data && (
                      <p className="font-mono text-[11px] text-emerald-700">
                        Status: Active • Endpoint Verified
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveBDCourierSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    BDCourier API Secret Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste your BDCourier API Key (e.g. bdc_live_xxxxxxxx...)"
                      className="w-full h-11 pl-3.5 pr-20 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary-600 focus:outline-none font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Your key is stored securely in your encrypted store settings.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bdSettings.enabled}
                      onChange={(e) => setBdSettings({ ...bdSettings, enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-bold text-gray-800">
                      Enable BDCourier Customer Delivery Ratio & Fraud Detection
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bdSettings.autoCheckOnOrder}
                      onChange={(e) => setBdSettings({ ...bdSettings, autoCheckOnOrder: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-bold text-gray-800">
                      Auto-display ratio pill badges in Admin Orders and Customer Directory
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Moderate Risk Warning Threshold (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={bdSettings.minSuccessRatioWarning}
                      onChange={(e) =>
                        setBdSettings({ ...bdSettings, minSuccessRatioWarning: Number(e.target.value) })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-xs font-bold"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Customers below this ratio get a yellow warning badge.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Critical Risk Threshold (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={bdSettings.blockThresholdRatio}
                      onChange={(e) =>
                        setBdSettings({ ...bdSettings, blockThresholdRatio: Number(e.target.value) })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-xs font-bold"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Customers below this ratio trigger severe return risk alerts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={verifyingKey || !apiKeyInput.trim()}
                    variant="outline"
                    className="text-xs font-bold rounded-xl border-gray-300"
                  >
                    {verifyingKey ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        <span>Pinging BDCourier API...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary-600" />
                        <span>Test & Verify API Connection</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-black rounded-xl shadow-xs"
                  >
                    {savingSettings ? "Saving Settings..." : "Save Configuration"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Guide & Help sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-black text-gray-900 border-b border-gray-100 pb-2">
                <Info className="h-4 w-4 text-primary-600" />
                <span>How to Get Your API Key</span>
              </div>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside text-[11px] leading-relaxed">
                <li>
                  Go to{" "}
                  <a
                    href="https://bdcourier.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    bdcourier.com <ExternalLink className="h-2.5 w-2.5" />
                  </a>{" "}
                  and create a merchant account.
                </li>
                <li>Navigate to your BDCourier Dashboard Settings or Developer API page.</li>
                <li>Copy your Secret API Key and paste it into the field on the left.</li>
                <li>Click <strong>Test & Verify Connection</strong> to validate live connectivity.</li>
              </ol>

              <div className="p-3 bg-primary-50/50 rounded-2xl border border-primary-100 text-[11px] text-primary-900 font-medium">
                🛡️ <strong>Live Multi-Courier Protection:</strong> Live parcel verification across all 7 supported couriers (Pathao, SteadFast, RedX, PaperFly, CarryBee, CourrierFast, ParcelDex). Inspect customer delivery ratios before dispatching COD orders.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BDCourier Live Phone Lookup */}
      {activeTab === "lookup" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-primary-600" />
                <span>Live BDCourier Customer Phone Lookup</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Check any customer mobile number to inspect multi-courier delivery success rate, cancelled parcels, and incident reports.
              </p>
            </div>

            <form onSubmit={handleLookupSubmit} className="flex gap-2 max-w-lg">
              <input
                type="tel"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="Enter 11-digit BD number (e.g. 017XXXXXXXX)"
                className="flex-1 h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-600 text-xs font-mono font-bold focus:outline-none"
                required
              />
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-black text-xs rounded-xl shadow-xs">
                <Search className="h-4 w-4 mr-1.5" /> Check Records
              </Button>
            </form>
          </div>

          {activeLookupPhone ? (
            <div className="max-w-2xl">
              <BDCourierHistoryCard key={activeLookupPhone} phone={activeLookupPhone} customerName="Queried Customer" />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center space-y-3 shadow-2xs max-w-2xl">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 shadow-2xs">
                <Truck className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-black text-gray-900">Live Multi-Courier Intelligence</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter any customer mobile number above to inspect real-time delivery performance, doorstep returns, and merchant fraud complaint reports across Pathao, SteadFast, RedX, PaperFly, CarryBee, CourrierFast, and ParcelDex.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Fraud Blacklist Table */}
      {activeTab === "blacklist" && (
        <div className="space-y-6">
          {/* Add Modal */}
          {showAddModal && (
            <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-red-200/60 pb-3 border-b">
                <h2 className="text-sm font-black text-red-900 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  {isBn ? "    added " : "Add Blacklist & Blocking Rule"}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-bold"
                >
                  {isBn ? "Cancel" : "Cancel"}
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      {isBn ? ":00 " : "Target Type"}
                    </label>
                    <select
                      value={addType}
                      onChange={(e) => setAddType(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold focus:border-red-600 focus:outline-none"
                    >
                      <option value="phone">{isBn ? "Mobile Phone Number (01...)" : "Mobile Phone Number (01...)"}</option>
                      <option value="ip">{isBn ? " " : "IP Address"}</option>
                      <option value="email">{isBn ? "Email " : "Email Address"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      {isBn ? " Number /  / Email" : "Blocked Identifier Value"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={addType === "phone" ? "01999999999" : addType === "ip" ? "103.145.2.1" : "name@example.com"}
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold font-mono focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      {isBn ? "to blocklist " : "Reason for Blacklist"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        isBn
                          ? "e.g.:     /   Order"
                          : "e.g. Repeated doorstep refusal / BDCourier fraud report"
                      }
                      value={addReason}
                      onChange={(e) => setAddReason(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs font-bold rounded-xl"
                  >
                    {isBn ? "Cancel" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl"
                  >
                    {saving
                      ? (isBn ? "Add ..." : "Adding...")
                      : (isBn ? "Security to blocklist Add to Cart" : "Add to Security Blacklist")}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* List Table */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-gray-900">
                {isBn
                  ? `     Profile (${profiles.length})`
                  : `Blocked Identifiers & High-Risk Profiles (${profiles.length})`}
              </h2>
              <span className="text-xs text-gray-400 font-bold">
                {isBn
                  ? "  :00 from  Order permanently Cancel  "
                  : "Orders with these contacts will be strictly rejected"}
              </span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              {profiles.map((p) => (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        p.is_blacklisted
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {p.identifier_type === "phone" ? (
                        <Phone className="h-4 w-4" />
                      ) : p.identifier_type === "email" ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 text-xs">{p.identifier_value}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                            p.is_blacklisted
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {p.is_blacklisted
                            ? (isBn ? "" : "Blocked")
                            : (isBn ? "" : "Flagged")}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {p.blacklist_reason || p.notes || (isBn ? "   " : "No additional reason provided")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[11px] text-gray-400">
                      {isBn ? ":" : "Risk:"} <strong className="text-red-600">{p.risk_score}/100</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={isBn ? " from " : "Remove from Blacklist"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {profiles.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                  <p className="font-bold">
                    {isBn ? "   ।" : "Blacklist is currently empty."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
