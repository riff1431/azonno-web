"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { FinanceSubNav } from "@/components/admin/finance/finance-sub-nav";
import {
  saveAccount,
  deleteAccount,
  transferFunds,
  type AccountItem,
} from "@/features/finance/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

const ACCOUNT_TYPES = [
  "Asset (Bank)",
  "Asset (MFS)",
  "Asset (Cash)",
  "Asset (Receivable)",
  "Liability (Payable)",
  "Equity / Capital",
];

interface AccountingClientProps {
  initialAccounts: AccountItem[];
}

export function AccountingClient({ initialAccounts }: AccountingClientProps) {
  const { t: rawT } = useAdminLang();
  const t = (key: string) => (rawT as any)(key) || key;
  const [accounts, setAccounts] = useState<AccountItem[]>(initialAccounts);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Transfer Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState(initialAccounts[0]?.id || "");
  const [transferTo, setTransferTo] = useState(initialAccounts[1]?.id || "");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState(false);

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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      setTransferError("Please select different source and destination accounts.");
      return;
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      setTransferError("Please enter a valid transfer amount.");
      return;
    }

    setTransferLoading(true);
    setTransferError("");
    try {
      const res = await transferFunds({
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount: Number(transferAmount),
        notes: transferNote,
      });

      if (res.error) {
        setTransferError(res.error);
        return;
      }

      setAccounts(res.accounts);
      setTransferSuccess(true);
      setTimeout(() => {
        setTransferSuccess(false);
        setShowTransferModal(false);
        setTransferAmount("");
        setTransferNote("");
      }, 1200);
    } catch (err: any) {
      setTransferError(err.message || "Failed to execute transfer.");
    } finally {
      setTransferLoading(false);
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
    <div className="space-y-6 max-w-5xl">
      <FinanceSubNav />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("accounting_title")}</h1>
          <p className="text-xs text-text-secondary mt-0.5">{t("accounting_desc")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setTransferError("");
              setTransferSuccess(false);
              setShowTransferModal(true);
            }}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs gap-1.5 h-8 cursor-pointer"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary-600" />
            <span>Transfer Funds</span>
          </Button>

          <Button onClick={openAddModal} size="sm" className="shrink-0 text-xs gap-1.5 h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>{t("add_account_btn")}</span>
          </Button>
        </div>
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
          <span className="text-[11px] text-text-muted">
            {accounts.filter((a) => a.balance < 0).length} {t("payable_obligations_label")}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card space-y-2">
          <span className="text-xs text-text-muted font-medium">{t("net_liquid_capital_label")}</span>
          <p
            className={`text-2xl font-extrabold ${
              netWorth >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {formatPrice(netWorth)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">{t("verified_reconciliation_label")}</span>
        </div>
      </div>

      {/* Accounts List Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text">{t("all_accounts_subheading")}</h2>
          <span className="text-xs text-text-muted font-semibold">
            {accounts.length} {t("accounts_configured_label")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">{t("th_account_name")}</th>
                <th className="px-4 py-3">{t("th_type_category")}</th>
                <th className="px-4 py-3">{t("th_account_no")}</th>
                <th className="px-4 py-3 text-right">{t("th_balance")}</th>
                <th className="px-4 py-3 text-right">{t("th_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-surface-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-secondary text-primary-600">
                        <Landmark className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-text">{acc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.type.includes("Bank")
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : acc.type.includes("MFS")
                          ? "bg-teal-50/60 text-[#164E63] border border-teal-200"
                          : acc.type.includes("Cash")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : acc.type.includes("Receivable")
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {acc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted">{acc.accountNo}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold text-sm ${
                      acc.balance >= 0 ? "text-text" : "text-red-600"
                    }`}
                  >
                    {formatPrice(acc.balance)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1 text-text-muted hover:text-text rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
                      title={t("action_edit")}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      disabled={deletingId === acc.id}
                      className="p-1 text-text-muted hover:text-red-600 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
                      title={t("action_delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fund Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-[#1D6474]" />
                Internal Fund Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-text-muted hover:text-text cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {transferSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Fund transfer completed successfully! Balances updated.</span>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="space-y-4 text-xs">
                {transferError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{transferError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Source Account (Transfer From)</Label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:outline-none"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatPrice(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Destination Account (Transfer To)</Label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text focus:outline-none"
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatPrice(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Transfer Amount (৳)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Transfer Reference / Note (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Courier Remittance payout to Bank"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={transferLoading}>
                    {transferLoading ? "Processing..." : "Execute Transfer"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
                className="text-text-muted hover:text-text cursor-pointer"
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
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-balance">{t("acc_balance_label")}</Label>
                <Input
                  id="acc-balance"
                  type="number"
                  placeholder="e.g. 50000 (negative for liabilities)"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-no">{t("acc_no_label")}</Label>
                <Input
                  id="acc-no"
                  placeholder={t("acc_no_placeholder")}
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
                  {submitting ? t("saving_btn") : t("save_account_btn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
