"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Truck,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { trackOrder } from "@/features/orders/actions";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";
import {
  buildCourierTrackingUrl,
  formatCustomerLogEntry,
  getCustomerOrderStatusInfo,
} from "@/lib/utils";

export default function TrackOrderPage() {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [copiedCid, setCopiedCid] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setOrder(null);

    const res = await trackOrder(orderNumber, phone);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setOrder(res.order);
    }
    setLoading(false);
  };

  const handleCopyCid = (cid: string) => {
    if (!cid) return;
    navigator.clipboard.writeText(cid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  const isBn = language === "bn";

  const statusSteps = [
    { key: "pending", label: isBn ? "Order Placed" : "Order Placed" },
    { key: "confirmed", label: isBn ? "Confirmed successfully" : "Confirmed" },
    { key: "processing", label: isBn ? "" : "Packaging" },
    { key: "shipped", label: isBn ? "Delivery " : "In Transit" },
    { key: "delivered", label: isBn ? "Delivered" : "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "processing":
      case "packed":
      case "ready_for_pickup":
        return 2;
      case "shipped":
      case "in_transit":
      case "out_for_delivery":
        return 3;
      case "delivered":
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const address = order?.shipping_address_snapshot || {};
  const items = order?.order_items || [];
  const history = (order?.order_status_history || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const activeCid = order?.consignment_id || order?.tracking_code || "";
  const courierName =
    order?.courier_name ||
    address.courier_name ||
    (activeCid.startsWith("PTH") || activeCid.startsWith("DE") ? "Pathao Courier" : activeCid.startsWith("SF") ? "SteadFast Courier" : "SteadFast Courier");
  const liveTrackingUrl = buildCourierTrackingUrl(courierName, activeCid, order?.tracking_url);
  const statusInfo = order ? getCustomerOrderStatusInfo(order.status, language) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 border border-primary-200">
          <Truck className="h-3.5 w-3.5" />
          {isBn ? " " : "Order Tracking"}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
          {t("orders", "trackOrderTitle")}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
          {isBn
            ? "your Order Number and Mobile Number  Real-time-  Delivery  ।"
            : "Enter your Order Number and Bangladesh mobile number to check real-time courier updates."}
        </p>
      </div>

      {/* Search Box */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
        <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-text mb-1">
              {t("orders", "orderNumber")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={t("orders", "enterOrderNumber")}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2.5 text-xs text-text font-mono font-bold uppercase placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">
              {t("checkout", "phone")} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder={t("orders", "enterPhone")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="sm:col-span-2 pt-1">
            <Button type="submit" disabled={loading} className="w-full py-5 font-bold text-xs sm:text-sm shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isBn ? "Order   ..." : "Locating Order..."}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1.5" />
                  {t("orders", "trackButton")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700 animate-in fade-in-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Tracking Result */}
      {order && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
          {/* Status Tracker Card */}
          <div className="rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="text-xs text-text-muted font-medium">{t("orders", "trackingResults")}:</span>
                <p className="text-xl font-black text-primary-600 font-mono tracking-tight">
                  {order.order_number}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {isBn ? "Order Date: " : "Placed on: "}
                  {new Date(order.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {statusInfo && (
                <div className="flex flex-col sm:items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${statusInfo.color}`}>
                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    <span>{statusInfo.label}</span>
                  </span>
                  <span className="text-[10px] text-text-muted font-medium max-w-xs text-left sm:text-right">
                    {statusInfo.desc}
                  </span>
                </div>
              )}
            </div>

            {/* Cancelled Banner */}
            {order.status === "cancelled" && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex items-start gap-3 animate-in fade-in-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">
                    {isBn ? " Orderitems Cancel  successfully" : "This order has been cancelled"}
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {isBn
                      ? "Orderitems Cancel  successfully।  Question     Please   Customers   Enter।"
                      : "This order was cancelled. If you need any assistance or have questions, please reach out to our customer support."}
                  </p>
                </div>
              </div>
            )}

            {/* Returned Banner */}
            {(order.status === "returned" || order.status === "failed") && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start gap-3 animate-in fade-in-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    {isBn ? "items :00  " : "Parcel in Return Process"}
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {isBn
                      ? "Delivered   items   ।    Customers  AddAdd to Cart।"
                      : "The parcel could not be delivered and is currently being returned to our warehouse."}
                  </p>
                </div>
              </div>
            )}

            {/* Stepper */}
            {order.status !== "cancelled" && order.status !== "returned" && order.status !== "failed" && (
              <div className="space-y-2 py-2">
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={step.key} className="space-y-2">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            isCompleted ? "bg-[#1D6474]" : "bg-zinc-200"
                          }`}
                        />
                        <span
                          className={`block text-[11px] leading-tight transition-colors ${
                            isCurrent
                              ? "font-black text-[#1D6474]"
                              : isCompleted
                              ? "font-bold text-gray-800"
                              : "text-gray-400 font-medium"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courier Dispatch Information Card */}
            {activeCid && order.status !== "cancelled" && (
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-pink-50/50 via-rose-50/30 to-purple-50/40 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white border border-primary-200 flex items-center justify-center text-[#1D6474] shadow-xs">
                      <Truck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                        {isBn ? " items" : "Courier Partner"}
                      </span>
                      <span className="font-bold text-xs text-gray-900">
                        {courierName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-gray-800 shadow-2xs">
                      <span>CID: {activeCid}</span>
                      <button
                        onClick={() => handleCopyCid(activeCid)}
                        title="Copy Consignment ID"
                        className="text-gray-400 hover:text-gray-700 p-0.5"
                      >
                        {copiedCid ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {liveTrackingUrl && (
                      <a
                        href={liveTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#1D6474] hover:bg-[#164E63] text-white px-3 py-1.5 rounded-xl transition-all shadow-xs"
                      >
                        <span>{isBn ? " " : "Live Track"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customer-Friendly Order Timeline History */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#1D6474]" />
                    <span>{isBn ? "Delivery  " : "Delivery Tracking History"}</span>
                  </h3>
                  <span className="text-[10px] text-text-muted font-medium">
                    {history.length} {isBn ? "items " : "Updates"}
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-100/70">
                  {history.map((h: any, idx: number) => {
                    const view = formatCustomerLogEntry(
                      { status: h.status, note: h.note, courier_name: courierName },
                      language
                    );
                    const isLatest = idx === history.length - 1;

                    return (
                      <div key={h.id || idx} className="relative group">
                        {/* Timeline Bullet Node */}
                        <div
                          className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isLatest
                              ? "bg-[#1D6474] border-white shadow-xs"
                              : "bg-white border-teal-300"
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isLatest ? "bg-white" : "bg-pink-400"}`} />
                        </div>

                        {/* Event Content */}
                        <div className={`rounded-2xl border p-3.5 text-xs transition-colors space-y-1 ${
                          isLatest ? "bg-teal-50/60/40 border-teal-200" : "bg-white border-gray-100"
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                              {view.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${view.badgeColor}`}>
                              {view.badge}
                            </span>
                          </div>

                          <p className="text-gray-600 text-[11px] sm:text-xs leading-relaxed">
                            {view.description}
                          </p>

                          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                            <Calendar className="h-3 w-3 text-gray-300" />
                            <span>
                              {new Date(h.created_at).toLocaleString(isBn ? "bn-BD" : "en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Destination & Ordered Items Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Delivery Info */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-2.5 text-xs">
              <h3 className="font-bold text-text flex items-center gap-1.5 border-b border-border pb-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                <span>{t("orders", "shippingAddress")}</span>
              </h3>
              <p className="font-bold text-text text-sm">{address.name || "Customer"}</p>
              <p className="text-text-secondary font-mono">{toBn(address.phone || "")}</p>
              <p className="text-text-secondary leading-relaxed">{address.address}</p>
              <p className="text-text-secondary font-medium">
                {[address.thana, address.district].filter(Boolean).join(", ")}
              </p>
              <div className="pt-2 border-t border-dashed border-border flex justify-between font-semibold">
                <span className="text-text-muted">{t("checkout", "shippingMethod")}:</span>
                <span className="text-primary-700 font-bold">{order.shipping_method || "Standard Delivery"}</span>
              </div>
            </div>

            {/* Payment & Items */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-2.5 text-xs">
              <h3 className="font-bold text-text flex items-center gap-1.5 border-b border-border pb-2">
                <Package className="h-4 w-4 text-primary-600" />
                <span>{t("orders", "itemDetails")} ({toBn(items.length)})</span>
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {items.map((it: any) => (
                  <div key={it.id} className="flex justify-between items-center text-text-secondary py-0.5">
                    <span className="truncate pr-2 font-medium">
                      {toBn(it.quantity)}x {it.product_name_snapshot || it.name}
                    </span>
                    <span className="font-bold text-text shrink-0">{formatPriceBn(it.total)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-dashed border-border flex justify-between text-sm font-extrabold text-text">
                <span>{t("checkout", "totalPayable")}:</span>
                <span className="text-primary-700 font-black">{formatPriceBn(order.total)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-text-muted font-medium">
                <span>{isBn ? "Payment :" : "Payment Method:"}</span>
                <span className="uppercase font-bold text-emerald-700">
                  {order.payment_method === "cod" ? (isBn ? "Cash  Delivery (COD)" : "Cash on Delivery") : order.payment_method}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
