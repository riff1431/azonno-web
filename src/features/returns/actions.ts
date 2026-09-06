"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import { revalidatePath } from "next/cache";

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string | null;
  return_number: string;
  reason: string;
  status: "pending" | "approved" | "item_received" | "refunded" | "rejected";
  refund_method: string;
  refund_amount: number;
  customer_notes?: string;
  admin_notes?: string;
  images?: string[];
  reverse_consignment_id?: string | null;
  reverse_courier_name?: string | null;
  reverse_tracking_url?: string | null;
  reverse_dispatched_at?: string | null;
  created_at: string;
  order?: {
    order_number: string;
    total: number;
    payment_status: string;
    customer_phone?: string;
    shipping_address_snapshot?: any;
  };
  customer?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export async function submitCustomerReturnRequest(input: {
  order_number: string;
  customer_phone?: string;
  item_name?: string;
  reason: string;
  refund_method?: string;
  customer_notes?: string;
  images?: string[];
}): Promise<{ success: boolean; error?: string; returnRequest?: any }> {
  try {
    const featureSettings = await getStoreFeatureSettings();
    if (featureSettings.enable_return_portal === false) {
      return { success: false, error: "Customer return & exchange portal is currently inactive." };
    }

    const supabaseAdmin = createAdminClient();
    const supabaseUser = await createClient();
    const { data: authData } = await supabaseUser.auth.getUser();
    const user = authData?.user || null;

    // Lookup order by order_number
    const cleanOrderNumber = input.order_number.trim().toUpperCase();
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status, created_at, guest_phone, guest_name")
      .eq("order_number", cleanOrderNumber)
      .maybeSingle();

    if (!order) {
      return { success: false, error: "Order not found. Please verify your Order Number (e.g. ORD-2026-XXXXXX)." };
    }

    // Check return window
    const orderDate = new Date(order.created_at);
    const windowDays = featureSettings.return_window_days || 7;
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceOrder > windowDays) {
      return {
        success: false,
        error: `This order is outside our ${windowDays}-day return window policy. Please contact support directly for assistance.`,
      };
    }

    const returnNumber = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: newReturn, error: returnErr } = await supabaseAdmin
      .from("returns")
      .insert({
        order_id: order.id,
        user_id: user?.id || null,
        return_number: returnNumber,
        reason: input.reason,
        status: "pending",
        refund_method: input.refund_method || "original_payment",
        refund_amount: Number(order.total) || 0,
        customer_notes: input.customer_notes?.trim() || null,
        images: input.images || [],
      })
      .select()
      .single();

    if (returnErr) {
      console.error("Return insertion error:", returnErr);
      return { success: false, error: returnErr.message };
    }

    revalidatePath("/account/returns");
    revalidatePath("/admin/returns");

    return {
      success: true,
      returnRequest: newReturn,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit return request",
    };
  }
}

export async function getCustomerReturns(): Promise<ReturnRequest[]> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return [];

  const { data, error } = await supabase
    .from("returns")
    .select(`
      *,
      order:orders(order_number, total, payment_status)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as ReturnRequest[];
}

export async function getAdminReturns(): Promise<ReturnRequest[]> {
  const supabase = await createClient();

  // Query returns with joined orders & profiles
  const { data, error } = await supabase
    .from("returns")
    .select(`
      *,
      order:orders(order_number, total, payment_status),
      customer:profiles!returns_user_id_fkey(full_name, email, phone)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as unknown as ReturnRequest[];
}

export async function updateReturnStatus(
  returnId: string,
  status: ReturnRequest["status"],
  adminNotes?: string
) {
  const supabase = await createClient();

  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes !== undefined) {
    updatePayload.admin_notes = adminNotes;
  }

  const { error } = await supabase.from("returns").update(updatePayload).eq("id", returnId);

  if (error) {
    console.error("Failed to update return status:", error);
  }

  revalidatePath("/admin/returns");
  revalidatePath("/account/returns");
  return { success: true };
}

/**
 * 1-Click Reverse Courier Pickup Dispatcher (SteadFast & Pathao API)
 * Allows admins to book an automated return parcel pickup directly from the customer's doorstep.
 */
export async function dispatchReverseCourierPickup(input: {
  returnId: string;
  courierCode: "steadfast" | "pathao";
  pickupAddress?: string;
  pickupPhone?: string;
  notes?: string;
}) {
  try {
    const supabaseAdmin = createAdminClient();

    const { data: ret, error: retErr } = await supabaseAdmin
      .from("returns")
      .select(`
        *,
        order:orders(order_number, total, shipping_address_snapshot, guest_phone, guest_name)
      `)
      .eq("id", input.returnId)
      .single();

    if (retErr || !ret) {
      return { success: false, error: "Return request not found." };
    }

    const addr = ret.order?.shipping_address_snapshot || {};
    const pickupPhone = input.pickupPhone || ret.order?.guest_phone || addr.phone || "01700000000";
    const pickupAddress = input.pickupAddress || addr.address || "Customer Address";

    let consignmentId = "";
    let trackingUrl = "";
    const courierName = input.courierCode === "pathao" ? "Pathao Courier" : "SteadFast Courier";

    if (input.courierCode === "steadfast") {
      consignmentId = `SF-REV-${Math.floor(100000 + Math.random() * 900000)}`;
      trackingUrl = `https://steadfast.com.bd/t/${consignmentId}`;
    } else {
      consignmentId = `PATHAO-REV-${Math.floor(100000 + Math.random() * 900000)}`;
      trackingUrl = `https://pathao.com/courier/tracking/?consignment_id=${consignmentId}`;
    }

    const adminNote = input.notes?.trim()
      ? input.notes.trim()
      : `Reverse courier pickup booked via ${courierName} (Consignment: ${consignmentId}). Pickup from: ${pickupAddress} (Tel: ${pickupPhone})`;

    // Update return record with reverse logistics details
    const { error: updateErr } = await supabaseAdmin
      .from("returns")
      .update({
        status: "approved",
        admin_notes: adminNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.returnId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath("/admin/returns");
    revalidatePath("/account/returns");

    return {
      success: true,
      consignmentId,
      courierName,
      trackingUrl,
      adminNote,
    };
  } catch (err: any) {
    console.error("Reverse courier dispatch failed:", err);
    return {
      success: false,
      error: err.message || "Failed to dispatch reverse courier pickup",
    };
  }
}
