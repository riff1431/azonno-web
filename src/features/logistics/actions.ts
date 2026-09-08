"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendSmsNotification } from "@/features/sms/actions";

// Default couriers in Bangladesh
const DEFAULT_COURIERS = [
  {
    id: "c1",
    name: "SteadFast Courier",
    code: "steadfast",
    api_base_url: "https://portal.steadfast.com.bd/api/v1",
    status: "active",
    config: {
      api_key: "sf_live_sample_key_bd",
      secret_key: "sf_live_sample_secret",
      auto_booking: true,
      service_type: "standard",
    },
    shipments_count: 142,
    success_rate: "98.4%",
  },
  {
    id: "c2",
    name: "Pathao Courier",
    code: "pathao",
    api_base_url: "https://api-hermes.pathao.com/aladdin/api/v1",
    status: "active",
    config: {
      client_id: "pathao_client_id_live",
      client_secret: "pathao_secret_live",
      auto_booking: false,
      store_id: "store_gulshan_hq",
    },
    shipments_count: 98,
    success_rate: "97.8%",
  },
  {
    id: "c3",
    name: "RedX Delivery",
    code: "redx",
    api_base_url: "https://openapi.redx.com.bd/v1.0.0-beta",
    status: "inactive",
    config: {
      api_key: "",
      auto_booking: false,
    },
    shipments_count: 35,
    success_rate: "94.2%",
  },
];

export async function getCouriers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("couriers").select("*");

  if (!error && data && data.length > 0) {
    return data;
  }
  return DEFAULT_COURIERS;
}

export async function getCourierShipments() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courier_shipments")
    .select("*, orders(order_number, total, status)")
    .order("created_at", { ascending: false });

  if (!error && data) {
    return data;
  }

  // Fallback initial sample shipments
  return [
    {
      id: "sh-101",
      order_id: "542e5f96-a55f-4133-9620-a136586258db",
      order_number: "ORD-2026-895823",
      courier_name: "SteadFast Courier",
      consignment_id: "SF-895823-BD",
      tracking_id: "STF-2026-90412",
      booking_status: "booked",
      delivery_status: "in_transit",
      cod_amount: 1365,
      booked_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
}

export async function bookCourierDelivery(input: {
  orderId: string;
  orderNumber: string;
  courierCode: "steadfast" | "pathao" | "redx" | "paperfly" | "sundarban";
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  district: string;
  thana?: string;
  codAmount: number;
  weightKg?: number;
  itemDescription?: string;
  totalQuantity?: number;
  specialInstruction?: string;
}) {
  const { dispatchOrderToCourier } = await import("./services/courier-service");
  const code = (input.courierCode === "steadfast" || input.courierCode === "pathao")
    ? input.courierCode
    : "manual";

  const result = await dispatchOrderToCourier({
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    courierCode: code,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    recipientAddress: input.recipientAddress,
    district: input.district,
    thana: input.thana,
    codAmount: input.codAmount,
    weightKg: input.weightKg,
    itemDescription: input.itemDescription,
    totalQuantity: input.totalQuantity,
    specialInstruction: input.specialInstruction,
  });

  if (!result.success) {
    return {
      success: false,
      consignmentId: "",
      trackingId: "",
      courierName: result.courier_name,
      error: result.error || "Courier booking failed",
    };
  }

  // Trigger automated SMS notification
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    await sendSmsNotification({
      recipientPhone: input.recipientPhone,
      eventType: "order_shipped",
      variables: {
        customer_name: input.recipientName,
        order_number: input.orderNumber,
        courier_name: result.courier_name,
        tracking_id: result.tracking_code,
        tracking_url: result.tracking_url || `${appUrl}/account/track`,
      },
    });
  } catch (smsErr) {
    console.warn("SMS delivery notification notice:", smsErr);
  }

  try {
    revalidatePath("/admin/shipping");
    revalidatePath(`/admin/orders/${input.orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    revalidatePath("/account/track");
  } catch (revErr) {
    // Non-fatal if called in CLI or outside request lifecycle
  }

  return {
    success: true,
    consignmentId: result.consignment_id,
    trackingId: result.tracking_code,
    trackingUrl: result.tracking_url,
    courierName: result.courier_name,
    weightKg: input.weightKg || 0.5,
    itemsSummary: input.itemDescription || "Cosmetics Parcel",
    instructions: input.specialInstruction,
    error: undefined,
  };
}

/* =========================================================================
   SHIPPING ZONES & REGIONAL DELIVERY RATES
   ========================================================================= */

export interface ShippingZoneItem {
  id: string;
  name: string;
  regions: string;
  charge: number;
  freeThreshold: number;
  deliveryTime: string;
  enabled: boolean;
  courierRates: { steadfast: number; pathao: number; redx: number };
}

const DEFAULT_SHIPPING_ZONES: ShippingZoneItem[] = [
  {
    id: "zone-1",
    name: "Inside Dhaka (Express)",
    regions: "Dhaka City (Gulshan, Banani, Dhanmondi, Mirpur, Uttara, Mohakhali, etc.)",
    charge: 60,
    freeThreshold: 2500,
    deliveryTime: "24-48 Hours",
    enabled: true,
    courierRates: { steadfast: 60, pathao: 70, redx: 60 },
  },
  {
    id: "zone-2",
    name: "Outside Dhaka (Nationwide Courier)",
    regions: "All Districts & Divisions outside Dhaka City (Chattogram, Sylhet, Rajshahi, Khulna, etc.)",
    charge: 120,
    freeThreshold: 3500,
    deliveryTime: "2-4 Days",
    enabled: true,
    courierRates: { steadfast: 120, pathao: 130, redx: 120 },
  },
];

export async function getShippingZones(): Promise<ShippingZoneItem[]> {
  const { getSetting } = await import("@/lib/settings/config-service");
  const zones = await getSetting<ShippingZoneItem[]>("shipping", "zones", DEFAULT_SHIPPING_ZONES);
  return zones || DEFAULT_SHIPPING_ZONES;
}

export async function saveShippingZone(data: {
  id?: string;
  name: string;
  regions: string;
  charge: number;
  freeThreshold: number;
  deliveryTime: string;
  enabled?: boolean;
  courierRates?: { steadfast: number; pathao: number; redx: number };
}): Promise<ShippingZoneItem[]> {
  const { updateGroupSettings } = await import("@/lib/settings/config-service");
  const current = await getShippingZones();
  let updated: ShippingZoneItem[];

  if (data.id) {
    updated = current.map((z) =>
      z.id === data.id
        ? {
            ...z,
            name: data.name.trim(),
            regions: data.regions.trim(),
            charge: Number(data.charge),
            freeThreshold: Number(data.freeThreshold),
            deliveryTime: data.deliveryTime.trim(),
            enabled: data.enabled !== undefined ? data.enabled : z.enabled,
            courierRates: data.courierRates || z.courierRates,
          }
        : z
    );
  } else {
    const newZone: ShippingZoneItem = {
      id: `zone-${Date.now()}`,
      name: data.name.trim(),
      regions: data.regions.trim(),
      charge: Number(data.charge),
      freeThreshold: Number(data.freeThreshold),
      deliveryTime: data.deliveryTime.trim(),
      enabled: data.enabled !== undefined ? data.enabled : true,
      courierRates: data.courierRates || {
        steadfast: Number(data.charge),
        pathao: Number(data.charge) + 10,
        redx: Number(data.charge),
      },
    };
    updated = [...current, newZone];
  }

  await updateGroupSettings("shipping", { zones: updated });
  revalidatePath("/admin/shipping/zones");
  return updated;
}

export async function deleteShippingZone(id: string): Promise<ShippingZoneItem[]> {
  const { updateGroupSettings } = await import("@/lib/settings/config-service");
  const current = await getShippingZones();
  const updated = current.filter((z) => z.id !== id);
  await updateGroupSettings("shipping", { zones: updated });
  revalidatePath("/admin/shipping/zones");
  return updated;
}

/**
 * Real-Time Live Courier Status Sync (SteadFast & Pathao)
 * Queries live API for consignment status and updates database in real time.
 */
export async function syncLiveCourierStatus(orderId: string) {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_status_history(*)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { success: false, error: "Order not found." };
  }

  const cid = order.consignment_id || order.tracking_code || order.tracking_id;
  if (!cid) {
    return { success: false, error: "Order has not been dispatched to a courier yet." };
  }

  const courier = (
    order.courier_name ||
    order.shipping_method ||
    order.shipping_address_snapshot?.courier_name ||
    ""
  ).toLowerCase();

  const isPathaoCourier =
    courier.includes("pathao") ||
    String(cid).startsWith("PTH") ||
    String(cid).startsWith("DE");

  let liveStatus = "";
  let statusNote = "";
  let rawData: any = null;

  if (isPathaoCourier) {
    const { getPathaoOrderStatus } = await import("./services/pathao");
    const res = await getPathaoOrderStatus(cid);
    if (!res || res.status !== 200 || !res.delivery_status) {
      return {
        success: false,
        error: res?.error || "Pathao API did not return a valid delivery status for this consignment. Please verify Pathao credentials.",
      };
    }
    liveStatus = (res.delivery_status || "").toLowerCase();
    statusNote = `Pathao Live API: ${liveStatus.replace(/_/g, " ").toUpperCase()}`;
    rawData = res;
  } else {
    // SteadFast Courier with multi-key fallback
    const { getSteadfastStatusByCid, getSteadfastStatusByInvoice, getSteadfastStatusByTrackingCode } = await import("./services/steadfast");
    const cleanCid = String(cid).replace(/^SF-/, "").trim();
    let res = await getSteadfastStatusByCid(cleanCid);
    if ((!res || res.status !== 200 || !res.delivery_status) && order.tracking_code) {
      res = await getSteadfastStatusByTrackingCode(order.tracking_code);
    }
    if ((!res || res.status !== 200 || !res.delivery_status) && order.order_number) {
      res = await getSteadfastStatusByInvoice(order.order_number);
    }
    const rawStatusVal = res?.delivery_status ?? (typeof res?.status === "string" ? res.status : "");
    if (!res || res.status !== 200 || !rawStatusVal) {
      return {
        success: false,
        error: res?.error || "SteadFast API credentials are not configured or parcel was not found on the SteadFast server.",
      };
    }
    liveStatus = String(rawStatusVal).toLowerCase();
    statusNote = `SteadFast Live API: ${liveStatus.replace(/_/g, " ").toUpperCase()}`;
    rawData = res;
  }

  // Map to system OrderStatus
  let mappedStatus = order.status;
  let isReturned = false;
  let isCancelled = false;

  const normalized = liveStatus.toLowerCase().trim();

  if (
    normalized.includes("delivered") ||
    normalized === "partial_delivered" ||
    normalized.includes("payment_collected") ||
    normalized.includes("successful")
  ) {
    mappedStatus = "delivered";
  } else if (
    normalized.includes("cancel") ||
    normalized.includes("cancelled") ||
    normalized.includes("pickup_cancelled") ||
    normalized.includes("pickup cancel")
  ) {
    mappedStatus = "cancelled";
    isCancelled = true;
  } else if (
    normalized.includes("return") ||
    normalized.includes("rto") ||
    normalized.includes("failed") ||
    normalized.includes("exchange")
  ) {
    mappedStatus = "returned";
    isReturned = true;
  } else if (
    normalized.includes("hold") ||
    normalized.includes("reschedule") ||
    normalized.includes("delay")
  ) {
    mappedStatus = "on-hold";
  } else if (
    normalized.includes("transit") ||
    normalized.includes("picked") ||
    normalized.includes("review") ||
    normalized.includes("pending") ||
    normalized.includes("pickup") ||
    normalized.includes("hub") ||
    normalized.includes("out_for_delivery")
  ) {
    mappedStatus = "shipped";
  }

  const addrSnap = order.shipping_address_snapshot || {};
  const isAlreadySame =
    mappedStatus === order.status &&
    addrSnap.courier_status === liveStatus;

  if (isAlreadySame) {
    return {
      success: true,
      orderId,
      status: mappedStatus,
      courierStatus: liveStatus,
      message: `Order status is already up-to-date with live courier (${mappedStatus}).`,
    };
  }

  // Update order in Supabase
  const updatedAddressSnap = {
    ...addrSnap,
    courier_name: isPathaoCourier ? "Pathao Courier" : "SteadFast Courier",
    consignment_id: cid,
    courier_status: liveStatus,
    courier_webhook_note: statusNote,
    is_courier_returned: isReturned,
    is_courier_cancelled: isCancelled,
    last_synced_at: new Date().toISOString(),
  };

  const coreUpdate: any = {
    status: mappedStatus,
    shipping_method: isPathaoCourier ? "Pathao Courier" : "SteadFast Courier",
    shipping_address_snapshot: updatedAddressSnap,
    public_note: statusNote,
    updated_at: new Date().toISOString(),
  };

  const { error: syncUpdateErr } = await supabase
    .from("orders")
    .update(coreUpdate)
    .eq("id", orderId);

  if (syncUpdateErr) {
    console.error("Critical: Live courier status sync update failed:", syncUpdateErr);
  }

  // Insert audit record into order_status_history table only on meaningful status changes
  try {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: mappedStatus,
      note: statusNote,
      created_at: new Date().toISOString(),
    });
  } catch (histErr) {
    console.warn("Status history insert skipped:", histErr);
  }

  // WooCommerce Idempotent Inventory Synchronization on Courier Status Sync
  try {
    const { restoreOrderStock, reduceOrderStock } = await import("@/features/orders/actions");
    if (isReturned || isCancelled || mappedStatus === "returned" || mappedStatus === "cancelled" || mappedStatus === "failed") {
      await restoreOrderStock(orderId, supabase);
    } else if (mappedStatus === "completed" || mappedStatus === "delivered" || mappedStatus === "shipped") {
      await reduceOrderStock(orderId, supabase);
    }
  } catch (invErr) {
    console.warn("[Courier Sync Inventory Warning]:", invErr);
  }

  // Automated EMQ 9.0+ Meta & TikTok Conversions API (CAPI) Purchase Trigger on status sync
  if (mappedStatus === "completed" || mappedStatus === "delivered") {
    try {
      const { triggerStatusGatedPurchaseCapi } = await import("@/features/orders/actions");
      await triggerStatusGatedPurchaseCapi(orderId, mappedStatus, order, null, supabase);
    } catch (capiErr) {
      console.warn("[Courier Sync CAPI Delivery Trigger]:", capiErr);
    }
  }

  try {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  } catch (revErr) {
    // Non-fatal outside request lifecycle
  }

  return {
    success: true,
    orderId,
    orderNumber: order.order_number,
    courierName: isPathaoCourier ? "Pathao Courier" : "SteadFast Courier",
    consignmentId: cid,
    liveStatus,
    mappedStatus,
    statusNote,
    isReturned,
    isCancelled,
  };
}



