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

  revalidatePath("/admin/shipping");
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  revalidatePath("/account/track");

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

  const cid = order.consignment_id || order.tracking_code;
  if (!cid) {
    return { success: false, error: "Order has not been dispatched to a courier yet." };
  }

  const courier = (order.courier_name || "").toLowerCase();
  let liveStatus = "";
  let statusNote = "";
  let rawData: any = null;

  if (courier.includes("pathao")) {
    const { getPathaoOrderStatus } = await import("./services/pathao");
    const res = await getPathaoOrderStatus(cid);
    liveStatus = (res.delivery_status || "").toLowerCase();
    statusNote = `Pathao Live API: ${liveStatus.replace(/_/g, " ").toUpperCase()}`;
    rawData = res;
  } else {
    // Default to SteadFast Courier
    const { getSteadfastStatusByCid } = await import("./services/steadfast");
    const res = await getSteadfastStatusByCid(cid);
    liveStatus = (res.delivery_status || "").toLowerCase();
    statusNote = `SteadFast Live API: ${liveStatus.replace(/_/g, " ").toUpperCase()}`;
    rawData = res;
  }

  // Map to system OrderStatus
  let mappedStatus = order.status;
  let isReturned = false;
  let isCancelled = false;

  if (liveStatus.includes("delivered") && !liveStatus.includes("pending")) {
    mappedStatus = "completed";
  } else if (liveStatus.includes("cancelled") || liveStatus === "cancel") {
    mappedStatus = "cancelled";
    isCancelled = true;
  } else if (liveStatus.includes("return") || liveStatus.includes("rto") || liveStatus.includes("hold")) {
    mappedStatus = "returned";
    isReturned = true;
  } else if (liveStatus.includes("transit") || liveStatus.includes("picked") || liveStatus.includes("review") || liveStatus.includes("pending")) {
    mappedStatus = "shipped";
  }

  // Update order in Supabase
  const history = Array.isArray(order.order_status_history) ? order.order_status_history : [];
  const newHistory = [
    ...history,
    {
      from: order.status,
      to: mappedStatus,
      changed_at: new Date().toISOString(),
      changed_by: "Real-time Courier API Sync",
      note: statusNote,
    },
  ];

  await supabase
    .from("orders")
    .update({
      status: mappedStatus,
      is_courier_returned: isReturned,
      is_courier_cancelled: isCancelled,
      courier_webhook_note: statusNote,
      order_status_history: newHistory,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

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

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  return {
    success: true,
    orderId,
    courierName: order.courier_name || "SteadFast",
    consignmentId: cid,
    liveStatus,
    mappedStatus,
    statusNote,
    isReturned,
    isCancelled,
  };
}


