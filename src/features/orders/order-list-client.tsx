"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Package,
  Phone,
  Calendar,
  Clock,
  Clock3,
  Truck,
  Printer,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  MessageCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Tag,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
  Search,
  Filter,
  Plus,
  Download,
  X,
  Sliders,
  Zap,
  RotateCcw,
  MapPin,
  CornerDownLeft,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPrice, buildCourierTrackingUrl } from "@/lib/utils";
import { updateOrderStatus, createOrder, getAdminOrders } from "./actions";
import { bookCourierDelivery, syncLiveCourierStatus } from "@/features/logistics/actions";
import { addBlacklistEntry } from "@/features/fraud/actions";
import { Button } from "@/components/shared/ui/button";
import { trackCancelOrder, trackRefund } from "@/lib/analytics/datalayer";
import { getAvailableNextStatuses, OrderStatus, generateWhatsAppOrderMessage } from "@/types/orders";
import { BDCourierBadge } from "@/features/fraud/bdcourier-badge";
import { getWhatsAppTemplates, type WhatsAppTemplate } from "@/features/communication/whatsapp-actions";
import { useAdminLang } from "@/lib/admin-lang-context";

interface OrderListClientProps {
  initialOrders: any[];
}

export function OrderListClient({ initialOrders }: OrderListClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // Sync state whenever server re-renders initialOrders
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Periodic polling & window focus re-fetch to ensure newly paid orders show up instantly
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await getAdminOrders();
        if (Array.isArray(latest)) {
          setOrders(latest);
        }
      } catch (err) {
        console.warn("Background orders sync:", err);
      }
    };

    window.addEventListener("focus", fetchLatest);
    const interval = setInterval(fetchLatest, 10000);
    return () => {
      window.removeEventListener("focus", fetchLatest);
      clearInterval(interval);
    };
  }, []);

  const handleRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const latest = await getAdminOrders();
      if (Array.isArray(latest)) {
        setOrders(latest);
      }
      router.refresh();
      setBannerMsg({ text: "Orders list updated with latest live transactions.", isError: false });
    } catch {
      setBannerMsg({ text: "Could not refresh orders list.", isError: true });
    } finally {
      setIsRefreshingOrders(false);
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useAdminLang();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [syncingCourierId, setSyncingCourierId] = useState<string | null>(null);
  const [bulkSyncLoading, setBulkSyncLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick View Order Modal State
  const [quickViewOrder, setQuickViewOrder] = useState<any | null>(null);

  // Admin Override Modal State
  const [overrideModalOrder, setOverrideModalOrder] = useState<any | null>(null);
  const [overrideTargetStatus, setOverrideTargetStatus] = useState<OrderStatus>("confirmed");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Anti-Fraud Block Customer Modal State
  const [blockModalOrder, setBlockModalOrder] = useState<any | null>(null);
  const [blockReason, setBlockReason] = useState<string>("High RTO rate / Suspected fraudulent activity");
  const [blockLoading, setBlockLoading] = useState(false);

  // Single Order Custom Dispatch Modal State (Custom COD & Note)
  const [customDispatchModal, setCustomDispatchModal] = useState<{
    order: any;
    courierCode: "steadfast" | "pathao";
    codAmount: number;
    weight: number;
    note: string;
  } | null>(null);
  const [customDispatchLoading, setCustomDispatchLoading] = useState(false);

  // Bulk Dispatch Review Modal State (Review all individual CODs & Global Note)
  const [bulkReviewModal, setBulkReviewModal] = useState<{
    courierCode: "steadfast" | "pathao";
    eligibleOrders: any[];
    globalNote: string;
  } | null>(null);

  // Create Manual Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);



  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    email: "",
    district: "Dhaka City",
    thana: "",
    address: "",
    productName: "COSRX Advanced Snail 96 Mucin Power Essence",
    productPrice: 1365,
    quantity: 1,
    deliveryFee: 60,
    notes: "Manual order placed via Phone/WhatsApp",
  });

  // WhatsApp dropdown menu open state & templates
  const [openWhatsAppId, setOpenWhatsAppId] = useState<string | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplate[]>([]);

  useEffect(() => {
    getWhatsAppTemplates().then((res) => {
      if (res && res.length > 0) setWaTemplates(res);
    });
  }, []);

  // Filter Orders // Search & Tab Filtering
  const filteredOrders = orders.filter((o) => {
    let matchesTab = true;
    if (activeTab === "all") matchesTab = true;
    else if (activeTab === "paid-online") matchesTab = o.payment_status === "paid";
    else if (activeTab === "pending") matchesTab = o.status === "pending";
    else if (activeTab === "processing") matchesTab = o.status === "processing" || o.status === "confirmed" || o.status === "packed" || o.status === "ready_for_pickup";
    else if (activeTab === "on-hold") matchesTab = o.status === "on-hold" || o.status === "on_hold";
    else if (activeTab === "completed") matchesTab = o.status === "completed" || o.status === "delivered" || o.status === "shipped" || o.status === "in_transit" || o.status === "out_for_delivery";
    else if (activeTab === "cancelled") matchesTab = o.status === "cancelled";
    else if (activeTab === "courier-returns") {
      matchesTab = Boolean(
        o.is_courier_returned ||
        o.is_courier_cancelled ||
        o.status === "returned" ||
        (o.status === "failed" && Boolean(o.consignment_id))
      );
    }
    else if (activeTab === "failed") matchesTab = o.status === "failed" || o.status === "returned" || o.status === "refunded";
    else matchesTab = o.status === activeTab;

    const phone = o.shipping_address_snapshot?.phone || o.guest_phone || "";
    const name = o.shipping_address_snapshot?.name || o.guest_name || "";
    const orderNum = o.order_number || "";
    const district = o.shipping_address_snapshot?.district || "";
    const paymentMethod = (o.payment_method || "").toLowerCase();
    const paymentStatus = (o.payment_status || "").toLowerCase();
    const note = (o.public_note || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      orderNum.toLowerCase().includes(query) ||
      phone.includes(searchQuery) ||
      name.toLowerCase().includes(query) ||
      district.toLowerCase().includes(query) ||
      paymentMethod.includes(query) ||
      paymentStatus.includes(query) ||
      note.includes(query) ||
      (o.consignment_id && o.consignment_id.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });


  // 1. Status Update Handler with State Guard & Override Interceptor
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Check if admin clicked the Force Override option
    if (newStatus === "__override__") {
      setOverrideModalOrder(targetOrder);
      setOverrideTargetStatus(targetOrder.status === "cancelled" ? "confirmed" : "processing");
      setOverrideReason("");
      return;
    }

    setActionLoadingId(orderId);
    const res = await updateOrderStatus(orderId, newStatus);
    setActionLoadingId(null);

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (newStatus === "cancelled" && targetOrder) {
        trackCancelOrder(
          targetOrder.order_number || targetOrder.id,
          "Admin updated status to cancelled",
          Number(targetOrder.total) || 0,
          "BDT"
        );
      } else if (newStatus === "returned" && targetOrder) {
        trackRefund({
          transaction_id: targetOrder.order_number || targetOrder.id,
          order_id: targetOrder.order_number || targetOrder.id,
          value: Number(targetOrder.total) || 0,
          currency: "BDT",
        });
      }

      setBannerMsg({
        text: `Order #${targetOrder.order_number || orderId} status successfully transitioned to ${newStatus.toUpperCase()}`,
        isError: false,
      });
      setTimeout(() => setBannerMsg(null), 3500);
    } else {
      setBannerMsg({
        text: `Transition Failed: ${res.error}`,
        isError: true,
      });
      setTimeout(() => setBannerMsg(null), 5000);
    }
  };

  // 1.1 Execute Admin Force Override
  const handleExecuteOverride = async () => {
    if (!overrideModalOrder) return;
    setOverrideLoading(true);

    const res = await updateOrderStatus(
      overrideModalOrder.id,
      overrideTargetStatus,
      undefined,
      true,
      overrideReason || "Supervisor manual correction"
    );

    setOverrideLoading(false);

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === overrideModalOrder.id ? { ...o, status: overrideTargetStatus } : o))
      );
      setBannerMsg({
        text: `Force Override applied: Order #${overrideModalOrder.order_number} status set to ${overrideTargetStatus.toUpperCase()}`,
        isError: false,
      });
      setOverrideModalOrder(null);
      setTimeout(() => setBannerMsg(null), 4500);
    } else {
      setBannerMsg({
        text: `Override failed: ${res.error}`,
        isError: true,
      });
    }
  };

  // 1.2 Real-Time Live Courier Status Sync (SteadFast & Pathao API)
  const handleSyncSingleCourier = async (orderId: string) => {
    setSyncingCourierId(orderId);
    try {
      const res = await syncLiveCourierStatus(orderId);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: res.mappedStatus as any,
                  courier_name: res.courierName || o.courier_name,
                  shipping_method: res.courierName || o.shipping_method,
                  consignment_id: res.consignmentId || o.consignment_id,
                  is_courier_returned: res.isReturned,
                  is_courier_cancelled: res.isCancelled,
                  courier_webhook_note: res.statusNote,
                  shipping_address_snapshot: {
                    ...(o.shipping_address_snapshot || {}),
                    courier_name: res.courierName || o.courier_name,
                    consignment_id: res.consignmentId || o.consignment_id,
                    courier_status: res.liveStatus,
                    courier_webhook_note: res.statusNote,
                    is_courier_returned: res.isReturned,
                    is_courier_cancelled: res.isCancelled,
                    last_synced_at: new Date().toISOString(),
                  },
                }
              : o
          )
        );
        setBannerMsg({
          text: `Live Sync: ${res.statusNote} -> Status updated to ${(res.mappedStatus || "").toUpperCase()}`,
          isError: false,
        });
      } else {
        setBannerMsg({
          text: res.error || "Failed to sync live status from courier API.",
          isError: true,
        });
      }
    } catch (err: any) {
      setBannerMsg({ text: err.message || "Courier sync failed", isError: true });
    } finally {
      setSyncingCourierId(null);
      setTimeout(() => setBannerMsg(null), 5500);
    }
  };

  // 1.3 Bulk Real-Time Courier Sync for all Selected Dispatched Orders
  const handleBulkSyncCouriers = async () => {
    const targets = orders.filter(
      (o) => selectedIds.includes(o.id) && Boolean(o.consignment_id || o.tracking_code || o.tracking_id)
    );
    if (targets.length === 0) {
      setBannerMsg({ text: "No dispatched orders in selection to sync.", isError: true });
      setTimeout(() => setBannerMsg(null), 3500);
      return;
    }

    setBulkSyncLoading(true);
    let count = 0;
    for (const ord of targets) {
      try {
        const res = await syncLiveCourierStatus(ord.id);
        if (res.success) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === ord.id
                ? {
                    ...o,
                    status: res.mappedStatus as any,
                    courier_name: res.courierName || o.courier_name,
                    shipping_method: res.courierName || o.shipping_method,
                    consignment_id: res.consignmentId || o.consignment_id,
                    is_courier_returned: res.isReturned,
                    is_courier_cancelled: res.isCancelled,
                    courier_webhook_note: res.statusNote,
                    shipping_address_snapshot: {
                      ...(o.shipping_address_snapshot || {}),
                      courier_name: res.courierName || o.courier_name,
                      consignment_id: res.consignmentId || o.consignment_id,
                      courier_status: res.liveStatus,
                      courier_webhook_note: res.statusNote,
                      is_courier_returned: res.isReturned,
                      is_courier_cancelled: res.isCancelled,
                      last_synced_at: new Date().toISOString(),
                    },
                  }
                : o
            )
          );
          count++;
        }
      } catch (e) {
        console.warn("Bulk sync error for order:", ord.id, e);
      }
    }
    setBulkSyncLoading(false);
    setBannerMsg({
      text: `Live Status Sync completed: Updated ${count} parcels from Courier APIs!`,
      isError: false,
    });
    setTimeout(() => setBannerMsg(null), 4500);
  };

  // 2. 1-Click Courier Dispatch (SteadFast or Pathao)
  const handleOneClickDispatch = async (
    order: any,
    courierCode: "steadfast" | "pathao",
    customWeight?: number,
    customNote?: string,
    customCod?: number
  ) => {
    const loadingKey = `${order.id}-${courierCode}`;
    setActionLoadingKey(loadingKey);
    setActionLoadingId(order.id);
    setBannerMsg(null);

    const address = order.shipping_address_snapshot || {};
    const items = order.order_items || [];
    const itemsSummary =
      items.map((it: any) => `${it.product_name_snapshot} (x${it.quantity})`).join(", ") ||
      "Skincare cosmetics parcel";
    const weight = customWeight ?? 0.5;
    const note = customNote ?? (order.public_note || "Fragile cosmetics. Call recipient before delivery.");
    const codDue = customCod !== undefined
      ? Number(customCod)
      : (order.amount_to_collect !== undefined ? Number(order.amount_to_collect) : Number(order.total));

    const res = await bookCourierDelivery({
      orderId: order.id,
      orderNumber: order.order_number,
      courierCode,
      recipientName: address.name || order.guest_name || "Customer",
      recipientPhone: address.phone || order.guest_phone || "01712345678",
      recipientAddress: address.address || "Dhaka, Bangladesh",
      district: address.district || "Dhaka City",
      thana: address.thana || "",
      codAmount: codDue,
      weightKg: weight,
      itemDescription: itemsSummary,
      specialInstruction: note,
    });

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: "shipped",
                courier_name: res.courierName,
                shipping_method: res.courierName,
                consignment_id: res.consignmentId,
                tracking_code: res.trackingId || res.consignmentId,
                tracking_id: res.trackingId || res.consignmentId,
                tracking_url: res.trackingUrl,
                shipping_address_snapshot: {
                  ...(o.shipping_address_snapshot || {}),
                  courier_name: res.courierName,
                  consignment_id: res.consignmentId,
                  tracking_code: res.trackingId || res.consignmentId,
                  tracking_id: res.trackingId || res.consignmentId,
                  tracking_url: res.trackingUrl,
                },
              }
            : o
        )
      );
      setBannerMsg({
        text: `Successfully Dispatched Order #${order.order_number} to ${res.courierName}! Consignment: ${res.consignmentId} (COD: ৳${codDue})`,
        isError: false,
      });
      setTimeout(() => setBannerMsg(null), 6000);
    } else {
      setBannerMsg({ text: res.error || "Courier booking failed.", isError: true });
      setTimeout(() => setBannerMsg(null), 8000);
    }
    setActionLoadingKey(null);
    setActionLoadingId(null);
  };

  // 2.1 Single Order Custom Dispatch Handlers (Custom COD & Custom Note)
  const handleOpenCustomDispatch = (order: any, courierCode: "steadfast" | "pathao") => {
    const cod = order.amount_to_collect !== undefined ? Number(order.amount_to_collect) : Number(order.total);
    setCustomDispatchModal({
      order,
      courierCode,
      codAmount: cod,
      weight: 0.5,
      note: order.public_note || "Fragile cosmetics. Call recipient before delivery.",
    });
  };

  const handleExecuteCustomDispatch = async () => {
    if (!customDispatchModal) return;
    setCustomDispatchLoading(true);
    await handleOneClickDispatch(
      customDispatchModal.order,
      customDispatchModal.courierCode,
      customDispatchModal.weight,
      customDispatchModal.note,
      customDispatchModal.codAmount
    );
    setCustomDispatchLoading(false);
    setCustomDispatchModal(null);
  };

  // 3. Open Anti-Fraud Block Customer Modal
  const handleOpenBlockModal = (order: any) => {
    setBlockModalOrder(order);
    setBlockReason("High RTO rate / Suspected fraudulent activity");
  };

  // 3.1 Execute Anti-Fraud Block & Order Cancellation
  const handleExecuteBlock = async () => {
    if (!blockModalOrder) return;
    setBlockLoading(true);

    const phone = blockModalOrder.shipping_address_snapshot?.phone || blockModalOrder.guest_phone || "";
    const ip = blockModalOrder.ip_address || null;

    if (phone) {
      await addBlacklistEntry({
        type: "phone",
        value: phone,
        reason: blockReason,
      });
    }

    if (ip) {
      await addBlacklistEntry({
        type: "ip",
        value: ip,
        reason: blockReason,
      });
    }

    // Cancel order and automatically restore stock via WooCommerce rules
    await updateOrderStatus(
      blockModalOrder.id,
      "cancelled",
      `Customer blacklisted and order cancelled. Reason: ${blockReason}`,
      true,
      blockReason
    );

    setOrders((prev) =>
      prev.map((o) => (o.id === blockModalOrder.id ? { ...o, status: "cancelled", is_blocked: true } : o))
    );

    setBannerMsg({
      text: `Customer (${phone || "Unknown"}) added to Blacklist and Order #${blockModalOrder.order_number} cancelled.`,
      isError: false,
    });

    setBlockLoading(false);
    setBlockModalOrder(null);
    setTimeout(() => setBannerMsg(null), 4500);
  };

  // Batch Dispatch Progress & Report State
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    current: number;
    percentage: number;
    currentOrderNumber?: string;
  } | null>(null);

  const [batchSummaryReport, setBatchSummaryReport] = useState<{
    courierName: string;
    successful: Array<{ id: string; order_number: string; consignment_id: string; tracking_url?: string; cod: number }>;
    failed: Array<{ id: string; order_number: string; phone: string; reason: string }>;
  } | null>(null);

  // 4. Open Bulk Dispatch Review Modal with individual CODs & Global Note preview
  const handleBulkCourierDispatch = (courierCode: "steadfast" | "pathao") => {
    if (selectedIds.length === 0) return;

    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    const eligibleOrders = selectedOrders.filter(
      (o) => !o.consignment_id && !o.tracking_code && (o.status === "processing" || o.status === "confirmed")
    );
    const skippedCount = selectedOrders.length - eligibleOrders.length;

    if (eligibleOrders.length === 0) {
      setBannerMsg({
        text: `No eligible processing orders in selection (${skippedCount} already dispatched, cancelled, or pending orders skipped).`,
        isError: true,
      });
      setTimeout(() => setBannerMsg(null), 4000);
      return;
    }

    setBulkReviewModal({
      courierCode,
      eligibleOrders,
      globalNote: "Fragile skincare cosmetics. Call recipient before delivery.",
    });
  };

  // 4.1 Execute Concurrent Batch Dispatch (Worker Pool Concurrency = 5)
  const executeBulkDispatchWorkerPool = async (
    courierCode: "steadfast" | "pathao",
    eligibleOrders: any[],
    globalNote: string
  ) => {
    setBulkLoading(true);
    setBannerMsg(null);
    setBatchProgress({
      total: eligibleOrders.length,
      current: 0,
      percentage: 0,
      currentOrderNumber: eligibleOrders[0]?.order_number,
    });

    const successful: Array<{ id: string; order_number: string; consignment_id: string; tracking_url?: string; cod: number }> = [];
    const failed: Array<{ id: string; order_number: string; phone: string; reason: string }> = [];

    const CONCURRENCY = 5;
    let completedCount = 0;

    const processOrder = async (order: any) => {
      const address = order.shipping_address_snapshot || {};
      const items = order.order_items || [];
      const itemsSummary = items.map((it: any) => `${it.product_name_snapshot} (x${it.quantity})`).join(", ") || "Cosmetics parcel";
      const codDue = order.amount_to_collect !== undefined ? Number(order.amount_to_collect) : Number(order.total);
      const recipientPhone = address.phone || order.guest_phone || "";
      const note = globalNote || order.public_note || "Fragile cosmetics parcel. Handle with care.";

      try {
        const res = await bookCourierDelivery({
          orderId: order.id,
          orderNumber: order.order_number,
          courierCode,
          recipientName: address.name || order.guest_name || "Customer",
          recipientPhone,
          recipientAddress: address.address || "Dhaka, Bangladesh",
          district: address.district || "Dhaka City",
          thana: address.thana || "",
          codAmount: codDue,
          weightKg: 0.5,
          itemDescription: itemsSummary,
          specialInstruction: note,
        });

        if (res.success) {
          successful.push({
            id: order.id,
            order_number: order.order_number,
            consignment_id: res.consignmentId,
            tracking_url: res.trackingUrl,
            cod: codDue,
          });

          setOrders((prev) =>
            prev.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: "shipped",
                    courier_name: res.courierName,
                    consignment_id: res.consignmentId,
                    tracking_code: res.trackingId,
                    tracking_url: res.trackingUrl,
                  }
                : o
            )
          );
        } else {
          failed.push({
            id: order.id,
            order_number: order.order_number,
            phone: recipientPhone,
            reason: res.error || "Courier API rejected booking",
          });
        }
      } catch (err: any) {
        failed.push({
          id: order.id,
          order_number: order.order_number,
          phone: recipientPhone,
          reason: err.message || "Network timeout during courier dispatch",
        });
      } finally {
        completedCount++;
        const nextOrder = eligibleOrders[completedCount];
        setBatchProgress({
          total: eligibleOrders.length,
          current: completedCount,
          percentage: Math.round((completedCount / eligibleOrders.length) * 100),
          currentOrderNumber: nextOrder ? nextOrder.order_number : undefined,
        });
      }
    };

    // Run pool
    const queue = [...eligibleOrders];
    const workers = Array(Math.min(CONCURRENCY, queue.length))
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const order = queue.shift();
          if (order) await processOrder(order);
        }
      });

    await Promise.all(workers);

    setBulkLoading(false);
    setBatchProgress(null);
    setSelectedIds([]);

    // Open Batch Summary Report Modal
    setBatchSummaryReport({
      courierName: courierCode === "steadfast" ? "SteadFast Courier" : "Pathao Express",
      successful,
      failed,
    });
  };

  // 5. Bulk Status Change with State Validation
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);

    for (const id of selectedIds) {
      await updateOrderStatus(id, newStatus);
    }

    setOrders((prev) =>
      prev.map((o) => (selectedIds.includes(o.id) ? { ...o, status: newStatus } : o))
    );
    setSelectedIds([]);
    setBulkLoading(false);
    setBannerMsg({
      text: `Updated ${selectedIds.length} orders to status: ${newStatus.toUpperCase()}`,
      isError: false,
    });
    setTimeout(() => setBannerMsg(null), 3000);
  };

  // 6. Bulk Export to CSV
  const handleExportCSV = () => {
    const exportTargets = selectedIds.length > 0 ? orders.filter((o) => selectedIds.includes(o.id)) : filteredOrders;
    if (exportTargets.length === 0) return;

    const headers = ["Order Number", "Date", "Customer Name", "Phone", "District", "Address", "Total", "Payment Method", "Status", "Courier", "Consignment ID"];
    const rows = exportTargets.map((o) => {
      const addr = o.shipping_address_snapshot || {};
      return [
        o.order_number,
        new Date(o.created_at).toLocaleDateString("en-GB"),
        `"${addr.name || o.guest_name || ""}"`,
        `"${addr.phone || o.guest_phone || ""}"`,
        `"${addr.district || ""}"`,
        `"${addr.address || ""}"`,
        o.total,
        o.payment_method,
        o.status,
        o.courier_name || "",
        o.consignment_id || "",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecomx_orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 7. Manual Order Creation Handler
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.phone || !createForm.address) {
      alert("Please fill in customer name, phone number, and street address.");
      return;
    }

    setCreatingOrder(true);
    const res = await createOrder({
      customer: {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || undefined,
        district: createForm.district,
        thana: createForm.thana.trim() || createForm.district,
        address: createForm.address.trim(),
        notes: createForm.notes.trim() || undefined,
      },
      items: [
        {
          product_id: "cosrx-snail-96",
          name: createForm.productName,
          price: createForm.productPrice,
          quantity: createForm.quantity,
        },
      ],
      shipping: {
        method: createForm.district.toLowerCase().includes("dhaka") ? "Inside Dhaka Express" : "Outside Dhaka Courier",
        amount: createForm.deliveryFee,
      },
    });

    if (res.error) {
      alert(`Error creating order: ${res.error}`);
    } else if (res.order) {
      setOrders((prev) => [res.order, ...prev]);
      setShowCreateModal(false);
      setBannerMsg({ text: `Order #${res.order.order_number} created successfully!`, isError: false });
      setTimeout(() => setBannerMsg(null), 4000);
      setCreateForm({
        name: "",
        phone: "",
        email: "",
        district: "Dhaka City",
        thana: "",
        address: "",
        productName: "COSRX Advanced Snail 96 Mucin Power Essence",
        productPrice: 1365,
        quantity: 1,
        deliveryFee: 60,
        notes: "Manual order placed via Phone/WhatsApp",
      });
    }
    setCreatingOrder(false);
  };

  // Selection Toggles
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    confirmed: "bg-blue-50 text-blue-800 border-blue-200",
    processing: "bg-indigo-50 text-indigo-800 border-indigo-200",
    "on-hold": "bg-orange-50 text-orange-800 border-orange-200",
    on_hold: "bg-orange-50 text-orange-800 border-orange-200",
    packed: "bg-purple-50 text-purple-800 border-purple-200",
    ready_for_pickup: "bg-cyan-50 text-cyan-800 border-cyan-200",
    shipped: "bg-teal-50 text-teal-800 border-teal-200",
    in_transit: "bg-teal-50 text-teal-800 border-teal-200",
    out_for_delivery: "bg-sky-50 text-sky-800 border-sky-200",
    delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    failed: "bg-red-50 text-red-800 border-red-200",
    return_requested: "bg-rose-50 text-rose-800 border-rose-200",
    returned: "bg-rose-50 text-rose-800 border-rose-200",
    refunded: "bg-purple-50 text-purple-800 border-purple-200",
  };

  const tabs = [
    { label: t("tab_all"), value: "all", count: orders.length },
    {
      label: "PAID ONLINE",
      value: "paid-online",
      count: orders.filter((o) => o.payment_status === "paid").length,
    },
    { label: t("tab_pending"), value: "pending", count: orders.filter((o) => o.status === "pending").length },
    {
      label: t("tab_processing"),
      value: "processing",
      count: orders.filter((o) => o.status === "processing" || o.status === "confirmed" || o.status === "packed" || o.status === "ready_for_pickup").length,
    },
    {
      label: t("tab_on_hold", "On Hold"),
      value: "on-hold",
      count: orders.filter((o) => o.status === "on-hold" || o.status === "on_hold").length,
    },
    {
      label: t("tab_delivered"),
      value: "completed",
      count: orders.filter((o) => o.status === "completed" || o.status === "delivered" || o.status === "shipped" || o.status === "in_transit" || o.status === "out_for_delivery").length,
    },
    { label: t("tab_cancelled"), value: "cancelled", count: orders.filter((o) => o.status === "cancelled").length },
    {
      label: t("returns_rto"),
      value: "courier-returns",
      count: orders.filter((o) => o.is_courier_returned || o.is_courier_cancelled || o.status === "returned" || (o.status === "failed" && Boolean(o.consignment_id))).length,
    },
    { label: t("tab_returned"), value: "failed", count: orders.filter((o) => o.status === "failed" || o.status === "returned" || o.status === "refunded").length },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e91e63] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              {t("orders_hub_title", "Orders & 1-Click Automation Hub")}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("orders_hub_desc", "Instant 1-Click SteadFast / Pathao dispatch, phone/IP blocklist, dynamic WhatsApp templates, and 4×6 thermal labels.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Refresh Orders Button */}
          <Button
            onClick={handleRefreshOrders}
            disabled={isRefreshingOrders}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            title="Refresh latest orders from database"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshingOrders ? "animate-spin text-[#e91e63]" : "text-gray-600"}`} />
            {isRefreshingOrders ? "Refreshing..." : "Refresh"}
          </Button>

          {/* + Create New Manual Order Button */}
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("create_order_btn", "Create Order")}
          </Button>

          {/* Export CSV */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-gray-300"
            title="Export filtered orders to CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-gray-600" />
            {t("export_csv_btn", "Export CSV")}
          </Button>

          <Link href="/admin/orders/incomplete">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl border-gray-300">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#e91e63]" />
              {t("incomplete_leads_btn", "Incomplete Leads")}
            </Button>
          </Link>
          <Link href="/admin/orders/fraud">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl border-red-200 text-red-700 hover:bg-red-50">
              <ShieldAlert className="h-3.5 w-3.5 mr-1 text-red-600" />
              {t("fraud_blocklist_btn", "Fraud & Blocklist")}
            </Button>
          </Link>
          <Link href="/admin/orders/settings">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl border-gray-300">
              {t("automation_rules_btn", "Automation Rules")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Notification Banner (Floating & In-page) */}
      {bannerMsg && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-lg rounded-2xl border p-4 text-xs font-bold shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-top-4 duration-200 ${
            bannerMsg.isError
              ? "border-red-300 bg-red-600 text-white shadow-red-500/20"
              : "border-emerald-300 bg-emerald-600 text-white shadow-emerald-500/20"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="p-1 bg-white/20 rounded-lg shrink-0 mt-0.5">
              {bannerMsg.isError ? <X className="h-4 w-4 text-white" /> : <Zap className="h-4 w-4 text-white" />}
            </span>
            <span className="leading-relaxed whitespace-pre-wrap">{bannerMsg.text}</span>
          </div>
          <button
            onClick={() => setBannerMsg(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Floating Bulk Action Bar with Smart Counter & Progress Bar */}
      {selectedIds.length > 0 && (
        <div className="rounded-3xl bg-gray-900 text-white p-4 shadow-2xl space-y-3 animate-in slide-in-from-top-2 border border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-[#e91e63] animate-pulse" />
              <div>
                <span className="text-xs font-black block">
                  {selectedIds.length} Order{selectedIds.length === 1 ? "" : "s"} Selected
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {orders.filter((o) => selectedIds.includes(o.id) && !o.consignment_id && o.status !== "cancelled").length} Ready for Dispatch •{" "}
                  {orders.filter((o) => selectedIds.includes(o.id) && Boolean(o.consignment_id)).length} Already Shipped
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => handleBulkCourierDispatch("steadfast")}
                disabled={bulkLoading || bulkSyncLoading}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm"
              >
                {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Truck className="h-3.5 w-3.5 mr-1" />}
                Bulk SteadFast (5x Fast)
              </Button>

              <Button
                onClick={() => handleBulkCourierDispatch("pathao")}
                disabled={bulkLoading || bulkSyncLoading}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-sm"
              >
                Bulk Pathao
              </Button>

              <Button
                onClick={handleBulkSyncCouriers}
                disabled={bulkLoading || bulkSyncLoading}
                size="sm"
                variant="outline"
                className="text-xs font-bold rounded-xl border-emerald-600 text-emerald-300 hover:bg-emerald-950/60"
                title="Query live delivery status from SteadFast/Pathao API for all selected parcels"
              >
                {bulkSyncLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-emerald-400" /> : <RefreshCw className="h-3.5 w-3.5 mr-1 text-emerald-400" />}
                Sync Live Status
              </Button>

              <Button
                onClick={() => handleBulkStatusUpdate("confirmed")}
                disabled={bulkLoading || bulkSyncLoading}
                size="sm"
                variant="outline"
                className="text-xs font-bold rounded-xl border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark Confirmed
              </Button>

              <button
                onClick={() => setSelectedIds([])}
                disabled={bulkLoading || bulkSyncLoading}
                className="text-xs text-gray-400 hover:text-white font-bold ml-2 underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Real-Time Concurrency Progress Bar */}
          {batchProgress && (
            <div className="pt-2 border-t border-gray-800 space-y-1.5 animate-in fade-in-0">
              <div className="flex justify-between text-[11px] font-bold text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-[#e91e63]" />
                  Dispatching #{batchProgress.currentOrderNumber}...
                </span>
                <span>
                  {batchProgress.current} / {batchProgress.total} ({batchProgress.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-[#e91e63] transition-all duration-300 rounded-full"
                  style={{ width: `${batchProgress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs & Search Controls */}
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab.value
                    ? "bg-[#e91e63] text-white shadow-xs"
                    : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === tab.value ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-80 relative">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_orders")}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3.5 py-2 text-xs font-medium text-gray-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Interactive Orders Table (Desktop: md+) & Responsive Mobile Cards (Mobile: <md) */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-black border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63]"
                  />
                </th>
                <th className="px-4 py-3.5">{t("column_order")}</th>
                <th className="px-4 py-3.5">{t("column_customer")}</th>
                <th className="px-4 py-3.5">{t("column_items", "Address & Items")}</th>
                <th className="px-4 py-3.5">{t("column_amount")}</th>
                <th className="px-4 py-3.5">{t("column_status")}</th>
                <th className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center justify-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-[#e91e63]" />
                    <span>{t("action_send_courier")}</span>
                  </span>
                </th>
                <th className="px-4 py-3.5 text-right">{t("column_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                    {t("no_orders")}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const addr = ord.shipping_address_snapshot || {};
                  const isChecked = selectedIds.includes(ord.id);
                  const phone = addr.phone || ord.guest_phone || "01700000000";
                  const rawPhone = phone.replace(/[^0-9]/g, "");
                  const bdPhone = rawPhone.startsWith("88") ? rawPhone : `88${rawPhone}`;
                  const customerName = addr.name || ord.guest_name || "Customer";
                  const consignment =
                    ord.consignment_id ||
                    ord.tracking_code ||
                    ord.tracking_id ||
                    addr.consignment_id ||
                    addr.tracking_id ||
                    addr.tracking_code ||
                    "";
                  const activeCid = consignment;
                  const rawCourier = (
                    ord.courier_name ||
                    ord.shipping_method ||
                    addr.courier_name ||
                    (activeCid.startsWith("PTH") || activeCid.startsWith("DE") ? "Pathao Courier" : activeCid.startsWith("SF") ? "SteadFast Courier" : "")
                  ).trim();
                  const isPathao = rawCourier.toLowerCase().includes("pathao") || activeCid.startsWith("PTH") || activeCid.startsWith("DE");
                  const isSteadfast = rawCourier.toLowerCase().includes("steadfast") || activeCid.startsWith("SF") || (!isPathao && Boolean(activeCid));
                  const courierBrand = isPathao ? "Pathao" : isSteadfast ? "SteadFast" : (rawCourier || "SteadFast");
                  const courier = isPathao ? "Pathao Courier" : isSteadfast ? "SteadFast Courier" : (rawCourier || "SteadFast Courier");
                  const isShipped = ord.status === "shipped" || Boolean(activeCid);
                  const isLoading = actionLoadingId === ord.id;
                  const isRet = Boolean(ord.is_courier_returned || ord.status === "returned" || (ord.status === "failed" && Boolean(activeCid)));
                  const isCanc = Boolean(ord.is_courier_cancelled || (ord.status === "cancelled" && Boolean(activeCid)));
                  const webhookNote = ord.courier_webhook_note || ord.admin_note || "";

                  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "");

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isRet
                          ? "bg-rose-50/30"
                          : isCanc
                          ? "bg-amber-50/20"
                          : isChecked
                          ? "bg-pink-50/30"
                          : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(ord.id)}
                          className="rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63]"
                        />
                      </td>

                      {/* Order Number & Consignment Code & Courier Return Indicator */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="font-mono font-black text-[#e91e63] hover:underline"
                          >
                            {ord.order_number}
                          </Link>
                          <button
                            onClick={() => setQuickViewOrder(ord)}
                            title="Quick View Order Details"
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {new Date(ord.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>

                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {ord.payment_status === "paid" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              <span>{ord.payment_method === "bkash" ? "bKash (PAID)" : "PAID"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                              {ord.payment_method === "cod" || !ord.payment_method ? "COD" : ord.payment_method}
                            </span>
                          )}
                        </div>

                        {consignment && (
                          <div className="inline-flex items-center gap-1 mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            <span>{consignment}</span>
                            <button
                              onClick={() => handleCopy(consignment, ord.id)}
                              title="Copy Tracking ID"
                              className="hover:text-emerald-950"
                            >
                              {copiedId === ord.id ? (
                                <Check className="h-2.5 w-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Prominent Courier Webhook Return / Cancel Badges */}
                        {isRet && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider w-fit">
                              <RotateCcw className="h-2.5 w-2.5 text-rose-700 animate-pulse" />
                              <span>Courier Returned (RTO)</span>
                            </span>
                            {webhookNote && (
                              <span className="text-[9px] text-rose-600 font-medium max-w-44 truncate" title={webhookNote}>
                                {webhookNote}
                              </span>
                            )}
                          </div>
                        )}

                        {isCanc && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider w-fit">
                              <Ban className="h-2.5 w-2.5 text-amber-700" />
                              <span>Courier Cancelled</span>
                            </span>
                            {webhookNote && (
                              <span className="text-[9px] text-amber-700 font-medium max-w-44 truncate" title={webhookNote}>
                                {webhookNote}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Customer Info & 1-Click WhatsApp / Call / Block */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 block">{customerName}</span>
                          {ord.risk_profile && (
                            ord.risk_profile.risk_level === "blocked" ? (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1"
                                title={ord.risk_profile.flags.join(" • ") || "Customer is on fraud blocklist"}
                              >
                                <Ban className="h-2.5 w-2.5 text-rose-700" />
                                <span>Blocked</span>
                              </span>
                            ) : ord.risk_profile.risk_level === "high" ? (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1"
                                title={ord.risk_profile.flags.join(" • ") || "High Risk / High RTO probability"}
                              >
                                <ShieldAlert className="h-2.5 w-2.5 text-red-600" />
                                <span>High Risk</span>
                              </span>
                            ) : ord.risk_profile.risk_level === "medium" ? (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1"
                                title={ord.risk_profile.flags.join(" • ") || "Medium Risk"}
                              >
                                <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                                <span>Med Risk</span>
                              </span>
                            ) : (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                                title="Low Risk • Valid Bangladeshi mobile • Clear delivery record"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                <span>Safe</span>
                              </span>
                            )
                          )}
                          <BDCourierBadge phone={phone} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-gray-600 font-mono font-bold text-[11px]">{phone}</span>

                          {/* 1-Click Direct Call */}
                          <a
                            href={`tel:${phone}`}
                            title="Direct Call Customer"
                            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Phone className="h-3.5 w-3.5 text-blue-600" />
                          </a>

                          {/* 1-Click WhatsApp Menu with Templates */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenWhatsAppId(openWhatsAppId === ord.id ? null : ord.id)
                              }
                              title="WhatsApp Instant Messages"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>

                            {openWhatsAppId === ord.id && (
                              <div className="absolute left-0 mt-1 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 text-[11px] space-y-1 animate-in fade-in-0">
                                <div className="flex items-center justify-between px-2 py-0.5 border-b border-gray-100 pb-1">
                                  <span className="font-black text-[9px] uppercase text-gray-400">
                                    WhatsApp Actions
                                  </span>
                                  <Link
                                    href="/admin/communication/whatsapp"
                                    onClick={() => setOpenWhatsAppId(null)}
                                    className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800"
                                  >
                                    Manage ⚙️
                                  </Link>
                                </div>
                                <a
                                  href={generateWhatsAppOrderMessage(ord, "confirm", 120, waTemplates)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenWhatsAppId(null)}
                                  className="block px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                                >
                                  Order Confirmed
                                </a>
                                <a
                                  href={generateWhatsAppOrderMessage(ord, "shipped", 120, waTemplates)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenWhatsAppId(null)}
                                  className="block px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                                >
                                  Courier Live Tracking
                                </a>
                                <a
                                  href={generateWhatsAppOrderMessage(ord, "advance", 120, waTemplates)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenWhatsAppId(null)}
                                  className="block px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                                >
                                  Request Advance
                                </a>
                                <a
                                  href={generateWhatsAppOrderMessage(ord, "review", 120, waTemplates)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenWhatsAppId(null)}
                                  className="block px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                                >
                                  Review Request
                                </a>
                                <a
                                  href={generateWhatsAppOrderMessage(ord, "cancelled", 120, waTemplates)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenWhatsAppId(null)}
                                  className="block px-2 py-1.5 rounded-lg hover:bg-rose-50 text-rose-800 font-bold"
                                >
                                  Order Cancelled
                                </a>
                                <a
                                  href={generateWhatsAppOrderMessage(ord, "refund", 120, waTemplates)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenWhatsAppId(null)}
                                  className="block px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 font-bold"
                                >
                                  Refund Processed
                                </a>
                              </div>
                            )}
                          </div>

                          {/* 1-Click Block Number & IP Modal Trigger */}
                          <button
                            onClick={() => handleOpenBlockModal(ord)}
                            title="Block Customer & Security Blacklist"
                            className="p-1 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Destination & Ordered Items */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-gray-900 block">{addr.district || "Dhaka City"}</span>
                        <span className="text-[11px] text-gray-500 truncate max-w-37.5 block">
                          {addr.address || addr.thana}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                          {ord.order_items?.length || 1} Item(s)
                        </span>
                      </td>

                      {/* Amount Due & WooCommerce Status Subtext */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {(() => {
                          const isPaid = ord.payment_status === "paid";
                          const isBkash = ord.payment_method === "bkash" || Boolean(ord.public_note?.toLowerCase().includes("bkash"));
                          const trxMatch =
                            ord.public_note?.match(/TrxID:\s*([A-Za-z0-9]+)/i) ||
                            (ord.order_status_history || [])
                              .map((h: any) => h.note?.match(/TrxID:\s*([A-Za-z0-9]+)/i))
                              .find(Boolean);
                          const rowTrxId = trxMatch ? trxMatch[1] : null;

                          return (
                            <div>
                              <div className="flex items-center gap-1.5">
                                {isPaid ? (
                                  <div>
                                    <span className="font-black text-emerald-700 text-sm tracking-tight block">
                                      ৳0 (PAID)
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold block">
                                      Total: {formatPrice(ord.total)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-black text-gray-900 text-sm tracking-tight block">
                                    {formatPrice(ord.amount_to_collect !== undefined ? ord.amount_to_collect : ord.total)}
                                  </span>
                                )}
                              </div>

                              {Number(ord.advance_paid) > 0 && !isPaid && (
                                <div className="inline-flex items-center gap-1 mt-1">
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    ৳{ord.advance_paid} Advance Paid
                                  </span>
                                </div>
                              )}

                              {/* Status Subtext Badge */}
                              {isPaid ? (
                                <div className="mt-1 space-y-0.5">
                                  <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                                    ✓ PAID ONLINE ({isBkash ? "BKASH" : (ord.payment_method || "ONLINE").toUpperCase()})
                                  </span>
                                  {rowTrxId && (
                                    <span
                                      className="text-[8.5px] font-mono font-bold text-gray-500 block truncate max-w-36"
                                      title={`bKash Transaction ID: ${rowTrxId}`}
                                    >
                                      Trx: {rowTrxId}
                                    </span>
                                  )}
                                </div>
                              ) : isRet ? (
                                <span className="text-[10px] uppercase font-bold text-rose-700 block mt-1">COURIER RTO</span>
                              ) : isCanc ? (
                                <span className="text-[10px] uppercase font-bold text-amber-700 block mt-1">COURIER CANCELLED</span>
                              ) : ord.status === "completed" || ord.status === "delivered" ? (
                                <span className="inline-block mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase">
                                  COD (COLLECTED)
                                </span>
                              ) : ord.status === "on-hold" ? (
                                <span className="text-[10px] uppercase font-bold text-orange-600 block mt-1">AWAITING VERIFICATION</span>
                              ) : ord.status === "cancelled" ? (
                                <span className="text-[10px] uppercase font-bold text-gray-400 block mt-1">CANCELLED</span>
                              ) : ord.status === "refunded" ? (
                                <span className="text-[10px] uppercase font-bold text-purple-600 block mt-1">REFUNDED</span>
                              ) : ord.status === "failed" || ord.status === "returned" ? (
                                <span className="text-[10px] uppercase font-bold text-red-600 block mt-1">RTO (VOID)</span>
                              ) : ord.status === "processing" || ord.status === "confirmed" ? (
                                <span className="text-[10px] uppercase font-bold text-blue-600 block mt-1">COD (PENDING)</span>
                              ) : (
                                <span className="text-[10px] uppercase font-bold text-amber-600 block mt-1">
                                  {ord.payment_method === "cod" ? "COD (PENDING)" : "UNPAID"}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status Dropdown with Dynamic WooCommerce FSM Filtering & Override Option */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {(() => {
                          const availableOptions = getAvailableNextStatuses(ord.status);
                          return (
                            <select
                              value={ord.status}
                              disabled={isLoading}
                              onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize focus:outline-none cursor-pointer transition-colors shadow-2xs ${
                                statusColors[ord.status] || "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {availableOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-medium">
                                  {opt.label}
                                </option>
                              ))}
                              <option disabled className="text-gray-300">──────────</option>
                              <option value="__override__" className="bg-amber-50 text-amber-900 font-bold">
                                Force Override Status...
                              </option>
                            </select>
                          );
                        })()}

                        {/* CAPI Purchase Status Badge */}
                        {Boolean(ord.shipping_address_snapshot?.purchase_capi_fired_at) ? (
                          <div
                            className="flex items-center gap-1 mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md w-fit"
                            title={`CAPI Purchase Fired at ${new Date(ord.shipping_address_snapshot.purchase_capi_fired_at).toLocaleTimeString()}`}
                          >
                            <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                            <span>CAPI Fired ✓</span>
                          </div>
                        ) : (ord.status === "completed" || ord.status === "delivered") ? (
                          <div
                            className="flex items-center gap-1 mt-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md w-fit"
                            title="Order completed; CAPI trigger ready"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-blue-600" />
                            <span>CAPI Ready</span>
                          </div>
                        ) : null}
                      </td>

                      {/* 1-Click Courier Dispatch & Real-time API Sync */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {(() => {
                          const isSyncing = syncingCourierId === ord.id;
                          const isDelivered = ord.status === "completed" || ord.status === "delivered";
                          const isHold = ord.status === "on-hold" || ord.status === "on_hold";
                          const trackUrl = buildCourierTrackingUrl(courier, activeCid, ord.tracking_url);

                          const isAlreadyDispatched = Boolean(
                            activeCid ||
                            ord.status === "shipped" ||
                            ord.status === "in_transit" ||
                            ord.status === "out_for_delivery" ||
                            ((isDelivered || ord.status === "completed" || ord.status === "delivered") && Boolean(rawCourier || activeCid)) ||
                            (isRet && Boolean(rawCourier || activeCid)) ||
                            (isCanc && Boolean(rawCourier || activeCid))
                          );

                          if (isAlreadyDispatched) {
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <a
                                    href={trackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 font-bold text-xs h-6 px-2.5 rounded-lg border transition-all shadow-2xs ${
                                      isRet
                                        ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                                        : isCanc
                                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                        : isDelivered
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                        : isHold
                                        ? "bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100"
                                        : isPathao
                                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                        : "bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                    }`}
                                    title={`Click to open official live tracking for ${courierBrand}`}
                                  >
                                    {isRet ? (
                                      <RotateCcw className="h-3 w-3 text-rose-600 shrink-0 animate-pulse" />
                                    ) : isCanc ? (
                                      <Ban className="h-3 w-3 text-amber-600 shrink-0" />
                                    ) : isDelivered ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                    ) : isHold ? (
                                      <AlertTriangle className="h-3 w-3 text-orange-600 shrink-0" />
                                    ) : (
                                      <Truck className={`h-3 w-3 ${isPathao ? "text-red-600" : "text-emerald-600"} shrink-0 animate-pulse`} />
                                    )}
                                    <span>
                                      {isRet
                                        ? `RTO Return (${courierBrand})`
                                        : isCanc
                                        ? `Cancelled (${courierBrand})`
                                        : isDelivered
                                        ? `Delivered (${courierBrand})`
                                        : isHold
                                        ? `On Hold (${courierBrand})`
                                        : `In Transit (${courierBrand})`}
                                    </span>
                                    <ExternalLink className="h-2.5 w-2.5 opacity-60 shrink-0" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleSyncSingleCourier(ord.id)}
                                    disabled={isSyncing}
                                    className={`h-6 w-6 flex items-center justify-center rounded-lg border transition-colors shadow-2xs cursor-pointer ${
                                      isSyncing
                                        ? "bg-pink-50 border-pink-300 text-[#e91e63]"
                                        : isRet
                                        ? "border-rose-200 bg-white hover:bg-rose-50 text-rose-700"
                                        : isCanc
                                        ? "border-amber-200 bg-white hover:bg-amber-50 text-amber-700"
                                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                                    }`}
                                    title="Query live delivery status from Courier API (Updates Order Status in Real Time)"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#e91e63]" : ""}`} />
                                  </button>
                                </div>

                                {activeCid ? (
                                  <div className="flex items-center gap-1">
                                    <div className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-gray-800">
                                      <span>CID: {activeCid}</span>
                                      <button
                                        onClick={() => handleCopy(activeCid, ord.id)}
                                        title="Copy Consignment ID"
                                        className="hover:text-gray-950 p-0.5"
                                      >
                                        {copiedId === ord.id ? (
                                          <Check className="h-2.5 w-2.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-2.5 w-2.5 text-gray-500" />
                                        )}
                                      </button>
                                    </div>

                                    {(isRet || isCanc) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCustomDispatch(ord, isPathao ? "pathao" : "steadfast")}
                                        className="text-[9px] font-bold text-[#e91e63] hover:underline bg-pink-50 border border-pink-200 px-1 py-0.5 rounded"
                                        title="Re-dispatch this parcel to courier"
                                      >
                                        Re-book ⚡
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }

                          const isDispatchable =
                            ord.status === "processing" ||
                            ord.status === "confirmed" ||
                            ord.status === "pending" ||
                            ord.status === "packed" ||
                            ord.status === "ready_for_pickup";

                          if (isDispatchable) {
                            const isSteadfastLoading = actionLoadingKey === `${ord.id}-steadfast`;
                            const isPathaoLoading = actionLoadingKey === `${ord.id}-pathao`;
                            const isAnyLoading = isLoading || isSteadfastLoading || isPathaoLoading;

                            return (
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  onClick={() => handleOneClickDispatch(ord, "steadfast")}
                                  disabled={isAnyLoading}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] h-7 px-2 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-75"
                                  title="1-Click Dispatch to SteadFast Courier"
                                >
                                  {isSteadfastLoading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      <span>SteadFast</span>
                                    </span>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleOneClickDispatch(ord, "pathao")}
                                  disabled={isAnyLoading}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 bg-red-50/50 text-red-700 hover:bg-red-100/80 font-black text-[11px] h-7 px-2 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-75"
                                  title="1-Click Dispatch to Pathao Express"
                                >
                                  {isPathaoLoading ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                      <span>Pathao</span>
                                    </span>
                                  )}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCustomDispatch(ord, "steadfast")}
                                  disabled={isAnyLoading}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                                  title="Custom Dispatch (Edit COD Amount, Courier Gateway, Weight & Delivery Note)"
                                >
                                  <Sliders className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              className="inline-flex items-center justify-center gap-1 text-gray-400 font-bold text-[11px] bg-gray-50 h-7 px-3 rounded-xl border border-gray-200 cursor-not-allowed"
                              title={`Courier dispatch is locked because order is ${ord.status.toUpperCase()}`}
                            >
                              <span>Locked ({ord.status})</span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Action Links & Printing */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1-Click A4 Invoice */}
                          <Link
                            href={`/admin/orders/${ord.id}/invoice`}
                            target="_blank"
                            title="Print A4 Invoice / 4×6 Thermal Label"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg border border-gray-200">
                              <Printer className="h-3.5 w-3.5 text-gray-700" />
                            </Button>
                          </Link>

                          {/* Full Detail Link */}
                          <Link href={`/admin/orders/${ord.id}`}>
                            <Button
                              size="sm"
                              className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-[11px] font-bold rounded-lg h-7 px-2.5"
                            >
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (< md): Touch-Friendly Responsive Cards Layout */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-medium text-xs">
              No orders match your filter criteria.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const addr = ord.shipping_address_snapshot || {};
              const isChecked = selectedIds.includes(ord.id);
              const phone = addr.phone || ord.guest_phone || "01700000000";
              const rawPhone = phone.replace(/[^0-9]/g, "");
              const bdPhone = rawPhone.startsWith("88") ? rawPhone : `88${rawPhone}`;
              const customerName = addr.name || ord.guest_name || "Customer";
              const consignment =
                ord.consignment_id ||
                ord.tracking_code ||
                ord.tracking_id ||
                addr.consignment_id ||
                addr.tracking_id ||
                addr.tracking_code ||
                "";
              const activeCid = consignment;
              const rawCourier = (
                ord.courier_name ||
                ord.shipping_method ||
                addr.courier_name ||
                (activeCid.startsWith("PTH") || activeCid.startsWith("DE") ? "Pathao Courier" : activeCid.startsWith("SF") ? "SteadFast Courier" : "")
              ).trim();
              const isPathao = rawCourier.toLowerCase().includes("pathao") || activeCid.startsWith("PTH") || activeCid.startsWith("DE");
              const isSteadfast = rawCourier.toLowerCase().includes("steadfast") || activeCid.startsWith("SF") || (!isPathao && Boolean(activeCid));
              const courierBrand = isPathao ? "Pathao" : isSteadfast ? "SteadFast" : (rawCourier || "SteadFast");
              const courier = isPathao ? "Pathao Courier" : isSteadfast ? "SteadFast Courier" : (rawCourier || "SteadFast Courier");
              const isLoading = actionLoadingId === ord.id;
              const isRet = Boolean(ord.is_courier_returned || ord.status === "returned" || (ord.status === "failed" && Boolean(activeCid)));
              const isCanc = Boolean(ord.is_courier_cancelled || (ord.status === "cancelled" && Boolean(activeCid)));
              const webhookNote = ord.courier_webhook_note || ord.admin_note || "";
              const isProcessing = ord.status === "processing" || ord.status === "confirmed";
              const isDispatched = Boolean(activeCid || ord.status === "shipped" || ord.status === "completed" || ord.status === "delivered");

              return (
                <div
                  key={ord.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isRet
                      ? "bg-rose-50/40"
                      : isCanc
                      ? "bg-amber-50/30"
                      : isChecked
                      ? "bg-pink-50/40"
                      : "bg-white"
                  }`}
                >
                  {/* Top Card Row: Checkbox, Order #, Created Date & Status dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(ord.id)}
                        className="rounded border-gray-300 text-[#e91e63] focus:ring-[#e91e63] h-4 w-4"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="font-mono font-black text-sm text-[#e91e63] hover:underline"
                          >
                            {ord.order_number}
                          </Link>
                          <button
                            onClick={() => setQuickViewOrder(ord)}
                            title="Quick View"
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {new Date(ord.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status Select */}
                    <div>
                      {(() => {
                        const availableOptions = getAvailableNextStatuses(ord.status);
                        return (
                          <select
                            value={ord.status}
                            disabled={isLoading}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            className={`rounded-xl border px-2.5 py-1 text-xs font-bold capitalize focus:outline-none cursor-pointer shadow-2xs ${
                              statusColors[ord.status] || "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {availableOptions.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-medium">
                                {opt.label}
                              </option>
                            ))}
                            <option disabled className="text-gray-300">──────</option>
                            <option value="__override__" className="bg-amber-50 text-amber-900 font-bold">
                              Override...
                            </option>
                          </select>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Customer Info, Risk Badge & 1-Click Contacts */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-gray-900 text-xs">{customerName}</span>
                      {ord.risk_profile && (
                        ord.risk_profile.risk_level === "blocked" ? (
                          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                            <Ban className="h-2.5 w-2.5 text-rose-700" />
                            <span>Blocked</span>
                          </span>
                        ) : ord.risk_profile.risk_level === "high" ? (
                          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1">
                            <ShieldAlert className="h-2.5 w-2.5 text-red-600" />
                            <span>High Risk</span>
                          </span>
                        ) : ord.risk_profile.risk_level === "medium" ? (
                          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                            <span>Med Risk</span>
                          </span>
                        ) : (
                          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            <span>Safe</span>
                          </span>
                        )
                      )}
                      <BDCourierBadge phone={phone} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700 font-mono font-bold text-xs">{phone}</span>
                      <a
                        href={`tel:${phone}`}
                        title="Call Customer"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <div className="relative">
                        <button
                          onClick={() => setOpenWhatsAppId(openWhatsAppId === ord.id ? null : ord.id)}
                          title="WhatsApp Options"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>

                        {openWhatsAppId === ord.id && (
                          <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50 text-[11px] space-y-1">
                            <a
                              href={generateWhatsAppOrderMessage(ord, "confirm", 120, waTemplates)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenWhatsAppId(null)}
                              className="block px-2 py-1 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                            >
                              Order Confirmed
                            </a>
                            <a
                              href={generateWhatsAppOrderMessage(ord, "shipped", 120, waTemplates)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenWhatsAppId(null)}
                              className="block px-2 py-1 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                            >
                              Live Courier Tracking
                            </a>
                            <a
                              href={generateWhatsAppOrderMessage(ord, "advance", 120, waTemplates)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenWhatsAppId(null)}
                              className="block px-2 py-1 rounded-lg hover:bg-emerald-50 text-gray-800 font-bold"
                            >
                              Request Advance
                            </a>
                            <a
                              href={generateWhatsAppOrderMessage(ord, "cancelled", 120, waTemplates)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenWhatsAppId(null)}
                              className="block px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-800 font-bold"
                            >
                              Order Cancelled
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenBlockModal(ord)}
                        title="Block Number"
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Destination & Financials */}
                  <div className="bg-gray-50 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{addr.district || "Dhaka City"}</span>
                      <span className="text-[11px] text-gray-500 line-clamp-1">{addr.address || addr.thana}</span>
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">{ord.order_items?.length || 1} Item(s)</span>
                    </div>
                    <div className="text-right">
                      {ord.payment_status === "paid" ? (
                        <div>
                          <span className="font-black text-emerald-700 text-sm block">
                            ৳0 (PAID)
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                            {ord.payment_method === "bkash" ? "bKash Paid" : "Paid Online"}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-black text-gray-900 text-sm block">
                            {formatPrice(ord.amount_to_collect !== undefined ? ord.amount_to_collect : ord.total)}
                          </span>
                          {Number(ord.advance_paid) > 0 ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                              ৳{ord.advance_paid} Advance
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-gray-400">COD Due</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Courier Tracking & Actions */}
                  {(() => {
                    const isSyncing = syncingCourierId === ord.id;
                    const isDelivered = ord.status === "completed" || ord.status === "delivered";
                    const isHold = ord.status === "on-hold" || ord.status === "on_hold";
                    const trackUrl = buildCourierTrackingUrl(courier, activeCid, ord.tracking_url);

                    const isAlreadyDispatched = Boolean(
                      activeCid ||
                      ord.status === "shipped" ||
                      ord.status === "in_transit" ||
                      ord.status === "out_for_delivery" ||
                      ((isDelivered || ord.status === "completed" || ord.status === "delivered") && Boolean(rawCourier || activeCid)) ||
                      (isRet && Boolean(rawCourier || activeCid)) ||
                      (isCanc && Boolean(rawCourier || activeCid))
                    );

                    if (isAlreadyDispatched) {
                      return (
                        <div className={`rounded-2xl border p-2.5 text-xs space-y-1.5 shadow-2xs ${
                          isRet
                            ? "border-rose-200 bg-rose-50/70 text-rose-900"
                            : isCanc
                            ? "border-amber-200 bg-amber-50/70 text-amber-900"
                            : isDelivered
                            ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                            : isHold
                            ? "border-orange-200 bg-orange-50/70 text-orange-900"
                            : isPathao
                            ? "border-red-200 bg-red-50/60 text-red-950"
                            : "border-blue-200 bg-blue-50/70 text-blue-900"
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5 text-[11px]">
                              {isRet ? (
                                <RotateCcw className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                              ) : isCanc ? (
                                <Ban className="h-3.5 w-3.5 text-amber-600" />
                              ) : isDelivered ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : isHold ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                              ) : (
                                <Truck className={`h-3.5 w-3.5 ${isPathao ? "text-red-600" : "text-emerald-600"} animate-pulse`} />
                              )}
                              <span>
                                {isRet
                                  ? `RTO Return (${courierBrand})`
                                  : isCanc
                                  ? `Cancelled (${courierBrand})`
                                  : isDelivered
                                  ? `Delivered (${courierBrand})`
                                  : isHold
                                  ? `On Hold (${courierBrand})`
                                  : `In Transit (${courierBrand})`}
                              </span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSyncSingleCourier(ord.id)}
                                disabled={isSyncing}
                                className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-gray-800 hover:bg-gray-100 shadow-2xs cursor-pointer"
                                title="Query live delivery status from Courier API"
                              >
                                <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin text-[#e91e63]" : ""}`} />
                                <span>Sync API</span>
                              </button>
                              {activeCid && (
                                <a
                                  href={trackUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5"
                                >
                                  <span>Track</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          {activeCid && (
                            <div className="flex items-center justify-between pt-0.5">
                              <div className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-[10px] font-mono font-bold text-gray-800">
                                <span>CID: {activeCid}</span>
                                <button
                                  onClick={() => handleCopy(activeCid, ord.id)}
                                  title="Copy Consignment ID"
                                  className="hover:text-gray-950 p-0.5"
                                >
                                  {copiedId === ord.id ? (
                                    <Check className="h-2.5 w-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-2.5 w-2.5 text-gray-500" />
                                  )}
                                </button>
                              </div>
                              {(isRet || isCanc) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCustomDispatch(ord, isPathao ? "pathao" : "steadfast")}
                                  className="text-[10px] font-bold text-[#e91e63] hover:underline bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded"
                                >
                                  Re-book Courier ⚡
                                </button>
                              )}
                            </div>
                          )}

                          {webhookNote && (
                            <p className="text-[10px] font-medium opacity-80">
                              Note: {webhookNote}
                            </p>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* 1-Click Action Buttons for Mobile */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      {!activeCid &&
                      (ord.status === "processing" ||
                        ord.status === "confirmed" ||
                        ord.status === "pending" ||
                        ord.status === "packed" ||
                        ord.status === "ready_for_pickup") ? (
                        <>
                          <Button
                            onClick={() => handleOneClickDispatch(ord, "steadfast")}
                            disabled={isLoading || actionLoadingKey === `${ord.id}-steadfast` || actionLoadingKey === `${ord.id}-pathao`}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-7 px-2.5 rounded-xl shadow-xs"
                          >
                            {actionLoadingKey === `${ord.id}-steadfast` ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Zap className="h-3 w-3 mr-1" />
                            )}
                            SteadFast
                          </Button>
                          <Button
                            onClick={() => handleOneClickDispatch(ord, "pathao")}
                            disabled={isLoading || actionLoadingKey === `${ord.id}-steadfast` || actionLoadingKey === `${ord.id}-pathao`}
                            size="sm"
                            variant="outline"
                            className="border-red-300 bg-red-50/50 text-red-700 hover:bg-red-100 font-black text-xs h-7 px-2 rounded-xl"
                          >
                            {actionLoadingKey === `${ord.id}-pathao` ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1 text-red-600" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5" />
                            )}
                            Pathao
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomDispatch(ord, "steadfast")}
                            disabled={isLoading}
                            className="h-7 w-7 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                            title="Custom COD & Note"
                          >
                            <Sliders className="h-3 w-3" />
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <Link href={`/admin/orders/${ord.id}/invoice`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl border border-gray-200">
                          <Printer className="h-3.5 w-3.5 text-gray-700" />
                        </Button>
                      </Link>
                      <Link href={`/admin/orders/${ord.id}`}>
                        <Button size="sm" className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-bold rounded-xl h-7 px-3">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal 1: Quick View Order Drawer */}
      {quickViewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="font-mono font-black text-lg text-[#e91e63]">
                  {quickViewOrder.order_number}
                </span>
                <p className="text-xs text-text-secondary">
                  Placed on {new Date(quickViewOrder.created_at).toLocaleString("en-GB")}
                </p>
              </div>
              <button
                onClick={() => setQuickViewOrder(null)}
                className="rounded-full bg-surface-secondary p-1.5 text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-border p-4 space-y-2 bg-surface-secondary/50">
                <span className="font-bold text-text uppercase text-[10px]">Customer Destination</span>
                <p className="font-bold text-sm text-text">{quickViewOrder.shipping_address_snapshot?.name || quickViewOrder.guest_name}</p>
                <p className="text-text-secondary">{quickViewOrder.shipping_address_snapshot?.phone || quickViewOrder.guest_phone}</p>
                <p className="text-text-secondary">{quickViewOrder.shipping_address_snapshot?.address}</p>
                <p className="text-text-secondary">{quickViewOrder.shipping_address_snapshot?.thana}, {quickViewOrder.shipping_address_snapshot?.district}</p>
              </div>

              <div className="rounded-2xl border border-border p-4 space-y-2 bg-surface-secondary/50">
                <span className="font-bold text-text uppercase text-[10px]">Financials & Delivery</span>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-text">{formatPrice(quickViewOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-bold text-text">{formatPrice(quickViewOrder.shipping_amount)}</span>
                </div>
                {quickViewOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-bold">-{formatPrice(quickViewOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-1 flex justify-between font-extrabold text-sm text-text">
                  <span>Total Due:</span>
                  <span className="text-[#e91e63]">{formatPrice(quickViewOrder.total)}</span>
                </div>
              </div>
            </div>

            {quickViewOrder.risk_profile && (
              <div className="rounded-2xl border border-gray-200 p-4 space-y-1.5 bg-gray-50/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 uppercase text-[10px] flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#e91e63]" />
                    Fraud Risk Assessment
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      quickViewOrder.risk_profile.risk_level === "blocked" || quickViewOrder.risk_profile.risk_level === "high"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : quickViewOrder.risk_profile.risk_level === "medium"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {quickViewOrder.risk_profile.risk_level === "blocked"
                      ? "Blocked"
                      : `${quickViewOrder.risk_profile.risk_level.toUpperCase()} RISK (${quickViewOrder.risk_profile.score}% Trust)`}
                  </span>
                </div>
                {quickViewOrder.risk_profile.flags && quickViewOrder.risk_profile.flags.length > 0 ? (
                  <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5 pt-1">
                    {quickViewOrder.risk_profile.flags.map((flag: string, i: number) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-emerald-700 font-medium pt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>No risk signals detected. Valid Bangladeshi mobile and normal order pattern.</span>
                  </p>
                )}
              </div>
            )}

            {/* Courier & Delivery Webhook Details */}
            {(quickViewOrder.consignment_id || quickViewOrder.courier_name || quickViewOrder.courier_webhook_note || quickViewOrder.status === "returned") && (
              <div className={`rounded-2xl border p-4 space-y-2 text-xs ${
                quickViewOrder.status === "returned" || quickViewOrder.is_courier_returned
                  ? "border-rose-200 bg-rose-50/70"
                  : quickViewOrder.status === "cancelled" || quickViewOrder.is_courier_cancelled
                  ? "border-amber-200 bg-amber-50/70"
                  : "border-emerald-200 bg-emerald-50/50"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-[10px] flex items-center gap-1.5 text-gray-800">
                    <Truck className="h-3.5 w-3.5 text-[#e91e63]" />
                    <span>Courier & Logistics Status</span>
                  </span>
                  {quickViewOrder.consignment_id && (
                    <a
                      href={buildCourierTrackingUrl(quickViewOrder.courier_name, quickViewOrder.consignment_id, quickViewOrder.tracking_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#e91e63] font-mono font-bold text-xs hover:underline inline-flex items-center gap-1"
                    >
                      <span>{quickViewOrder.consignment_id}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Courier Partner:</span>
                    <span className="font-bold text-gray-900">{quickViewOrder.courier_name || "SteadFast Courier"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Current Status:</span>
                    <span className="font-black uppercase text-gray-900">{quickViewOrder.status}</span>
                  </div>
                </div>

                {quickViewOrder.courier_webhook_note && (
                  <div className="pt-2 border-t border-gray-200/60 text-[11px]">
                    <span className="font-bold text-gray-700 block">Latest Courier Webhook Note / Return Reason:</span>
                    <p className="text-gray-800 font-medium mt-0.5">{quickViewOrder.courier_webhook_note}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <span className="font-bold text-text uppercase text-[10px]">Ordered Line Items</span>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {(quickViewOrder.order_items || []).map((it: any) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-text">{it.product_name_snapshot}</p>
                      <p className="text-[11px] text-text-secondary">Quantity: {it.quantity} × {formatPrice(it.unit_price)}</p>
                    </div>
                    <span className="font-bold text-text">{formatPrice(it.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Link href={`/admin/orders/${quickViewOrder.id}/invoice`} target="_blank">
                <Button variant="outline" size="sm" className="text-xs font-bold">
                  <Printer className="h-3.5 w-3.5 mr-1 text-[#e91e63]" />
                  Print Invoice
                </Button>
              </Link>
              <Link href={`/admin/orders/${quickViewOrder.id}`}>
                <Button size="sm" className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-bold">
                  Full Order Page →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Create Manual Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#e91e63]" />
                <h2 className="text-base font-black text-gray-900">Create Manual / Phone Order</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full bg-surface-secondary p-1.5 text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arifur Rahman"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">District / City</label>
                  <select
                    value={createForm.district}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        district: e.target.value,
                        deliveryFee: e.target.value.toLowerCase().includes("dhaka") ? 60 : 120,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  >
                    <option value="Dhaka City">Dhaka City (৳60 Delivery)</option>
                    <option value="Chattogram">Chattogram (৳120 Delivery)</option>
                    <option value="Sylhet">Sylhet (৳120 Delivery)</option>
                    <option value="Rajshahi">Rajshahi (৳120 Delivery)</option>
                    <option value="Khulna">Khulna (৳120 Delivery)</option>
                    <option value="Barishal">Barishal (৳120 Delivery)</option>
                    <option value="Rangpur">Rangpur (৳120 Delivery)</option>
                    <option value="Mymensingh">Mymensingh (৳120 Delivery)</option>
                    <option value="Cumilla">Cumilla (৳120 Delivery)</option>
                    <option value="Gazipur">Gazipur (৳120 Delivery)</option>
                    <option value="Narayanganj">Narayanganj (৳120 Delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Thana / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanmondi, Gulshan, Mirpur"
                    value={createForm.thana}
                    onChange={(e) => setCreateForm({ ...createForm, thana: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="House #, Road #, Area details"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none"
                />
              </div>

              {/* Product Select */}
              <div className="rounded-2xl border border-gray-200 p-3 bg-gray-50 space-y-2">
                <span className="font-bold text-gray-800 uppercase text-[10px]">Product Selection</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={createForm.productName}
                      onChange={(e) => setCreateForm({ ...createForm, productName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={createForm.productPrice}
                      onChange={(e) => setCreateForm({ ...createForm, productPrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                  <span>Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, quantity: Math.max(1, createForm.quantity - 1) })}
                      className="h-6 w-6 rounded bg-gray-200 text-gray-800 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold">{createForm.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, quantity: createForm.quantity + 1 })}
                      className="h-6 w-6 rounded bg-gray-200 text-gray-800 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span>Delivery Charge:</span>
                  <span className="font-bold text-gray-900">৳{createForm.deliveryFee}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 font-extrabold text-sm text-[#e91e63]">
                  <span>Total Amount Due:</span>
                  <span>{formatPrice(createForm.productPrice * createForm.quantity + createForm.deliveryFee)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingOrder} className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-bold">
                  {creatingOrder ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Confirm & Create Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Batch Dispatch Summary Report & Thermal Label Print Trigger */}
      {batchSummaryReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="font-black text-base text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  Batch Courier Dispatch Report ({batchSummaryReport.courierName})
                </span>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Execution completed for {batchSummaryReport.successful.length + batchSummaryReport.failed.length} parcels
                </p>
              </div>
              <button
                onClick={() => setBatchSummaryReport(null)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 uppercase">Successfully Booked</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-2xl font-black text-emerald-900 block">
                  {batchSummaryReport.successful.length}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium block">
                  Consignments ready for courier pickup & live tracking
                </span>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-800 uppercase">Failed / Rejected</span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-2xl font-black text-red-900 block">
                  {batchSummaryReport.failed.length}
                </span>
                <span className="text-[10px] text-red-700 font-medium block">
                  {batchSummaryReport.failed.length === 0
                    ? "Zero errors encountered"
                    : "Kept selected for address/phone correction"}
                </span>
              </div>
            </div>

            {/* Error Details List if any failed */}
            {batchSummaryReport.failed.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  The following {batchSummaryReport.failed.length} order(s) require attention:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl border border-red-200 bg-red-50/40 p-3 text-xs">
                  {batchSummaryReport.failed.map((f) => (
                    <div key={f.id} className="flex items-start justify-between gap-2 border-b border-red-100 pb-1.5">
                      <div>
                        <span className="font-mono font-bold text-gray-900 block">#{f.order_number} ({f.phone || "No phone"})</span>
                        <span className="text-[11px] text-red-700">{f.reason}</span>
                      </div>
                      <Link href={`/admin/orders/${f.id}`} className="text-[#e91e63] font-bold text-[11px] hover:underline shrink-0">
                        Fix & Edit
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                {batchSummaryReport.successful.length} consignment IDs stored in database.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setBatchSummaryReport(null)}
                  variant="outline"
                  className="text-xs font-bold rounded-xl"
                >
                  Dismiss
                </Button>
                {batchSummaryReport.successful.length > 0 && (
                  <Button
                    onClick={() => {
                      setBatchSummaryReport(null);
                      window.print();
                    }}
                    className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-black rounded-xl shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print All {batchSummaryReport.successful.length} Thermal Labels
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Admin State Machine Override Confirmation Modal */}
      {overrideModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-gray-900">Admin State Machine Override</h3>
                  <p className="text-xs text-gray-500 font-medium">Order #{overrideModalOrder.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setOverrideModalOrder(null)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                Lifecycle Guard Bypass Warning:
              </span>
              <p className="leading-relaxed">
                You are forcing a transition from <strong className="uppercase font-black text-amber-950">'{overrideModalOrder.status}'</strong> to{" "}
                <strong className="uppercase font-black text-amber-950">'{overrideTargetStatus}'</strong>. This will bypass standard warehouse, courier, and inventory validation checks.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Target Status</label>
                <select
                  value={overrideTargetStatus}
                  onChange={(e) => setOverrideTargetStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold capitalize text-gray-900 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="shipped">Shipped</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

            <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Reason for Override <span className="text-gray-400 font-normal">(Logged in audit history)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer requested to un-cancel after phone verification; Mistakenly cancelled earlier."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOverrideModalOrder(null)}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteOverride}
                disabled={overrideLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs"
              >
                {overrideLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                )}
                Confirm Force Override
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Anti-Fraud Customer Blacklist Confirmation Modal */}
      {blockModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-100 text-red-700">
                  <Ban className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-gray-900">Security Blacklist Confirmation</h3>
                  <p className="text-xs text-gray-500 font-medium">Order #{blockModalOrder.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setBlockModalOrder(null)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-900 space-y-1">
              <span className="font-bold block">Blacklist & Order Cancellation Notice:</span>
              <p className="leading-relaxed">
                Blocking this customer will permanently add their phone number (<strong>{blockModalOrder.shipping_address_snapshot?.phone || blockModalOrder.guest_phone || "N/A"}</strong>) to the security blocklist, reject all future checkout attempts, automatically <strong>cancel</strong> Order #{blockModalOrder.order_number}, and restore inventory stock.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Reason for Blacklisting
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none"
                  placeholder="e.g. Fake lead, unreachable multiple times, high RTO rate"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockModalOrder(null)}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteBlock}
                disabled={blockLoading}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs"
              >
                {blockLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                )}
                Confirm Blacklist & Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Single Order Custom Courier Dispatch Modal (Edit COD Amount & Note) */}
      {customDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-gray-900">Custom Courier Dispatch</h3>
                  <p className="text-xs text-gray-500 font-medium">Order #{customDispatchModal.order.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setCustomDispatchModal(null)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Courier Selection */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">Select Courier Gateway</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomDispatchModal({ ...customDispatchModal, courierCode: "steadfast" })}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      customDispatchModal.courierCode === "steadfast"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-700" />
                    SteadFast Courier
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDispatchModal({ ...customDispatchModal, courierCode: "pathao" })}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                      customDispatchModal.courierCode === "pathao"
                        ? "border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/20"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Pathao Express
                  </button>
                </div>
              </div>

              {/* Recipient Snapshot */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-1 text-gray-700">
                <span className="font-bold block text-gray-900">Delivery Recipient:</span>
                <p>
                  {customDispatchModal.order.shipping_address_snapshot?.name || customDispatchModal.order.guest_name || "Customer"} •{" "}
                  {customDispatchModal.order.shipping_address_snapshot?.phone || customDispatchModal.order.guest_phone}
                </p>
                <p className="text-gray-500 text-[11px] truncate">
                  {customDispatchModal.order.shipping_address_snapshot?.address || "Dhaka, Bangladesh"}
                </p>
              </div>

              {/* Editable COD Amount & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">
                    COD Collection Amount (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customDispatchModal.codAmount}
                    onChange={(e) =>
                      setCustomDispatchModal({
                        ...customDispatchModal,
                        codAmount: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-gray-500">Amount rider collects at doorstep</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Parcel Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={customDispatchModal.weight}
                    onChange={(e) =>
                      setCustomDispatchModal({
                        ...customDispatchModal,
                        weight: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-gray-500">Default cosmetics: 0.5kg</span>
                </div>
              </div>

              {/* Editable Delivery Note / Special Instruction */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Delivery Instruction / Note for Rider
                </label>
                <textarea
                  rows={2}
                  value={customDispatchModal.note}
                  onChange={(e) =>
                    setCustomDispatchModal({
                      ...customDispatchModal,
                      note: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Fragile skincare cosmetics. Allow recipient to inspect before payment."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomDispatchModal(null)}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteCustomDispatch}
                disabled={customDispatchLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs"
              >
                {customDispatchLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Truck className="h-3.5 w-3.5 mr-1.5" />
                )}
                Dispatch Consignment (৳{customDispatchModal.codAmount})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Bulk Dispatch Review & Confirmation Modal */}
      {bulkReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl ${bulkReviewModal.courierCode === "steadfast" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-gray-900">
                    Bulk Courier Dispatch ({bulkReviewModal.courierCode === "steadfast" ? "SteadFast" : "Pathao"})
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {bulkReviewModal.eligibleOrders.length} Eligible Orders Selected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkReviewModal(null)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Statistics Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Parcels to Book</span>
                <span className="text-xl font-black text-gray-900">{bulkReviewModal.eligibleOrders.length} Parcels</span>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total COD to Collect</span>
                <span className="text-xl font-black text-emerald-900">
                  {formatPrice(
                    bulkReviewModal.eligibleOrders.reduce(
                      (acc, o) => acc + (o.amount_to_collect !== undefined ? Number(o.amount_to_collect) : Number(o.total)),
                      0
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Global Note for All Selected Parcels */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-gray-800">
                Global Delivery Note / Rider Instructions (Applied to All Parcels)
              </label>
              <input
                type="text"
                value={bulkReviewModal.globalNote}
                onChange={(e) => setBulkReviewModal({ ...bulkReviewModal, globalNote: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Fragile skincare cosmetics. Call recipient before delivery."
              />
            </div>

            {/* Orders Preview List */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 max-h-56">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Recipient</th>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5 text-right">COD Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bulkReviewModal.eligibleOrders.map((ord) => {
                    const cod = ord.amount_to_collect !== undefined ? Number(ord.amount_to_collect) : Number(ord.total);
                    return (
                      <tr key={ord.id} className="hover:bg-gray-50/60">
                        <td className="p-2.5 font-mono font-bold text-gray-900">{ord.order_number}</td>
                        <td className="p-2.5 text-gray-700">
                          {ord.shipping_address_snapshot?.name || ord.guest_name || "Customer"} (
                          {ord.shipping_address_snapshot?.phone || ord.guest_phone || ""})
                        </td>
                        <td className="p-2.5 text-gray-500">{ord.shipping_address_snapshot?.district || "Dhaka City"}</td>
                        <td className="p-2.5 text-right font-black text-emerald-700">৳{cod}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkReviewModal(null)}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const { courierCode, eligibleOrders, globalNote } = bulkReviewModal;
                  setBulkReviewModal(null);
                  executeBulkDispatchWorkerPool(courierCode, eligibleOrders, globalNote);
                }}
                className={`text-xs font-black rounded-xl shadow-xs text-white ${
                  bulkReviewModal.courierCode === "steadfast"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <Truck className="h-3.5 w-3.5 mr-1.5" />
                Confirm & Dispatch {bulkReviewModal.eligibleOrders.length} Parcels (5x Concurrent)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


