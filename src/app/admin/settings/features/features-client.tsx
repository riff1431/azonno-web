"use client";

import { useState } from "react";
import { ToggleRight, CheckCircle2, ShieldAlert, Sparkles, Sliders } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { toggleModuleStatus, type SystemModule } from "@/features/modules/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface FeaturesClientProps {
  initialModules: SystemModule[];
}

export function FeaturesClient({ initialModules }: FeaturesClientProps) {
  const { t } = useAdminLang();
  const [modules, setModules] = useState<SystemModule[]>(initialModules);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  // Group into Features, Marketing, Operations
  const featureModules = modules.filter(
    (m) =>
      m.category === "features" ||
      m.category === "marketing" ||
      m.category === "communication"
  );

  const handleToggle = async (key: string, enabled: boolean) => {
    setLoadingKey(key);
    setModules((prev) =>
      prev.map((m) =>
        m.key === key
          ? { ...m, is_enabled: enabled, status: enabled ? "active" : "inactive" }
          : m
      )
    );

    const res = await toggleModuleStatus(key, enabled);
    if (res?.error) {
      setModules((prev) =>
        prev.map((m) => (m.key === key ? { ...m, is_enabled: !enabled } : m))
      );
      alert(res.error);
    }
    setLoadingKey(null);
  };

  const activeCount = featureModules.filter((m) => m.is_enabled).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <ModuleHeader
        title={t("features_title")}
        description={t("features_desc")}
        icon={Sliders}
        badgeLabel={`${activeCount} of ${featureModules.length} Active`}
      />

      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden divide-y divide-border">
        {featureModules.map((item) => (
          <div
            key={item.key}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-secondary/30 transition-colors"
          >
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text">{item.name}</h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted border border-border">
                  {item.category}
                </span>
                {item.is_enabled ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {t("feature_enabled_label")}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-text-muted bg-surface-secondary px-2 py-0.5 rounded">
                    {t("feature_disabled_label")}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.is_enabled}
                  disabled={loadingKey === item.key}
                  onChange={(e) => handleToggle(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
