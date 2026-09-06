"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Shield, Wifi, WifiOff } from "lucide-react";
import { useAdminLang } from "@/lib/admin-lang-context";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "not_configured"
  | "sandbox"
  | "live"
  | "active"
  | "inactive";

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function ConnectionStatusBadge({
  status,
  className,
  showIcon = true,
}: ConnectionStatusBadgeProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";
  const normStatus = (status || "").toLowerCase();

  switch (normStatus) {
    case "connected":
    case "active":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200",
            className
          )}
        >
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          <span>
            {normStatus === "connected"
              ? (isBn ? "সংযুক্ত" : "Connected")
              : (isBn ? "সক্রিয়" : "Active")}
          </span>
        </span>
      );

    case "live":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200",
            className
          )}
        >
          {showIcon && <Wifi className="h-3.5 w-3.5 text-emerald-600" />}
          <span>{isBn ? "লাইভ মোড" : "Live Mode"}</span>
        </span>
      );

    case "sandbox":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200",
            className
          )}
        >
          {showIcon && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
          <span>{isBn ? "স্যান্ডবক্স / টেস্ট" : "Sandbox / Test"}</span>
        </span>
      );

    case "error":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200",
            className
          )}
        >
          {showIcon && <XCircle className="h-3.5 w-3.5 text-red-600" />}
          <span>{isBn ? "ত্রুটি" : "Error"}</span>
        </span>
      );

    case "disconnected":
    case "inactive":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted border border-border",
            className
          )}
        >
          {showIcon && <WifiOff className="h-3.5 w-3.5 text-text-muted" />}
          <span>
            {normStatus === "disconnected"
              ? (isBn ? "বিচ্ছিন্ন" : "Disconnected")
              : (isBn ? "নিষ্ক্রিয়" : "Disabled")}
          </span>
        </span>
      );

    case "not_configured":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-secondary border border-border",
            className
          )}
        >
          {showIcon && <HelpCircle className="h-3.5 w-3.5 text-text-muted" />}
          <span>{isBn ? "কনফিগার করা হয়নি" : "Not Configured"}</span>
        </span>
      );
  }
}
