"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Landmark, ArrowDownRight, ArrowUpRight, Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { saveAccount, deleteAccount, type AccountItem } from "@/features/finance/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

const ACCOUNT_TYPES = [
  "Asset (Bank)",
  "Asset (MFS)",
  "Asset (Receivable)",
  "Liability (Payable)",
  "Equity / Capital",
];

interface AccountingClientProps {
  initialAccounts: AccountItem[];
}

export function AccountingClient({ initialAccounts }: AccountingClientProps) {
  const { t } = useAdminLang();
  const [accounts, setAccounts] = useState<AccountItem[]>(initialAccounts);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState(ACCOUNT_TYPES[0]);
  const [balance, setBalance] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [error, setError] = useState("");

  const totalAssets = accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = Math.abs(
    accounts
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + a.balance, 0)
  );

  const netWorth = totalAssets - totalLiabilities;

  const openAddModal = () => {
    setEditingAccount(null);
    setName("");
    setType(ACCOUNT_TYPES[0]);
    setBalance("");
    setAccountNo("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (acc: AccountItem) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(String(acc.balance));
    setAccountNo(acc.accountNo);
    setError("");
    setShowModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("err_enter_account_name"));
      return;
    }
    if (balance === "" || isNaN(Number(balance))) {
      setError(t("err_enter_valid_balance"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await saveAccount({
        id: editingAccount?.id,
        name,
        type,
        balance: Number(balance),
        accountNo: accountNo || "N/A",
      });
      setAccounts(updated);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || t("err_failed_save_account"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm(t("confirm_delete_account"))) return;
    setDeletingId(id);
    try {
      const updated = await deleteAccount(id);
      setAccounts(updated);
    } catch (err: any) {
      alert(t("err_failed_delete_account") + ": " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("accounting_title")}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t("accounting_desc")}</p>
        </div>

        <Button onClick={openAddModal} size="sm" className="shrink-0 text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("add_account_btn")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("total_liquid_assets_label")}</span>
          <p className="text-2xl font-extrabold text-text">{formatPrice(totalAssets)}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
            <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
            {accounts.filter((a) => a.balance > 0).length} {t("active_asset_accounts_label")}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("outstanding_payables_label")}</span>
          <p className="text-2xl font-extrabold text-red-600">-{formatPrice(totalLiabilities)}</p>
          <span className="text-[11px] text-text-muted">{t("supplier_procurement_label")}</span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("net_working_capital_label")}</span>
          <p className={`text-2xl font-extrabold ${netWorth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatPrice(netWorth)}
          </p>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${
              netWorth >= 0
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-red-700 bg-red-50 border-red-200"
            }`}
          >
            {netWorth >= 0 ? t("positive_cash_flow_label") : t("working_capital_deficit_label")}
          </span>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text">{t("account_balances_ledger_title")}</h2>
          <span className="text-xs text-text-muted">{accounts.length} {t("ledger_records_label")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">{t("col_account_entity")}</th>
                <th className="px-4 py-3">{t("col_classification")}</th>
                <th className="px-4 py-3">{t("col_account_ref")}</th>
                <th className="px-4 py-3 text-right">{t("col_current_balance")}</th>
                <th className="px-4 py-3 text-right">{t("column_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-xs">
                    {t("no_accounts_yet")}
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary-600 shrink-0" />
                      {acc.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          acc.type.includes("Liability") || acc.balance < 0
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-[11px]">
                      {acc.accountNo}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-extrabold text-sm whitespace-nowrap ${
                        acc.balance >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {acc.balance >= 0 ? formatPrice(acc.balance) : `-${formatPrice(Math.abs(acc.balance))}`}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="text-text-muted hover:text-primary-600 transition-colors p-1"
                        title={t("edit_account_modal_title")}
                      >
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        disabled={deletingId === acc.id}
                        className="text-text-muted hover:text-red-600 transition-colors p-1"
                        title={t("column_actions")}
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

      {/* Add / Edit Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary-600" />
                {editingAccount ? t("edit_account_modal_title") : t("add_account_modal_title")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="acc-name">{t("acc_name_label")}</Label>
                <Input
                  id="acc-name"
                  placeholder={t("acc_name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-type">{t("acc_type_label")}</Label>
                <select
                  id="acc-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:border-primary-500 focus:outline-none"
                >
                  {ACCOUNT_TYPES.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-balance">{t("acc_balance_label")}</Label>
                <Input
                  id="acc-balance"
                  type="number"
                  placeholder={t("acc_balance_placeholder")}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                />
                <p className="text-[10px] text-text-muted">{t("acc_balance_hint")}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-no">{t("acc_number_label")}</Label>
                <Input
                  id="acc-no"
                  placeholder={t("acc_number_placeholder")}
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  {t("cancel_btn")}
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? t("saving_account_btn") : t("save_account_btn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
