"use client";

import { useState } from "react";
import { CreditCard, Banknote, Smartphone, Building, Settings, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { ConnectionStatusBadge } from "@/components/admin/module-settings/connection-status-badge";
import { Button } from "@/components/shared/ui/button";
import { toggleModuleStatus } from "@/features/modules/actions";
import { type PaymentMethodItem } from "@/features/payments/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

const ICON_MAP: Record<string, any> = {
  Banknote,
  Smartphone,
  CreditCard,
  Building,
};

interface PaymentsClientProps {
  initialMethods: PaymentMethodItem[];
}

export function PaymentsClient({ initialMethods }: PaymentsClientProps) {
  const { t } = useAdminLang();
  const [methods, setMethods] = useState<PaymentMethodItem[]>(initialMethods);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleToggle = async (key: string, enabled: boolean) => {
    setLoadingKey(key);
    setMethods((prev) =>
      prev.map((m) =>
        m.key === key
          ? { ...m, isEnabled: enabled, status: enabled ? "active" : "inactive" }
          : m
      )
    );

    const res = await toggleModuleStatus(key, enabled);
    if (res?.error) {
      setMethods((prev) =>
        prev.map((m) => (m.key === key ? { ...m, isEnabled: !enabled } : m))
      );
      alert(res.error);
    }
    setLoadingKey(null);
  };

  const activeCount = methods.filter((m) => m.isEnabled).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <ModuleHeader
          title={t("payment_methods")}
          description="Manage Cash on Delivery (COD), local MFS mobile wallets (bKash, Nagad), SSLCommerz, and global credit card processors."
          icon={CreditCard}
          badgeLabel={`${activeCount} ${t("active")} / ${methods.length} ${t("all")}`}
        />

        <Link href="/admin/payments/logs">
          <Button variant="outline" size="sm" className="text-xs shrink-0">
            {t("payment_verification")} &rarr;
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {methods.map((method) => {
          const Icon = ICON_MAP[method.iconName] || CreditCard;

          return (
            <div
              key={method.key}
              className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:shadow-dropdown space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text">{method.name}</h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {method.category}
                      </span>
                    </div>
                  </div>

                  <ConnectionStatusBadge status={method.status} />
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {method.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.isEnabled}
                    disabled={loadingKey === method.key}
                    onChange={(e) => handleToggle(method.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-[11px] font-medium text-text-muted">
                    {method.isEnabled ? t("active") : t("disabled")}
                  </span>
                </label>

                <Link href={method.settingsHref}>
                  <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                    <Settings className="h-3 w-3 mr-1 text-primary-600" />
                    {t("action_edit")}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
