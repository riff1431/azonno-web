"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Save,
  Layers,
  Zap,
  RefreshCw,
  AlertTriangle,
  Lock,
  Globe,
  Copy,
  Check,
  Radio,
  FileCode,
  Video,
  X,
  Target,
  Sliders,
  PlayCircle,
  Database,
  Eye,
  CheckCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  getMarketingAnalyticsSettings,
  saveMarketingAnalyticsSettings,
  testMetaCapiDiagnostic,
  type MarketingAnalyticsSettings,
} from "@/features/marketing/meta-actions";
import {
  getTikTokSettings,
  saveTikTokSettings,
  testTikTokCapiDiagnostic,
  type TikTokSettings,
} from "@/features/marketing/tiktok-actions";

export default function AdminMetaSettingsPage() {
  const [activeTab, setActiveTab] = useState<"meta" | "tiktok" | "purchase_emq" | "gtm" | "catalog">("meta");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingCapi, setTestingCapi] = useState(false);
  const [testingTikTok, setTestingTikTok] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  const [formData, setFormData] = useState<MarketingAnalyticsSettings>({
    meta_pixel_id: "",
    meta_capi_token: "",
    meta_test_event_code: "",
    meta_capi_enabled: true,
    meta_advanced_matching_enabled: true,
    gtm_container_id: "",
    ga4_measurement_id: "",
    catalog_feed_url: "/api/feed/meta",
    purchase_tracking_mode: "status_gated",
    purchase_trigger_status: "completed",
    enable_meta_capi_purchase: true,
    enable_tiktok_capi_purchase: true,
    suppress_browser_pixel_on_status_gated: true,
  });

  const [tiktokData, setTiktokData] = useState<TikTokSettings>({
    tiktok_pixel_id: "",
    tiktok_access_token: "",
    tiktok_test_event_code: "",
    tiktok_capi_enabled: true,
    tiktok_advanced_matching_enabled: true,
  });

  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [capiTestResult, setCapiTestResult] = useState<{
    success: boolean;
    message: string;
    fbTraceId?: string;
  } | null>(null);

  const [tiktokTestResult, setTiktokTestResult] = useState<{
    success: boolean;
    message: string;
    requestId?: string;
  } | null>(null);


  useEffect(() => {
    Promise.all([getMarketingAnalyticsSettings(), getTikTokSettings()]).then(
      ([metaConfig, ttConfig]) => {
        setFormData(metaConfig);
        setTiktokData(ttConfig);
        setLoading(false);
      }
    );
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await Promise.all([
        saveMarketingAnalyticsSettings(formData),
        saveTikTokSettings(tiktokData),
      ]);
      setFeedback({ text: "Meta & TikTok Marketing settings saved successfully!" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ text: `Failed to save: ${err.message}`, isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleTestCapiPing = async () => {
    setTestingCapi(true);
    setCapiTestResult(null);

    try {
      const res = await testMetaCapiDiagnostic(formData.meta_test_event_code);
      if (res.success) {
        setCapiTestResult({
          success: true,
          message: `Meta Graph API Received 1 Diagnostic Event! Events Received: ${res.eventsReceived ?? 1}`,
          fbTraceId: res.fbTraceId,
        });
      } else if (res.skipped) {
        setCapiTestResult({
          success: false,
          message: "Please enter your Meta Pixel ID and CAPI Access Token first.",
        });
      } else {
        setCapiTestResult({
          success: false,
          message: res.error || "Meta CAPI request failed",
          fbTraceId: res.metaTraceId,
        });
      }
    } catch (err: any) {
      setCapiTestResult({
        success: false,
        message: err.message || "Network error testing CAPI",
      });
    } finally {
      setTestingCapi(false);
    }
  };

  const handleTestTikTokPing = async () => {
    setTestingTikTok(true);
    setTiktokTestResult(null);

    try {
      const res = await testTikTokCapiDiagnostic(tiktokData.tiktok_test_event_code);
      if (res.success) {
        setTiktokTestResult({
          success: true,
          message: `TikTok Business Events API Received 1 Diagnostic Event! ${res.message}`,
          requestId: res.requestId,
        });
      } else if (res.skipped) {
        setTiktokTestResult({
          success: false,
          message: "Please enter your TikTok Pixel Code and Access Token first.",
        });
      } else {
        setTiktokTestResult({
          success: false,
          message: res.error || "TikTok Events API request failed",
        });
      }
    } catch (err: any) {
      setTiktokTestResult({
        success: false,
        message: err.message || "Network error testing TikTok Events API",
      });
    } finally {
      setTestingTikTok(false);
    }
  };

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || "");

  const fullFeedUrl = `${origin}/api/feed/meta`;

  const handleCopyFeed = () => {
    navigator.clipboard.writeText(fullFeedUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 bg-white p-6 rounded-3xl shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e91e63] animate-pulse" />
            <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200 uppercase">
              Omnichannel Tracking Hub
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#e91e63]" />
            Meta &amp; TikTok Pixel, CAPI &amp; DataLayer Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Full-funnel Browser Meta &amp; TikTok Pixels, Server-Side Conversions APIs (CAPI), GTM/GA4 Enhanced Ecommerce DataLayer, and Product Catalog XML Feed.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saving ? "Saving Changes..." : "Save Configuration"}
        </Button>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border p-4 text-xs font-bold flex justify-between ${
            feedback.isError
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          } animate-in fade-in-0`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("meta")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "meta"
              ? "border-[#e91e63] text-[#e91e63]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Sparkles className="inline h-4 w-4 mr-1.5" />
          Meta Pixel &amp; CAPI
        </button>
        <button
          onClick={() => setActiveTab("tiktok")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "tiktok"
              ? "border-[#e91e63] text-[#e91e63]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Video className="inline h-4 w-4 mr-1.5" />
          TikTok Pixel &amp; Events API (CAPI)
        </button>
        <button
          onClick={() => setActiveTab("purchase_emq")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "purchase_emq"
              ? "border-[#e91e63] text-[#e91e63]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Target className="inline h-4 w-4 text-[#e91e63]" />
          <span>Purchase &amp; EMQ Control</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-black border border-emerald-300">
            EMQ 9.0+
          </span>
        </button>
        <button
          onClick={() => setActiveTab("gtm")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "gtm"
              ? "border-[#e91e63] text-[#e91e63]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Code2 className="inline h-4 w-4 mr-1.5" />
          GTM &amp; GA4 DataLayer
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "catalog"
              ? "border-[#e91e63] text-[#e91e63]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileCode className="inline h-4 w-4 mr-1.5" />
          Product Catalog Feeds
        </button>
      </div>

      {/* TAB 1: Meta Pixel & Conversions API (CAPI) */}
      {activeTab === "meta" && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#e91e63]" />
                    Facebook Pixel &amp; Server-Side CAPI Credentials
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Connects browser events and server-side Conversions API to eliminate ad-blocker signal loss with 100% event deduplication.
                  </p>
                </div>

                <a
                  href="https://business.facebook.com/events_manager2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#e91e63] hover:underline flex items-center gap-1"
                >
                  Meta Events Manager <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">
                    Meta Pixel ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.meta_pixel_id}
                    onChange={(e) => setFormData({ ...formData, meta_pixel_id: e.target.value })}
                    placeholder="e.g. 123456789012345"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Found in Meta Business Suite &gt; Events Manager &gt; Data Sources.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">
                    Test Event Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_test_event_code || ""}
                    onChange={(e) => setFormData({ ...formData, meta_test_event_code: e.target.value })}
                    placeholder="e.g. TEST89582"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Enter your temporary Test Event Code from Meta Events Manager &gt; Test Events to verify events in real time.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Conversions API (CAPI) System User Access Token
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={formData.meta_capi_token}
                    onChange={(e) => setFormData({ ...formData, meta_capi_token: e.target.value })}
                    placeholder="EAA..."
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Generate in Events Manager &gt; Settings &gt; Conversions API &gt; &quot;Generate access token&quot;.
                </p>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                  <div>
                    <span className="font-bold text-text text-xs block">Enable Server-Side Conversions API (CAPI)</span>
                    <span className="text-text-muted text-[11px]">
                      Sends parallel server-to-server events to Meta Graph API v21.0 with shared deduplication `eventID`.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.meta_capi_enabled}
                    onChange={(e) => setFormData({ ...formData, meta_capi_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-[#e91e63] focus:ring-[#e91e63]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                  <div>
                    <span className="font-bold text-text text-xs block">
                      Automatic Advanced Matching (Customer Data Hashing)
                    </span>
                    <span className="text-text-muted text-[11px]">
                      SHA-256 hashes customer email, phone (8801XXXXXXXXX), name, city, and cookies (_fbp, _fbc) for maximized Event Quality Match Score.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.meta_advanced_matching_enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_advanced_matching_enabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-[#e91e63] focus:ring-[#e91e63]"
                  />
                </label>
              </div>
            </div>

            {/* Diagnostic Ping Card */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Live Meta CAPI Diagnostic Connection Tester
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Dispatches a live test event to Meta Graph API and verifies payload reception.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleTestCapiPing}
                  disabled={testingCapi || !formData.meta_pixel_id}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold rounded-xl shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testingCapi ? "animate-spin" : ""}`} />
                  {testingCapi ? "Dispatching..." : "Send CAPI Test Ping"}
                </Button>
              </div>

              {capiTestResult && (
                <div
                  className={`flex items-start gap-2.5 rounded-2xl border p-4 text-xs font-semibold ${
                    capiTestResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {capiTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div>{capiTestResult.message}</div>
                    {capiTestResult.fbTraceId && (
                      <div className="text-[10px] font-mono text-gray-500">
                        FB Trace ID: {capiTestResult.fbTraceId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Saving Changes..." : "Save Meta Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: TikTok Pixel & Events API (CAPI) */}
      {activeTab === "tiktok" && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text flex items-center gap-2">
                    <Video className="h-4 w-4 text-black" />
                    TikTok Pixel &amp; Events API (CAPI) Credentials
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Connect TikTok Pixel (`ttq`) and Server-Side Events API (v1.3) for TikTok Ads Manager attribution and ROAS tracking.
                  </p>
                </div>

                <a
                  href="https://ads.tiktok.com/marketing_api/docs?id=1739584855420929"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#e91e63] hover:underline flex items-center gap-1"
                >
                  TikTok Events API Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">
                    TikTok Pixel ID / Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tiktokData.tiktok_pixel_id}
                    onChange={(e) => setTiktokData({ ...tiktokData, tiktok_pixel_id: e.target.value })}
                    placeholder="e.g. CXXXXXXXXXXXXXXX"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Found in TikTok Ads Manager &gt; Assets &gt; Events &gt; Web Events.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">
                    Test Event Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={tiktokData.tiktok_test_event_code || ""}
                    onChange={(e) => setTiktokData({ ...tiktokData, tiktok_test_event_code: e.target.value })}
                    placeholder="e.g. TESTXXXXX"
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Enter your Test Event Code from TikTok Events Manager &gt; Test Events.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  TikTok Events API Long-Term Access Token
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={tiktokData.tiktok_access_token}
                    onChange={(e) => setTiktokData({ ...tiktokData, tiktok_access_token: e.target.value })}
                    placeholder="Enter your TikTok Access Token..."
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-mono text-text focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Generate in TikTok Events Manager &gt; Settings &gt; Events API &gt; &quot;Generate Access Token&quot;.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                  <div>
                    <span className="font-bold text-text text-xs block">Enable Server-Side TikTok Events API (CAPI)</span>
                    <span className="text-text-muted text-[11px]">
                      Sends parallel server-to-server conversions to TikTok Business API with matching `event_id`.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tiktokData.tiktok_capi_enabled}
                    onChange={(e) => setTiktokData({ ...tiktokData, tiktok_capi_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-[#e91e63] focus:ring-[#e91e63]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border hover:bg-surface-secondary/40 cursor-pointer">
                  <div>
                    <span className="font-bold text-text text-xs block">
                      Automatic Advanced Matching (SHA-256 Hashing)
                    </span>
                    <span className="text-text-muted text-[11px]">
                      Hashes customer email, phone, external ID, and TikTok Click ID (`ttclid`, `ttp`) for maximum ad attribution.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tiktokData.tiktok_advanced_matching_enabled}
                    onChange={(e) =>
                      setTiktokData({ ...tiktokData, tiktok_advanced_matching_enabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-[#e91e63] focus:ring-[#e91e63]"
                  />
                </label>
              </div>
            </div>

            {/* Diagnostic Ping Card */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Live TikTok Events API Diagnostic Connection Tester
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Dispatches a live test event to TikTok Business API and verifies response status.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleTestTikTokPing}
                  disabled={testingTikTok || !tiktokData.tiktok_pixel_id}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold rounded-xl shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testingTikTok ? "animate-spin" : ""}`} />
                  {testingTikTok ? "Dispatching..." : "Send TikTok Test Ping"}
                </Button>
              </div>

              {tiktokTestResult && (
                <div
                  className={`flex items-start gap-2.5 rounded-2xl border p-4 text-xs font-semibold ${
                    tiktokTestResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {tiktokTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div>{tiktokTestResult.message}</div>
                    {tiktokTestResult.requestId && (
                      <div className="text-[10px] font-mono text-gray-500">
                        TikTok Request ID: {tiktokTestResult.requestId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Saving Changes..." : "Save TikTok Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: Purchase & EMQ Control */}
      {activeTab === "purchase_emq" && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Mode & Status Gate Configuration */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#e91e63]" />
                    Purchase Event Dispatch Control &amp; Optimization
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Configure when and how Purchase / CompletePayment events fire to protect ad optimization from unverified or returned COD orders.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  EMQ 9.0+ Active
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-900">
                  Purchase Tracking Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-start gap-3 ${
                      formData.purchase_tracking_mode === "status_gated"
                        ? "border-[#e91e63] bg-pink-50/40 ring-1 ring-[#e91e63]"
                        : "border-border bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchase_tracking_mode"
                      value="status_gated"
                      checked={formData.purchase_tracking_mode === "status_gated"}
                      onChange={() => setFormData({ ...formData, purchase_tracking_mode: "status_gated" })}
                      className="mt-1 text-[#e91e63] focus:ring-[#e91e63]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          Order Status-Gated (Verified CAPI)
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#e91e63] text-white">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Fires server-side CAPI Purchase <strong>ONLY when the admin transitions the order</strong> to your chosen trigger status (e.g. Completed/Delivered). Unverified browser pixel events are suppressed on checkout, ensuring Meta &amp; TikTok algorithms train <strong>only on 100% genuine, collected orders</strong>.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-start gap-3 ${
                      formData.purchase_tracking_mode === "immediate"
                        ? "border-[#e91e63] bg-pink-50/40 ring-1 ring-[#e91e63]"
                        : "border-border bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchase_tracking_mode"
                      value="immediate"
                      checked={formData.purchase_tracking_mode === "immediate"}
                      onChange={() => setFormData({ ...formData, purchase_tracking_mode: "immediate" })}
                      className="mt-1 text-[#e91e63] focus:ring-[#e91e63]"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        Standard Immediate (Checkout Confirmation)
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Fires immediately upon customer landing on the order confirmation page. Standard legacy tracking (fires for all COD orders including cancellations or fake phone numbers).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status Trigger Dropdown */}
              {formData.purchase_tracking_mode === "status_gated" && (
                <div className="rounded-2xl border border-pink-200 bg-pink-50/30 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
                        CAPI Purchase Trigger Status
                      </label>
                      <select
                        value={formData.purchase_trigger_status || "completed"}
                        onChange={(e) => setFormData({ ...formData, purchase_trigger_status: e.target.value as any })}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                      >
                        <option value="completed">Completed / Delivered (Recommended for COD)</option>
                        <option value="delivered">Delivered Only</option>
                        <option value="confirmed">Confirmed / Processing</option>
                        <option value="processing">Processing (On Order Received)</option>
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Whenever an order status transitions to this value in the admin dashboard, the server-side Purchase event is automatically dispatched.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
                        Browser Pixel Suppression
                      </label>
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={formData.suppress_browser_pixel_on_status_gated !== false}
                          onChange={(e) =>
                            setFormData({ ...formData, suppress_browser_pixel_on_status_gated: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63]"
                        />
                        <span className="text-xs text-gray-800 font-semibold">
                          Suppress browser Purchase pixel on checkout thank-you page
                        </span>
                      </label>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Prevents premature pixel firing so your ad campaigns are not polluted by unconfirmed orders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Platform Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-border p-4 bg-gray-50/50">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#e91e63]" />
                        Meta CAPI Purchase Dispatch
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Sends Graph API v21.0 Purchase event with 13 EMQ parameters.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enable_meta_capi_purchase !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, enable_meta_capi_purchase: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63]"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-border p-4 bg-gray-50/50">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-pink-600" />
                        TikTok Events API CompletePayment
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Sends TikTok Events API v1.3 event with 7 match parameters.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enable_tiktok_capi_purchase !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, enable_tiktok_capi_purchase: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63]"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Saving Changes..." : "Save Purchase & Tracking Settings"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: GTM & GA4 DataLayer */}
      {activeTab === "gtm" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-600" />
                Google Tag Manager &amp; GA4 Configuration
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Standard Google Analytics 4 Enhanced Ecommerce DataLayer output (`window.dataLayer.push`).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  Google Tag Manager (GTM) Container ID
                </label>
                <input
                  type="text"
                  value={formData.gtm_container_id || ""}
                  onChange={(e) => setFormData({ ...formData, gtm_container_id: e.target.value })}
                  placeholder="GTM-XXXXXXX"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">
                  GA4 Measurement ID
                </label>
                <input
                  type="text"
                  value={formData.ga4_measurement_id || ""}
                  onChange={(e) => setFormData({ ...formData, ga4_measurement_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-mono text-text focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Active Enhanced Ecommerce DataLayer Events
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  "view_item_list",
                  "select_item",
                  "view_item",
                  "add_to_cart",
                  "remove_from_cart",
                  "view_cart",
                  "begin_checkout",
                  "add_shipping_info",
                  "add_payment_info",
                  "purchase",
                  "refund",
                  "search",
                ].map((ev) => (
                  <div key={ev} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100 font-mono text-[11px] text-gray-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Saving Changes..." : "Save GTM Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: Dynamic Catalog XML Feeds */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-[#e91e63]" />
                  Meta Dynamic Product Catalog XML Feed
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Live XML Feed compliant with Meta Commerce Manager, Advantage+ Dynamic Ads, and Instagram Shop tagging.
                </p>
              </div>
              <a
                href="/admin/marketing/catalog"
                className="text-[11px] font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                View All Feeds <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text">
                Meta Catalog Feed URL (Paste into Meta Commerce Manager &gt; Data Sources)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 font-mono text-xs text-[#e91e63] select-all truncate">
                  {fullFeedUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFeed}
                  className="text-xs font-bold rounded-xl shrink-0"
                >
                  {copiedFeed ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy URL
                    </>
                  )}
                </Button>
                <a
                  href="/api/feed/meta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs px-3 py-2 shadow-xs transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Preview Feed
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Video className="h-4 w-4 text-pink-600" />
                TikTok Product Catalog XML Feed
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Dynamic product XML feed formatted for TikTok Catalog Manager, Video Shopping Ads, and Dynamic Showcase Ads.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text">
                TikTok Catalog Feed URL (Paste into TikTok Ads Manager &gt; Assets &gt; Catalogs)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 font-mono text-xs text-pink-600 select-all truncate">
                  {`${origin}/api/feed/tiktok`}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${origin}/api/feed/tiktok`);
                    setCopiedFeed(true);
                    setTimeout(() => setCopiedFeed(false), 2500);
                  }}
                  className="text-xs font-bold rounded-xl shrink-0"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy URL
                </Button>
                <a
                  href="/api/feed/tiktok"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-3 py-2 shadow-xs transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Preview Feed
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
