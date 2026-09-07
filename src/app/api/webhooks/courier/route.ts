import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Real-Time Courier Webhook Receiver (SteadFast & Pathao Delivery Status Sync)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Parse status payload (handles both SteadFast and Pathao webhook schemas)
    const consignmentId = body.consignment_id || body.consignmentId || body.merchant_order_id;
    const trackingCode = body.tracking_code || body.tracking_id || body.trackingCode;
    const statusRaw = (body.status || body.delivery_status || "").toLowerCase();

    if (!consignmentId && !trackingCode) {
      return NextResponse.json({ error: "Missing consignment identifier" }, { status: 400 });
    }

    // Find the corresponding order
    let query = supabase.from("orders").select("id, order_number, user_id, status, order_items(*)");
    if (consignmentId) {
      query = query.or(`consignment_id.eq.${consignmentId},order_number.eq.${consignmentId}`);
    } else {
      query = query.eq("tracking_code", trackingCode);
    }

    const { data: orders, error: findError } = await query;
    if (findError || !orders || orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];
    let newStatus: string = order.status;
    let noteText = `Courier status webhook: ${statusRaw}`;

    if (["delivered", "successful", "complete"].includes(statusRaw)) {
      newStatus = "delivered";
      noteText = `Parcel delivered successfully by courier rider.`;

      // 1. Mark order delivered & paid
      await supabase
        .from("orders")
        .update({
          status: "delivered",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // 2. Award 50 Loyalty Reward Points if customer has account
      if (order.user_id) {
        try {
          await supabase.from("loyalty_points").insert({
            user_id: order.user_id,
            order_id: order.id,
            points: 50,
            type: "earned",
            description: `Cashback points for delivered order #${order.order_number}`,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.log("Loyalty point credit note");
        }
      }

      // 3. Automated EMQ 9.0+ Meta & TikTok Conversions API (CAPI) Purchase Trigger on Courier Delivery
      try {
        const { triggerStatusGatedPurchaseCapi } = await import("@/features/orders/actions");
        await triggerStatusGatedPurchaseCapi(order.id, "delivered", order, null, supabase);
      } catch (capiErr) {
        console.warn("[Courier Route CAPI Delivery Trigger]:", capiErr);
      }
    } else if (["returned", "return", "cancelled", "rto", "failed"].includes(statusRaw)) {
      newStatus = "returned";
      noteText = `Parcel returned / RTO by courier. Auto-restocking inventory items.`;

      // 1. Mark order returned
      await supabase
        .from("orders")
        .update({
          status: "returned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // 2. Auto Restock Inventory on Return
      const items = order.order_items || [];
      for (const item of items) {
        if (item.product_id) {
          try {
            const { data: inv } = await supabase
              .from("inventory")
              .select("id, on_hand")
              .eq("product_id", item.product_id)
              .maybeSingle();

            if (inv) {
              await supabase
                .from("inventory")
                .update({ on_hand: (inv.on_hand || 0) + Number(item.quantity || 1) })
                .eq("id", inv.id);
            }
          } catch (e) {
            console.log("Auto-restock inventory note");
          }
        }
      }
    } else if (["in_transit", "shipped", "picked", "out_for_delivery"].includes(statusRaw)) {
      newStatus = statusRaw === "out_for_delivery" ? "out_for_delivery" : "shipped";
      noteText = `Courier update: Parcel ${statusRaw.replace(/_/g, " ")}`;

      await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    // Append to order status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: newStatus,
      note: noteText,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/account/track");

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      newStatus,
      note: noteText,
    });
  } catch (err: any) {
    console.error("Courier webhook processing error:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
