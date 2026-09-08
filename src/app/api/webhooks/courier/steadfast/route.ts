import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSteadfastSettings } from "@/features/logistics/courier-settings-actions";
import { reduceOrderStock, restoreOrderStock } from "@/features/orders/actions";

/**
 * Official SteadFast Courier Webhook Handler
 * Documentation:
 * - Header: Authorization: Bearer {auth_token}
 * - Payload 1: notification_type = "delivery_status"
 * - Payload 2: notification_type = "tracking_update"
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const settings = await getSteadfastSettings(true);

    // 1. Verify Bearer Token if configured
    if (settings.webhook_auth_token && settings.webhook_auth_token !== "••••••••") {
      const expectedBearer = `Bearer ${settings.webhook_auth_token}`;
      const fallbackApiKeyBearer = `Bearer ${settings.api_key}`;

      if (authHeader !== expectedBearer && authHeader !== fallbackApiKeyBearer) {
        return NextResponse.json(
          { status: "error", message: "Unauthorized. Invalid Bearer auth token." },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const supabase = createAdminClient();

    const notificationType = body.notification_type || "delivery_status";
    const consignmentId = body.consignment_id ? String(body.consignment_id) : null;
    const invoice = body.invoice || null;
    const statusRaw = (body.status || "").toLowerCase().trim();
    const trackingMessage = body.tracking_message || "";
    const updatedAt = body.updated_at || new Date().toISOString();

    if (!consignmentId && !invoice) {
      return NextResponse.json(
        { status: "error", message: "Missing consignment_id or invoice identifier." },
        { status: 400 }
      );
    }

    // 2. Find target order in database
    let query = supabase
      .from("orders")
      .select("id, order_number, user_id, status, subtotal, shipping_amount, discount_amount, total, advance_paid");

    if (consignmentId && invoice) {
      query = query.or(`consignment_id.eq.${consignmentId},order_number.eq.${invoice}`);
    } else if (consignmentId) {
      query = query.eq("consignment_id", consignmentId);
    } else {
      query = query.eq("order_number", invoice);
    }

    const { data: orders, error: findError } = await query;
    if (findError || !orders || orders.length === 0) {
      return NextResponse.json(
        { status: "error", message: `Order with Consignment ID '${consignmentId || invoice}' not found.` },
        { status: 404 }
      );
    }

    const order = orders[0];

    // 3. Handle Delivery Status Notification
    if (notificationType === "delivery_status") {
      if (statusRaw === "delivered" || statusRaw === "partial_delivered") {
        await supabase
          .from("orders")
          .update({
            status: "delivered",
            payment_status: "paid",
            amount_to_collect: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        await reduceOrderStock(order.id, supabase);

        await supabase.from("order_status_history").insert({
          order_id: order.id,
          status: "delivered",
          note: `SteadFast Webhook: Delivered (${statusRaw}). ${trackingMessage || "COD collection completed."} Updated at: ${updatedAt}`,
          created_by: null,
        });

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
            // Non-critical loyalty insertion
          }
        }

        // Automated EMQ 9.0+ Meta & TikTok Conversions API (CAPI) Purchase Trigger on Courier Delivery
        try {
          const { triggerStatusGatedPurchaseCapi } = await import("@/features/orders/actions");
          await triggerStatusGatedPurchaseCapi(order.id, "delivered", order, null, supabase);
        } catch (capiErr) {
          console.warn("[SteadFast CAPI Delivery Trigger]:", capiErr);
        }
      } else if (statusRaw === "cancelled" || statusRaw === "returned" || statusRaw === "failed") {
        await supabase
          .from("orders")
          .update({
            status: statusRaw === "cancelled" ? "cancelled" : "returned",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        await restoreOrderStock(order.id, supabase);

        await supabase.from("order_status_history").insert({
          order_id: order.id,
          status: statusRaw === "cancelled" ? "cancelled" : "returned",
          note: `SteadFast Webhook: ${statusRaw.toUpperCase()}. ${trackingMessage || "Parcel returned to merchant."} Inventory automatically restocked.`,
          created_by: null,
        });
      } else if (statusRaw === "pending" || statusRaw === "in_review") {
        await supabase.from("order_status_history").insert({
          order_id: order.id,
          status: order.status,
          note: `SteadFast Webhook Status: ${statusRaw}. ${trackingMessage}`,
          created_by: null,
        });
      }
    } else if (notificationType === "tracking_update") {
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: order.status,
        note: `SteadFast Tracking Update: ${trackingMessage} (${updatedAt})`,
        created_by: null,
      });
    }

    if (consignmentId) {
      await supabase
        .from("courier_shipments")
        .update({
          delivery_status: statusRaw || "in_transit",
          last_status_message: trackingMessage || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("consignment_id", consignmentId);
    }

    return NextResponse.json({
      status: "success",
      message: "Webhook received successfully.",
    });
  } catch (err: any) {
    console.error("SteadFast Webhook execution error:", err);
    return NextResponse.json(
      { status: "error", message: err.message || "Internal server error processing webhook." },
      { status: 500 }
    );
  }
}

