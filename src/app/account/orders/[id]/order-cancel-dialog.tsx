"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, X, XCircle, CheckCircle2 } from "lucide-react";
import { cancelCustomerOrder } from "@/features/orders/actions";
import { Button } from "@/components/shared/ui/button";

interface OrderCancelDialogProps {
  orderId: string;
  orderNumber: string;
}

const CANCEL_REASONS = [
  "Changed my mind / Want to order something else",
  "Placed order by mistake or duplicate order",
  "Need to change shipping address or contact number",
  "Delivery time is longer than expected",
  "Found a better deal / price elsewhere",
  "Other reason",
];

export function OrderCancelDialog({ orderId, orderNumber }: OrderCancelDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const finalReason =
      selectedReason === "Other reason"
        ? customReason.trim() || "Customer specified other reason"
        : selectedReason;

    try {
      const res = await cancelCustomerOrder(orderId, finalReason);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        setSuccessMsg("Your order has been successfully cancelled. The reserved items have been restored to inventory.");
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(true);
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
      >
        <XCircle className="h-3.5 w-3.5 mr-1" />
        Cancel Order
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-4 text-zinc-900"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              onClick={() => !isSubmitting && setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 rounded-full p-1 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Cancel Order #{orderNumber}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you sure you want to cancel this order? This action will immediately release reserved products back to stock.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg ? (
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            ) : (
              <>
                {/* Reason Selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-zinc-700 block">
                    Please select a reason for cancellation:
                  </label>
                  <div className="space-y-1.5">
                    {CANCEL_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedReason === reason
                            ? "border-[#1D6474] bg-teal-50/60/50 text-zinc-900 font-semibold shadow-xs"
                            : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancel_reason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="h-3.5 w-3.5 text-[#1D6474] border-zinc-300 focus:ring-[#1D6474]"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === "Other reason" && (
                    <div className="pt-2">
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Please specify why you want to cancel..."
                        rows={3}
                        className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 focus:border-[#1D6474] focus:ring-1 focus:ring-[#1D6474] outline-hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-zinc-700 hover:bg-zinc-100"
                  >
                    Keep Order
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleCancel}
                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Confirm Cancellation"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
