import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBkashPayment } from "@/lib/payments/bkash";
import { logIntegrationEvent } from "@/features/modules/actions";
import { getBaseUrl, getRequestBaseUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required orderId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Order is already paid" },
        { status: 400 }
      );
    }

    // Determine dynamic callback URL matching the user's host (e.g. blushbudget.com, staging, or localhost)
    const baseUrl = getRequestBaseUrl(req) || getBaseUrl();
    const callbackUrl = `${baseUrl}/api/payments/bkash/callback`;

    const paymentRes = await createBkashPayment({
      amount: order.total,
      orderNumber: order.order_number,
      payerReference: order.guest_phone || order.order_number,
      callbackUrl,
    });

    if (!paymentRes.success || !paymentRes.bkashURL) {
      await logIntegrationEvent({
        provider: "BKASH",
        moduleKey: "bkash",
        event: "create_payment_failed",
        status: "error",
        message: `Failed to create bKash payment for order ${order.order_number}: ${paymentRes.error || paymentRes.statusMessage}`,
        metadata: { orderId, error: paymentRes.error, raw: paymentRes.raw },
      });

      return NextResponse.json(
        { success: false, error: paymentRes.error || "Failed to create bKash checkout session" },
        { status: 502 }
      );
    }

    // Record payment session initiation in order note / status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: "pending",
      note: `bKash payment session initiated. PaymentID: ${paymentRes.paymentID}`,
    });

    await logIntegrationEvent({
      provider: "BKASH",
      moduleKey: "bkash",
      event: "create_payment_success",
      status: "success",
      message: `bKash checkout URL generated for order ${order.order_number}. PaymentID: ${paymentRes.paymentID}`,
      metadata: { orderId, paymentID: paymentRes.paymentID, amount: order.total },
    });

    return NextResponse.json({
      success: true,
      bkashURL: paymentRes.bkashURL,
      paymentID: paymentRes.paymentID,
    });
  } catch (err: any) {
    console.error("Error creating bKash payment:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
