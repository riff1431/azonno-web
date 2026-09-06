"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Ban,
  Package,
} from "lucide-react";
import Link from "next/link";
import { fetchBDCourierReport, type BDCourierReport } from "./bdcourier-service";
import { addBlacklistEntry } from "./actions";

interface BDCourierHistoryCardProps {
  phone: string;
  customerName?: string;
  initialReport?: BDCourierReport | null;
  onBlockSuccess?: () => void;
}

export function BDCourierHistoryCard({
  phone,
  customerName = "Customer",
  initialReport = null,
  onBlockSuccess,
}: BDCourierHistoryCardProps) {
  const [report, setReport] = useState<BDCourierReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockSuccessMsg, setBlockSuccessMsg] = useState<string | null>(null);

  const loadReport = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await fetchBDCourierReport(phone);
      setReport(res);
    } catch (err) {
      console.error("Error loading BDCourier report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialReport && phone) {
      loadReport();
    }
  }, [phone]);

  const handleBlockCustomer = async () => {
    if (!phone) return;
    setBlocking(true);
    try {
      const reason = `BDCourier Low Delivery Ratio (${report?.success_ratio ?? 0}%) / Doorstep Return History`;
      const res = await addBlacklistEntry({
        type: "phone",
        value: phone,
        reason,
      });

      if (res.success) {
        setBlockSuccessMsg("Phone number added to Fraud Blacklist!");
        onBlockSuccess?.();
        setTimeout(() => setBlockSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error("Block error:", e);
    } finally {
      setBlocking(false);
    }
  };

  if (!phone) {
    return null;
  }

  const ratio = report?.success_ratio ?? 100;
  const color = report?.color ?? "emerald";

  const colorStyles = {
    emerald: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/40",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      title: "Trusted Buyer (High Success Rate)",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-amber-50/40",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      bar: "bg-amber-500",
      text: "text-amber-700",
      title: "Moderate Risk (Confirm Before Dispatch)",
    },
    red: {
      border: "border-red-200",
      bg: "bg-red-50/40",
      badge: "bg-red-100 text-red-800 border-red-300",
      bar: "bg-red-500",
      text: "text-red-700",
      title: "High Risk / Doorstep Refusal Alert",
    },
    zinc: {
      border: "border-gray-200",
      bg: "bg-gray-50/40",
      badge: "bg-gray-100 text-gray-700 border-gray-300",
      bar: "bg-gray-400",
      text: "text-gray-600",
      title: "New Customer (No Previous History)",
    },
  }[color];

  return (
    <div className={`rounded-3xl border ${colorStyles.border} ${colorStyles.bg} p-5 sm:p-6 shadow-xs space-y-4`}>
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white shadow-2xs border border-gray-100">
            <Truck className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span>BDCourier Fraud & Delivery Intelligence</span>
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">Phone: {phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-2xs transition-colors"
            title="Refresh BDCourier data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary-600" : ""}`} />
          </button>
          <Link
            href="/admin/orders/fraud"
            className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-2xs transition-colors"
            title="Fraud Control & Settings"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </Link>
        </div>
      </div>

      {blockSuccessMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <span>{blockSuccessMsg}</span>
        </div>
      )}

      {loading && !report ? (
        <div className="py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="text-xs font-bold">Querying BDCourier Multi-Courier Records...</span>
        </div>
      ) : report ? (
        <div className="space-y-4 text-xs">
          {/* Main Ratio & Progress Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">Delivery Success Ratio:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${colorStyles.badge}`}>
                {report.total_parcel === 0 ? "New Buyer (0 History)" : `${report.success_ratio}% Success`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
              <div
                className={`h-full ${colorStyles.bar} transition-all duration-500 rounded-full`}
                style={{ width: `${report.total_parcel === 0 ? 100 : report.success_ratio}%` }}
              />
            </div>

            {/* Verdict Note */}
            <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
              {report.risk_verdict}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-gray-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Parcels</span>
              <span className="text-base font-black text-gray-900 block mt-0.5">{report.total_parcel}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-emerald-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Received</span>
              <span className="text-base font-black text-emerald-700 block mt-0.5">{report.success_parcel}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-red-200/80 text-center">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Cancelled/RTO</span>
              <span className="text-base font-black text-red-700 block mt-0.5">{report.cancelled_parcel}</span>
            </div>
          </div>

          {/* Multi-Courier Breakdown (SteadFast, Pathao, RedX, Paperfly) */}
          {report.courier_details && Object.keys(report.courier_details).length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5">
              <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider block border-b border-gray-100 pb-1.5">
                Courier Provider Breakdown
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                {report.courier_details.steadfast && (
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <div className="font-bold text-gray-900 flex justify-between">
                      <span>SteadFast</span>
                      <span className="font-black text-emerald-700">{report.courier_details.steadfast.ratio}%</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Success: {report.courier_details.steadfast.success}</span>
                      <span>Return: {report.courier_details.steadfast.cancelled}</span>
                    </div>
                  </div>
                )}

                {report.courier_details.pathao && (
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <div className="font-bold text-gray-900 flex justify-between">
                      <span>Pathao</span>
                      <span className="font-black text-emerald-700">{report.courier_details.pathao.ratio}%</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Success: {report.courier_details.pathao.success}</span>
                      <span>Return: {report.courier_details.pathao.cancelled}</span>
                    </div>
                  </div>
                )}

                {report.courier_details.redx && (
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <div className="font-bold text-gray-900 flex justify-between">
                      <span>RedX</span>
                      <span className="font-black text-emerald-700">{report.courier_details.redx.ratio}%</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Success: {report.courier_details.redx.success}</span>
                      <span>Return: {report.courier_details.redx.cancelled}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning Reports from other merchants if any */}
          {report.reports && report.reports.length > 0 && (
            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 space-y-1.5">
              <span className="font-bold text-red-900 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span>Reported Incident Flags ({report.reports.length})</span>
              </span>
              <ul className="space-y-1 text-[11px] text-red-800 list-disc list-inside">
                {report.reports.map((r, i) => (
                  <li key={i}>{r.reason} {r.courier ? `(${r.courier})` : ""}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Fraud Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-400">
              Source: {report.source === "live_api" ? "BDCourier Live API" : "BDCourier Intelligence Engine"}
            </span>

            {report.risk_level === "critical" || report.risk_level === "high" ? (
              <button
                type="button"
                onClick={handleBlockCustomer}
                disabled={blocking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {blocking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                <span>Add to Fraud Blocklist</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
