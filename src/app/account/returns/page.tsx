"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import {
  type ReturnRequest,
  getCustomerReturns,
  submitCustomerReturnRequest,
} from "@/features/returns/actions";
import { formatPrice } from "@/lib/utils";
import { trackRefund, trackSubmitApplication } from "@/lib/analytics/datalayer";

export default function AccountReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [reason, setReason] = useState("Damaged product received");
  const [refundMethod, setRefundMethod] = useState("bkash");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    getCustomerReturns().then((data) => {
      setReturns(data);
      setLoading(false);
    });
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setErrorMsg("Please enter your Order Number (e.g. ORD-2026-XXXXXX)");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const res = await submitCustomerReturnRequest({
      order_number: orderNumber.trim(),
      reason,
      refund_method: refundMethod,
      customer_notes: comments.trim() || undefined,
    });

    if (res.error) {
      setErrorMsg(res.error);
      setSubmitting(false);
      return;
    }

    trackRefund({
      transaction_id: orderNumber.trim(),
      order_id: orderNumber.trim(),
      value: res.returnRequest?.refund_amount || 0,
    });
    trackSubmitApplication("return_exchange_request", orderNumber.trim());

    setSuccessMsg("Your return request has been registered! Our team will review within 24 hours.");
    setOrderNumber("");
    setComments("");
    setShowModal(false);
    setSubmitting(false);

    // Refresh list
    getCustomerReturns().then(setReturns);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const getStatusBadge = (status: ReturnRequest["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved (Return in Progress)
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Refunded
          </span>
        );
      case "item_received":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="h-3.5 w-3.5" /> Item Received in Warehouse
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" /> Request Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-[#e91e63]" /> Returns &amp; Exchanges
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage product returns, refund status, and replacement requests.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-bold rounded-xl self-start sm:self-auto shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Request New Return
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Return Policy Notice Strip */}
      <div className="rounded-2xl border border-pink-200 bg-pink-50/50 p-4 flex items-start gap-3 text-xs">
        <ShieldCheck className="h-5 w-5 text-[#e91e63] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-900">7-Day Hassle-Free Return Guarantee</p>
          <p className="text-gray-600 leading-relaxed">
            If you received a damaged product, incorrect shade, or defective item, you can request an exchange or 100% refund within 7 days of delivery.
          </p>
        </div>
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
        </div>
      ) : returns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-[#e91e63] mx-auto">
            <Package className="h-6 w-6 stroke-1" />
          </div>
          <h3 className="text-sm font-black text-gray-900">No Return Requests Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You currently have no active or completed return/exchange requests.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            variant="outline"
            className="rounded-xl text-xs font-bold"
          >
            Submit a Return Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div
              key={ret.id}
              className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-[#e91e63]">{ret.return_number}</span>
                  {ret.order?.order_number && (
                    <>
                      <span className="text-gray-400 text-xs mx-2">•</span>
                      <span className="text-xs font-bold text-gray-700">
                        Order: {ret.order.order_number}
                      </span>
                    </>
                  )}
                </div>
                {getStatusBadge(ret.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Reason for Return</span>
                  <span className="font-bold text-gray-900">{ret.reason}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Estimated Refund</span>
                  <span className="font-black text-pink-600">{formatPrice(ret.refund_amount)}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Submission Date</span>
                  <span className="font-medium text-gray-700">
                    {new Date(ret.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {ret.admin_notes && (
                <div className="rounded-2xl bg-pink-50/50 border border-pink-200 p-3.5 text-xs space-y-1.5">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Customer Care &amp; Pickup Update:
                  </span>
                  <p className="text-gray-700 leading-relaxed">{ret.admin_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Return Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-[#e91e63]" />
                <h3 className="font-black text-base text-gray-900">Request Return or Exchange</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Order Number (ORD-2026-XXXXXX) *</label>
                <Input
                  required
                  placeholder="ORD-2026-123456"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Primary Reason for Return *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
                >
                  <option value="Damaged product received">Damaged or leaking item in transit</option>
                  <option value="Wrong shade or product received">Wrong shade / variation received</option>
                  <option value="Allergic reaction or sensitivity">Skin sensitivity / allergy</option>
                  <option value="Defective pump / dropper">Defective dropper or packaging dispenser</option>
                  <option value="Expired or near-expiry batch">Near expiry date</option>
                  <option value="Changed mind (unopened)">Changed mind (sealed &amp; unopened)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Preferred Refund / Exchange Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
                >
                  <option value="bkash">bKash Mobile Wallet Refund</option>
                  <option value="nagad">Nagad Mobile Wallet Refund</option>
                  <option value="store_credit">Store Credit Voucher (+5% Bonus)</option>
                  <option value="item_exchange">Replacement / Product Exchange</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Details &amp; Wallet Number (Optional)</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide wallet phone number or extra context regarding the issue..."
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-black shadow-md"
                >
                  {submitting ? "Verifying..." : "Submit Return Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
