"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSmsNotification } from "@/features/sms/actions";
import { revalidatePath } from "next/cache";

export interface PostPurchaseConfig {
  reviewRequestDays: number;
  replenishmentDays: number;
  autoLoyaltyPoints: number;
  autoRestockOnReturn: boolean;
  autoDispatchOnConfirm: boolean;
  defaultCourier: "steadfast" | "pathao" | "smart" | "manual";
}

let memoryAutomationConfig: PostPurchaseConfig = {
  reviewRequestDays: 3,
  replenishmentDays: 45,
  autoLoyaltyPoints: 50,
  autoRestockOnReturn: true,
  autoDispatchOnConfirm: true,
  defaultCourier: "smart",
};

export async function getPostPurchaseConfig(): Promise<PostPurchaseConfig> {
  return memoryAutomationConfig;
}

export async function savePostPurchaseConfig(config: Partial<PostPurchaseConfig>) {
  memoryAutomationConfig = {
    ...memoryAutomationConfig,
    ...config,
  };
  revalidatePath("/admin/orders/settings");
  return { success: true, config: memoryAutomationConfig };
}

/**
 * Trigger Post-Purchase Skincare Review Request Message
 */
export async function triggerReviewRequest(orderId: string, phone: string, customerName: string) {
  const { getLiveBaseUrl } = await import("@/lib/utils");
  const appUrl = await getLiveBaseUrl();
  await sendSmsNotification({
    recipientPhone: phone,
    eventType: "review_request",
    variables: {
      customer_name: customerName,
      store_name: "Azonno",
      store_url: `${appUrl}/account/reviews`,
    },
  });

  return { success: true, message: "Review request sent to customer!" };
}

/**
 * Trigger Skincare Replenishment / Restock Alert Message
 */
export async function triggerReplenishmentAlert(phone: string, customerName: string, productName: string) {
  const { getLiveBaseUrl } = await import("@/lib/utils");
  const appUrl = await getLiveBaseUrl();
  await sendSmsNotification({
    recipientPhone: phone,
    eventType: "promotional",
    variables: {
      customer_name: customerName,
      store_name: "Azonno",
      discount: "10%",
      coupon_code: "GLOW10",
      store_url: `${appUrl}/`,
    },
  });

  return { success: true, message: `Replenishment reminder sent for ${productName}!` };
}
