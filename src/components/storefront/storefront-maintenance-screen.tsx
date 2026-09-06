import React from "react";
import Link from "next/link";
import { Sparkles, PhoneCall, ShieldAlert, Clock, ArrowRight, Lock } from "lucide-react";

interface StorefrontMaintenanceScreenProps {
  message?: string;
}

export function StorefrontMaintenanceScreen({
  message = "We are performing scheduled updates to improve your beauty shopping experience. We will return shortly!",
}: StorefrontMaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-linear-to-b from-rose-50/60 via-white to-pink-50/40 flex flex-col justify-between p-6 md:p-12 selection:bg-rose-100">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-linear-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-rose-200">
            BB
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider text-gray-900 block">
              BLUSH & BUDGET
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-600 block">
              Authentic Beauty Bangladesh
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Scheduled Maintenance
        </div>
      </div>

      {/* Hero Center Card */}
      <div className="max-w-2xl mx-auto text-center my-auto py-12 space-y-6">
        <div className="relative inline-block">
          <div className="h-20 w-20 rounded-3xl bg-linear-to-tr from-rose-100 to-pink-100 border border-rose-200 flex items-center justify-center mx-auto shadow-inner text-rose-600">
            <Sparkles className="h-10 w-10 animate-spin-slow" />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
            <Clock className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            We’ll Be Right Back!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto font-medium">
            {message}
          </p>
        </div>

        {/* Status card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-rose-100 p-5 max-w-md mx-auto shadow-lg shadow-rose-100/40 text-left space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2.5">
            <span className="text-gray-500 font-medium">System Status:</span>
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Storefront Offline for Updates
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2.5">
            <span className="text-gray-500 font-medium">Active Orders & Deliveries:</span>
            <span className="font-bold text-emerald-600">Processing on schedule</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Urgent Customer Support:</span>
            <span className="font-bold text-gray-800">Available 10 AM – 10 PM</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="https://wa.me/8801700000000?text=Hello%20Blush%20%26%20Budget,%20I%20have%20an%20urgent%20inquiry%20regarding%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            Chat with Beauty Advisor on WhatsApp
          </a>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-gray-400" />
            Staff / Admin Sign In
          </Link>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-6xl mx-auto w-full pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Blush & Budget. Authentic Skincare & Cosmetics Bangladesh.</p>
        <p className="text-[11px] text-gray-400">
          Need order tracking? Your courier SMS updates remain active.
        </p>
      </div>
    </div>
  );
}
