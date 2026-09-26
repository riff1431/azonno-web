"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Save,
  CheckCircle2,
  Mail,
  MessageSquare,
  Smartphone,
  PhoneCall,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import {
  getNotificationMatrix,
  saveNotificationMatrix,
} from "@/features/communication/actions";
import Link from "next/link";

interface EventItem {
  key: string;
  label: string;
  desc: string;
  category: "checkout" | "orders" | "post_delivery" | "auth";
  smsSupported: boolean;
  smsNote?: string;
  whatsappSupported: boolean;
  whatsappNote?: string;
  emailSupported: boolean;
  inappSupported: boolean;
}

const EVENTS: EventItem[] = [
  {
    key: "order_otp",
    label: "Phone Verification OTP (Checkout OTP)",
    desc: "    4-  Code SMS",
    category: "checkout",
    smsSupported: true,
    smsNote: "Automated SMS Gateway",
    whatsappSupported: false,
    emailSupported: false,
    inappSupported: false,
  },
  {
    key: "abandoned_cart",
    label: "Abandoned Checkout Recovery (Abandoned Cart)",
    desc: "     Discount Link  SMS",
    category: "checkout",
    smsSupported: true,
    smsNote: "1-Click Recovery SMS",
    whatsappSupported: true,
    whatsappNote: "WhatsApp Recovery Message",
    emailSupported: true,
    inappSupported: false,
  },
  {
    key: "order_placed",
    label: "Order Placed   (Order Placed)",
    desc: "Cash  Delivery (COD)  / Payment Confirmed  Order ID   Link SMS",
    category: "orders",
    smsSupported: true,
    smsNote: "Automated SMS Gateway",
    whatsappSupported: true,
    whatsappNote: "1-Click Order Confirmation",
    emailSupported: true,
    inappSupported: true,
  },
  {
    key: "order_shipped",
    label: "    (Consignment Shipped)",
    desc: "items  Pathao-    Code    Link  SMS",
    category: "orders",
    smsSupported: true,
    smsNote: "Automated SMS with Tracking",
    whatsappSupported: true,
    whatsappNote: "1-Click Tracking Link",
    emailSupported: true,
    inappSupported: true,
  },
  {
    key: "advance_requested",
    label: " Delivery   (Advance Delivery Charge)",
    desc: "  Order Delivery     SMS ",
    category: "orders",
    smsSupported: true,
    smsNote: "Automated / Template SMS",
    whatsappSupported: true,
    whatsappNote: "1-Click bKash/Nagad Request",
    emailSupported: false,
    inappSupported: true,
  },
  {
    key: "order_delivered",
    label: "Delivered Confirmed (Order Delivered)",
    desc: " from Delivered    Delivery  SMS",
    category: "orders",
    smsSupported: true,
    smsNote: "Automated SMS Gateway",
    whatsappSupported: false,
    emailSupported: true,
    inappSupported: true,
  },
  {
    key: "order_cancelled",
    label: "Order Cancel   (Order Cancelled)",
    desc: "Order Cancel   Customers   SMS",
    category: "orders",
    smsSupported: true,
    smsNote: "Automated SMS Gateway",
    whatsappSupported: false,
    emailSupported: true,
    inappSupported: true,
  },
  {
    key: "refund_approved",
    label: "Refund  :00  (Refund Approved)",
    desc: "Products :00 Verification  :00      SMS",
    category: "post_delivery",
    smsSupported: true,
    smsNote: "Automated SMS Gateway",
    whatsappSupported: true,
    whatsappNote: "1-Click Refund Notification",
    emailSupported: true,
    inappSupported: true,
  },
  {
    key: "review_request",
    label: "Products Reviews    (Review Request)",
    desc: "Delivery 2-3 Enter  Price   Reviews  SMS ",
    category: "post_delivery",
    smsSupported: true,
    smsNote: "Marketing SMS Link",
    whatsappSupported: true,
    whatsappNote: "1-Click Feedback Request",
    emailSupported: true,
    inappSupported: false,
  },
  {
    key: "promotional",
    label: "Stock    (Promotional & Replenishment)",
    desc: "Casual Wear   and  Coupon Code  SMS",
    category: "post_delivery",
    smsSupported: true,
    smsNote: "Promotional SMS Gateway",
    whatsappSupported: true,
    whatsappNote: "1-Click WhatsApp Promo",
    emailSupported: true,
    inappSupported: false,
  },
  {
    key: "password_reset",
    label: "Password Reset   items (Password Reset)",
    desc: " Password Invalid   Security items SMS",
    category: "auth",
    smsSupported: true,
    smsNote: "Automated SMS Gateway",
    whatsappSupported: false,
    emailSupported: true,
    inappSupported: false,
  },
];

export default function AdminNotificationMatrixPage() {
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotificationMatrix();
        setMatrix(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = (key: string) => {
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllChannel = (channel: "sms" | "whatsapp" | "email" | "inapp", enable: boolean) => {
    setMatrix((prev) => {
      const next = { ...prev };
      EVENTS.forEach((evt) => {
        const field = `${evt.key}_${channel}`;
        if (channel === "sms" && evt.smsSupported) next[field] = enable;
        if (channel === "whatsapp" && evt.whatsappSupported) next[field] = enable;
        if (channel === "email" && evt.emailSupported) next[field] = enable;
        if (channel === "inapp" && evt.inappSupported) next[field] = enable;
      });
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      await saveNotificationMatrix(matrix);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <ModuleHeader
        title="Multi-Channel Notification Matrix"
        description="Selectively control and route automated SMS Gateway broadcasts, 1-Click WhatsApp dynamic templates, transactional Emails, and In-App alerts."
        icon={Bell}
        backHref="/admin/settings/modules"
      />

      {/* Channel Overview Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <MessageSquare className="h-4 w-4 text-rose-600" />
              SMS Gateway
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              Automated
            </span>
          </div>
          <p className="text-[11px] text-rose-900/80 leading-relaxed">
            Directly dispatched by your connected SMS Gateway (BulkSMSBD / Greenweb) for instant OTP and order tracking.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <Link
              href="/admin/communication/sms"
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
            >
              Gateway Settings <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <PhoneCall className="h-4 w-4 text-emerald-600" />
              WhatsApp Dynamic
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              1-Click / Chat
            </span>
          </div>
          <p className="text-[11px] text-emerald-900/80 leading-relaxed">
            Pre-fills personalized templates (Order confirm, courier tracking, bKash advance fee, reviews) in 1 click.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <Link
              href="/admin/orders"
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
            >
              View in Orders <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <Mail className="h-4 w-4 text-blue-600" />
              Transactional Email
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              SMTP / Resend
            </span>
          </div>
          <p className="text-[11px] text-blue-900/80 leading-relaxed">
            Sends formatted HTML order invoices, dispatch summaries, and account receipts to buyer email addresses.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <Link
              href="/admin/communication/email"
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
            >
              SMTP Settings <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-800">
              <Bell className="h-4 w-4 text-violet-600" />
              In-App & Alerts
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              Real-Time
            </span>
          </div>
          <p className="text-[11px] text-violet-900/80 leading-relaxed">
            Instant admin notification bell alerts and buyer account parcel tracking progress updates.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] font-medium text-violet-700">Native Store Realtime</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Notification dispatch rules updated and saved successfully!</span>
        </div>
      )}

      {/* Main Matrix Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 bg-surface-secondary/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-600" />
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Store Lifecycle Notification Rules
            </h3>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-text-muted font-medium">Quick Channel Actions:</span>
            <button
              type="button"
              onClick={() => toggleAllChannel("sms", true)}
              className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 hover:bg-rose-100"
            >
              All SMS ON
            </button>
            <button
              type="button"
              onClick={() => toggleAllChannel("sms", false)}
              className="px-2 py-1 rounded bg-gray-50 text-gray-600 font-semibold border border-gray-200 hover:bg-gray-100"
            >
              All SMS OFF
            </button>
            <button
              type="button"
              onClick={() => toggleAllChannel("whatsapp", true)}
              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 hover:bg-emerald-100"
            >
              All WhatsApp ON
            </button>
            <button
              type="button"
              onClick={() => toggleAllChannel("whatsapp", false)}
              className="px-2 py-1 rounded bg-gray-50 text-gray-600 font-semibold border border-gray-200 hover:bg-gray-100"
            >
              All WhatsApp OFF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-5 py-4 w-[38%]">Lifecycle Event</th>
                <th className="px-4 py-4 text-center w-[15%]">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                      <MessageSquare className="h-3.5 w-3.5" />
                      SMS Gateway
                    </span>
                    <span className="text-[9px] text-rose-600/70 font-normal">Automated API</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center w-[16%]">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                      <PhoneCall className="h-3.5 w-3.5" />
                      WhatsApp
                    </span>
                    <span className="text-[9px] text-emerald-600/70 font-normal">1-Click / Live</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center w-[15%]">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </span>
                    <span className="text-[9px] text-blue-600/70 font-normal">SMTP Receipts</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center w-[16%]">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 text-violet-700 font-bold">
                      <Bell className="h-3.5 w-3.5" />
                      In-App
                    </span>
                    <span className="text-[9px] text-violet-600/70 font-normal">Dashboard & Bell</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {EVENTS.map((evt) => {
                const isSms = !!matrix[`${evt.key}_sms`];
                const isWa = !!matrix[`${evt.key}_whatsapp`];
                const isEmail = !!matrix[`${evt.key}_email`];
                const isInApp = !!matrix[`${evt.key}_inapp`];

                return (
                  <tr key={evt.key} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-surface-secondary text-primary-600 mt-0.5 shrink-0">
                          {evt.category === "checkout" && <ShieldCheck className="h-3.5 w-3.5" />}
                          {evt.category === "orders" && <Truck className="h-3.5 w-3.5" />}
                          {evt.category === "post_delivery" && <RotateCcw className="h-3.5 w-3.5" />}
                          {evt.category === "auth" && <KeyRound className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-text text-xs">{evt.label}</p>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{evt.desc}</p>
                        </div>
                      </div>
                    </td>

                    {/* SMS Column */}
                    <td className="px-4 py-4 text-center">
                      {evt.smsSupported ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSms}
                            onChange={() => handleToggle(`${evt.key}_sms`)}
                            className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                          />
                          {evt.smsNote && (
                            <span className="text-[9px] text-text-muted hidden sm:inline-block">
                              {evt.smsNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted/40 font-mono">—</span>
                      )}
                    </td>

                    {/* WhatsApp Column */}
                    <td className="px-4 py-4 text-center">
                      {evt.whatsappSupported ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isWa}
                            onChange={() => handleToggle(`${evt.key}_whatsapp`)}
                            className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                          {evt.whatsappNote && (
                            <span className="text-[9px] text-text-muted hidden sm:inline-block">
                              {evt.whatsappNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted/40 font-mono">—</span>
                      )}
                    </td>

                    {/* Email Column */}
                    <td className="px-4 py-4 text-center">
                      {evt.emailSupported ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isEmail}
                            onChange={() => handleToggle(`${evt.key}_email`)}
                            className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted/40 font-mono">—</span>
                      )}
                    </td>

                    {/* In-App Column */}
                    <td className="px-4 py-4 text-center">
                      {evt.inappSupported ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isInApp}
                            onChange={() => handleToggle(`${evt.key}_inapp`)}
                            className="h-4 w-4 rounded border-border text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted/40 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-surface-secondary/40 border-t border-border flex items-center justify-between">
          <p className="text-[11px] text-text-muted">
            Changes apply instantly to live checkout, SMS gateway broadcasts, and order management actions.
          </p>
          <Button type="submit" disabled={saving || loading} size="sm" className="text-xs bg-primary-600 hover:bg-primary-700 text-white">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving Changes..." : "Save Notification Matrix"}
          </Button>
        </div>
      </form>
    </div>
  );
}

