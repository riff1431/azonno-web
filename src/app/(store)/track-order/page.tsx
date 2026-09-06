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
} from "lucide-react";
import { trackOrder } from "@/features/orders/actions";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";

export default function TrackOrderPage() {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);

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

  const statusSteps = [
    { key: "pending", label: t("orders", "statusPending") },
    { key: "confirmed", label: t("orders", "statusConfirmed") },
    { key: "processing", label: t("orders", "statusProcessing") },
    { key: "shipped", label: t("orders", "statusShipped") },
    { key: "delivered", label: t("orders", "statusDelivered") },
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
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const address = order?.shipping_address_snapshot || {};
  const items = order?.order_items || [];
  const history = order?.order_status_history || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 border border-primary-200">
          <Truck className="h-3.5 w-3.5" />
          {language === "bn" ? "রিয়েল-টাইম পার্সেল ট্র্যাকিং" : "Real-Time Consignment Tracking"}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
          {t("orders", "trackOrderTitle")}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
          {language === "bn"
            ? "আপনার অর্ডার নম্বর এবং মোবাইল নম্বর দিয়ে রিয়েল-টাইম কুরিয়ার ডেলিভারি আপডেট জানুন।"
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
              className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2.5 text-xs text-text font-mono font-bold uppercase placeholder:text-text-muted focus:outline-none"
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
              className="w-full rounded-xl border border-border bg-surface-secondary/50 px-3.5 py-2.5 text-xs text-text placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 pt-1">
            <Button type="submit" disabled={loading} className="w-full py-5 font-bold text-xs sm:text-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {language === "bn" ? "অর্ডার অনুসন্ধান করা হচ্ছে..." : "Locating Order..."}
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
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div>
                <span className="text-xs text-text-muted">{t("orders", "trackingResults")}:</span>
                <p className="text-lg font-extrabold text-primary-600 font-mono">
                  {order.order_number}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 text-xs font-bold capitalize">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1 text-center">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="space-y-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isCompleted ? "bg-primary-600" : "bg-zinc-200"
                        }`}
                      />
                      <span
                        className={`block text-[11px] leading-tight ${
                          isCurrent
                            ? "font-extrabold text-primary-600"
                            : isCompleted
                            ? "font-bold text-text"
                            : "text-text-muted"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Timeline History */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {language === "bn" ? "স্ট্যাটাস লগ" : "Status Log"}
                </h3>
                <div className="space-y-3">
                  {history.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-3 text-xs">
                      <div className="h-2 w-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-text capitalize">
                          {h.status}: {h.note || "Status updated"}
                        </p>
                        <span className="text-[10px] text-text-muted">
                          {new Date(h.created_at).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Items Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Delivery Info */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-2 text-xs">
              <h3 className="font-bold text-text flex items-center gap-1.5 border-b border-border pb-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                {t("orders", "shippingAddress")}
              </h3>
              <p className="font-bold text-text">{address.name}</p>
              <p className="text-text-secondary">{toBn(address.phone)}</p>
              <p className="text-text-secondary">{address.address}</p>
              <p className="text-text-secondary">{address.thana}, {address.district}</p>
              <div className="pt-2 border-t border-dashed border-border flex justify-between font-semibold">
                <span>{t("checkout", "shippingMethod")}:</span>
                <span className="text-primary-700">{order.shipping_method}</span>
              </div>
            </div>

            {/* Payment & Items */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-2 text-xs">
              <h3 className="font-bold text-text flex items-center gap-1.5 border-b border-border pb-2">
                <Package className="h-4 w-4 text-primary-600" />
                {t("orders", "itemDetails")} ({toBn(items.length)})
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {items.map((it: any) => (
                  <div key={it.id} className="flex justify-between text-text-secondary">
                    <span className="truncate pr-2">{toBn(it.quantity)}x {it.product_name_snapshot}</span>
                    <span className="font-semibold text-text">{formatPriceBn(it.total)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-dashed border-border flex justify-between text-sm font-extrabold text-text">
                <span>{t("checkout", "totalPayable")}:</span>
                <span className="text-primary-700">{formatPriceBn(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

