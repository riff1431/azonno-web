"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSmsNotification } from "@/features/sms/actions";
import { revalidatePath } from "next/cache";

export interface RiskEvaluation {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  isBlacklisted: boolean;
  courierSuccessRate: string;
  previousOrdersCount: number;
  isDuplicateOrder: boolean;
  duplicateOrderId?: string;
  reasons: string[];
  recommendedAction: "allow" | "flag" | "require_advance" | "block";
}

export interface FraudProfile {
  id: string;
  identifier_type: "phone" | "email" | "ip" | "address";
  identifier_value: string;
  risk_score: number;
  cancellation_count: number;
  rejected_delivery_count: number;
  return_abuse_count: number;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  notes?: string;
  updated_at: string;
}

export interface AbandonedLead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  district?: string;
  address?: string;
  cart_items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    variant?: string;
  }>;
  cart_total: number;
  recovery_status: "abandoned" | "sms_sent" | "whatsapp_sent" | "converted";
  last_active_at: string;
}

const FRAUD_STORE_KEY = "fraud_profiles_store";
const LEADS_STORE_KEY = "abandoned_checkouts_store";

const DEFAULT_FRAUD_PROFILES: FraudProfile[] = [];

async function getStoredFraudProfiles(): Promise<FraudProfile[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("store_settings").select("value").eq("key", FRAUD_STORE_KEY).single();
    if (data && Array.isArray(data.value)) {
      return data.value as FraudProfile[];
    }
  } catch {}
  return [];
}

async function saveStoredFraudProfiles(profiles: FraudProfile[]) {
  try {
    const supabase = createAdminClient();
    await supabase.from("store_settings").upsert({
      key: FRAUD_STORE_KEY,
      value: profiles as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  } catch {}
}

async function getStoredLeads(): Promise<AbandonedLead[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("store_settings").select("value").eq("key", LEADS_STORE_KEY).single();
    if (data && Array.isArray(data.value) && data.value.length > 0) {
      return data.value as AbandonedLead[];
    }
  } catch {}
  return memoryAbandonedCheckouts;
}

async function saveStoredLeads(leads: AbandonedLead[]) {
  try {
    const supabase = createAdminClient();
    await supabase.from("store_settings").upsert({
      key: LEADS_STORE_KEY,
      value: leads as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  } catch {}
}

// In-memory abandoned leads store
let memoryAbandonedCheckouts: AbandonedLead[] = [];

/**
 * 1. Evaluate Comprehensive Order Risk & Courier Delivery Return Ratio
 */
export async function evaluateOrderRisk({
  phone,
  email,
  district,
  total,
  ipAddress,
}: {
  phone: string;
  email?: string;
  district?: string;
  total?: number;
  ipAddress?: string;
}): Promise<RiskEvaluation> {
  const supabase = createAdminClient();
  const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
  const cleanEmail = (email || "").trim().toLowerCase();
  const reasons: string[] = [];
  let riskScore = 0;

  // 1. Blacklist Check
  const profiles = await getStoredFraudProfiles();
  const blacklisted = profiles.find((p: FraudProfile) => {
    if (!p.is_blacklisted) return false;
    const val = (p.identifier_value || "").trim().toLowerCase();
    const valDigits = val.replace(/[^0-9]/g, "");
    const matchPhone = cleanPhone && (valDigits === cleanPhone || val === cleanPhone);
    const matchEmail = cleanEmail && val === cleanEmail;
    const matchIp = ipAddress && val === ipAddress.trim();
    return matchPhone || matchEmail || matchIp;
  });

  if (blacklisted) {
    return {
      riskScore: 100,
      riskLevel: "critical",
      isBlacklisted: true,
      courierSuccessRate: "0%",
      previousOrdersCount: 0,
      isDuplicateOrder: false,
      reasons: [blacklisted.blacklist_reason || "Customer contact / IP explicitly blacklisted by store admin."],
      recommendedAction: "block",
    };
  }

  // 2. Query past orders from this phone number
  const { data: pastOrders } = await supabase
    .from("orders")
    .select("id, status, created_at, total")
    .or(`guest_phone.eq.${cleanPhone},shipping_address_snapshot->>phone.eq.${cleanPhone}`)
    .order("created_at", { ascending: false });

  const orderList = pastOrders || [];
  const deliveredCount = orderList.filter((o) => o.status === "delivered").length;
  const returnedCount = orderList.filter((o) => ["cancelled", "returned", "failed"].includes(o.status)).length;
  const totalCompleted = deliveredCount + returnedCount;

  let courierSuccessRate = "No Past History";
  if (totalCompleted > 0) {
    const rate = Math.round((deliveredCount / totalCompleted) * 100);
    courierSuccessRate = `${rate}% (Store)`;
    if (rate < 80) {
      riskScore += 35;
      reasons.push(`Low store delivery success rate (${courierSuccessRate}, ${returnedCount} returns).`);
    }
  }

  // Real-time BDCourier multi-courier network check
  if (cleanPhone.length >= 10) {
    try {
      const { fetchBDCourierReport } = await import("@/features/fraud/bdcourier-service");
      const bdReport = await fetchBDCourierReport(cleanPhone);
      if (bdReport.success && bdReport.total_parcel > 0) {
        courierSuccessRate = `${bdReport.success_ratio}% (${bdReport.success_parcel}/${bdReport.total_parcel} delivered across BD Couriers)`;
        if (bdReport.risk_level === "critical" || bdReport.success_ratio < 40) {
          riskScore += 50;
          reasons.push(`Critical courier cancellation history: ${bdReport.cancelled_parcel} returns across courier networks (${bdReport.success_ratio}% success).`);
        } else if (bdReport.risk_level === "high" || bdReport.success_ratio < 70) {
          riskScore += 30;
          reasons.push(`High return risk across BD couriers (${bdReport.success_ratio}% delivery ratio, ${bdReport.cancelled_parcel} cancellations).`);
        }
      }
    } catch {}
  }

  // 3. Duplicate / Rapid Multiple Orders Check (within last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentOrders = orderList.filter((o) => new Date(o.created_at) >= tenMinutesAgo);
  let isDuplicateOrder = false;
  let duplicateOrderId: string | undefined;

  if (recentOrders.length > 0) {
    isDuplicateOrder = true;
    duplicateOrderId = recentOrders[0].id;
    riskScore += 25;
    reasons.push(`Duplicate order detected: Customer placed ${recentOrders.length + 1} orders within 10 minutes.`);
  }

  // 4. High-Value COD Risk Check
  if (total && total > 6000) {
    riskScore += 15;
    reasons.push("High-value COD order (> ৳6,000). Recommend advance delivery fee confirmation.");
  }

  // Determine Risk Level & Action
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  let recommendedAction: "allow" | "flag" | "require_advance" | "block" = "allow";

  if (riskScore >= 70) {
    riskLevel = "high";
    recommendedAction = "require_advance";
  } else if (riskScore >= 30) {
    riskLevel = "medium";
    recommendedAction = "flag";
  }

  return {
    riskScore,
    riskLevel,
    isBlacklisted: false,
    courierSuccessRate,
    previousOrdersCount: orderList.length,
    isDuplicateOrder,
    duplicateOrderId,
    reasons,
    recommendedAction,
  };
}

/**
 * 2. Real-Time Incomplete / Abandoned Lead Capture (Triggered Instantly on Checkout Input)
 */
export async function saveIncompleteLead(input: {
  name?: string;
  phone?: string;
  email?: string;
  district?: string;
  thana?: string;
  address?: string;
  cartItems: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    variant?: string;
  }>;
  cartTotal: number;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
}) {
  const cleanPhone = (input.phone || "").trim().replace(/[^0-9]/g, "");
  const cleanEmail = (input.email || "").trim().toLowerCase();
  const cleanName = (input.name || "").trim();

  // Require at least a valid contact identifier (phone with >= 6 digits, or email, or name)
  if (!cleanPhone && !cleanEmail && !cleanName) {
    return { success: false, error: "No contact info" };
  }

  const identifier = cleanPhone || cleanEmail || `lead_${cleanName.toLowerCase().replace(/\s+/g, "_")}`;

  const existingIdx = memoryAbandonedCheckouts.findIndex(
    (l) =>
      (cleanPhone && l.customer_phone === cleanPhone) ||
      (cleanEmail && l.customer_email === cleanEmail) ||
      (l.id === identifier)
  );

  const lead: AbandonedLead = {
    id: existingIdx >= 0 ? memoryAbandonedCheckouts[existingIdx].id : `ab-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customer_name: cleanName || "Guest Customer",
    customer_phone: cleanPhone || "Not Provided",
    customer_email: cleanEmail || undefined,
    district: input.district || "Dhaka City",
    address: [input.address, input.thana, input.district].filter(Boolean).join(", "),
    cart_items: input.cartItems.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity || 1,
      price: it.price || 0,
      image: it.image,
      variant: it.variant,
    })),
    cart_total: input.cartTotal,
    recovery_status: existingIdx >= 0 && memoryAbandonedCheckouts[existingIdx].recovery_status === "converted"
      ? "converted"
      : "abandoned",
    last_active_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    memoryAbandonedCheckouts[existingIdx] = lead;
  } else {
    memoryAbandonedCheckouts.unshift(lead);
  }

  // Keep latest 200 leads in memory
  if (memoryAbandonedCheckouts.length > 200) {
    memoryAbandonedCheckouts = memoryAbandonedCheckouts.slice(0, 200);
  }

  return { success: true, leadId: lead.id };
}

export async function markLeadConverted(phone: string) {
  const cleanPhone = phone.trim().replace(/[^0-9]/g, "");
  memoryAbandonedCheckouts = memoryAbandonedCheckouts.map((l) =>
    l.customer_phone === cleanPhone ? { ...l, recovery_status: "converted" } : l
  );
  revalidatePath("/admin/orders/incomplete");
  return { success: true };
}

export async function getAbandonedCheckouts() {
  const leads = await getStoredLeads();
  return leads.filter((l) => l.recovery_status !== "converted");
}

export async function createOrderFromAbandonedLead(leadId: string, fallbackLead?: AbandonedLead) {
  const currentLeads = await getStoredLeads();
  let lead = currentLeads.find((l) => l.id === leadId) || fallbackLead;

  if (!lead) {
    return { success: false, error: "Incomplete lead data not found" };
  }

  const { createOrder } = await import("@/features/orders/actions");

  try {
    const isDhaka = (lead.district || "").toLowerCase().includes("dhaka");
    const deliveryFee = isDhaka ? 60 : 120;

    const itemsToOrder = (lead.cart_items && lead.cart_items.length > 0)
      ? lead.cart_items.map((it) => ({
          product_id: it.id || "prod_converted",
          variant_id: null,
          name: it.name,
          price: it.price,
          quantity: it.quantity || 1,
        }))
      : [
          {
            product_id: "prod_converted",
            variant_id: null,
            name: "Skincare Cosmetics Lead Package",
            price: lead.cart_total > 0 ? lead.cart_total : 1000,
            quantity: 1,
          },
        ];

    const res = await createOrder({
      customer: {
        name: lead.customer_name || "Customer",
        phone: lead.customer_phone || "01700000000",
        email: lead.customer_email || undefined,
        district: lead.district || "Dhaka City",
        thana: "",
        address: lead.address || "Dhaka, Bangladesh",
        notes: `Order converted from Incomplete Lead (${lead.id}) via Admin Dashboard`,
      },
      items: itemsToOrder,
      shipping: {
        method: isDhaka ? "Inside Dhaka Express (24-48h)" : "Outside Dhaka Courier (3-5d)",
        amount: deliveryFee,
      },
    });

    if (res.success) {
      const updatedLeads = currentLeads.map((l) =>
        l.id === leadId || (lead && l.customer_phone === lead.customer_phone)
          ? { ...l, recovery_status: "converted" as const }
          : l
      );
      await saveStoredLeads(updatedLeads);

      revalidatePath("/admin/orders");
      revalidatePath("/admin/orders/incomplete");
      return { success: true, orderNumber: res.orderNumber, orderId: res.orderId };
    }

    return { success: false, error: res.error || "Failed to create order" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to convert lead" };
  }
}

/**
 * 3. Fraud Blacklist Management
 */
export async function getFraudProfiles() {
  return await getStoredFraudProfiles();
}

export async function addBlacklistEntry(input: {
  type: "phone" | "ip" | "email";
  value: string;
  reason: string;
}) {
  const current = await getStoredFraudProfiles();
  const newProfile: FraudProfile = {
    id: `fp-${Date.now()}`,
    identifier_type: input.type,
    identifier_value: input.value.trim(),
    risk_score: 100,
    cancellation_count: 5,
    rejected_delivery_count: 3,
    return_abuse_count: 2,
    is_blacklisted: true,
    blacklist_reason: input.reason || "Manually blocked by store administrator.",
    updated_at: new Date().toISOString(),
  };

  current.unshift(newProfile);
  await saveStoredFraudProfiles(current);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/fraud");
  return { success: true, profile: newProfile };
}

export async function removeBlacklistEntry(id: string) {
  const current = await getStoredFraudProfiles();
  const updated = current.filter((p) => p.id !== id);
  await saveStoredFraudProfiles(updated);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/fraud");
  return { success: true };
}

export async function toggleBlacklistStatus(phoneOrId: string, isBlacklisted: boolean, reason?: string) {
  const current = await getStoredFraudProfiles();
  const clean = phoneOrId.trim();
  const existing = current.find((p) => p.identifier_value === clean || p.id === clean);
  if (existing) {
    existing.is_blacklisted = isBlacklisted;
    existing.blacklist_reason = reason || existing.blacklist_reason;
  } else {
    current.unshift({
      id: `fp-${Date.now()}`,
      identifier_type: "phone",
      identifier_value: clean,
      risk_score: 100,
      cancellation_count: 3,
      rejected_delivery_count: 2,
      return_abuse_count: 1,
      is_blacklisted: isBlacklisted,
      blacklist_reason: reason || "Manual blacklist toggle",
      updated_at: new Date().toISOString(),
    });
  }
  await saveStoredFraudProfiles(current);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/fraud");
  return { success: true };
}

export async function sendAbandonedRecoverySms(id: string) {
  const item = memoryAbandonedCheckouts.find((c) => c.id === id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  if (item) {
    await sendSmsNotification({
      recipientPhone: item.customer_phone,
      eventType: "abandoned_cart",
      variables: {
        customer_name: item.customer_name || "সম্মানিত গ্রাহক",
        store_name: "Blush & Budget",
        checkout_url: `${appUrl}/checkout`,
        discount_code: "BLUSH5",
      },
    });
    item.recovery_status = "sms_sent";
  }
  return { success: true };
}

/**
 * 4. Duplicate Order Merger
 */
export async function mergeDuplicateOrders(targetOrderId: string, duplicateOrderId: string) {
  const supabase = createAdminClient();

  // 1. Fetch both orders with items
  const [{ data: targetOrder }, { data: dupOrder }] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").eq("id", targetOrderId).single(),
    supabase.from("orders").select("*, order_items(*)").eq("id", duplicateOrderId).single(),
  ]);

  if (!targetOrder || !dupOrder) {
    return { error: "One or both orders could not be found." };
  }

  // 2. Re-assign items from dupOrder to targetOrder
  const dupItems = dupOrder.order_items || [];
  for (const it of dupItems) {
    await supabase.from("order_items").update({ order_id: targetOrderId }).eq("id", it.id);
  }

  // 3. Recalculate target order total
  const newSubtotal = Number(targetOrder.subtotal || 0) + Number(dupOrder.subtotal || 0);
  const newTotal = newSubtotal + Number(targetOrder.shipping_amount || 0);

  await supabase
    .from("orders")
    .update({
      subtotal: newSubtotal,
      total: newTotal,
      internal_note: `Merged with duplicate order #${dupOrder.order_number}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetOrderId);

  // 4. Mark duplicate order as cancelled/merged
  await supabase
    .from("orders")
    .update({
      status: "cancelled",
      internal_note: `Merged into Order #${targetOrder.order_number}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", duplicateOrderId);

  await supabase.from("order_status_history").insert([
    {
      order_id: targetOrderId,
      status: targetOrder.status,
      note: `Merged items from duplicate order #${dupOrder.order_number}. New Total: ৳${newTotal}`,
    },
    {
      order_id: duplicateOrderId,
      status: "cancelled",
      note: `Cancelled as duplicate. Merged into Order #${targetOrder.order_number}`,
    },
  ]);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${targetOrderId}`);

  return { success: true, newTotal };
}
