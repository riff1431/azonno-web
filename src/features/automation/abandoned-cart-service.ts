"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutAndFraudSettings } from "@/features/settings/checkout-settings-actions";
import { saveIncompleteLead } from "@/features/fraud/actions";

export interface AbandonedCartPayload {
  customer_name: string;
  phone: string;
  email?: string;
  division?: string;
  district?: string;
  thana?: string;
  address?: string;
  cart_items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }[];
  subtotal: number;
}

/**
 * Capture customer checkout data in real time as they type
 */
export async function captureAbandonedCart(payload: AbandonedCartPayload) {
  const settings = await getCheckoutAndFraudSettings().catch(() => ({ enable_abandoned_cart_capture: true }));
  if (settings.enable_abandoned_cart_capture === false) return { skipped: true };

  // 1. Extract real client IP
  let clientIp: string | undefined;
  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    const { extractClientIp } = await import("@/lib/utils");
    clientIp = extractClientIp(headerStore);
  } catch {}

  // 2. Instantly save to incomplete leads dashboard
  await saveIncompleteLead({
    name: payload.customer_name,
    phone: payload.phone,
    email: payload.email,
    ip_address: clientIp,
    division: payload.division,
    district: payload.district,
    thana: payload.thana,
    address: payload.address,
    cartItems: (payload.cart_items || []).map((it) => ({
      product_id: it.product_id,
      name: it.product_name,
      quantity: it.quantity,
      price: it.price,
      image_url: it.image_url,
    })),
    subtotal: payload.subtotal,
    cartTotal: payload.subtotal,
  }).catch(() => null);

  // 2. Also try writing to optional incomplete_orders table if present
  const cleanPhone = (payload.phone || "").replace(/\D/g, "");
  if (cleanPhone.length >= 6) {
    try {
      const supabase = createAdminClient();
      await supabase.from("incomplete_orders").upsert(
        {
          phone: cleanPhone,
          customer_name: payload.customer_name || "Shopper",
          email: payload.email || null,
          shipping_division: payload.division || null,
          shipping_district: payload.district || null,
          shipping_thana: payload.thana || null,
          shipping_address: payload.address || null,
          cart_items: payload.cart_items,
          cart_total: payload.subtotal,
          last_active_at: new Date().toISOString(),
          status: "abandoned",
        },
        { onConflict: "phone" }
      );
    } catch {}
  }

  return { success: true };
}
