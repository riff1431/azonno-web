"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building,
  Banknote,
  Phone,
  Mail,
  User,
  AlertCircle,
  Filter,
  DollarSign,
  ArrowUpDown,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  type PaymentVerificationItem,
  verifyPaymentLiveWithGateway,
  manuallyMarkOrderPaymentVerified,
} from "@/features/payments/actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface PaymentLogsClientProps {
  initialItems: PaymentVerificationItem[];
  rawLogs: any[];
}

export function PaymentLogsClient({ initialItems, rawLogs }: PaymentLogsClientProps) {
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const [items, setItems] = useState<PaymentVerificationItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"verifications" | "rawLogs">("verifications");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Gateway Verification Modal state
  const [inspectItem, setInspectItem] = useState<PaymentVerificationItem | null>(null);
  const [customSearchTrx, setCustomSearchTrx] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Manual mark paid transition
  const [isPending, startTransition] = useTransition();
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items in memory for instantaneous feedback
  const filteredItems = items.filter((item) => {
    // 1. Search filter: customerName, customerPhone, customerEmail, orderNumber, trxId, paymentId, walletNumber
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.customerName?.toLowerCase().includes(q);
      const matchPhone = item.customerPhone?.toLowerCase().includes(q);
      const matchEmail = item.customerEmail?.toLowerCase().includes(q);
      const matchOrder = item.orderNumber?.toLowerCase().includes(q);
      const matchTrx = item.trxId?.toLowerCase().includes(q);
      const matchPaymentId = item.paymentId?.toLowerCase().includes(q);
      const matchWallet = item.walletNumber?.toLowerCase().includes(q);

      if (
        !matchName &&
        !matchPhone &&
        !matchEmail &&
        !matchOrder &&
        !matchTrx &&
        !matchPaymentId &&
        !matchWallet
      ) {
        return false;
      }
    }

    // 2. Provider filter
    if (providerFilter !== "ALL") {
      if (item.provider?.toUpperCase() !== providerFilter.toUpperCase()) {
        return false;
      }
    }

    // 3. Status filter
    if (statusFilter !== "ALL") {
      if (item.paymentStatus?.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
    }

    return true;
  });

  // KPI Calculations
  const totalVerifiedRevenue = items
    .filter((i) => i.paymentStatus === "paid")
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const pendingCount = items.filter((i) => i.paymentStatus === "pending").length;
  const bkashTransactions = items.filter((i) => i.provider === "BKASH");
  const bkashPaidCount = bkashTransactions.filter((i) => i.paymentStatus === "paid").length;

  // Perform Live Gateway Verification check
  const handleStartInspection = async (item: PaymentVerificationItem) => {
    setInspectItem(item);
    setVerifyResult(null);
    setVerifyError(null);
    setActionSuccessMsg(null);

    if (item.trxId || item.paymentId) {
      setVerifying(true);
      try {
        const res = await verifyPaymentLiveWithGateway({
          provider: item.provider,
          paymentId: item.paymentId,
          trxId: item.trxId,
          orderNumber: item.orderNumber,
        });
        if (res.success) {
          setVerifyResult(res);
        } else {
          setVerifyError(res.error || "Gateway returned no matching transaction record.");
        }
      } catch (err: any) {
        setVerifyError(err.message || "Failed to contact payment gateway.");
      } finally {
        setVerifying(false);
      }
    }
  };

  // On-demand standalone gateway inquiry by custom TrxID or PaymentID
  const handleCustomGatewayInquiry = async () => {
    if (!customSearchTrx.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const q = customSearchTrx.trim();
      const isPaymentId = q.startsWith("TR") || q.length > 20;
      const res = await verifyPaymentLiveWithGateway({
        provider: "BKASH",
        paymentId: isPaymentId ? q : undefined,
        trxId: !isPaymentId ? q : undefined,
      });
      if (res.success) {
        setVerifyResult(res);
      } else {
        setVerifyError(res.error || "Transaction not found on bKash Gateway.");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Gateway lookup failed.");
    } finally {
      setVerifying(false);
    }
  };

  // Mark order payment verified & sync status
  const handleConfirmMarkAsPaid = (orderId: string, trxIdToConfirm: string, amount: number) => {
    startTransition(async () => {
      const res = await manuallyMarkOrderPaymentVerified({
        orderId,
        verifiedTrxId: trxIdToConfirm || `MANUAL-${Date.now()}`,
        verifiedAmount: amount,
        note: `Verified by Admin on Payment Verification Dashboard`,
      });

      if (res.success) {
        setActionSuccessMsg(`Order marked as Paid successfully!`);
        setItems((prev) =>
          prev.map((it) =>
            it.orderId === orderId
              ? {
                  ...it,
                  paymentStatus: "paid",
                  orderStatus: "processing",
                  trxId: trxIdToConfirm || it.trxId,
                }
              : it
          )
        );
        setTimeout(() => {
          setInspectItem(null);
          setActionSuccessMsg(null);
        }, 1500);
      } else {
        alert(res.error || "Failed to update order payment status.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {isBn ? "পরিশোধিত মোট রাজস্ব" : "Total Paid Revenue"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">
            ৳{totalVerifiedRevenue.toLocaleString("en-BD")}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            {isBn
              ? `${items.filter((i) => i.paymentStatus === "paid").length} টি সম্পন্ন অর্ডারের মাধ্যমে`
              : `Across ${items.filter((i) => i.paymentStatus === "paid").length} completed orders`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {isBn ? "যাচাই অপেক্ষমাণ" : "Pending Verification"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
          <p className="mt-1 text-[11px] text-text-muted">
            {isBn ? "ম্যানুয়াল বা গেটওয়ে নিশ্চিতকরণের অপেক্ষায়" : "Awaiting manual or PGW confirmation"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {isBn ? "বিকাশ টোকেনাইজড" : "bKash Tokenized"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#e2136e]/10 text-[#e2136e] flex items-center justify-center border border-[#e2136e]/20">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">{bkashTransactions.length}</div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {isBn
              ? `${bkashPaidCount} টি সফলভাবে ভেরিফায়েড ও পেইড`
              : `${bkashPaidCount} verified & paid successfully`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              {isBn ? "অডিট ট্রেল রেকর্ড" : "Audit Trail Records"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-text">{rawLogs.length}</div>
          <p className="mt-1 text-[11px] text-text-muted">
            {isBn ? "ওয়েবহুক ও এপিআই ইভেন্ট সংরক্ষিত" : "Immutable webhook & API events logged"}
          </p>
        </div>
      </div>

      {/* Main View Toggle & Search Header */}
      <div className="rounded-2xl border border-border bg-white shadow-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("verifications")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "verifications"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-secondary text-text-muted hover:text-text"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {isBn ? "পেমেন্ট ভেরিফিকেশন ও অডিট" : "Payment Verifications & Audit"} ({filteredItems.length})
            </button>
            <button
              onClick={() => setActiveTab("rawLogs")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "rawLogs"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-secondary text-text-muted hover:text-text"
              }`}
            >
              <FileText className="h-4 w-4" />
              {isBn ? "গেটওয়ে ইভেন্ট লগ" : "Gateway Event Logs"} ({rawLogs.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setInspectItem({
                  id: "custom-query",
                  orderId: "",
                  orderNumber: "Direct Gateway Query",
                  customerName: "PGW Direct Search",
                  customerPhone: "",
                  customerEmail: "",
                  amount: 0,
                  provider: "BKASH",
                  paymentStatus: "pending",
                  orderStatus: "inspection",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setVerifyResult(null);
                setVerifyError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              {isBn ? "লাইভ বিকাশ পিজিডব্লিউ অনুসন্ধান" : "Live bKash PGW Query"}
            </button>
          </div>
        </div>

        {activeTab === "verifications" && (
          <>
            {/* Search & Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="relative md:col-span-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder={
                    isBn
                      ? "গ্রাহকের নাম, ফোন (০১...), ইমেইল, TrxID, PaymentID অথবা অর্ডার নম্বর দিয়ে খুঁজুন..."
                      : "Search by User Name, Phone (017...), Email, TrxID, PaymentID, or Order #..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface-secondary/40 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text font-bold"
                  >
                    {isBn ? "মুছুন" : "Clear"}
                  </button>
                )}
              </div>

              {/* Provider Filter */}
              <div className="md:col-span-3">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-secondary/40 text-xs text-text font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="ALL">{isBn ? "সকল গেটওয়ে ও মাধ্যম" : "All Gateways / Methods"}</option>
                  <option value="BKASH">{isBn ? "বিকাশ পেমেন্ট" : "bKash (Tokenized MFS)"}</option>
                  <option value="SSLCOMMERZ">{isBn ? "এসএসএলকমার্স" : "SSLCommerz (Cards/NetBanking)"}</option>
                  <option value="NAGAD">{isBn ? "নগদ পেমেন্ট" : "Nagad (Direct / MFS)"}</option>
                  <option value="COD">{isBn ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery (COD)"}</option>
                  <option value="STRIPE">Stripe</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-secondary/40 text-xs text-text font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="ALL">{isBn ? "সকল পেমেন্ট স্ট্যাটাস" : "All Payment Statuses"}</option>
                  <option value="PAID">{isBn ? "পরিশোধিত" : "Paid (Verified)"}</option>
                  <option value="PENDING">{isBn ? "যাচাই অপেক্ষমাণ" : "Pending Verification"}</option>
                  <option value="FAILED">{isBn ? "ব্যর্থ" : "Failed"}</option>
                  <option value="REFUNDED">{isBn ? "রিফান্ডেড" : "Refunded"}</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary/70 text-text-muted uppercase font-bold border-b border-border">
                    <tr>
                      <th className="px-4 py-3">{isBn ? "অর্ডারের বিবরণ" : "Order Details"}</th>
                      <th className="px-4 py-3">{isBn ? "গ্রাহক ও ব্যবহারকারী" : "Customer / User"}</th>
                      <th className="px-4 py-3">{isBn ? "পেমেন্ট মাধ্যম" : "Payment Method"}</th>
                      <th className="px-4 py-3">{isBn ? "ট্রানজেকশন আইডি" : "Transaction ID (TrxID)"}</th>
                      <th className="px-4 py-3">{isBn ? "টাকার পরিমাণ" : "Amount"}</th>
                      <th className="px-4 py-3">{isBn ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}</th>
                      <th className="px-4 py-3 text-right">{isBn ? "ভেরিফিকেশন অ্যাকশন" : "Verification Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-text-muted/60" />
                          <p className="font-semibold text-text">
                            {isBn
                              ? "অনুসন্ধানের সাথে মিলে এমন কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি"
                              : "No payment records found matching query"}
                          </p>
                          <p className="text-[11px] mt-1">
                            {isBn
                              ? "অনুগ্রহ করে ফিল্টার অথবা সার্চ কিওয়ার্ড পরিবর্তন করে চেষ্টা করুন।"
                              : "Try adjusting your search terms or gateway filter."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isBkash = item.provider === "BKASH";
                        const isPaid = item.paymentStatus === "paid";
                        const isPendingStatus = item.paymentStatus === "pending";

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-surface-secondary/40 transition-colors"
                          >
                            {/* Order Details */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/orders/${item.orderId}`}
                                  className="font-mono font-bold text-primary-600 hover:underline flex items-center gap-1"
                                >
                                  {item.orderNumber}
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </Link>
                              </div>
                              <div className="text-[11px] text-text-muted mt-0.5">
                                {new Date(item.createdAt).toLocaleString("en-BD", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted uppercase font-bold">
                                Order: {item.orderStatus}
                              </span>
                            </td>

                            {/* Customer / User */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-text flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-text-muted" />
                                {item.customerName}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-1">
                                <Phone className="h-3 w-3 text-text-muted" />
                                <a
                                  href={`tel:${item.customerPhone}`}
                                  className="font-mono hover:text-primary-600 hover:underline"
                                >
                                  {item.customerPhone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.customerPhone, `phone-${item.id}`)}
                                  className="text-text-muted hover:text-text p-0.5 rounded"
                                  title="Copy phone number"
                                >
                                  {copiedId === `phone-${item.id}` ? (
                                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5" />
                                  )}
                                </button>
                              </div>
                              {item.customerEmail && item.customerEmail !== "N/A" && (
                                <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5 truncate max-w-45">
                                  <Mail className="h-3 w-3 text-text-muted" />
                                  <span className="truncate">{item.customerEmail}</span>
                                </div>
                              )}
                            </td>

                            {/* Provider */}
                            <td className="px-4 py-3.5">
                              {isBkash ? (
                                <div className="inline-flex flex-col">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#e2136e]/10 text-[#e2136e] border border-[#e2136e]/20">
                                    <Smartphone className="h-3.5 w-3.5" />
                                    bKash Tokenized
                                  </span>
                                  <span className="text-[10px] text-text-muted mt-0.5">PGW v1.2.0</span>
                                </div>
                              ) : item.provider === "SSLCOMMERZ" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  SSLCommerz
                                </span>
                              ) : item.provider === "NAGAD" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                  <Smartphone className="h-3.5 w-3.5" />
                                  Nagad MFS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                  <Banknote className="h-3.5 w-3.5" />
                                  {item.provider}
                                </span>
                              )}
                            </td>

                            {/* TrxID & PaymentID */}
                            <td className="px-4 py-3.5">
                              {item.trxId ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 font-mono font-bold text-xs text-text bg-surface-secondary/70 px-2 py-0.5 rounded border border-border max-w-fit">
                                    <span>{item.trxId}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(item.trxId!, `trx-${item.id}`)}
                                      className="text-text-muted hover:text-text p-0.5 ml-1"
                                      title="Copy TrxID"
                                    >
                                      {copiedId === `trx-${item.id}` ? (
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  {item.paymentId && (
                                    <div className="text-[10px] font-mono text-text-muted truncate max-w-42.5">
                                      ID: {item.paymentId}
                                    </div>
                                  )}
                                  {item.walletNumber && (
                                    <div className="text-[10px] text-text-muted">
                                      Wallet: {item.walletNumber}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-muted font-mono text-[11px]">
                                  {item.provider === "COD" ? "Cash on Delivery" : "Not Provided"}
                                </span>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-sm text-text">
                                ৳{item.amount.toLocaleString("en-BD")}
                              </div>
                              <span className="text-[10px] text-text-muted">BDT</span>
                            </td>

                            {/* Payment Status */}
                            <td className="px-4 py-3.5">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  PAID
                                </span>
                              ) : isPendingStatus ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                  <Clock className="h-3 w-3" />
                                  PENDING
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                  <XCircle className="h-3 w-3" />
                                  {item.paymentStatus.toUpperCase()}
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartInspection(item)}
                                  className="text-xs h-7 px-2.5 font-semibold text-primary-700 border-primary-200 hover:bg-primary-50"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-primary-600" />
                                  Verify
                                </Button>

                                {isPendingStatus && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleConfirmMarkAsPaid(item.orderId, item.trxId || "", item.amount)
                                    }
                                    disabled={isPending}
                                    className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                  >
                                    Mark Paid
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Raw Integration Event Logs */}
        {activeTab === "rawLogs" && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-3 bg-surface-secondary/50 border-b border-border text-xs text-text-muted flex items-center justify-between">
              <span>Chronological Webhook & API Execution Trail</span>
              <span>Showing {rawLogs.length} Events</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/70 text-text-muted uppercase font-bold border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  {rawLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-surface-secondary/40 font-sans">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-text">{log.provider}</td>
                      <td className="px-4 py-3 font-mono text-primary-600">{log.event}</td>
                      <td className="px-4 py-3">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <XCircle className="h-3 w-3" />
                            ERROR
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-md truncate">
                        {log.message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Live Gateway Verification & Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-border overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">
                    Live Gateway Payment Verification
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Direct API double-check against gateway server
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="h-8 w-8 rounded-lg text-text-muted hover:text-text hover:bg-surface-secondary flex items-center justify-center font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Order and Customer Summary */}
              {inspectItem.orderId && (
                <div className="rounded-xl border border-border bg-surface-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted">Order</span>
                      <div className="font-mono font-bold text-text">{inspectItem.orderNumber}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-text-muted">Payable Amount</span>
                      <div className="text-sm font-bold text-emerald-600">
                        ৳{inspectItem.amount.toLocaleString("en-BD")}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">Customer Name:</span>
                      <p className="font-semibold text-text">{inspectItem.customerName}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Phone Number:</span>
                      <p className="font-mono font-semibold text-text">{inspectItem.customerPhone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Trx Search Input if inspecting custom or need to change query */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center justify-between">
                  <span>bKash Transaction ID (TrxID) or Payment ID</span>
                  <span className="text-[10px] text-primary-600 font-semibold">Live PGW Query</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter TrxID (e.g. BKH12345678) or PaymentID (TR...)"
                    defaultValue={inspectItem.trxId || inspectItem.paymentId || ""}
                    onChange={(e) => setCustomSearchTrx(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface-secondary/40 text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomGatewayInquiry}
                    disabled={verifying}
                    className="text-xs shrink-0"
                  >
                    {verifying ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Query Gateway"
                    )}
                  </Button>
                </div>
              </div>

              {/* Gateway Response Section */}
              {verifying && (
                <div className="rounded-xl border border-border p-6 text-center space-y-2 bg-surface-secondary/20">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary-600" />
                  <p className="text-xs font-semibold text-text">Contacting Payment Gateway API...</p>
                  <p className="text-[11px] text-text-muted">
                    Verifying transaction authenticity with official PGW servers
                  </p>
                </div>
              )}

              {verifyError && !verifying && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    Gateway Verification Result: Not Verified
                  </div>
                  <p className="text-[11px] text-red-700 leading-relaxed">{verifyError}</p>
                </div>
              )}

              {verifyResult && !verifying && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Gateway Authenticated
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {verifyResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-text-muted text-[11px]">Verified TrxID:</span>
                      <p className="font-mono font-bold text-text">
                        {verifyResult.trxID || inspectItem.trxId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px]">Gateway Amount:</span>
                      <p className="font-bold text-emerald-700">
                        ৳{verifyResult.amount || inspectItem.amount} {verifyResult.currency || "BDT"}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px]">Customer Wallet (MSISDN):</span>
                      <p className="font-mono font-semibold text-text">
                        {verifyResult.customerMsisdn || inspectItem.customerPhone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted text-[11px]">Payment Gateway:</span>
                      <p className="font-semibold text-text">{verifyResult.gateway}</p>
                    </div>
                  </div>

                  {verifyResult.date && (
                    <div className="text-[11px] text-text-muted pt-1 border-t border-emerald-200">
                      Execution Time: {new Date(verifyResult.date).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {actionSuccessMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-100 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {actionSuccessMsg}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-secondary/30 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectItem(null)}
                className="text-xs"
              >
                Close
              </Button>

              {inspectItem.orderId && inspectItem.paymentStatus !== "paid" && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleConfirmMarkAsPaid(
                      inspectItem.orderId,
                      verifyResult?.trxID || inspectItem.trxId || "",
                      inspectItem.amount
                    )
                  }
                  disabled={isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Sync & Mark Order as Paid
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
