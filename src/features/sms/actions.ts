"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/utils";

export interface SmsTemplate {
  id: string;
  name: string;
  event_type: string;
  template: string;
  variables: string[];
  status: "active" | "inactive";
}

export interface SmsLogItem {
  id: string;
  recipient_phone: string;
  message: string;
  status: "sent" | "delivered" | "failed";
  provider: string;
  sent_at: string;
}

// In-memory fallback logs for instant preview if Supabase table is not yet migrated
let memorySmsLogs: SmsLogItem[] = [
  {
    id: "sms-1",
    recipient_phone: "01712345678",
    message: "Dear Tanvir Ahmed, your order ORD-2026-895823 of BDT 1365 has been confirmed! We will dispatch soon. Track: /account/track",
    status: "delivered",
    provider: "BulkSMSBD",
    sent_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: "t0",
    name: "Phone Verification OTP",
    event_type: "order_otp",
    template: " {{customer_name}}, {{store_name}}- your items Code  {{otp_code}}। items 5  for । Codeitems  ।",
    variables: ["otp_code", "store_name", "customer_name"],
    status: "active",
  },
  {
    id: "t1",
    name: "Order Placed  ",
    event_type: "order_created",
    template: " {{customer_name}}, {{store_name}}- your Order #{{order_number}} permanently   successfully (: ৳{{total}})।   Delivery  ।  : {{tracking_url}}",
    variables: ["customer_name", "order_number", "total", "store_name", "tracking_url"],
    status: "active",
  },
  {
    id: "t2",
    name: "   Tracking",
    event_type: "order_shipped",
    template: " {{customer_name}}, your items (#{{order_number}}) {{courier_name}}    successfully। Tracking ID: {{tracking_id}}।  : {{tracking_url}}",
    variables: ["customer_name", "order_number", "courier_name", "tracking_id", "tracking_url"],
    status: "active",
  },
  {
    id: "t3",
    name: "Delivered Confirmed",
    event_type: "order_delivered",
    template: " {{customer_name}}, {{store_name}}- Order #{{order_number}} permanently Delivery successfully।    for  !",
    variables: ["customer_name", "order_number", "store_name"],
    status: "active",
  },
  {
    id: "t4",
    name: "Abandoned Checkout Recovery",
    event_type: "abandoned_cart",
    template: " {{customer_name}}, {{store_name}}- your desired Products   ।  Orderitems    : {{checkout_url}}",
    variables: ["customer_name", "store_name", "checkout_url", "discount_code"],
    status: "active",
  },
  {
    id: "t5",
    name: "Order Cancel  ",
    event_type: "order_cancelled",
    template: " {{customer_name}}, your Order #{{order_number}} Cancel  successfully।     AddAdd to Cart। ।",
    variables: ["customer_name", "order_number", "store_name"],
    status: "active",
  },
  {
    id: "t6",
    name: " Delivery Charge ",
    event_type: "advance_requested",
    template: " {{customer_name}}, Order #{{order_number}}- Delivery Charge  ৳{{advance_amount}}    ।  :00 Cash  Delivery Enter।",
    variables: ["customer_name", "order_number", "advance_amount"],
    status: "active",
  },
  {
    id: "t7",
    name: "Reviews   ",
    event_type: "review_request",
    template: " {{customer_name}},   {{store_name}}- Products your  successfully। your Price Reviews    : {{store_url}}",
    variables: ["customer_name", "store_name", "store_url"],
    status: "active",
  },
  {
    id: "t8",
    name: "   Discount",
    event_type: "promotional",
    template: " ! {{store_name}}- :00 {{discount}} OFF  use  Code {{coupon_code}}। Buy Now: {{store_url}}",
    variables: ["coupon_code", "discount", "store_name", "store_url"],
    status: "active",
  },
];

export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  const { getSetting } = await import("@/lib/settings/config-service");
  const saved = await getSetting<SmsTemplate[]>("sms", "templates", DEFAULT_TEMPLATES);
  return saved || DEFAULT_TEMPLATES;
}

export async function resetSmsTemplatesToDefault(): Promise<{ success: boolean; templates: SmsTemplate[] }> {
  const { updateGroupSettings } = await import("@/lib/settings/config-service");
  await updateGroupSettings("sms", { templates: DEFAULT_TEMPLATES });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/communication/sms/templates");
  return { success: true, templates: DEFAULT_TEMPLATES };
}

export async function saveSmsTemplate(template: {
  id?: string;
  name: string;
  event_type: string;
  template: string;
  variables: string[];
}): Promise<SmsTemplate[]> {
  const { updateGroupSettings } = await import("@/lib/settings/config-service");
  const current = await getSmsTemplates();
  let updated: SmsTemplate[];

  if (template.id) {
    updated = current.map((t) =>
      t.id === template.id
        ? {
            ...t,
            name: template.name.trim(),
            event_type: template.event_type.trim(),
            template: template.template.trim(),
            variables: template.variables,
          }
        : t
    );
  } else {
    const newTpl: SmsTemplate = {
      id: `tpl-${Date.now()}`,
      name: template.name.trim(),
      event_type: template.event_type.trim(),
      template: template.template.trim(),
      variables: template.variables,
      status: "active",
    };
    updated = [...current, newTpl];
  }

  await updateGroupSettings("sms", { templates: updated });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/communication/sms/templates");
  return updated;
}

export async function deleteSmsTemplate(id: string): Promise<SmsTemplate[]> {
  const { updateGroupSettings } = await import("@/lib/settings/config-service");
  const current = await getSmsTemplates();
  const updated = current.filter((t) => t.id !== id);
  await updateGroupSettings("sms", { templates: updated });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/communication/sms/templates");
  return updated;
}

export async function getSmsLogs() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("sms_logs").select("*").order("sent_at", { ascending: false });
  if (data && data.length > 0) return data;
  return memorySmsLogs;
}

export async function sendSmsNotification(input: {
  recipientPhone: string;
  eventType: string;
  variables: Record<string, string>;
}) {
  const { shouldSendNotification, getSmsProviderConfig } = await import("@/features/communication/actions");
  
  // Check if provider is enabled
  const providerConfig = await getSmsProviderConfig(true);
  if (!providerConfig.is_active && input.eventType !== "test_sms") {
    return {
      success: false,
      skipped: true,
      reason: "SMS Provider Gateway is currently disabled in Admin settings.",
    };
  }

  // Check event-specific notification matrix (OTP and test SMS bypass this check)
  if (input.eventType !== "order_otp" && input.eventType !== "test_sms") {
    const isAllowed = await shouldSendNotification(input.eventType, "sms");
    if (!isAllowed) {
      return {
        success: true,
        skipped: true,
        reason: `SMS notification for event '${input.eventType}' is toggled OFF by admin.`,
      };
    }
  }

  const templates = await getSmsTemplates();
  const targetTypes = (input.eventType === "order_placed" || input.eventType === "order_created")
    ? ["order_placed", "order_created"]
    : [input.eventType];
  const template = templates.find((t) => targetTypes.includes(t.event_type)) || templates[0];

  const { getLiveBaseUrl } = await import("@/lib/utils");
  const liveBaseUrl = await getLiveBaseUrl();

  const mergedVars: Record<string, string> = {
    store_name: "Azonno",
    discount_code: "BLUSH5",
    coupon_code: "BLUSH5",
    store_url: liveBaseUrl,
    customer_name: "Dear Customer",
    ...input.variables,
  };

  // Convert ANY relative path or incomplete URL variable to a complete live absolute URL
  for (const [key, val] of Object.entries(mergedVars)) {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        key.endsWith("_url") ||
        key === "tracking_url" ||
        key === "checkout_url" ||
        key === "store_url" ||
        trimmed.startsWith("/")
      ) {
        if (trimmed.startsWith("/")) {
          mergedVars[key] = `${liveBaseUrl}${trimmed}`;
        }
      }
    }
  }

  let message = template.template;
  if (input.eventType === "test_sms" && input.variables.custom_message) {
    message = input.variables.custom_message;
  } else {
    for (const [key, val] of Object.entries(mergedVars)) {
      message = message.replaceAll(`{{${key}}}`, String(val ?? ""));
    }
    // Remove any remaining unresolved double-brace tokens cleanly
    message = message.replace(/\{\{[^}]+\}\}/g, "").replace(/\s{2,}/g, " ").trim();
  }

  // Real Gateway Dispatch
  const { dispatchSmsToGateway } = await import("@/features/sms/sms-service");
  const sendRes = await dispatchSmsToGateway(
    providerConfig,
    input.recipientPhone,
    message,
    input.eventType
  );

  const logItem: SmsLogItem = {
    id: sendRes.messageId || `sms-${Date.now()}`,
    recipient_phone: input.recipientPhone,
    message,
    status: sendRes.success ? "delivered" : "failed",
    provider: providerConfig.provider_name || "BulkSMSBD",
    sent_at: new Date().toISOString(),
  };

  memorySmsLogs = [logItem, ...memorySmsLogs];

  const supabase = createAdminClient();
  try {
    await supabase.from("sms_logs").insert({
      recipient_phone: input.recipientPhone,
      message,
      status: sendRes.success ? "delivered" : "failed",
      provider_response: {
        gateway: providerConfig.provider_name || "BulkSMSBD",
        status: sendRes.success ? "SUCCESS" : "FAILED",
        message_id: logItem.id,
        raw: sendRes.rawResponse,
        error: sendRes.error,
        latencyMs: sendRes.latencyMs,
      },
    });
  } catch (e) {
    // Graceful fallback
  }

  return {
    success: sendRes.success,
    log: logItem,
    error: sendRes.error,
    providerResult: sendRes,
  };
}

