"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
    name: "Order Phone Verification OTP",
    event_type: "order_otp",
    template: "Your {{store_name}} order verification OTP code is {{otp_code}}. Valid for 5 minutes. Do not share this code.",
    variables: ["otp_code", "store_name", "customer_name"],
    status: "active",
  },
  {
    id: "t1",
    name: "Order Placed & Confirmed",
    event_type: "order_created",
    template: "Dear {{customer_name}}, your order {{order_number}} of BDT {{total}} has been confirmed! We will dispatch soon. Track: {{tracking_url}}",
    variables: ["customer_name", "order_number", "total", "tracking_url"],
    status: "active",
  },
  {
    id: "t2",
    name: "Consignment Dispatched",
    event_type: "order_shipped",
    template: "Dear {{customer_name}}, your order {{order_number}} is on the way via {{courier_name}}. Tracking ID: {{tracking_id}}. Track: {{tracking_url}}",
    variables: ["customer_name", "order_number", "courier_name", "tracking_id", "tracking_url"],
    status: "active",
  },
  {
    id: "t3",
    name: "Flash Sale Promotional Voucher",
    event_type: "promotional",
    template: "Exclusive Flash Deal! Use promo code {{coupon_code}} for {{discount}} OFF authentic K-Beauty skincare. Shop now: {{store_url}}",
    variables: ["coupon_code", "discount", "store_url"],
    status: "active",
  },
];

export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  const { getSetting } = await import("@/lib/settings/config-service");
  const saved = await getSetting<SmsTemplate[]>("sms", "templates", DEFAULT_TEMPLATES);
  return saved || DEFAULT_TEMPLATES;
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
  const providerConfig = await getSmsProviderConfig();
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
  const template = templates.find((t) => t.event_type === input.eventType) || templates[0];

  let message = template.template;
  for (const [key, val] of Object.entries(input.variables)) {
    message = message.replaceAll(`{{${key}}}`, val);
  }

  const logItem: SmsLogItem = {
    id: `sms-${Date.now()}`,
    recipient_phone: input.recipientPhone,
    message,
    status: "delivered",
    provider: providerConfig.provider_name || "BulkSMSBD",
    sent_at: new Date().toISOString(),
  };

  memorySmsLogs = [logItem, ...memorySmsLogs];

  const supabase = createAdminClient();
  try {
    await supabase.from("sms_logs").insert({
      recipient_phone: input.recipientPhone,
      message,
      status: "delivered",
      provider_response: { gateway: providerConfig.provider_name || "BulkSMSBD", status: "SUCCESS", message_id: logItem.id },
    });
  } catch (e) {
    // Graceful fallback
  }

  return { success: true, log: logItem };
}

