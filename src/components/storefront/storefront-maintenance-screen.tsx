import React from "react";
import Link from "next/link";
import { Sparkles, PhoneCall, ShieldAlert, Clock, ArrowRight, Lock, Eye, Settings, ShieldCheck } from "lucide-react";

interface StorefrontMaintenanceScreenProps {
  message?: string;
  isAdminUser?: boolean;
  supportPhone?: string;
  storeName?: string;
  copyrightText?: string;
}

export function StorefrontMaintenanceScreen({
  message = "We are performing scheduled updates to improve your beauty shopping experience. We will return shortly!",
  isAdminUser = false,
  supportPhone,
  storeName,
  copyrightText,
}: StorefrontMaintenanceScreenProps) {
  const displayStoreName = storeName || "Store Online";
  const cleanPhone = (supportPhone || "").replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hello ${displayStoreName}, I have an inquiry regarding my order.`
      )}`
    : "#";

  return (
    <div className="min-h-screen bg-linear-to-b from-rose-50/60 via-white to-pink-50/40 flex flex-col justify-between selection:bg-rose-100 overflow-x-hidden">
      {/* Admin Quick Action Banner if logged in as Admin */}
      {isAdminUser && (
        <div className="bg-slate-900 text-white px-3.5 sm:px-6 py-2.5 text-xs shadow-md border-b border-slate-800 z-50 sticky top-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-medium text-gray-200 text-[11px] sm:text-xs">
                <strong>Administrator Mode:</strong> Storefront is offline to public visitors.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href="/?admin_preview=1"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] sm:text-xs shadow-xs transition shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview Live Store
              </a>
              <Link
                href="/admin/settings/maintenance"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-[11px] sm:text-xs font-semibold border border-slate-700 transition shrink-0"
              >
                <Settings className="h-3.5 w-3.5 text-rose-400" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-12 pb-0 md:pb-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-linear-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shadow-rose-200 shrink-0">
            {displayStoreName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("") || "BB"}
          </div>
          <div>
            <span className="font-black text-sm sm:text-base tracking-wider text-gray-900 block">
              {displayStoreName.toUpperCase()}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-rose-600 block">
              Authentic Beauty Bangladesh
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-semibold shrink-0">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Scheduled Maintenance
        </div>
      </div>

      {/* Hero Center Card */}
      <div className="max-w-2xl mx-auto text-center my-auto py-8 sm:py-12 px-4 sm:px-6 space-y-5 sm:space-y-6 w-full">
        <div className="relative inline-block">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-linear-to-tr from-rose-100 to-pink-100 border border-rose-200 flex items-center justify-center mx-auto shadow-inner text-rose-600">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 animate-spin-slow" />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            We’ll Be Right Back!
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto font-medium">
            {message}
          </p>
        </div>

        {/* Status card */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-rose-100 p-4 sm:p-5 max-w-md mx-auto shadow-lg shadow-rose-100/40 text-left space-y-2.5 sm:space-y-3 w-full">
          <div className="flex items-center justify-between text-[11px] sm:text-xs border-b border-gray-100 pb-2.5">
            <span className="text-gray-500 font-medium">System Status:</span>
            <span className="font-bold text-amber-600 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Storefront Offline for Updates
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs border-b border-gray-100 pb-2.5">
            <span className="text-gray-500 font-medium">Active Orders &amp; Deliveries:</span>
            <span className="font-bold text-emerald-600">Processing on schedule</span>
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="text-gray-500 font-medium">Urgent Customer Support:</span>
            <span className="font-bold text-gray-800">Available 10 AM – 10 PM</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2 w-full max-w-md mx-auto">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            Chat with Beauty Advisor on WhatsApp
          </a>

          <Link
            href="/login?redirect=/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-gray-400" />
            Staff / Admin Sign In
          </Link>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-12 pt-6 sm:pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left text-[11px] sm:text-xs text-gray-500">
        <p>{copyrightText || `© ${new Date().getFullYear()} ${storeName || "Blush & Budget"}. Authentic Skincare & Cosmetics Bangladesh.`}</p>
        <p className="text-[10px] sm:text-[11px] text-gray-400">
          Need order tracking? Your courier SMS updates remain active.
        </p>
      </div>
    </div>
  );
}
