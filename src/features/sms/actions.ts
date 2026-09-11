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
    name: "ফোন ভেরিফিকেশন ওটিপি",
    event_type: "order_otp",
    template: "প্রিয় {{customer_name}}, {{store_name}}-এ আপনার ওটিপি কোড হলো {{otp_code}}। এটি ৫ মিনিটের জন্য প্রযোজ্য। কোডটি গোপন রাখুন।",
    variables: ["otp_code", "store_name", "customer_name"],
    status: "active",
  },
  {
    id: "t1",
    name: "অর্ডার গ্রহণ ও কনফার্মেশন",
    event_type: "order_created",
    template: "প্রিয় {{customer_name}}, {{store_name}}-এ আপনার অর্ডার #{{order_number}} সফলভাবে গ্রহণ করা হয়েছে (বিল: ৳{{total}})। দ্রুত পার্সেল ডেলিভারি করা হবে। লাইভ ট্র্যাক: {{tracking_url}}",
    variables: ["customer_name", "order_number", "total", "store_name", "tracking_url"],
    status: "active",
  },
  {
    id: "t2",
    name: "কুরিয়ারে হস্তান্তর ও ট্র্যাকিং",
    event_type: "order_shipped",
    template: "প্রিয় {{customer_name}}, আপনার পার্সেলটি (#{{order_number}}) {{courier_name}} কুরিয়ারে তুলে দেওয়া হয়েছে। ট্র্যাকিং আইডি: {{tracking_id}}। ট্র্যাক করুন: {{tracking_url}}",
    variables: ["customer_name", "order_number", "courier_name", "tracking_id", "tracking_url"],
    status: "active",
  },
  {
    id: "t3",
    name: "ডেলিভারি সম্পন্ন নিশ্চিতকরণ",
    event_type: "order_delivered",
    template: "প্রিয় {{customer_name}}, {{store_name}}-এর অর্ডার #{{order_number}} সফলভাবে ডেলিভারি হয়েছে। আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ!",
    variables: ["customer_name", "order_number", "store_name"],
    status: "active",
  },
  {
    id: "t4",
    name: "অসম্পূর্ণ চেকআউট রিকভারি",
    event_type: "abandoned_cart",
    template: "প্রিয় {{customer_name}}, {{store_name}}-এ আপনার পছন্দের প্রোডাক্টগুলো কার্টে রাখা আছে। এখনই অর্ডারটি কনফার্ম করতে ভিজিট করুন: {{checkout_url}}",
    variables: ["customer_name", "store_name", "checkout_url", "discount_code"],
    status: "active",
  },
  {
    id: "t5",
    name: "অর্ডার বাতিল সংক্রান্ত তথ্য",
    event_type: "order_cancelled",
    template: "প্রিয় {{customer_name}}, আপনার অর্ডার #{{order_number}} বাতিল করা হয়েছে। যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ।",
    variables: ["customer_name", "order_number", "store_name"],
    status: "active",
  },
  {
    id: "t6",
    name: "অগ্রিম ডেলিভারি চার্জ অনুরোধ",
    event_type: "advance_requested",
    template: "প্রিয় {{customer_name}}, অর্ডার #{{order_number}}-এর ডেলিভারি চার্জ বাবদ ৳{{advance_amount}} অগ্রিম পাঠানোর অনুরোধ করছি। বাকি টাকা ক্যাশ অন ডেলিভারিতে দিন।",
    variables: ["customer_name", "order_number", "advance_amount"],
    status: "active",
  },
  {
    id: "t7",
    name: "রিভিউ ও ফিডব্যাক অনুরোধ",
    event_type: "review_request",
    template: "প্রিয় {{customer_name}}, আশা করি {{store_name}}-এর প্রোডাক্টগুলো আপনার পছন্দ হয়েছে। আপনার মূল্যবান রিভিউ ও মতামত আমাদের জানান: {{store_url}}",
    variables: ["customer_name", "store_name", "store_url"],
    status: "active",
  },
  {
    id: "t8",
    name: "প্রমোশনাল ভাউচার ও ডিসকাউন্ট",
    event_type: "promotional",
    template: "বিশেষ অফার! {{store_name}}-এ কেনাকাটায় {{discount}} ছাড় পেতে ব্যবহার করুন প্রোমোকোড {{coupon_code}}। এখনই কিনুন: {{store_url}}",
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
  const targetTypes = (input.eventType === "order_placed" || input.eventType === "order_created")
    ? ["order_placed", "order_created"]
    : [input.eventType];
  const template = templates.find((t) => targetTypes.includes(t.event_type)) || templates[0];

  const mergedVars: Record<string, string> = {
    store_name: "Blush & Budget",
    discount_code: "BLUSH5",
    coupon_code: "BLUSH5",
    store_url: getBaseUrl(),
    customer_name: "সম্মানিত গ্রাহক",
    ...input.variables,
  };

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

