"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { UserCheck, ArrowUpRight, Plus, Trash2, X, AlertCircle, Award } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { FinanceSubNav } from "@/components/admin/finance/finance-sub-nav";
import { addInvestor, distributeProfit, deleteInvestor, type InvestorItem } from "@/features/finance/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface InvestorsClientProps {
  initialInvestors: InvestorItem[];
}

export function InvestorsClient({ initialInvestors }: InvestorsClientProps) {
  const { t } = useAdminLang();
  const [investors, setInvestors] = useState<InvestorItem[]>(initialInvestors);
  const [showAddModal, setShowAddModal] = useState(false);
  const [distributingItem, setDistributingItem] = useState<InvestorItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add stakeholder form states
  const [name, setName] = useState("");
  const [equity, setEquity] = useState("");
  const [capital, setCapital] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("Active Stakeholder");
  const [error, setError] = useState("");

  // Distribution form states
  const [distributionAmount, setDistributionAmount] = useState("");

  const totalCapital = investors.reduce((sum, inv) => sum + inv.capital, 0);
  const totalProfit = investors.reduce((sum, inv) => sum + inv.profitDistributed, 0);

  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("err_enter_stakeholder_name"));
      return;
    }
    if (!equity.trim()) {
      setError(t("err_enter_equity_pct"));
      return;
    }
    if (!capital || Number(capital) <= 0) {
      setError(t("err_enter_valid_capital"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await addInvestor({
        name,
        equity,
        capital: Number(capital),
        contact: contact || "N/A",
        status,
      });
      setInvestors(updated);
      setShowAddModal(false);
      setName("");
      setEquity("");
      setCapital("");
      setContact("");
    } catch (err: any) {
      setError(err.message || t("err_failed_add_stakeholder"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDistributeProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributingItem) return;
    if (!distributionAmount || Number(distributionAmount) <= 0) {
      setError(t("err_enter_valid_payout"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await distributeProfit(distributingItem.id, Number(distributionAmount));
      setInvestors(updated);
      setDistributingItem(null);
      setDistributionAmount("");
    } catch (err: any) {
      setError(err.message || t("err_failed_distribution"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvestor = async (id: string) => {
    if (!confirm(t("confirm_delete_investor"))) return;
    setDeletingId(id);
    try {
      const updated = await deleteInvestor(id);
      setInvestors(updated);
    } catch (err: any) {
      alert(t("err_failed_delete_stakeholder") + ": " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <FinanceSubNav />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("investors_title")}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t("investors_desc")}</p>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("add_stakeholder_btn")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("total_paid_capital_label")}</span>
          <p className="text-2xl font-extrabold text-text">{formatPrice(totalCapital)}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> {t("seed_working_capital_label")}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("total_profit_shared_label")}</span>
          <p className="text-2xl font-extrabold text-primary-600">{formatPrice(totalProfit)}</p>
          <span className="text-[11px] text-text-muted">{t("lifetime_distributions_label")}</span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("cap_table_label")}</span>
          <p className="text-2xl font-extrabold text-text">{investors.length} {t("partners_label")}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">{t("active_share_registry_label")}</span>
        </div>
      </div>

      {/* Cap Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text">{t("equity_ownership_title")}</h2>
          <span className="text-xs text-text-muted">{investors.length} {t("partners_label")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">{t("col_stakeholder")}</th>
                <th className="px-4 py-3">{t("col_equity_share")}</th>
                <th className="px-4 py-3">{t("col_paid_in_capital")}</th>
                <th className="px-4 py-3">{t("col_profit_distributed")}</th>
                <th className="px-4 py-3">{t("col_contact")}</th>
                <th className="px-4 py-3">{t("column_status")}</th>
                <th className="px-4 py-3 text-right">{t("column_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {investors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted text-xs">
                    {t("no_stakeholders_yet")}
                  </td>
                </tr>
              ) : (
                investors.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
                        {inv.name.charAt(0)}
                      </div>
                      {inv.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        {inv.equity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-text whitespace-nowrap">
                      {formatPrice(inv.capital)}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-emerald-600 whitespace-nowrap">
                      {formatPrice(inv.profitDistributed)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                      {inv.contact}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDistributingItem(inv);
                          setDistributionAmount("");
                          setError("");
                        }}
                        className="text-xs h-7 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {t("distribute_btn")}
                      </Button>
                      <button
                        onClick={() => handleDeleteInvestor(inv.id)}
                        disabled={deletingId === inv.id}
                        className="text-text-muted hover:text-red-600 transition-colors p-1 align-middle"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stakeholder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary-600" />
                {t("register_stakeholder_modal_title")}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddInvestor} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="inv-name">{t("inv_name_label")}</Label>
                <Input
                  id="inv-name"
                  placeholder={t("inv_name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-equity">{t("inv_equity_label")}</Label>
                <Input
                  id="inv-equity"
                  placeholder={t("inv_equity_placeholder")}
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-capital">{t("inv_capital_label")}</Label>
                <Input
                  id="inv-capital"
                  type="number"
                  placeholder={t("inv_capital_placeholder")}
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-contact">{t("inv_contact_label")}</Label>
                <Input
                  id="inv-contact"
                  placeholder={t("inv_contact_placeholder")}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  {t("cancel_btn")}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? t("saving_stakeholder_btn") : t("save_stakeholder_btn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Profit Distribution Modal */}
      {distributingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-600" />
                {t("record_distribution_modal_title")}
              </h3>
              <button
                onClick={() => setDistributingItem(null)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-surface-secondary rounded-xl border border-border text-xs space-y-1">
              <p className="font-bold text-text">{distributingItem.name}</p>
              <div className="flex justify-between text-text-secondary">
                <span>{t("equity_share_label")} {distributingItem.equity}</span>
                <span>{t("past_distributed_label")} {formatPrice(distributingItem.profitDistributed)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleDistributeProfit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="dist-amount">{t("distribution_amount_label")}</Label>
                <Input
                  id="dist-amount"
                  type="number"
                  placeholder={t("distribution_amount_placeholder")}
                  value={distributionAmount}
                  onChange={(e) => setDistributionAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDistributingItem(null)}
                >
                  {t("cancel_btn")}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? t("processing_btn") : t("record_payout_btn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
