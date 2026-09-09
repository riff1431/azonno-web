"use client";

import React, { useState, useTransition } from "react";
import {
  Wrench,
  Save,
  AlertTriangle,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Smartphone,
  Monitor,
  RefreshCw,
  Plus,
  Info,
  Lock,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { saveMaintenanceSettings, type MaintenanceSettings } from "@/features/settings/actions";
import { StorefrontMaintenanceScreen } from "@/components/storefront/storefront-maintenance-screen";

interface MaintenanceClientProps {
  initialSettings: MaintenanceSettings;
}

const PRESET_MESSAGES = [
  {
    title: "✨ Scheduled System Update",
    text: "We are performing scheduled updates to improve your beauty shopping experience. We will return shortly!",
  },
  {
    title: "🛍️ Catalog & Restock Sync",
    text: "We are restructuring our brand collections and restocking authentic items. Our storefront will reopen in a few moments!",
  },
  {
    title: "🔥 Flash Sale Preparation",
    text: "Getting ready for our exclusive Seasonal Flash Sale! Incredible beauty discounts are coming. We will unlock the store shortly!",
  },
  {
    title: "🛡️ Server & Security Upgrade",
    text: "Routine infrastructure upgrade in progress. Active customer orders and courier dispatches remain completely uninterrupted.",
  },
];

export function MaintenanceClient({ initialSettings }: MaintenanceClientProps) {
  const [enabled, setEnabled] = useState(initialSettings.maintenance_mode);
  const [message, setMessage] = useState(initialSettings.maintenance_message);
  const [bypassIps, setBypassIps] = useState(initialSettings.bypass_ips);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await saveMaintenanceSettings({
          maintenance_mode: enabled,
          maintenance_message: message,
          bypass_ips: bypassIps,
        });
        if (res?.success) {
          showToast(
            enabled
              ? "⚠️ Maintenance Mode is now ACTIVE! Public storefront visitors will see the maintenance screen."
              : "✅ Storefront is now LIVE! Maintenance Mode has been disabled.",
            "success"
          );
        } else {
          showToast("Failed to update maintenance settings", "error");
        }
      } catch (err: any) {
        showToast(err?.message || "An unexpected error occurred", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Toast Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-slate-900 border-emerald-500/50 text-white"
              : "bg-red-950 border-red-500/50 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400 shrink-0" />
          )}
          <p className="text-xs font-medium">{toast.text}</p>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Status Card */}
      <div
        className={`rounded-2xl border p-5 transition-all ${
          enabled
            ? "border-amber-300 bg-linear-to-r from-amber-50 via-orange-50/50 to-amber-50/20 shadow-amber-100/50 shadow-md"
            : "border-emerald-200 bg-linear-to-r from-emerald-50/60 via-teal-50/30 to-white shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                enabled
                  ? "bg-amber-500 text-white shadow-amber-200"
                  : "bg-emerald-500 text-white shadow-emerald-200"
              }`}
            >
              {enabled ? (
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {enabled ? "Storefront Maintenance is ACTIVE" : "Storefront is LIVE & Operational"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    enabled
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      enabled ? "bg-amber-600 animate-ping" : "bg-emerald-600"
                    }`}
                  />
                  {enabled ? "Offline to Public" : "Publicly Visible"}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {enabled
                  ? "Public visitors are currently presented with the maintenance screen. Logged-in admins and whitelisted IPs retain full storefront access."
                  : "All customers and visitors can browse products, add to cart, and place orders smoothly."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="text-xs border-gray-200 hover:bg-white text-gray-700 bg-white/80 shadow-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
              Preview Screen
            </Button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              Visit Storefront
            </a>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
          <div className="space-y-0.5">
            <span className="font-bold text-gray-900 block text-sm">
              Enable Maintenance Mode
            </span>
            <span className="text-gray-500 text-xs">
              When toggled ON, the public catalog & checkout are held in maintenance mode.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Public Notice Message */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-gray-800 text-xs">
              Custom Public Maintenance Notice
            </label>
            <span className="text-[11px] text-gray-400">
              {message.length} characters
            </span>
          </div>

          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type notice message shown on maintenance page..."
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none shadow-xs transition"
          />

          {/* Quick Preset Templates */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-500 block">
              Quick Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(preset.text)}
                  className="text-left p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-rose-50/50 hover:border-rose-200 text-xs transition-all group"
                >
                  <p className="font-semibold text-gray-800 group-hover:text-rose-600">
                    {preset.title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {preset.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Whitelisted Bypass IPs */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-gray-800 text-xs">
              Whitelisted Bypass IP Addresses (Comma-separated)
            </label>
            <span className="text-[11px] text-gray-400">
              Optional for staging/external testers
            </span>
          </div>
          <input
            type="text"
            value={bypassIps}
            onChange={(e) => setBypassIps(e.target.value)}
            placeholder="e.g. 103.205.71.12, 192.168.1.1"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-mono text-gray-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none shadow-xs"
          />
          <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <strong>Admin Bypass:</strong> Logged-in admin and staff accounts bypass maintenance mode automatically and see the live storefront with a top notification bar. External IPs listed above will also bypass the block.
            </p>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Admin routes (`/admin/*`) & API auth are never blocked.
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-rose-200 flex items-center gap-2"
          >
            {isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isPending ? "Saving..." : "Save Maintenance Settings"}
          </Button>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Maintenance Screen Live Preview
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    This is what public visitors will see when visiting the store.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Viewport switch */}
                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl border border-gray-300/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      previewMode === "desktop"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      previewMode === "mobile"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content Frame */}
            <div className="flex-1 bg-gray-100 overflow-y-auto p-4 flex items-center justify-center">
              <div
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 transition-all duration-300 ${
                  previewMode === "mobile"
                    ? "w-[390px] h-[720px] rounded-3xl border-4 border-gray-800 overflow-y-auto"
                    : "w-full h-full overflow-y-auto"
                }`}
              >
                <StorefrontMaintenanceScreen message={message} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
