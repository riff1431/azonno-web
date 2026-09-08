/**
 * Unified Courier Orchestrator & Idempotent Dispatcher
 * Bridges SteadFast, Pathao, RedX, and Manual shipping providers
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createSteadfastConsignment, CourierBookingResult } from "./steadfast";
import { createPathaoConsignment } from "./pathao";

export interface DispatchOrderInput {
  orderId: string;
  orderNumber: string;
  courierCode: "steadfast" | "pathao" | "redx" | "manual";
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
  userId?: string | null;
}

export async function dispatchOrderToCourier(
  input: DispatchOrderInput
): Promise<CourierBookingResult> {
  const supabaseAdmin = createAdminClient();

  // 1. Idempotency Check: Verify if order is already dispatched/has consignment
  const { data: existingOrder, error: checkErr } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, consignment_id, tracking_id, shipping_address_snapshot, public_note")
    .eq("id", input.orderId)
    .single();

  if (existingOrder?.consignment_id) {
    return {
      success: false,
      courier_name: "SteadFast Courier",
      courier_code: input.courierCode,
      consignment_id: existingOrder.consignment_id,
      tracking_code: existingOrder.tracking_id || existingOrder.consignment_id,
      tracking_url: `https://steadfast.com.bd/t/${existingOrder.tracking_id || existingOrder.consignment_id}`,
      cod_amount: input.codAmount,
      error: `Order #${existingOrder.order_number} is already booked (Consignment ID: ${existingOrder.consignment_id}).`,
    };
  }

  // 2. Route to appropriate courier adapter
  let result: CourierBookingResult;

  if (input.courierCode === "pathao") {
    result = await createPathaoConsignment({
      merchant_order_id: input.orderNumber,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      recipient_address: input.recipientAddress,
      district: input.district,
      thana: input.thana,
      amount_to_collect: input.codAmount,
      item_quantity: input.totalQuantity || 1,
      item_weight: input.weightKg || 0.5,
      special_instruction: input.specialInstruction,
    });
  } else if (input.courierCode === "steadfast") {
    result = await createSteadfastConsignment({
      invoice: input.orderNumber,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      recipient_address: input.recipientAddress,
      cod_amount: input.codAmount,
      note: input.specialInstruction || `Order #${input.orderNumber} - Cosmetics parcel`,
    });
  } else {
    // Manual / Other Courier
    const manualCid = `MAN-${Math.floor(100000 + Math.random() * 900000)}`;
    result = {
      success: true,
      courier_name: "Manual",
      courier_code: "manual",
      consignment_id: manualCid,
      tracking_code: manualCid,
      tracking_url: "",
      cod_amount: input.codAmount,
      message: "Dispatched via Manual/In-house Logistics.",
    };
  }

  if (!result.success) {
    return result;
  }

  // 3. Atomically update Order Record in Database with snapshot fallback
  const addrSnap = (existingOrder as any)?.shipping_address_snapshot || {};
  const updatedAddressSnap = {
    ...addrSnap,
    courier_name: result.courier_name,
    consignment_id: result.consignment_id,
    tracking_code: result.tracking_code,
    tracking_url: result.tracking_url,
    delivery_hub: result.delivery_hub || null,
    booked_at: new Date().toISOString(),
  };

  const coreUpdate: any = {
    status: "shipped",
    consignment_id: result.consignment_id,
    tracking_id: result.tracking_code,
    shipping_method: result.courier_name,
    shipping_address_snapshot: updatedAddressSnap,
    updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabaseAdmin
    .from("orders")
    .update(coreUpdate)
    .eq("id", input.orderId);

  if (updateErr) {
    console.error("Critical: Order dispatch update failed:", updateErr);
  }

  // 4. Record in courier_shipments
  try {
    await supabaseAdmin.from("courier_shipments").insert({
      order_id: input.orderId,
      courier_name: result.courier_name,
      consignment_id: result.consignment_id,
      tracking_id: result.tracking_code,
      booking_status: "booked",
      delivery_status: "in_transit",
      cod_amount: input.codAmount,
      booked_at: new Date().toISOString(),
    });
  } catch (shipErr) {
    console.warn("courier_shipments insert skipped:", shipErr);
  }

  // 5. Append to Order Status Audit History
  try {
    await supabaseAdmin.from("order_status_history").insert({
      order_id: input.orderId,
      status: "shipped",
      note: `1-Click Dispatch: Booked with ${result.courier_name}. Consignment ID: ${result.consignment_id}, Tracking Code: ${result.tracking_code}, COD Amount: ৳${input.codAmount}`,
      created_by: input.userId || null,
    });
  } catch (histErr) {
    console.warn("order_status_history insert skipped:", histErr);
  }

  return result;
}
