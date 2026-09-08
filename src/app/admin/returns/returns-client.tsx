"use client";

import { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Eye,
  Filter,
  Search,
  Check,
  Ban,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  X,
  Truck,
  Send,
  Loader2,
  Copy,
  Sparkles,
  Settings,
  Save,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { buildCourierTrackingUrl } from "@/lib/utils";
import { ModuleHeader } from "@/components/admin/module-settings/module-header";
import {
  updateReturnStatus,
  dispatchReverseCourierPickup,
  type ReturnRequest,
} from "@/features/returns/actions";
import {
  type StoreFeatureSettings,
  updateStoreFeatureSettings,
} from "@/features/settings/feature-settings-actions";
import Link from "next/link";
import { useAdminLang } from "@/lib/admin-lang-context";
import { BDCourierBadge } from "@/features/fraud/bdcourier-badge";

interface ReturnsClientProps {
  initialReturns: ReturnRequest[];
  initialSettings?: StoreFeatureSettings;
}

export function ReturnsClient({ initialReturns, initialSettings }: ReturnsClientProps) {
  const { t } = useAdminLang();
  const [returnsList, setReturnsList] = useState<ReturnRequest[]>(initialReturns);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Policy Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<Partial<StoreFeatureSettings>>({
    enable_return_portal: initialSettings?.enable_return_portal ?? true,
    return_window_days: initialSettings?.return_window_days ?? 7,
    enable_reverse_courier_booking: initialSettings?.enable_reverse_courier_booking ?? true,
    default_return_warehouse_address:
      initialSettings?.default_return_warehouse_address ||
      "Blush & Budget Fulfilment Hub, House 14, Road 11, Block D, Banani, Dhaka-1213",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Reverse Courier Dispatch State
  const [reverseModalReturn, setReverseModalReturn] = useState<ReturnRequest | null>(null);
  const [reverseCourier, setReverseCourier] = useState<"steadfast" | "pathao">("steadfast");
  const [reversePickupPhone, setReversePickupPhone] = useState("");
  const [reversePickupAddress, setReversePickupAddress] = useState("");
  const [dispatchingReverse, setDispatchingReverse] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<{ text: string; isError?: boolean } | null>(null);


  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateStoreFeatureSettings(settings);
      setBannerFeedback({ text: "Return policy and reverse courier settings updated successfully!" });
      setShowSettingsModal(false);
      setTimeout(() => setBannerFeedback(null), 5000);
    } catch (err: any) {
      setBannerFeedback({ text: err.message || "Failed to save settings", isError: true });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: ReturnRequest["status"]) => {
    setUpdatingId(id);
    try {
      await updateReturnStatus(id, newStatus, adminNoteInput || undefined);
      setReturnsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus, admin_notes: adminNoteInput || r.admin_notes } : r))
      );
      if (selectedReturn?.id === id) {
        setSelectedReturn((prev) => (prev ? { ...prev, status: newStatus, admin_notes: adminNoteInput || prev.admin_notes } : null));
      }
    } finally {
      setUpdatingId(null);
    }
  };


  const handleOpenReverseModal = (item: ReturnRequest) => {
    setReverseModalReturn(item);
    setReverseCourier("steadfast");
    setReversePickupPhone(item.customer?.phone || item.order?.customer_phone || "");
    setReversePickupAddress(item.order?.shipping_address_snapshot?.address || "");
  };

  const handleDispatchReverse = async () => {
    if (!reverseModalReturn) return;
    setDispatchingReverse(true);
    setBannerFeedback(null);

    try {
      const res = await dispatchReverseCourierPickup({
        returnId: reverseModalReturn.id,
        courierCode: reverseCourier,
        pickupPhone: reversePickupPhone,
        pickupAddress: reversePickupAddress,
      });

      if (res.success) {
        setReturnsList((prev) =>
          prev.map((r) =>
            r.id === reverseModalReturn.id
              ? {
                  ...r,
                  status: "approved",
                  reverse_consignment_id: res.consignmentId,
                  reverse_courier_name: res.courierName,
                  reverse_tracking_url: res.trackingUrl,
                  admin_notes: res.adminNote,
                }
              : r
          )
        );
        setBannerFeedback({
          text: `Successfully booked reverse pickup via ${res.courierName}! Consignment: ${res.consignmentId}`,
        });
        setReverseModalReturn(null);
        setTimeout(() => setBannerFeedback(null), 5000);
      } else {
        setBannerFeedback({ text: res.error || "Failed to book reverse pickup", isError: true });
      }
    } catch (err: any) {
      setBannerFeedback({ text: err.message || "Reverse dispatch error", isError: true });
    } finally {
      setDispatchingReverse(false);
    }
  };

  const handleOpenWhatsAppReturn = (item: ReturnRequest) => {
    const phone = item.customer?.phone || item.order?.customer_phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const intlPhone = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
    const name = item.customer?.full_name || "Customer";
    const msg = `আসসালামু আলাইকুম ${name}! Blush & Budget থেকে আপনার রিটার্ন রিকোয়েস্ট (${item.return_number}) রিসিভ করা হয়েছে। অর্ডার: #${item.order?.order_number || ""}. আমরা পার্সেলটি পিকআপ ও রিফান্ড প্রসেস করার জন্য আপনাকে সহায়তা করছি।`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filteredReturns = returnsList.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      r.return_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customer?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.order?.order_number || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ReturnRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> {t("return_status_pending")}
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3 w-3" /> {t("return_status_approved")}
          </span>
        );
      case "item_received":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
            <Package className="h-3 w-3" /> {t("returned_stock")}
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Check className="h-3 w-3" /> {t("column_refund")}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" /> {t("return_status_rejected")}
          </span>
        );
    }
  };

  const pendingCount = returnsList.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ModuleHeader
          title={t("return_management")}
          description={t("return_desc")}
          icon={RotateCcw}
          badgeLabel={`${pendingCount} ${t("filter_pending")}`}
        />
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="gap-2 text-xs font-bold border-border hover:border-[#e91e63] hover:text-[#e91e63] bg-white rounded-xl shadow-xs py-2.5 px-4 h-auto"
          >
            <Settings className="h-4 w-4" />
            {t("return_policy")}
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerFeedback && (
        <div
          className={`rounded-2xl border p-4 text-xs font-bold flex justify-between items-center ${
            bannerFeedback.isError
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          } animate-in fade-in-0`}
        >
          <span>{bannerFeedback.text}</span>
          <button onClick={() => setBannerFeedback(null)} className="opacity-60 hover:opacity-100 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-text-muted">Total Requests</span>
          <p className="text-2xl font-extrabold text-text mt-1">{returnsList.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-amber-600">Pending Review</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-blue-600">Approved for Pickup</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {returnsList.filter((r) => r.status === "approved" || r.status === "item_received").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-emerald-600">Successfully Refunded</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {returnsList.filter((r) => r.status === "refunded").length}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-card">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by RMA #, Order #, or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-secondary/50 pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Returns" },
            { id: "pending", label: "Pending" },
            { id: "approved", label: "Approved" },
            { id: "item_received", label: "Received" },
            { id: "refunded", label: "Refunded" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Table / Grid */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text">
            <thead className="bg-surface-secondary/60 text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
              <tr>
                <th className="px-5 py-3.5">RMA # &amp; Date</th>
                <th className="px-5 py-3.5">Order &amp; Customer</th>
                <th className="px-5 py-3.5">Reason for Return</th>
                <th className="px-5 py-3.5">Refund Method &amp; Amount</th>
                <th className="px-5 py-3.5">Status &amp; Courier</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReturns.map((item) => (
                <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-primary-600">{item.return_number}</span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-text">{item.customer?.full_name || "Customer"}</div>
                    <p className="text-[11px] text-text-muted font-mono">{item.order?.order_number}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <p className="text-[11px] text-text-secondary">{item.customer?.phone}</p>
                      {item.customer?.phone && <BDCourierBadge phone={item.customer.phone} />}
                    </div>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="line-clamp-2 text-text font-medium">{item.reason}</p>
                    {item.customer_notes && (
                      <p className="text-[11px] text-text-muted italic mt-0.5">"{item.customer_notes}"</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-text">৳{item.refund_amount.toLocaleString()}</span>
                    <p className="text-[10px] font-semibold uppercase text-text-muted tracking-wider mt-0.5">
                      {item.refund_method}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div>{getStatusBadge(item.status)}</div>
                    {item.reverse_consignment_id && (
                      <a
                        href={buildCourierTrackingUrl(item.reverse_courier_name, item.reverse_consignment_id, item.reverse_tracking_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold hover:underline"
                      >
                        <Truck className="h-3 w-3 text-emerald-600" />
                        <span>{item.reverse_consignment_id}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 1-Click Reverse Courier Pickup Dispatch Button */}
                      {!item.reverse_consignment_id && item.status !== "refunded" && item.status !== "rejected" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReverseModal(item)}
                          className="text-xs h-7 px-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl"
                          title="1-Click Reverse Courier Pickup"
                        >
                          <Truck className="h-3 w-3 mr-1 text-pink-400" />
                          Book Reverse Pickup
                        </Button>
                      )}

                      {/* WhatsApp Coordinator */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenWhatsAppReturn(item)}
                        className="text-xs h-7 px-2.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                        title="Chat on WhatsApp with Return Details"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(item);
                          setAdminNoteInput(item.admin_notes || "");
                        }}
                        className="text-xs h-7 px-2.5 rounded-xl"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Inspect
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReturns.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <RotateCcw className="h-8 w-8 text-text-muted mx-auto" />
            <h3 className="text-sm font-bold text-text">No return requests found</h3>
            <p className="text-xs text-text-secondary">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>

      {/* Inspect / Modal Drawer */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                  Return RMA Inspection
                </span>
                <h2 className="text-lg font-bold text-text">{selectedReturn.return_number}</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Order: <span className="font-mono font-bold">{selectedReturn.order?.order_number}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-text-muted hover:text-text p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-text-muted">Customer Name:</span>
                <p className="font-bold text-text">{selectedReturn.customer?.full_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Contact Phone:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-text">{selectedReturn.customer?.phone}</p>
                  {selectedReturn.customer?.phone && <BDCourierBadge phone={selectedReturn.customer.phone} />}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Refund Amount:</span>
                <p className="font-bold text-text text-sm">৳{selectedReturn.refund_amount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Refund Method:</span>
                <p className="font-bold uppercase text-text">{selectedReturn.refund_method}</p>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-surface-secondary/50 rounded-2xl p-4 border border-border space-y-2 text-xs">
              <span className="font-bold text-text">Return Reason:</span>
              <p className="text-text-secondary leading-relaxed">{selectedReturn.reason}</p>
              {selectedReturn.customer_notes && (
                <div className="pt-2 border-t border-border">
                  <span className="text-text-muted font-semibold">Customer Note:</span>
                  <p className="text-text italic">{selectedReturn.customer_notes}</p>
                </div>
              )}
            </div>

            {/* Evidence photos if any */}
            {selectedReturn.images && selectedReturn.images.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-text">Uploaded Evidence:</span>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {selectedReturn.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Return evidence"
                      className="h-28 w-28 object-cover rounded-xl border border-border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-text">Admin Internal Processing Notes:</label>
              <textarea
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                rows={2}
                placeholder="Enter courier consignment note, refund reference number, or inspection remarks..."
                className="w-full rounded-xl border border-border p-3 text-xs focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                {!selectedReturn.reverse_consignment_id && selectedReturn.status !== "refunded" && selectedReturn.status !== "rejected" && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenReverseModal(selectedReturn)}
                    className="text-xs bg-gray-900 hover:bg-black text-white font-bold"
                  >
                    <Truck className="h-3.5 w-3.5 mr-1 text-pink-400" /> Book Reverse Pickup
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenWhatsAppReturn(selectedReturn)}
                  className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-emerald-600" /> WhatsApp Chat
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedReturn.id, "approved")}
                  disabled={updatingId === selectedReturn.id || selectedReturn.status === "approved"}
                  className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedReturn.id, "item_received")}
                  disabled={updatingId === selectedReturn.id || selectedReturn.status === "item_received"}
                  className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                >
                  <Package className="h-3.5 w-3.5 mr-1" /> Item Received
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedReturn.id, "refunded")}
                  disabled={updatingId === selectedReturn.id || selectedReturn.status === "refunded"}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Issue Refund
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedReturn.id, "rejected")}
                  disabled={updatingId === selectedReturn.id || selectedReturn.status === "rejected"}
                  className="text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setSelectedReturn(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone 1-Click Reverse Courier Dispatch Modal */}
      {reverseModalReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in-0 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#e91e63] animate-ping" />
                  <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                    Reverse Logistics Dispatcher
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mt-1 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#e91e63]" />
                  Book Reverse Courier Pickup
                </h3>
                <p className="text-xs text-gray-500">
                  RMA: <span className="font-mono font-bold text-gray-900">{reverseModalReturn.return_number}</span> | Order: <span className="font-mono font-bold text-gray-900">{reverseModalReturn.order?.order_number}</span>
                </p>
              </div>

              <button
                onClick={() => setReverseModalReturn(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Courier Provider Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-900">
                Select Reverse Courier Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReverseCourier("steadfast")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reverseCourier === "steadfast"
                      ? "border-[#e91e63] bg-pink-50/50 ring-2 ring-[#e91e63]/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold text-xs text-gray-900">SteadFast Courier</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Nationwide Reverse Pickup</div>
                </button>

                <button
                  type="button"
                  onClick={() => setReverseCourier("pathao")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    reverseCourier === "pathao"
                      ? "border-[#e91e63] bg-pink-50/50 ring-2 ring-[#e91e63]/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold text-xs text-gray-900">Pathao Courier</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Express City Pickup</div>
                </button>
              </div>
            </div>

            {/* Pickup Details Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Customer Pickup Phone Number
                </label>
                <input
                  type="text"
                  value={reversePickupPhone}
                  onChange={(e) => setReversePickupPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Customer Doorstep Pickup Address
                </label>
                <textarea
                  value={reversePickupAddress}
                  onChange={(e) => setReversePickupAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReverseModalReturn(null)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleDispatchReverse}
                disabled={dispatchingReverse || !reversePickupPhone || !reversePickupAddress}
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Truck className={`h-3.5 w-3.5 mr-1.5 ${dispatchingReverse ? "animate-spin" : ""}`} />
                {dispatchingReverse ? "Booking Reverse Pickup..." : "Confirm Reverse Dispatch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RMA Policy & Reverse Courier Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in-0 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-[#e91e63]" />
                  <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                    RMA & Logistics Admin Controls
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">
                  Return Policy & Reverse Pickup Settings
                </h3>
                <p className="text-xs text-gray-500">
                  Configure return validity windows, warehouse drop hubs, and reverse courier dispatch rules.
                </p>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Return Portal Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <div className="font-bold text-gray-900">Customer Return Portal</div>
                  <div className="text-[11px] text-gray-500">
                    Allow customers to submit return requests from their Account Dashboard.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_return_portal ?? true}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, enable_return_portal: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e91e63]"></div>
                </label>
              </div>

              {/* Reverse Courier Booking Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <div className="font-bold text-gray-900">1-Click Reverse Courier Pickup</div>
                  <div className="text-[11px] text-gray-500">
                    Enable automated doorstep pickup booking via SteadFast & Pathao Reverse APIs.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_reverse_courier_booking ?? true}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        enable_reverse_courier_booking: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e91e63]"></div>
                </label>
              </div>

              {/* Return Window Days */}
              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Return Window Eligibility (Days after Delivery)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 7, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, return_window_days: days }))}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                        settings.return_window_days === days
                          ? "border-[#e91e63] bg-pink-50 text-[#e91e63] ring-1 ring-[#e91e63]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Warehouse Drop Address */}
              <div>
                <label className="block font-bold text-gray-900 mb-1">
                  Central Return & Warehouse Hub Address
                </label>
                <textarea
                  value={settings.default_return_warehouse_address || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      default_return_warehouse_address: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Enter central warehouse address for return parcel drop..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Save className={`h-3.5 w-3.5 mr-1.5 ${savingSettings ? "animate-spin" : ""}`} />
                {savingSettings ? "Saving Settings..." : "Save Policy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

