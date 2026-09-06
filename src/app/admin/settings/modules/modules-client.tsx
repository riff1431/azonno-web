"use client";

import { useState } from "react";
import {
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
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { ModuleCard, type ModuleCardItem } from "@/components/admin/module-settings/module-card";
import { toggleModuleStatus, type SystemModule } from "@/features/modules/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

const ICON_MAP: Record<string, any> = {
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
  Blocks,
};

const MODULE_SETTINGS_HREF_MAP: Record<string, string> = {
  cloudinary: "/admin/media/cloudinary",
  steadfast: "/admin/shipping/steadfast",
  pathao: "/admin/shipping/pathao",
  cod: "/admin/payments/cod",
  bkash: "/admin/payments/bkash",
  nagad: "/admin/payments/nagad",
  sslcommerz: "/admin/payments/sslcommerz",
  stripe: "/admin/payments/stripe",
  paypal: "/admin/payments/paypal",
  bank_transfer: "/admin/payments/custom",
  sms: "/admin/communication/sms",
  email: "/admin/communication/email",
  meta_pixel: "/admin/marketing/meta",
  meta_capi: "/admin/marketing/meta",
  meta_catalog: "/admin/marketing/catalog",
  reviews: "/admin/products/settings",
  returns: "/admin/returns",
  fraud_detection: "/admin/fraud",
  accounting: "/admin/finance/accounting",
  suppliers: "/admin/finance/suppliers",
  investors: "/admin/finance/investors",
};

interface ModulesClientProps {
  initialModules: SystemModule[];
}

export function ModulesClient({ initialModules }: ModulesClientProps) {
  const { t } = useAdminLang();
  const [modules, setModules] = useState<SystemModule[]>(initialModules);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Modules" },
    { id: "core", label: "Core" },
    { id: "payments", label: "Payments" },
    { id: "shipping", label: "Shipping & Courier" },
    { id: "marketing", label: "Marketing" },
    { id: "communication", label: "Communication" },
    { id: "media", label: "Media" },
    { id: "features", label: "Features" },
    { id: "finance", label: "Finance" },
  ];

  const handleToggle = async (key: string, enabled: boolean) => {
    setLoadingKey(key);
    // Optimistic UI update
    setModules((prev) =>
      prev.map((m) =>
        m.key === key
          ? { ...m, is_enabled: enabled, status: enabled ? "active" : "inactive" }
          : m
      )
    );

    const res = await toggleModuleStatus(key, enabled);
    if (res?.error) {
      // Revert if error
      setModules((prev) =>
        prev.map((m) => (m.key === key ? { ...m, is_enabled: !enabled } : m))
      );
      alert(res.error);
    }
    setLoadingKey(null);
  };

  const filteredModules = modules.filter((mod) => {
    const matchesCategory =
      categoryFilter === "all" || mod.category.toLowerCase() === categoryFilter;
    const matchesSearch =
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalEnabled = modules.filter((m) => m.is_enabled).length;

  return (
    <div className="space-y-6 max-w-7xl">
      <ModuleHeader
        title={t("modules_title")}
        description={t("modules_desc")}
        icon={Blocks}
        badgeLabel={`${totalEnabled} Active / ${modules.length} Total`}
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-card">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search modules by name, provider or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-secondary/50 pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none"
          />
        </div>

        {/* Categories Tab Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((mod) => {
          const cardItem: ModuleCardItem = {
            key: mod.key,
            name: mod.name,
            category: mod.category,
            description: mod.description,
            icon: ICON_MAP[mod.icon] || Blocks,
            status: mod.status,
            isEnabled: mod.is_enabled,
            isCore: mod.is_core,
            settingsHref: MODULE_SETTINGS_HREF_MAP[mod.key],
            version: mod.version,
          };

          return (
            <ModuleCard
              key={mod.key}
              module={cardItem}
              onToggle={handleToggle}
              loading={loadingKey === mod.key}
            />
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-text">{t("no_dues_found")}</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {t("filter_label")} {t("all_categories_btn")}
          </p>
        </div>
      )}
    </div>
  );
}
