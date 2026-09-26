"use client";

import React from "react";
import {
  ArrowLeft,
  Blocks,
  Shield,
  ShoppingBag,
  Package,
  Users,
  Cloud,
  Truck,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  MessageSquare,
  Mail,
  Activity,
  Server,
  ShoppingCart,
  Code,
  BarChart3,
  Star,
  Heart,
  HelpCircle,
  Award,
  RotateCcw,
  UserX,
  ShieldAlert,
  Calculator,
  Factory,
  TrendingUp,
  Sliders,
  Store,
  Globe,
  Wrench,
  Image,
  Megaphone,
  Bell,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { ConnectionStatusBadge, ConnectionStatus } from "./connection-status-badge";
import { useAdminLang } from "@/lib/admin-lang-context";

const ICON_LOOKUP: Record<string, any> = {
  Blocks,
  Shield,
  ShoppingBag,
  Package,
  Users,
  Cloud,
  Truck,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  MessageSquare,
  Mail,
  Activity,
  Server,
  ShoppingCart,
  Code,
  BarChart3,
  Star,
  Heart,
  HelpCircle,
  Award,
  RotateCcw,
  UserX,
  ShieldAlert,
  Calculator,
  Factory,
  TrendingUp,
  Sliders,
  Store,
  Globe,
  Wrench,
  Image,
  Megaphone,
  Bell,
  MapPin,
  Search,
};

interface ModuleHeaderProps {
  title: string;
  description: string;
  icon?: any;
  iconName?: string;
  status?: ConnectionStatus | string;
  isEnabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  isCore?: boolean;
  backHref?: string;
  badgeLabel?: string;
}

export function ModuleHeader({
  title,
  description,
  icon,
  iconName,
  status,
  isEnabled,
  onToggleEnabled,
  isCore = false,
  backHref,
  badgeLabel,
}: ModuleHeaderProps) {
  // Resolve icon safely across server/client boundaries
  let RenderedIcon: React.ReactNode = null;
  if (React.isValidElement(icon)) {
    RenderedIcon = icon;
  } else if (iconName && ICON_LOOKUP[iconName]) {
    const IconComp = ICON_LOOKUP[iconName];
    RenderedIcon = <IconComp className="h-5 w-5" />;
  } else if (typeof icon === "function") {
    const IconComp = icon;
    RenderedIcon = <IconComp className="h-5 w-5" />;
  }

  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";

  return (
    <div className="border-b border-border pb-5">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isBn ? "Back to Integrations" : "Back to Integrations"}
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {RenderedIcon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 border border-primary-100">
              {RenderedIcon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-text">{title}</h1>
              {status && <ConnectionStatusBadge status={status} />}
              {badgeLabel && (
                <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary border border-border">
                  {badgeLabel}
                </span>
              )}
              {isCore && (
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  {isBn ? "Core Modules" : "Core Module"}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl">{description}</p>
          </div>
        </div>

        {onToggleEnabled !== undefined && !isCore && (
          <div className="flex items-center gap-3 bg-white border border-border px-4 py-2 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-text">
              {isEnabled
                ? (isBn ? "Module Active" : "Module Enabled")
                : (isBn ? "Module Inactive" : "Module Disabled")}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => onToggleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
