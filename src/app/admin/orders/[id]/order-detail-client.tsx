"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Truck,
  Package,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Edit3,
  Save,
  MessageCircle,
  ExternalLink,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  XCircle,
  ShieldCheck,
  Send,
  Ban,
  X,
  Target,
  Sparkles,
  Pause,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { formatPrice, formatShortProductId, buildCourierTrackingUrl } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { updateAdminOrderFull, triggerManualOrderCapiPurchase } from "@/features/orders/actions";
import { bookCourierDelivery, syncLiveCourierStatus } from "@/features/logistics/actions";
import { trackCancelOrder, trackRefund } from "@/lib/analytics/datalayer";
import { BDCourierHistoryCard } from "@/features/fraud/bdcourier-card";
import { generateWhatsAppOrderMessage } from "@/types/orders";

interface OrderDetailClientProps {
  order: any;
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);

  // Status & Notes State
  const [status, setStatus] = useState(order.status || "pending");
  const [statusNote, setStatusNote] = useState(order.public_note || "");
  const [internalNote, setInternalNote] = useState(order.internal_note || "");

  // Editable Customer & Shipping Address State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const initialAddr = order.shipping_address_snapshot || {};
  const [addressForm, setAddressForm] = useState({
    name: initialAddr.name || order.guest_name || "",
    phone: initialAddr.phone || order.guest_phone || "",
    email: initialAddr.email || order.guest_email || "",
    address: initialAddr.address || "",
    thana: initialAddr.thana || "",
    district: initialAddr.district || "Dhaka City",
  });

  // Editable Financials & Payment State
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [financialForm, setFinancialForm] = useState({
    subtotal: Number(order.subtotal || order.total || 0),
    shipping_amount: Number(order.shipping_amount ?? 60),
    discount_amount: Number(order.discount_amount || 0),
    payment_method: order.payment_method || "cod",
    payment_status: order.payment_status || "pending",
  });

  // Courier Dispatch State
  const [courierName, setCourierName] = useState(order.courier_name || "SteadFast Courier");
  const [consignmentId, setConsignmentId] = useState(order.consignment_id || "");
  const [parcelWeight, setParcelWeight] = useState(0.5);
  const initialItemsSummary = (order.order_items || [])
    .map((i: any) => `${i.product_name_snapshot} (x${i.quantity})`)
    .join(", ") || "Skincare cosmetics parcel";
  const [itemDescription, setItemDescription] = useState(initialItemsSummary);
  const [specialInstruction, setSpecialInstruction] = useState(
    order.public_note || "Fragile skincare cosmetics. Please handle with care and call before delivery."
  );
  const [bookingCourier, setBookingCourier] = useState<"steadfast" | "pathao" | null>(null);
  const [syncingCourier, setSyncingCourier] = useState(false);

  // UI Interactive State
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [capiLoading, setCapiLoading] = useState(false);
  const [capiMsg, setCapiMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [openWhatsAppMenu, setOpenWhatsAppMenu] = useState(false);

  const items = order.order_items || [];
  const history = order.order_status_history || [];

  // Recalculate Total Due dynamically
  const calculatedTotal = Math.max(
    0,
    Number(financialForm.subtotal) - Number(financialForm.discount_amount) + Number(financialForm.shipping_amount)
  );

  // Quick 1-Click Status Transitions
  const handleQuickStatus = async (newStatus: string, quickNote: string, markPaid = false) => {
    setSaving(true);
    setMsg(null);

    const payload: any = {
      status: newStatus,
      note: quickNote,
    };
    if (markPaid) {
      payload.payment_status = "paid";
    }

    const res = await updateAdminOrderFull(order.id, payload);
    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      setOrder(res.order);
      setStatus(newStatus);
      if (markPaid) {
        setFinancialForm((prev) => ({ ...prev, payment_status: "paid" }));
      }

      // GA4 & Meta Pixel Event Triggers
      if (newStatus === "cancelled") {
        trackCancelOrder(
          order.order_number || order.id,
          quickNote || "Admin cancelled order",
          Number(order.total) || 0,
          "BDT",
          {
            name: addressForm.name,
            phone: addressForm.phone,
            email: addressForm.email,
            city: addressForm.district,
          }
        );
      } else if (newStatus === "refunded") {
        trackRefund({
          transaction_id: order.order_number || order.id,
          order_id: order.order_number || order.id,
          value: Number(order.total) || 0,
          currency: "BDT",
          customer: {
            name: addressForm.name,
            phone: addressForm.phone,
            email: addressForm.email,
            city: addressForm.district,
          },
          items: items.map((it: any) => ({
            item_id: it.product_id || it.id,
            item_name: it.product_name_snapshot || "Product",
            price: Number(it.unit_price) || 0,
            quantity: Number(it.quantity) || 1,
          })),
        });
      }

      setMsg({ text: `Order updated to ${newStatus.toUpperCase()}!`, isError: false });
      setTimeout(() => setMsg(null), 3500);
      router.refresh();
    }
    setSaving(false);
  };

  // Full Status & Notes Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await updateAdminOrderFull(order.id, {
      status,
      publicNote: statusNote.trim() || undefined,
      internalNote: internalNote.trim() || undefined,
      note: statusNote.trim() || `Fulfillment status updated to ${status} by admin`,
    });

    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      setOrder(res.order);
      setStatus(res.order.status);
      setInternalNote(res.order.internal_note || "");

      // GA4 & Meta Pixel Event Triggers
      if (status === "cancelled") {
        trackCancelOrder(
          order.order_number || order.id,
          statusNote || "Admin status cancelled",
          Number(order.total) || 0,
          "BDT",
          {
            name: addressForm.name,
            phone: addressForm.phone,
            email: addressForm.email,
            city: addressForm.district,
          }
        );
      } else if (status === "refunded") {
        trackRefund({
          transaction_id: order.order_number || order.id,
          order_id: order.order_number || order.id,
          value: Number(order.total) || 0,
          currency: "BDT",
          customer: {
            name: addressForm.name,
            phone: addressForm.phone,
            email: addressForm.email,
            city: addressForm.district,
          },
          items: items.map((it: any) => ({
            item_id: it.product_id || it.id,
            item_name: it.product_name_snapshot || "Product",
            price: Number(it.unit_price) || 0,
            quantity: Number(it.quantity) || 1,
          })),
        });
      }

      setMsg({ text: "Fulfillment status and notes saved successfully!", isError: false });
      setTimeout(() => setMsg(null), 3500);
      router.refresh();
    }
    setSaving(false);
  };

  // Save Customer & Address Changes
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await updateAdminOrderFull(order.id, {
      shipping_address_snapshot: addressForm,
      note: `Customer shipping details modified by admin`,
    });

    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      setOrder(res.order);
      setIsEditingAddress(false);
      setMsg({ text: "Customer delivery address updated!", isError: false });
      setTimeout(() => setMsg(null), 3500);
      router.refresh();
    }
    setSaving(false);
  };

  // Save Financials & Payment Changes
  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await updateAdminOrderFull(order.id, {
      shipping_amount: Number(financialForm.shipping_amount),
      discount_amount: Number(financialForm.discount_amount),
      total: calculatedTotal,
      payment_method: financialForm.payment_method,
      payment_status: financialForm.payment_status,
      note: `Financial adjustment: Total ৳${calculatedTotal} (${financialForm.payment_status})`,
    });

    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      setOrder(res.order);
      setIsEditingFinancials(false);
      setMsg({ text: "Financial breakdown and payment status updated!", isError: false });
      setTimeout(() => setMsg(null), 3500);
      router.refresh();
    }
    setSaving(false);
  };

  // Automated Courier Booking with Complete Payload
  const handleBookCourier = async (courierCode: "steadfast" | "pathao") => {
    setBookingCourier(courierCode);
    setMsg(null);

    const res = await bookCourierDelivery({
      orderId: order.id,
      orderNumber: order.order_number,
      courierCode,
      recipientName: addressForm.name || order.guest_name || "Customer",
      recipientPhone: addressForm.phone || order.guest_phone || "01712345678",
      recipientAddress: addressForm.address || "Dhaka, Bangladesh",
      district: addressForm.district || "Dhaka City",
      thana: addressForm.thana || "",
      codAmount: order.payment_status === "paid" ? 0 : order.total,
      weightKg: Number(parcelWeight),
      itemDescription: itemDescription.trim() || undefined,
      specialInstruction: specialInstruction.trim() || undefined,
    });

    if (res.success) {
      setConsignmentId(res.consignmentId);
      setCourierName(res.courierName);
      setMsg({
        text: `Successfully dispatched with ${res.courierName}! Consignment: ${res.consignmentId}`,
        isError: false,
      });
      setStatus("shipped");
      setOrder({
        ...order,
        status: "shipped",
        courier_name: res.courierName,
        consignment_id: res.consignmentId,
        tracking_code: res.trackingId || res.consignmentId,
        tracking_url: res.trackingUrl,
      });
      router.refresh();
    } else {
      setMsg({ text: res.error || "Courier booking failed.", isError: true });
    }
    setBookingCourier(null);
  };

  // Sync Live Courier Status
  const handleSyncCourier = async () => {
    setSyncingCourier(true);
    setMsg(null);
    try {
      const res = await syncLiveCourierStatus(order.id);
      if (res.success) {
        setMsg({ text: `Live Sync: ${res.statusNote}`, isError: false });
        setStatus(res.mappedStatus);
        setOrder({
          ...order,
          status: res.mappedStatus,
          courier_name: res.courierName,
          consignment_id: res.consignmentId,
          is_courier_returned: res.isReturned,
          is_courier_cancelled: res.isCancelled,
          courier_webhook_note: res.statusNote,
        });
        router.refresh();
      } else {
        setMsg({ text: res.error || "Failed to sync status from courier API.", isError: true });
      }
    } catch (e: any) {
      setMsg({ text: e.message || "Failed to sync status.", isError: true });
    }
    setSyncingCourier(false);
  };

  const handlePrint = () => {
    window.open(`/admin/orders/${order.id}/invoice`, "_blank");
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const trackingUrl = buildCourierTrackingUrl(courierName, consignmentId);

    const res = await updateAdminOrderFull(order.id, {
      courier_name: courierName,
      consignment_id: consignmentId || undefined,
      tracking_code: consignmentId || undefined,
      tracking_url: consignmentId ? trackingUrl : undefined,
      note: `Courier updated: ${courierName} (Consignment: ${consignmentId || "N/A"})`,
    });

    if (res.error) {
      setMsg({ text: res.error, isError: true });
    } else {
      if (res.order) {
        setOrder(res.order);
        setCourierName(res.order.courier_name || courierName);
        setConsignmentId(res.order.consignment_id || consignmentId);
      }
      setMsg({ text: `Courier tracking details saved successfully!`, isError: false });
      setTimeout(() => setMsg(null), 3500);
      router.refresh();
    }
    setSaving(false);
  };

  const activeCid = order.consignment_id || consignmentId || "";
  const isBooked = Boolean(activeCid);
  const activeCourierName = order.courier_name || courierName;
  const isPathao = activeCourierName.toLowerCase().includes("pathao") || activeCid.startsWith("PTH") || activeCid.startsWith("DE");

  const liveTrackingUrl = buildCourierTrackingUrl(activeCourierName, activeCid, order.tracking_url);

  const rawPhone = (addressForm.phone || order.guest_phone || "").replace(/[^0-9]/g, "");
  const formattedBdPhone = rawPhone.startsWith("88") ? rawPhone : `88${rawPhone}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon" className="rounded-xl border border-gray-200 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
                Order {order.order_number}
              </h1>
              <span
                className={`rounded-full text-xs px-3 py-0.5 border font-black uppercase tracking-wide ${
                  order.status === "completed" || order.status === "delivered"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : order.status === "shipped" || order.status === "in_transit"
                    ? "bg-teal-50 text-teal-800 border-teal-300"
                    : order.status === "processing"
                    ? "bg-pink-50 text-[#e91e63] border-pink-200"
                    : order.status === "cancelled"
                    ? "bg-red-50 text-red-800 border-red-300"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
              >
                {order.status}
              </span>
              {isBooked && (
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] px-2.5 py-0.5 font-bold flex items-center gap-1 font-mono">
                  <Truck className="h-3 w-3 text-emerald-600" />
                  {isPathao ? "Pathao" : "SteadFast"}: {activeCid}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString("en-GB")} • {items.length} Line Item{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Header Action Buttons: Courier Sync vs Quick Dispatch */}
          {isBooked ? (
            <>
              <Button
                onClick={handleSyncCourier}
                disabled={syncingCourier}
                size="sm"
                variant="outline"
                className="text-xs font-bold rounded-xl border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingCourier ? "animate-spin text-emerald-600" : ""}`} />
                Sync Courier API
              </Button>
              <a
                href={liveTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
              >
                <span>Live Tracking</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleBookCourier("steadfast")}
                disabled={Boolean(bookingCourier)}
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                {bookingCourier === "steadfast" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Truck className="h-3.5 w-3.5 mr-1" />}
                Book SteadFast Delivery
              </Button>
              <Button
                onClick={() => handleBookCourier("pathao")}
                disabled={Boolean(bookingCourier)}
                size="sm"
                variant="outline"
                className="text-xs font-bold rounded-xl border-red-300 bg-red-50/60 hover:bg-red-100 text-red-800 shadow-xs"
              >
                {bookingCourier === "pathao" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-red-600" /> : <Truck className="h-3.5 w-3.5 mr-1" />}
                Pathao Express
              </Button>
            </>
          )}

          <Button variant="outline" onClick={handlePrint} className="text-xs font-bold rounded-xl border-gray-300 hover:bg-gray-50">
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Invoice
          </Button>

          <Link href={`/orders/${order.id}/confirmation`} target="_blank">
            <Button variant="outline" className="text-xs font-bold rounded-xl border-gray-300 hover:bg-gray-50">
              <ExternalLink className="h-3.5 w-3.5 mr-1 text-[#e91e63]" />
              Customer View
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Alert Notification */}
      {msg && (
        <div
          className={`rounded-2xl border p-4 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in-0 ${
            msg.isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Quick 1-Click Status Pipeline Bar */}
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-[#e91e63]" /> Quick Status Actions:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleQuickStatus("confirmed", "Order verified and confirmed via phone")}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "confirmed"
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-1 font-black"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <Check className="h-3.5 w-3.5" /> Confirm Order
          </button>

          <button
            onClick={() => handleQuickStatus("processing", "Order moved to processing/warehouse packaging")}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "processing"
                ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 ring-offset-1 font-black"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
            }`}
          >
            <Package className="h-3.5 w-3.5" /> Processing
          </button>

          <button
            onClick={() => handleQuickStatus("on-hold", "Order placed on hold awaiting customer confirmation/advance")}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "on-hold" || order.status === "on_hold"
                ? "bg-orange-600 text-white shadow-md ring-2 ring-orange-300 ring-offset-1 font-black"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            }`}
          >
            <Pause className="h-3.5 w-3.5" /> On Hold
          </button>

          <button
            onClick={() => handleQuickStatus("packed", "Parcel packed in holographic bubble mailer")}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "packed" || order.status === "ready_for_pickup"
                ? "bg-purple-600 text-white shadow-md ring-2 ring-purple-300 ring-offset-1 font-black"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            <Package className="h-3.5 w-3.5" /> Mark Packed
          </button>

          <button
            onClick={() => handleQuickStatus("shipped", "Dispatched with courier partner")}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "shipped" || order.status === "in_transit" || order.status === "out_for_delivery"
                ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-300 ring-offset-1 font-black"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
            }`}
          >
            <Truck className="h-3.5 w-3.5" /> Mark In-Transit
          </button>

          <button
            onClick={() => handleQuickStatus("completed", "Order completed, parcel delivered & payment collected", true)}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "completed" || order.status === "delivered"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 ring-offset-1 font-black"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete & Paid
          </button>

          <button
            onClick={() => handleQuickStatus("cancelled", "Order cancelled by admin/customer")}
            disabled={saving}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
              order.status === "cancelled"
                ? "bg-red-600 text-white shadow-md ring-2 ring-red-300 ring-offset-1 font-black"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            }`}
          >
            <Ban className="h-3.5 w-3.5" /> Cancel Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Items, Fulfillment & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Fulfillment Status & Notes Manager */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Truck className="h-4 w-4 text-[#e91e63]" /> Update Fulfillment Status & Notes
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Fulfillment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 font-bold capitalize focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  >
                    <option value="pending">Pending (Awaiting Verification)</option>
                    <option value="confirmed">Confirmed (Order Verified)</option>
                    <option value="processing">Processing & In Warehouse</option>
                    <option value="on-hold">On Hold (Awaiting Advance / Action)</option>
                    <option value="packed">Packed (Ready in Box)</option>
                    <option value="ready_for_pickup">Ready for Courier Pickup</option>
                    <option value="shipped">Shipped / In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed (Delivered & Paid)</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned / RTO</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    Customer Public Tracking Note
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Handed over to SteadFast tracking #SF12345"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-800 mb-1">
                    Internal Staff Note (Private to Admin)
                  </label>
                  <textarea
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="e.g. Advance ৳120 delivery fee received via bKash TrxID 89A291. Deliver after 5 PM."
                    className="w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-[#e91e63] hover:bg-pink-700 text-white text-xs font-black rounded-xl px-6 py-2 shadow-xs"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Save Status & Notes
                </Button>
              </div>
            </form>
          </div>

          {/* 2. Courier Consignment & Delivery Center */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" /> Courier Consignment & Tracking Dispatch
              </h2>
              {isBooked && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Booked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Courier Service</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                >
                  <option value="SteadFast Courier">SteadFast Courier (Standard)</option>
                  <option value="Pathao Express">Pathao Express</option>
                  <option value="RedX Logistics">RedX Logistics</option>
                  <option value="Paperfly">Paperfly</option>
                  <option value="Sundarban Courier">Sundarban Courier</option>
                  <option value="In-House Delivery Rider">In-House Delivery Rider</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Consignment / Tracking Number</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={consignmentId}
                    onChange={(e) => setConsignmentId(e.target.value)}
                    placeholder="e.g. SF-9029148 or PTH12345"
                    className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                  <Button
                    onClick={handleSaveTracking}
                    disabled={saving}
                    size="sm"
                    className="bg-[#e91e63] hover:bg-pink-700 text-white text-xs font-bold rounded-xl shrink-0 shadow-xs"
                  >
                    Save Tracking
                  </Button>
                  {consignmentId && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(consignmentId);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      title="Copy Tracking Number"
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shrink-0 flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Parcel Weight (KG) <span className="text-[10px] text-gray-400 font-normal">(SteadFast & Pathao)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={parcelWeight}
                  onChange={(e) => setParcelWeight(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Package Content / Products Summary
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g. Simple Moisturiser (125ml) x 1"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-800 mb-1">
                  Special Delivery Instructions (For Courier Rider)
                </label>
                <input
                  type="text"
                  value={specialInstruction}
                  onChange={(e) => setSpecialInstruction(e.target.value)}
                  placeholder="e.g. Fragile skincare item. Please call before delivery."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                {isBooked ? (
                  <>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Booked with {activeCourierName} ({activeCid})</span>
                    </div>

                    <Button
                      onClick={handleSyncCourier}
                      disabled={syncingCourier}
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl shadow-xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingCourier ? "animate-spin text-emerald-600" : ""}`} />
                      Sync Live Courier API
                    </Button>

                    <a
                      href={liveTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                    >
                      <span>Open Live Tracking</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <Button
                      onClick={() => handleBookCourier("steadfast")}
                      disabled={Boolean(bookingCourier)}
                      size="sm"
                      variant="ghost"
                      className="text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                      title="Re-book with SteadFast if needed"
                    >
                      Re-Book
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleBookCourier("steadfast")}
                      disabled={Boolean(bookingCourier)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      {bookingCourier === "steadfast" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Truck className="h-3.5 w-3.5 mr-1" />}
                      1-Click SteadFast Dispatch
                    </Button>
                    <Button
                      onClick={() => handleBookCourier("pathao")}
                      disabled={Boolean(bookingCourier)}
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold rounded-xl border-red-300 bg-red-50/60 hover:bg-red-100 text-red-800 shadow-xs"
                    >
                      {bookingCourier === "pathao" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-red-600" /> : <Truck className="h-3.5 w-3.5 mr-1" />}
                      Pathao Express Dispatch
                    </Button>
                  </>
                )}
              </div>

              <Link href="/admin/shipping" target="_blank">
                <span className="text-xs font-bold text-[#e91e63] hover:underline flex items-center gap-1">
                  Courier Settings <ExternalLink className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>

          {/* 3. Ordered Line Items Table */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-gray-900">
                Ordered Items ({items.length})
              </h2>
              <span className="text-xs text-gray-500 font-bold">Subtotal: {formatPrice(order.subtotal)}</span>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between text-xs hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-[#e91e63] border border-pink-100">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.product_name_snapshot}</p>
                      <p className="text-gray-500 mt-0.5 font-medium">
                        Qty: <strong className="text-gray-800">{item.quantity}</strong> × {formatPrice(item.unit_price)}
                        {item.sku_snapshot && <span className="ml-2 font-mono text-gray-400">SKU: {formatShortProductId(item.sku_snapshot)}</span>}
                      </p>
                    </div>
                  </div>

                  <span className="font-black text-gray-900 text-sm font-mono">
                    {formatPrice(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Status History & Audit Log */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-black uppercase text-gray-900 border-b border-gray-100 pb-3">
              Order Activity & Timeline History
            </h2>
            <div className="space-y-3 text-xs">
              {history.length === 0 ? (
                <p className="text-gray-400 italic">No activity history recorded yet.</p>
              ) : (
                history.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 border-l-2 border-[#e91e63] pl-3.5 py-1">
                    <div>
                      <p className="font-bold text-gray-900 capitalize">
                        {h.status}: <span className="font-normal text-gray-600">{h.note}</span>
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium font-mono">
                        {new Date(h.created_at).toLocaleString("en-GB")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Customer, Financials & Communications */}
        <div className="space-y-6">
          {/* 1. Customer & Delivery Address (Editable) */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#e91e63]" /> Customer & Delivery Address
              </h2>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="text-xs font-bold text-[#e91e63] hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" /> {isEditingAddress ? "Cancel" : "Edit"}
              </button>
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mobile Phone (BD)</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addressForm.email}
                    onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Detailed Street Address</label>
                  <textarea
                    rows={2}
                    required
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Thana</label>
                    <input
                      type="text"
                      value={addressForm.thana}
                      onChange={(e) => setAddressForm({ ...addressForm, thana: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">District</label>
                    <input
                      type="text"
                      value={addressForm.district}
                      onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving} size="sm" className="w-full bg-[#e91e63] hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs">
                  {saving ? "Saving..." : "Save Address Changes"}
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Name</span>
                  <p className="font-bold text-gray-900 text-sm">{addressForm.name || order.guest_name || "Guest Customer"}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Contact</span>
                  <p className="font-bold text-gray-900 font-mono text-sm">
                    {addressForm.phone || order.guest_phone || "N/A"}
                  </p>
                </div>

                {addressForm.email && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                    <p className="text-gray-600 font-mono">{addressForm.email}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Destination</span>
                  <p className="font-medium text-gray-800 mt-0.5">{addressForm.address || "N/A"}</p>
                  <p className="text-gray-500 font-bold">
                    {addressForm.thana ? `${addressForm.thana}, ` : ""}
                    {addressForm.district || "Dhaka City"}
                  </p>
                </div>

                {/* 1-Click WhatsApp Dropdown Templates & Phone Calling */}
                <div className="pt-2 border-t border-gray-100 flex gap-2 relative">
                  <div className="flex-1 relative">
                    <button
                      type="button"
                      onClick={() => setOpenWhatsAppMenu(!openWhatsAppMenu)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 shadow-xs transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                      <ChevronDown className="h-3 w-3 opacity-80" />
                    </button>

                    {openWhatsAppMenu && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 space-y-1 animate-in fade-in-0 zoom-in-95">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          Select WhatsApp Message Template
                        </div>

                        <a
                          href={generateWhatsAppOrderMessage(order, "confirm")}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenWhatsAppMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-gray-800 text-xs font-bold transition-colors"
                        >
                          <span className="text-base">🌸</span>
                          <div>
                            <p className="text-gray-900 font-bold">Order Confirmation</p>
                            <p className="text-[10px] text-gray-500 font-normal">Order details, items & COD total</p>
                          </div>
                        </a>

                        <a
                          href={generateWhatsAppOrderMessage(order, "shipped")}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenWhatsAppMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-gray-800 text-xs font-bold transition-colors"
                        >
                          <span className="text-base">🚚</span>
                          <div>
                            <p className="text-gray-900 font-bold">Shipped & Live Tracking</p>
                            <p className="text-[10px] text-gray-500 font-normal">Courier name, tracking ID & link</p>
                          </div>
                        </a>

                        <a
                          href={generateWhatsAppOrderMessage(order, "advance", 120)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenWhatsAppMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-gray-800 text-xs font-bold transition-colors"
                        >
                          <span className="text-base">💳</span>
                          <div>
                            <p className="text-gray-900 font-bold">Advance Fee Request (৳120)</p>
                            <p className="text-[10px] text-gray-500 font-normal">Delivery charge payment request</p>
                          </div>
                        </a>

                        <a
                          href={generateWhatsAppOrderMessage(order, "review")}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenWhatsAppMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-gray-800 text-xs font-bold transition-colors"
                        >
                          <span className="text-base">⭐</span>
                          <div>
                            <p className="text-gray-900 font-bold">Review & Feedback Request</p>
                            <p className="text-[10px] text-gray-500 font-normal">Post-delivery satisfaction check</p>
                          </div>
                        </a>

                        <a
                          href={generateWhatsAppOrderMessage(order, "cancelled")}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenWhatsAppMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-gray-800 text-xs font-bold transition-colors"
                        >
                          <span className="text-base">❌</span>
                          <div>
                            <p className="text-red-700 font-bold">Order Cancelled Notice</p>
                            <p className="text-[10px] text-gray-500 font-normal">Cancellation confirmation</p>
                          </div>
                        </a>

                        <a
                          href={`https://wa.me/${formattedBdPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenWhatsAppMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-800 text-xs font-bold border-t border-gray-100 transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <div>
                            <p className="text-gray-900 font-bold">Open Direct Chat</p>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>

                  <a
                    href={`tel:${addressForm.phone || order.guest_phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs py-2 shadow-xs transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#e91e63]" /> Call
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 1.5 BDCourier Fraud & Multi-Courier History Card */}
          <BDCourierHistoryCard
            phone={addressForm.phone || order.guest_phone}
            customerName={addressForm.name || order.guest_name}
          />

          {/* 2. Financial Breakdown & Payment Control (Editable) */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-600" /> Financials & Payment Rules
              </h2>
              <button
                onClick={() => setIsEditingFinancials(!isEditingFinancials)}
                className="text-xs font-bold text-[#e91e63] hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" /> {isEditingFinancials ? "Cancel" : "Adjust Price"}
              </button>
            </div>

            {isEditingFinancials ? (
              <form onSubmit={handleSaveFinancials} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Products Subtotal (৳)</label>
                  <input
                    type="number"
                    value={financialForm.subtotal}
                    onChange={(e) => setFinancialForm({ ...financialForm, subtotal: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Delivery Shipping Fee (৳)</label>
                  <input
                    type="number"
                    value={financialForm.shipping_amount}
                    onChange={(e) => setFinancialForm({ ...financialForm, shipping_amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Manual Discount (৳)</label>
                  <input
                    type="number"
                    value={financialForm.discount_amount}
                    onChange={(e) => setFinancialForm({ ...financialForm, discount_amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={financialForm.payment_method}
                    onChange={(e) => setFinancialForm({ ...financialForm, payment_method: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="bkash">bKash Online / Manual</option>
                    <option value="nagad">Nagad Online / Manual</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Visa / Mastercard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={financialForm.payment_status}
                    onChange={(e) => setFinancialForm({ ...financialForm, payment_status: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30"
                  >
                    <option value="pending">Pending (Unpaid COD)</option>
                    <option value="partial">Partially Paid (Advance Delivery Fee)</option>
                    <option value="paid">Paid (Full Payment Received)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between font-black text-sm text-gray-900">
                  <span>Recalculated Total:</span>
                  <span className="text-[#e91e63] text-base font-mono">{formatPrice(calculatedTotal)}</span>
                </div>

                <Button type="submit" disabled={saving} size="sm" className="w-full bg-[#e91e63] hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs">
                  {saving ? "Saving..." : "Save Financial Adjustments"}
                </Button>
              </form>
            ) : (
              <div className="space-y-2.5 text-gray-600">
                <div className="flex justify-between">
                  <span>Products Subtotal</span>
                  <span className="font-bold text-gray-900 font-mono">{formatPrice(order.subtotal)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Applied</span>
                    <span className="font-mono">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount)}
                  </span>
                </div>

                {/* Dynamic Due Amount */}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline text-sm font-black text-gray-900">
                  <span>{order.payment_status === "paid" ? "COD Due to Collect" : "Total COD Due"}</span>
                  <span className={`text-xl font-black font-mono ${order.payment_status === "paid" ? "text-emerald-700" : "text-[#e91e63]"}`}>
                    {order.payment_status === "paid" ? "৳0 (PAID)" : formatPrice(order.amount_to_collect !== undefined ? order.amount_to_collect : order.total)}
                  </span>
                </div>

                {order.payment_status === "paid" && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Total Order Bill:</span>
                    <span className="font-bold text-gray-800 font-mono">{formatPrice(order.total)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-[11px]">
                  <span className="font-medium">Payment Method:</span>
                  <span
                    className={`font-black uppercase px-2.5 py-0.5 rounded-lg border text-xs flex items-center gap-1 ${
                      order.payment_status === "paid"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {order.payment_status === "paid" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                    {order.payment_method === "bkash"
                      ? "bKash Online Payment"
                      : order.payment_method === "cod"
                      ? "Cash on Delivery"
                      : order.payment_method}
                  </span>
                </div>

                {/* TrxID Badge if Online Payment */}
                {(() => {
                  const trxMatch =
                    order.public_note?.match(/TrxID:\s*([A-Za-z0-9]+)/i) ||
                    (history || []).map((h: any) => h.note?.match(/TrxID:\s*([A-Za-z0-9]+)/i)).find(Boolean);
                  const trxId = trxMatch ? trxMatch[1] : null;

                  if (!trxId) return null;
                  return (
                    <div className="flex justify-between items-center text-[11px] bg-pink-50 p-2 rounded-xl border border-pink-200">
                      <span className="font-bold text-pink-900">bKash TrxID:</span>
                      <span className="font-mono font-black text-pink-700">{trxId}</span>
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium">Payment Status:</span>
                  <span
                    className={`font-black uppercase px-2.5 py-0.5 rounded-lg border text-[10px] ${
                      order.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {order.payment_status === "paid" ? "PAID (পরিশোধিত)" : order.payment_status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Meta & TikTok Conversions API (CAPI) Dispatch Manager */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-black uppercase text-gray-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#e91e63]" /> Meta &amp; TikTok CAPI Purchase
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-pink-100 text-[#e91e63]">
                EMQ 9.0+
              </span>
            </div>

            {capiMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  capiMsg.isError
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {capiMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                <span>{capiMsg.text}</span>
              </div>
            )}

            {(() => {
              const addressSnap = order.shipping_address_snapshot || {};
              const firedAt = addressSnap.purchase_capi_fired_at;
              const results = addressSnap.purchase_capi_results;

              return (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-semibold">Server CAPI Trigger:</span>
                      {firedAt ? (
                        <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-[10px] uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Auto-Dispatched ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg text-[10px] uppercase">
                          ⚡ Auto-Armed (Pending Delivered/Paid)
                        </span>
                      )}
                    </div>

                    {firedAt && (
                      <div className="text-[11px] text-gray-500 font-mono">
                        Dispatched at: {new Date(firedAt).toLocaleString("en-GB")}
                      </div>
                    )}

                    {results && (
                      <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-gray-700">Meta CAPI:</span>{" "}
                          <span className={results.meta_success ? "text-emerald-700 font-bold" : "text-gray-500"}>
                            {results.meta_success ? "Sent & Tracked ✓" : "Not Fired"}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">TikTok CAPI:</span>{" "}
                          <span className={results.tiktok_success ? "text-emerald-700 font-bold" : "text-gray-500"}>
                            {results.tiktok_success ? "Sent & Tracked ✓" : "Not Fired"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    ⚡ <strong>স্বয়ংক্রিয় ট্র্যাকিং সক্রিয় (Auto-Trigger Active):</strong> অর্ডারটি <strong>Completed / Delivered</strong> অথবা <strong>Paid</strong> হওয়া মাত্র (অথবা কুরিয়ার ডেলিভারি কনফার্ম করামাত্র) সার্ভার অটোমেটিক Meta ও TikTok CAPI Purchase ফায়ার করে দিবে। নিচের বাটনটি শুধুমাত্র এডমিনদের ম্যানুয়াল টেস্ট বা এমার্জেন্সি ওভাররাইডের জন্য।
                  </p>

                  <Button
                    onClick={async () => {
                      setCapiLoading(true);
                      setCapiMsg(null);
                      try {
                        const res = await triggerManualOrderCapiPurchase(order.id);
                        if (res?.success) {
                          setCapiMsg({
                            text: "Server-side CAPI Purchase dispatched to Meta & TikTok with EMQ 9.0+ parameters!",
                            isError: false,
                          });
                          router.refresh();
                        } else {
                          setCapiMsg({
                            text: res?.error || "Failed to dispatch CAPI purchase.",
                            isError: true,
                          });
                        }
                      } catch (err: any) {
                        setCapiMsg({ text: err?.message || "CAPI dispatch error", isError: true });
                      } finally {
                        setCapiLoading(false);
                        setTimeout(() => setCapiMsg(null), 5000);
                      }
                    }}
                    disabled={capiLoading}
                    size="sm"
                    className="w-full bg-linear-to-r from-[#e91e63] to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white text-xs font-bold rounded-xl py-2.5 shadow-xs"
                  >
                    {capiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {firedAt ? "Re-Dispatch CAPI Purchase (Manual Override)" : "Dispatch Server CAPI Now (Manual Override)"}
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
