"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Ban,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Copy,
  Check,
  Search,
  Filter,
  Users,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/data-table";
import { formatPrice } from "@/lib/utils";
import {
  adminSetCustomerPassword,
  adminBlockCustomer,
  adminUnblockCustomer,
  type AdminCustomer,
} from "./actions";
import { BDCourierBadge } from "@/features/fraud/bdcourier-badge";

interface CustomerListClientProps {
  initialCustomers: AdminCustomer[];
}

export function CustomerListClient({ initialCustomers }: CustomerListClientProps) {
  const [customers, setCustomers] = useState<AdminCustomer[]>(initialCustomers);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast / notification state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [passwordModalCustomer, setPasswordModalCustomer] = useState<AdminCustomer | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [blockModalCustomer, setBlockModalCustomer] = useState<AdminCustomer | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  const [unblockModalCustomer, setUnblockModalCustomer] = useState<AdminCustomer | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPassword(true);
    setPasswordError(null);
  };

  // Submit new password
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalCustomer) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    setIsSettingPassword(true);
    setPasswordError(null);

    const res = await adminSetCustomerPassword(passwordModalCustomer.id, newPassword);

    if (res.success) {
      showToast(`Password for ${passwordModalCustomer.full_name || passwordModalCustomer.email} updated successfully!`);
      setPasswordModalCustomer(null);
      setNewPassword("");
      setShowPassword(false);
    } else {
      setPasswordError(res.error || "Failed to update password.");
    }
    setIsSettingPassword(false);
  };

  // Submit Block Customer
  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockModalCustomer) return;

    setIsBlocking(true);

    const res = await adminBlockCustomer(blockModalCustomer.id, blockReason);

    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === blockModalCustomer.id
            ? {
                ...c,
                status: "blocked" as const,
                is_blocked: true,
                blacklist_reason: blockReason.trim() || "Customer blocked by Admin from Customer Directory",
              }
            : c
        )
      );
      showToast(`Customer blocked and added to Fraud Blacklist!`);
      setBlockModalCustomer(null);
      setBlockReason("");
    } else {
      showToast(res.error || "Failed to block customer.", "error");
    }
    setIsBlocking(false);
  };

  // Submit Unblock Customer
  const handleUnblockSubmit = async () => {
    if (!unblockModalCustomer) return;

    setIsUnblocking(true);

    const res = await adminUnblockCustomer(unblockModalCustomer.id);

    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === unblockModalCustomer.id
            ? {
                ...c,
                status: "active" as const,
                is_blocked: false,
                blacklist_reason: undefined,
              }
            : c
        )
      );
      showToast(`Customer unblocked and removed from Fraud Blacklist!`);
      setUnblockModalCustomer(null);
    } else {
      showToast(res.error || "Failed to unblock customer.", "error");
    }
    setIsUnblocking(false);
  };

  // Filtered dataset
  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === "active") return !c.is_blocked;
    if (statusFilter === "blocked") return c.is_blocked;
    return true;
  });

  // Calculate Metrics
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => !c.is_blocked).length;
  const blockedCount = customers.filter((c) => c.is_blocked).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  const columns: Column<AdminCustomer>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black text-xs uppercase shadow-xs ${
              row.is_blocked
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-primary-50 text-primary-700 border border-primary-100"
            }`}
          >
            {row.full_name ? row.full_name.charAt(0) : row.email ? row.email.charAt(0) : "C"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text text-xs truncate max-w-[180px]">
                {row.full_name || "Unnamed Customer"}
              </span>
              {row.is_blocked && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700">
                  BLOCKED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
              <Mail className="h-3 w-3 shrink-0 text-text-muted" />
              <span className="truncate max-w-[170px]">{row.email || "No Email"}</span>
              {row.email && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(row.email, `email-${row.id}`)}
                  className="text-text-muted hover:text-text opacity-70 hover:opacity-100"
                  title="Copy email"
                >
                  {copiedId === `email-${row.id}` ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span className="font-mono text-xs text-text font-medium">{row.phone || "—"}</span>
            {row.phone && (
              <button
                type="button"
                onClick={() => copyToClipboard(row.phone || "", `phone-${row.id}`)}
                className="text-text-muted hover:text-text opacity-70 hover:opacity-100"
                title="Copy phone"
              >
                {copiedId === `phone-${row.id}` ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
          {row.phone && (
            <div>
              <BDCourierBadge phone={row.phone} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <div>
          {row.is_blocked ? (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                <ShieldAlert className="h-3 w-3 text-red-600" /> Fraud Blocked
              </span>
              {row.blacklist_reason && (
                <span className="text-[10px] text-red-600 max-w-[160px] truncate" title={row.blacklist_reason}>
                  {row.blacklist_reason}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Active
            </span>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
            row.role === "admin"
              ? "bg-primary-50 text-primary-700 border-primary-200"
              : "bg-zinc-100 text-zinc-600 border-zinc-200"
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-bold text-text">
          {row.order_count} {row.order_count === 1 ? "order" : "orders"}
        </span>
      ),
    },
    {
      key: "spent",
      header: "Total Spent",
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-black text-primary-700">
          {formatPrice(row.total_spent)}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Registered",
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-text-muted">
          {new Date(row.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Controls",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {/* Set Password Action */}
          <button
            type="button"
            onClick={() => {
              setPasswordModalCustomer(row);
              setNewPassword("");
              setShowPassword(false);
              setPasswordError(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-zinc-300 transition-all shadow-xs"
            title="Set New Password for Customer"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
            <span>Set Password</span>
          </button>

          {/* Block / Unblock Action */}
          {row.is_blocked ? (
            <button
              type="button"
              onClick={() => setUnblockModalCustomer(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs"
              title="Unblock Customer & Remove from Blacklist"
            >
              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Unblock</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setBlockModalCustomer(row);
                setBlockReason("Blocked by Admin from Customer Directory");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all shadow-xs"
              title="Block Customer & Push to Fraud Blacklist"
            >
              <Ban className="h-3.5 w-3.5 text-red-600" />
              <span>Block</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : "bg-red-950 text-red-100 border-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-60 hover:opacity-100 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-600" />
            <h1 className="text-xl sm:text-2xl font-black text-text">Customer Directory & Security</h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Manage customer accounts, update passwords directly, and enforce automatic Fraud Blacklist order blocking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders/fraud"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-all shadow-xs"
          >
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span>Fraud Engine Hub</span>
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Customers</span>
            <div className="p-2 bg-zinc-100 text-zinc-600 rounded-xl">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-text mt-2">{totalCount}</div>
          <p className="text-[11px] text-text-muted mt-1">Registered customer profiles</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Accounts</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{activeCount}</div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Able to place orders seamlessly</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Fraud Blocked</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-700 mt-2">{blockedCount}</div>
          <p className="text-[11px] text-red-600/80 mt-1">Auto-restricted on checkout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">Customer Spend</span>
            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary-700 mt-2">{formatPrice(totalRevenue)}</div>
          <p className="text-[11px] text-primary-600/80 mt-1">Total lifetime customer revenue</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "all"
              ? "bg-text text-white shadow-xs"
              : "bg-white text-text-secondary hover:bg-zinc-100 border border-border"
          }`}
        >
          All Customers ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "active"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("blocked")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "blocked"
              ? "bg-red-700 text-white shadow-xs"
              : "bg-white text-red-700 hover:bg-red-50 border border-red-200"
          }`}
        >
          Blocked & Fraud Blacklisted ({blockedCount})
        </button>
      </div>

      {/* Customers Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        searchKey="full_name"
        searchPlaceholder="Search by customer name, email or phone..."
        emptyMessage={
          statusFilter === "blocked"
            ? "No customers are currently blocked."
            : "No customer accounts found."
        }
      />

      {/* Modal 1: Set New Password Modal */}
      {passwordModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-border shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text">Set New Password</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Directly override customer account password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalCustomer(null)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Customer Summary Card */}
            <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 space-y-1">
              <div className="text-xs font-bold text-text">
                {passwordModalCustomer.full_name || "Customer Account"}
              </div>
              <div className="text-[11px] text-text-secondary flex items-center gap-2">
                <span>{passwordModalCustomer.email || "No email"}</span>
                {passwordModalCustomer.phone && <span>• {passwordModalCustomer.phone}</span>}
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full h-11 pl-3.5 pr-20 rounded-xl border border-border bg-zinc-50/50 focus:bg-white focus:border-primary-600 focus:outline-none text-xs font-mono transition-colors"
                    required
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generate Secure Password
                </button>
                <span className="text-[11px] text-text-muted">Min 6 characters</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPasswordModalCustomer(null)}
                  disabled={isSettingPassword}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:bg-zinc-100 border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingPassword || !newPassword || newPassword.length < 6}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-sm disabled:opacity-50"
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Block Customer & Add to Fraud Blacklist Modal */}
      {blockModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-red-700 rounded-2xl border border-red-200">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-red-950">Block Customer</h3>
                  <p className="text-xs text-red-600 mt-0.5">
                    Restrict account & auto-add to Fraud Blacklist
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockModalCustomer(null)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Warning Callout */}
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-red-800">
                <Ban className="h-4 w-4 shrink-0 text-red-600" />
                <span>Automatic Fraud Blacklist Enforcement</span>
              </div>
              <p className="leading-relaxed text-[11px] text-red-700">
                When you block this customer, their mobile number (
                <strong className="font-mono font-bold text-red-900">
                  {blockModalCustomer.phone || "N/A"}
                </strong>
                ) and email address (
                <strong className="font-mono font-bold text-red-900">
                  {blockModalCustomer.email}
                </strong>
                ) will immediately be placed into the <strong>Fraud Blacklist</strong>. They will not be able to place any future orders on the store.
              </p>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Block Reason / Notes
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Doorstep refusal, fake contact information, repeated COD return abuse"
                  rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-zinc-50/50 focus:bg-white focus:border-red-600 focus:outline-none text-xs transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setBlockModalCustomer(null)}
                  disabled={isBlocking}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:bg-zinc-100 border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBlocking}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm disabled:opacity-50"
                >
                  {isBlocking ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Blocking...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      <span>Confirm Block & Blacklist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Unblock Customer Modal */}
      {unblockModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-950">Unblock Customer</h3>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Restore account & remove from Fraud Blacklist
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnblockModalCustomer(null)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Restore Storefront Ordering</span>
              </div>
              <p className="leading-relaxed text-[11px] text-emerald-700">
                This will unblock{" "}
                <strong className="font-bold text-emerald-900">
                  {unblockModalCustomer.full_name || unblockModalCustomer.email}
                </strong>{" "}
                and automatically remove their phone number ({unblockModalCustomer.phone || "N/A"}) and email from the Fraud Blacklist, allowing them to place orders normally again.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setUnblockModalCustomer(null)}
                disabled={isUnblocking}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:bg-zinc-100 border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnblockSubmit}
                disabled={isUnblocking}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50"
              >
                {isUnblocking ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Unblocking...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Confirm Unblock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
