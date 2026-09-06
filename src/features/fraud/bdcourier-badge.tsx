"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, X, Loader2, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { fetchBDCourierReport, type BDCourierReport } from "./bdcourier-service";
import { CourierBrandLogo } from "@/components/shared/courier-logo";

interface BDCourierBadgeProps {
  phone: string;
  initialRatio?: number;
  initialTotal?: number;
  autoFetch?: boolean;
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
}: BDCourierBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [report, setReport] = useState<BDCourierReport | null>(null);
  const [loading, setLoading] = useState(false);

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

  // 100% Real data - live multi-courier stats!
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

  if (!phone) return null;

  const safeVerdict =
    typeof report?.risk_verdict === "string"
      ? report.risk_verdict
      : report?.raw_risk_verdict?.action || "Live customer delivery evaluation across courier networks.";

  const allCouriers = report?.courier_details
    ? Object.entries(report.courier_details)
    : [];

  const tooltipTitle = isLoaded
    ? isNew
      ? `BDCourier: New Customer (0 past parcel history)`
      : `BDCourier: ${currentRatio}% Success (${report?.success_parcel ?? 0}/${currentTotal} delivered across BD Couriers). Click to view details.`
    : `Querying BDCourier live stats for ${phone}...`;

  return (
    <>
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
            <span className="opacity-80">Checking...</span>
          </span>
        ) : isLoaded ? (
          <>
            {isNew ? (
              <>
                <Truck className="h-3 w-3 shrink-0 text-zinc-500" />
                <span>New Buyer (0)</span>
              </>
            ) : isRed ? (
              <>
                <ShieldAlert className="h-3 w-3 shrink-0 text-red-600" />
                <span>{currentRatio}% Risk</span>
              </>
            ) : isAmber ? (
              <>
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                <span>{currentRatio}% Ratio</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                <span>{currentRatio}% Ratio</span>
              </>
            )}
          </>
        ) : (
          <>
            <Truck className="h-3 w-3 shrink-0" />
            <span>BDCourier Check</span>
          </>
        )}
      </button>

      {/* Modal Popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary-600" />
                <h4 className="text-xs font-black text-gray-900">BDCourier Customer Stats</h4>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                <span className="text-xs font-bold">Querying Live BDCourier Records...</span>
              </div>
            ) : report ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <span className="font-mono font-bold text-gray-800">{report.phone}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      report.color === "emerald"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : report.color === "amber"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : report.color === "red"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {report.total_parcel === 0 ? "New Buyer" : `${report.success_ratio}% Delivered`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-400 block font-bold">Parcels</span>
                    <span className="font-black text-gray-900 text-sm">{report.total_parcel.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block font-bold">Received</span>
                    <span className="font-black text-emerald-700 text-sm">{report.success_parcel.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-[10px] text-red-700 block font-bold">Cancelled</span>
                    <span className="font-black text-red-700 text-sm">{report.cancelled_parcel.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium">
                  {safeVerdict}
                </p>

                {/* All Supported Couriers List */}
                {allCouriers.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="uppercase font-bold text-gray-400 block">Courier Breakdown ({allCouriers.length})</span>
                      <span className="text-gray-400">
                        {allCouriers.filter(([_, c]) => c && c.total > 0).length} Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {allCouriers.map(([key, c]) => {
                        if (!c) return null;
                        const hasOrders = c.total > 0;
                        return (
                          <div
                            key={key}
                            className={`p-2 rounded-lg border flex justify-between items-center ${
                              hasOrders
                                ? "bg-gray-50/90 border-gray-200 shadow-2xs"
                                : "bg-gray-50/40 border-gray-200/60 opacity-70"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <CourierBrandLogo name={c.name} logoUrl={c.logo} className="h-3.5 w-3.5" />
                              <span className="font-bold text-gray-800 truncate">{c.name}</span>
                            </div>
                            {hasOrders ? (
                              <span className={`font-black shrink-0 ml-1 ${c.ratio >= 80 ? "text-emerald-700" : c.ratio >= 50 ? "text-amber-700" : "text-red-700"}`}>
                                {c.ratio}%
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-400 font-bold shrink-0 ml-1">0</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Incident Complaints if any */}
                {report.reports && report.reports.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] space-y-1.5">
                    <span className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>{report.reports.length} Fraud Report(s) on file</span>
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {report.reports.map((r, i) => (
                        <p key={i} className="text-red-800 bg-white/70 p-1.5 rounded text-[10px] leading-tight">
                          • {r.reason} {r.courier ? `(${r.courier})` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100 font-mono">
                  <span className="capitalize">Source: {report.source}</span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/orders/fraud?phone=${report.phone}&tab=lookup`}
                      className="text-primary-600 font-bold hover:underline font-sans inline-flex items-center gap-1"
                    >
                      <span>Open Full Fraud Hub</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="text-gray-600 font-bold hover:text-gray-900 font-sans"
                    >
                      Close
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
