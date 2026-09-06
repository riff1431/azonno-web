"use client";

import { useState } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Database, Shield, Cloud, Truck, MessageSquare, CreditCard, Sparkles } from "lucide-react";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import { Button } from "@/components/shared/ui/button";
import { runSystemHealthCheck, type ServiceHealthItem } from "@/features/system/health-actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface HealthClientProps {
  initialChecks: ServiceHealthItem[];
}

export function HealthClient({ initialChecks }: HealthClientProps) {
  const { t } = useAdminLang();
  const [checks, setChecks] = useState<ServiceHealthItem[]>(initialChecks);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string>(new Date().toLocaleTimeString());

  const handleRunHealthCheck = async () => {
    setLoading(true);
    try {
      const results = await runSystemHealthCheck();
      setChecks(results);
      setLastRun(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  const healthyCount = checks.filter((c) => c.status === "healthy").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const errorCount = checks.filter((c) => c.status === "error").length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            System Health & Service Connectivity
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time diagnostic probe across PostgreSQL database, Supabase Auth, Cloudinary CDN, Couriers, and SMS gateways.
          </p>
        </div>

        <Button
          onClick={handleRunHealthCheck}
          disabled={loading}
          size="sm"
          className="text-xs shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {t("run_health_check_btn")}
        </Button>
      </div>

      {/* Health Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">{t("health_healthy_label")}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{healthyCount}</p>
          <p className="text-[11px] text-text-muted">Operating nominally</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">{t("health_warning_label")}</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{warningCount}</p>
          <p className="text-[11px] text-text-muted">Non-critical notices</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">{t("health_error_label")}</span>
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-extrabold text-red-600">{errorCount}</p>
          <p className="text-[11px] text-text-muted">Requires immediate attention</p>
        </div>
      </div>

      {/* Services List */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden divide-y divide-border">
        {checks.map((item) => (
          <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-text">{item.name}</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted border border-border">
                  {item.category}
                </span>
                {item.latencyMs !== undefined && (
                  <span className="text-[10px] font-mono text-text-muted">
                    {item.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">{item.message}</p>
            </div>

            <div className="shrink-0">
              {item.status === "healthy" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Healthy
                </span>
              )}
              {item.status === "warning" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Warning
                </span>
              )}
              {item.status === "error" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                  <XCircle className="h-3.5 w-3.5" />
                  Error
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-muted px-2">
        <span>Last diagnostic scan: {lastRun}</span>
        <span>Probe Engine v1.0.0</span>
      </div>
    </div>
  );
}
