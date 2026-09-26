"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  X,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Package,
  Ban,
  RefreshCw,
} from "lucide-react";
import { fetchBDCourierReport } from "./bdcourier-service";
import { type BDCourierReport, BDCOURIER_PROVIDERS } from "./types";
import { CourierBrandLogo } from "@/components/shared/courier-logo";
import { addBlacklistEntry } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface BDCourierBadgeProps {
  phone: string;
  initialRatio?: number;
  initialTotal?: number;
  autoFetch?: boolean;
  showInlineCouriers?: boolean;
}

// Client-side cache & in-flight promise deduplicator
const clientBadgeCache = new Map<string, BDCourierReport>();
const pendingBadgeRequests = new Map<string, Promise<BDCourierReport>>();

function getOrFetchBDCourierBadge(phone: string): Promise<BDCourierReport> {
  const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
  if (clientBadgeCache.has(cleanPhone)) {
    return Promise.resolve(clientBadgeCache.get(cleanPhone)!);
  }
  if (pendingBadgeRequests.has(cleanPhone)) {
    return pendingBadgeRequests.get(cleanPhone)!;
  }
  const promise = fetchBDCourierReport(cleanPhone)
    .then((res) => {
      clientBadgeCache.set(cleanPhone, res);
      pendingBadgeRequests.delete(cleanPhone);
      return res;
    })
    .catch((err) => {
      pendingBadgeRequests.delete(cleanPhone);
      throw err;
    });
  pendingBadgeRequests.set(cleanPhone, promise);
  return promise;
}

export function BDCourierBadge({
  phone,
  initialRatio,
  initialTotal,
  autoFetch = true,
  showInlineCouriers = false,
}: BDCourierBadgeProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";
  const [modalOpen, setModalOpen] = useState(false);
  const [report, setReport] = useState<BDCourierReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockSuccessMsg, setBlockSuccessMsg] = useState<string | null>(null);

  // Auto-fetch customer-wise live data on mount
  useEffect(() => {
    let active = true;
    const cleanPhone = (phone || "").trim().replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) return;

    if (initialRatio !== undefined) return;

    const cached = clientBadgeCache.get(cleanPhone);
    if (cached) {
      setReport(cached);
      return;
    }

    if (autoFetch) {
      setLoading(true);
      getOrFetchBDCourierBadge(cleanPhone)
        .then((res) => {
          if (active && res) {
            setReport(res);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [phone, initialRatio, autoFetch]);

  // Real multi-courier stats
  const currentRatio = report ? report.success_ratio : initialRatio;
  const currentTotal = report ? report.total_parcel : initialTotal;
  const isLoaded = report !== null || initialRatio !== undefined;

  const isNew = isLoaded && currentTotal === 0;
  const isRed = isLoaded && !isNew && currentRatio !== undefined && currentRatio < 50;
  const isAmber = isLoaded && !isNew && currentRatio !== undefined && currentRatio >= 50 && currentRatio < 80;

  const badgeStyle = !isLoaded
    ? "bg-violet-50/80 text-violet-700 border-violet-200 hover:bg-violet-100"
    : isNew
    ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
    : isRed
    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
    : isAmber
    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";

  const handleOpen = async () => {
    setModalOpen(true);
    if (!report && phone) {
      setLoading(true);
      try {
        const res = await getOrFetchBDCourierBadge(phone);
        setReport(res);
      } catch (e) {
        console.error("BDCourier live load error:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBlockCustomer = async () => {
    if (!phone) return;
    setBlocking(true);
    try {
      const reason = `BDCourier Low Delivery Ratio (${report?.success_ratio ?? 0}%) / Return History across couriers`;
      const res = await addBlacklistEntry({
        type: "phone",
        value: phone,
        reason,
      });
      if (res.success) {
        setBlockSuccessMsg(isBn ? "Number added to Fraud Blocklist!" : "Phone added to Fraud Blacklist!");
        setTimeout(() => setBlockSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error("Block error:", e);
    } finally {
      setBlocking(false);
    }
  };

  const handleManualRefresh = async () => {
    const cleanPhone = (phone || "").trim().replace(/[^0-9]/g, "");
    if (!cleanPhone) return;
    setLoading(true);
    try {
      const res = await fetchBDCourierReport(cleanPhone, { forceLive: true });
      clientBadgeCache.set(cleanPhone, res);
      setReport(res);
    } catch (e) {
      console.error("Manual refresh error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  const safeVerdict =
    typeof report?.risk_verdict === "string"
      ? report.risk_verdict
      : report?.raw_risk_verdict?.action || (isBn ? "Courier network Customers Delivery Tracking PriceTracking।" : "Live customer delivery evaluation across courier networks.");

  // Build complete list of all 11 supported couriers in Bangladesh
  const courierMap = report?.courier_details || {};
  const allSupportedCouriers = BDCOURIER_PROVIDERS.map((provider) => {
    const existing = courierMap[provider.key];
    return {
      key: provider.key,
      name: provider.name,
      bnName: provider.bnName || provider.name,
      logo: provider.logo,
      total: existing?.total || 0,
      success: existing?.success || 0,
      cancelled: existing?.cancelled || 0,
      ratio: existing?.total ? existing.ratio : (existing?.success ? 100 : 0),
      hasHistory: Boolean(existing && existing.total > 0),
    };
  });

  // Active couriers with history for inline chips
  const activeCouriers = allSupportedCouriers.filter((c) => c.hasHistory);

  const tooltipTitle = isLoaded
    ? isNew
      ? isBn ? " Courier: New Customer (    )" : "BDCourier: New Customer (0 past parcel history)"
      : isBn
      ? ` Courier: ${currentRatio}% Delivery  (${report?.success_parcel ?? 0}/${currentTotal} Delivery successfully)। View Details   ।`
      : `BDCourier: ${currentRatio}% Delivery Success (${report?.success_parcel ?? 0}/${currentTotal} delivered across BD Couriers). Click to view breakdown.`
    : isBn ? `${phone} Number  Courier   ...` : `Querying BDCourier live stats for ${phone}...`;

  return (
    <>
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        {/* Main Overall Delivery Success Ratio Badge */}
        <button
          type="button"
          onClick={handleOpen}
          disabled={loading}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border transition-colors shadow-2xs cursor-pointer ${badgeStyle}`}
          title={tooltipTitle}
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin text-primary-600" />
              <span className="opacity-80">{isBn ? " ..." : "Checking..."}</span>
            </span>
          ) : isLoaded ? (
            <>
              {isNew ? (
                <>
                  <Truck className="h-3 w-3 shrink-0 text-zinc-500" />
                  <span>{isBn ? "New Customer (0)" : "New Buyer (0)"}</span>
                </>
              ) : isRed ? (
                <>
                  <ShieldAlert className="h-3 w-3 shrink-0 text-red-600" />
                  <span>
                    {currentRatio}% {isBn ? "" : "Delivery"} ({report?.success_parcel ?? 0}/{currentTotal})
                  </span>
                </>
              ) : isAmber ? (
                <>
                  <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                  <span>
                    {currentRatio}% {isBn ? "" : "Delivery"} ({report?.success_parcel ?? 0}/{currentTotal})
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                  <span>
                    {currentRatio}% {isBn ? "" : "Delivery"} ({report?.success_parcel ?? 0}/{currentTotal})
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <Truck className="h-3 w-3 shrink-0" />
              <span>{isBn ? "Courier Reports" : "BDCourier Check"}</span>
            </>
          )}
        </button>

        {/* Inline Courier-Wise Badges (Showing percentages for active BD couriers directly in row) */}
        {showInlineCouriers && activeCouriers.length > 0 && (
          <div className="inline-flex items-center gap-1 flex-wrap">
            {activeCouriers.map((c) => {
              const chipColor =
                c.ratio >= 80
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : c.ratio >= 50
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-50 text-red-800 border-red-200";

              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={handleOpen}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border transition-transform hover:scale-105 ${chipColor}`}
                  title={`${c.name}: ${c.ratio}% (${c.success}/${c.total} delivered, ${c.cancelled} cancelled)`}
                >
                  <CourierBrandLogo name={c.name} logoUrl={c.logo} className="h-3 w-3" />
                  <span>
                    {c.name}: {c.ratio}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Courier Comprehensive Breakdown Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg p-5 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50/60 rounded-xl text-[#1D6474] border border-teal-200">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">
                    {isBn ? " Courier items- Delivery Reports" : "BD Courier Multi-Logistics Report"}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {isBn ? "Customers Number:" : "Customer Mobile:"} {phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-xl text-gray-700 hover:text-[#1D6474] hover:bg-teal-50/60 transition-colors flex items-center gap-1 text-[11px] font-bold border border-gray-200"
                  title="Force re-check live data from BDCourier API"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#1D6474]" : ""}`} />
                  <span>{isBn ? "  " : "Re-Check"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {blockSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>{blockSuccessMsg}</span>
              </div>
            )}

            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="h-7 w-7 animate-spin text-[#1D6474]" />
                <span className="text-xs font-bold">
                  {isBn ? " Courier :00   ..." : "Querying Live BDCourier Records..."}
                </span>
              </div>
            ) : report ? (
              <div className="space-y-4 text-xs">
                {/* Top Summary Card */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">
                      {isBn ? " Delivery  :" : "Overall Delivery Success Ratio:"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        report.color === "emerald"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : report.color === "amber"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : report.color === "red"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {report.total_parcel === 0
                        ? (isBn ? "New Customer (0 )" : "New Buyer (0 Records)")
                        : `${report.success_ratio}% ${isBn ? "Delivered" : "Delivered"}`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        report.color === "emerald"
                          ? "bg-emerald-500"
                          : report.color === "amber"
                          ? "bg-amber-500"
                          : report.color === "red"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                      style={{
                        width: `${report.total_parcel === 0 ? 100 : Math.min(100, Math.max(5, report.success_ratio))}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                    {safeVerdict}
                  </p>
                </div>

                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">
                      {isBn ? "Total " : "Total Parcels"}
                    </span>
                    <span className="font-black text-gray-900 text-base">{report.total_parcel.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-emerald-700 block font-bold uppercase">
                      {isBn ? " Delivery" : "Delivered"}
                    </span>
                    <span className="font-black text-emerald-700 text-base">{report.success_parcel.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-red-50/60 rounded-2xl border border-red-200 shadow-2xs">
                    <span className="text-[10px] text-red-700 block font-bold uppercase">
                      {isBn ? "Cancel / Return" : "Cancelled / RTO"}
                    </span>
                    <span className="font-black text-red-700 text-base">{report.cancelled_parcel.toLocaleString()}</span>
                  </div>
                </div>

                {/* API Key Missing Notification */}
                {report.message?.includes("API Key missing") && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-amber-900">
                      <KeyRound className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      <span>{isBn ? " Courier  added " : "Connect BDCourier Live API"}</span>
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      {isBn
                        ? "Pathao, Steadfast, RedX, Paperfly  All Courier   :00   Courier API Key  ।"
                        : "To view live nationwide fraud scores & delivery success rates across Pathao, SteadFast, RedX, PaperFly, please enter your BDCourier API key."}
                    </p>
                    <Link
                      href="/admin/orders/fraud?tab=settings"
                      className="inline-flex items-center gap-1 text-[11px] font-black text-primary-700 hover:underline pt-0.5"
                    >
                      {isBn ? "  Configure  →" : "Configure BDCourier API Key →"}
                    </Link>
                  </div>
                )}

                {/* ALL BD Courier Supported Providers Breakdown Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="uppercase font-bold text-gray-500 text-[10px] tracking-wider block">
                      {isBn
                        ? `All  Courier  (${allSupportedCouriers.length}items)`
                        : `Supported BD Couriers Breakdown (${allSupportedCouriers.length})`}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {activeCouriers.length} {isBn ? "items Courier Active  " : "Active with Orders"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allSupportedCouriers.map((c) => {
                      const ratioColor =
                        c.ratio >= 80
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : c.ratio >= 50
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : "text-red-700 bg-red-50 border-red-200";

                      return (
                        <div
                          key={c.key}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                            c.hasHistory
                              ? "bg-white border-gray-300 shadow-xs"
                              : "bg-gray-50/50 border-gray-200/60 opacity-65"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <CourierBrandLogo name={c.name} logoUrl={c.logo} className="h-4 w-4" />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-xs truncate">
                                  {isBn ? c.bnName : c.name}
                                </p>
                              </div>
                            </div>

                            {c.hasHistory ? (
                              <span className={`font-black text-xs px-2 py-0.5 rounded-md border ${ratioColor}`}>
                                {c.ratio}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                {isBn ? "0 " : "0 Parcels"}
                              </span>
                            )}
                          </div>

                          {c.hasHistory ? (
                            <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-600 font-mono">
                              <span>{isBn ? `Total: ${c.total}` : `Total: ${c.total}`}</span>
                              <span className="text-emerald-700 font-bold">
                                {isBn ? `: ${c.success}` : `Del: ${c.success}`}
                              </span>
                              <span className="text-red-700 font-bold">
                                {isBn ? `Cancel: ${c.cancelled}` : `Can: ${c.cancelled}`}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 text-[9.5px] text-gray-400 italic">
                              {isBn ? " Delivery   Tracking" : "No delivery records on file"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Community Incident Complaints if any */}
                {report.reports && report.reports.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-[11px] space-y-1.5">
                    <span className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>
                        {report.reports.length} {isBn ? "items    Add  " : "Fraud Report(s) on file"}
                      </span>
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {report.reports.map((r, i) => (
                        <p key={i} className="text-red-800 bg-white/80 p-2 rounded-lg text-[10px] leading-tight border border-red-100">
                          • {r.reason} {r.courier ? `(${r.courier})` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Controls & Direct Actions */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/orders/fraud?phone=${report.phone}&tab=lookup`}
                      className="text-primary-600 font-bold hover:underline text-xs inline-flex items-center gap-1"
                    >
                      <span>{isBn ? "Complete    " : "Open Full Fraud Hub"}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {(report.risk_level === "critical" || report.risk_level === "high" || report.cancelled_parcel > 0) && (
                      <button
                        type="button"
                        onClick={handleBlockCustomer}
                        disabled={blocking}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50"
                      >
                        {blocking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                        <span>{isBn ? "to blocklist added " : "Add to Blacklist"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                    >
                      {isBn ? " " : "Close"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
