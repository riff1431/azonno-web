"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, Ban, Phone, Search, AlertTriangle, Plus, CheckCircle2, UserX } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/shared/ui/button";
import { toggleBlacklistStatus, type FraudProfile } from "./actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface FraudCheckerClientProps {
  initialProfiles: FraudProfile[];
}

export function FraudCheckerClient({ initialProfiles }: FraudCheckerClientProps) {
  const { t } = useAdminLang();
  const [profiles, setProfiles] = useState<FraudProfile[]>(initialProfiles);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searchResult, setSearchResult] = useState<FraudProfile | null | "not_found">(null);
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = phoneSearch.trim();
    if (!query) return;

    const found = profiles.find((p) => p.identifier_value === query);
    setSearchResult(found || "not_found");
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    await toggleBlacklistStatus(newPhone.trim(), true, newReason.trim() || "Manual blacklist entry");

    // Refresh list
    const updated = profiles.filter((p) => p.identifier_value !== newPhone.trim());
    setProfiles([
      {
        id: `fp-${Date.now()}`,
        identifier_type: "phone",
        identifier_value: newPhone.trim(),
        risk_score: 95,
        cancellation_count: 1,
        rejected_delivery_count: 1,
        return_abuse_count: 0,
        is_blacklisted: true,
        blacklist_reason: newReason.trim() || "Manual blacklist entry",
        updated_at: new Date().toISOString(),
      },
      ...updated,
    ]);

    setNewPhone("");
    setNewReason("");
    setMsg(t("blacklist_added_msg"));
    setTimeout(() => setMsg(null), 3000);
  };

  const handleToggle = async (profile: FraudProfile) => {
    const nextStatus = !profile.is_blacklisted;
    await toggleBlacklistStatus(profile.identifier_value, nextStatus);

    setProfiles(
      profiles.map((p) =>
        p.id === profile.id ? { ...p, is_blacklisted: nextStatus, risk_score: nextStatus ? 90 : 15 } : p
      )
    );
  };

  const columns: Column<FraudProfile>[] = [
    {
      key: "identifier",
      header: t("customer_phone_col"),
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-text text-xs flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-primary-600" />
          {row.identifier_value}
        </span>
      ),
    },
    {
      key: "risk_score",
      header: t("risk_score_label"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
              row.risk_score >= 80
                ? "bg-red-50 text-red-700 border-red-200"
                : row.risk_score >= 50
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {row.risk_score} / 100
          </span>
          <span className="text-[11px] text-text-muted">
            {row.risk_score >= 80 ? t("risk_critical") : row.risk_score >= 50 ? t("risk_high") : t("risk_low")}
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      header: t("delivery_behavior"),
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-red-600 font-semibold block">
            {row.rejected_delivery_count} {t("doorstep_rejections")}
          </span>
          <span className="text-text-muted text-[11px] block">
            {row.cancellation_count} {t("order_cancellations")}
          </span>
        </div>
      ),
    },
    {
      key: "reason",
      header: t("blacklist_flag_notes"),
      cell: (row) => (
        <div className="max-w-70 text-xs">
          {row.is_blacklisted ? (
            <span className="text-red-700 font-semibold flex items-center gap-1">
              <Ban className="h-3 w-3 shrink-0" />
              {row.blacklist_reason || t("blacklisted_badge")}
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              {t("allowed_monitoring")}
            </span>
          )}
          {row.notes && <p className="text-text-muted text-[11px] mt-0.5 truncate">{row.notes}</p>}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("column_actions"),
      cell: (row) => (
        <Button
          variant={row.is_blacklisted ? "outline" : "destructive"}
          size="sm"
          onClick={() => handleToggle(row)}
          className="text-xs"
        >
          {row.is_blacklisted ? t("remove_blacklist_btn") : t("block_customer_btn")}
        </Button>
      ),
    },
  ];

  const totalBlacklisted = profiles.filter((p) => p.is_blacklisted).length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-text">{t("fraud_checker_title")}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t("fraud_checker_desc")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <UserX className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">{t("blacklisted_numbers")}</span>
          <p className="text-2xl font-extrabold text-red-600">{totalBlacklisted}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">{t("high_risk_monitored")}</span>
          <p className="text-2xl font-extrabold text-amber-600">
            {profiles.filter((p) => p.risk_score >= 50 && !p.is_blacklisted).length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-xs text-text-muted font-medium">{t("cod_shield_active")}</span>
          <p className="text-2xl font-extrabold text-emerald-700">{t("shield_active")}</p>
        </div>
      </div>

      {/* Lookup & Add to Blacklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instant Risk Lookup */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
          <h2 className="text-base font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Search className="h-4 w-4 text-primary-600" />
            {t("instant_lookup_title")}
          </h2>

          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="block font-semibold text-text mb-1">
                {t("enter_phone_label")}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="flex-1 rounded-xl border border-border px-3 py-2 text-xs font-mono focus:outline-none"
                />
                <Button type="submit" size="sm" className="text-xs">
                  {t("check_risk_btn")}
                </Button>
              </div>
            </div>

            {searchResult === "not_found" && (
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{t("clean_record_msg")}</span>
              </div>
            )}

            {typeof searchResult === "object" && searchResult !== null && (
              <div className="rounded-xl bg-red-50 p-3 text-red-700 text-xs border border-red-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>{t("risk_score_label")}: {searchResult.risk_score}/100</span>
                  <span>{searchResult.is_blacklisted ? t("blacklisted_badge") : t("flagged_badge")}</span>
                </div>
                <p className="text-[11px]">{searchResult.blacklist_reason || searchResult.notes}</p>
                <p className="text-[11px] font-semibold">
                  {t("doorstep_rejections")}: {searchResult.rejected_delivery_count} | {t("order_cancellations")}: {searchResult.cancellation_count}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Add To Blacklist Form */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 text-xs">
          <h2 className="text-base font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Ban className="h-4 w-4 text-red-600" />
            {t("add_to_blacklist_title")}
          </h2>

          <form onSubmit={handleAddBlacklist} className="space-y-3">
            <div>
              <label className="block font-semibold text-text mb-1">{t("column_phone")}</label>
              <input
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">{t("blacklist_reason_label")}</label>
              <input
                type="text"
                placeholder={t("blacklist_reason_placeholder")}
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            {msg && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {msg}
              </span>
            )}

            <Button type="submit" variant="destructive" size="sm" className="w-full text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("add_blacklist_btn")}
            </Button>
          </form>
        </div>
      </div>

      {/* Profiles Data Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text">{t("monitored_directory")}</h2>
        <DataTable
          columns={columns}
          data={profiles}
          searchKey="identifier_value"
          searchPlaceholder={t("search_phone_placeholder")}
          emptyMessage={t("no_flagged_numbers")}
        />
      </div>
    </div>
  );
}
