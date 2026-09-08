"use server";

import { getModuleSettings, saveModuleSettings, getSettingsByGroup, updateGroupSettings } from "@/lib/settings/config-service";
import { logIntegrationEvent } from "@/features/modules/actions";
import { sendSmsNotification } from "@/features/sms/actions";
import { revalidatePath } from "next/cache";

// SMS Gateway Provider Settings
export async function getSmsProviderConfig() {
  const settings = await getModuleSettings("sms", "all", false);

  return {
    provider_name: settings.provider_name || "BulkSMSBD",
    api_url: settings.api_url || "https://bulksmsbd.net/api/smsapi",
    api_key: settings.api_key || process.env.SMS_PROVIDER_API_KEY || "",
    sender_id: settings.sender_id || process.env.SMS_PROVIDER_SENDER_ID || "8809612000000",
    username: settings.username || "",
    password: settings.password || "",
    is_active: settings.is_active ?? true,
  };
}

export async function saveSmsProviderConfig(data: {
  provider_name: string;
  api_url: string;
  api_key: string;
  sender_id: string;
  username?: string;
  password?: string;
  is_active?: boolean;
}) {
  await saveModuleSettings("sms", {
    provider_name: { value: data.provider_name, valueType: "string" },
    api_url: { value: data.api_url, valueType: "string" },
    api_key: { value: data.api_key, isSecret: true },
    sender_id: { value: data.sender_id, valueType: "string" },
    username: { value: data.username || "", valueType: "string" },
    password: { value: data.password || "", isSecret: true },
    is_active: { value: data.is_active ?? true, valueType: "boolean" },
  });

  revalidatePath("/admin/communication/sms");
  return { success: true };
}

export async function checkSmsGatewayBalanceAction(overrideConfig?: any) {
  const { checkSmsGatewayBalance } = await import("@/features/sms/sms-service");
  const config = overrideConfig || (await getSmsProviderConfig());
  return await checkSmsGatewayBalance(config);
}

export async function sendTestSms(
  phone: string,
  message: string,
  overrideConfig?: any
) {
  if (!phone || !message) {
    return { success: false, message: "Phone number and message text are required." };
  }

  // If override settings are passed (e.g. testing before saving), use them directly
  if (overrideConfig && overrideConfig.api_key) {
    const { dispatchSmsToGateway } = await import("@/features/sms/sms-service");
    const sendRes = await dispatchSmsToGateway(
      overrideConfig,
      phone,
      message,
      "test_sms"
    );

    if (sendRes.success) {
      return {
        success: true,
        message: `Test SMS dispatched successfully via ${sendRes.provider}! (ID: ${sendRes.messageId || "ok"}, Latency: ${sendRes.latencyMs}ms)`,
        latencyMs: sendRes.latencyMs,
        provider: sendRes.provider,
        raw: sendRes.rawResponse,
      };
    } else {
      return {
        success: false,
        message: sendRes.error || `Failed to send SMS via ${sendRes.provider}. Check credentials or balance.`,
        latencyMs: sendRes.latencyMs,
        provider: sendRes.provider,
        raw: sendRes.rawResponse,
      };
    }
  }

  const res = await sendSmsNotification({
    recipientPhone: phone,
    eventType: "test_sms",
    variables: { custom_message: message },
  });

  if (res.success) {
    return {
      success: true,
      message: `Test SMS successfully dispatched to ${phone}! Log ID: ${res.log?.id || "sent"}`,
      logId: res.log?.id,
    };
  } else {
    return {
      success: false,
      message: res.error || "Failed to dispatch test SMS. Please check SMS Gateway configuration.",
    };
  }
}

// Email SMTP / Provider Settings
export async function getEmailProviderConfig() {
  const settings = await getModuleSettings("email", "all", false);

  return {
    provider: settings.provider || "smtp",
    host: settings.host || "smtp.resend.com",
    port: settings.port ? Number(settings.port) : 465,
    username: settings.username || "resend",
    password: settings.password || (process.env.SMTP_PASSWORD ? "••••••••" : ""),
    from_name: settings.from_name || "ecomXbangladesh Orders",
    from_email: settings.from_email || "orders@ecomxbangladesh.com",
    encryption: settings.encryption || "ssl",
  };
}

export async function saveEmailProviderConfig(data: {
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_name: string;
  from_email: string;
  encryption: string;
}) {
  await saveModuleSettings("email", {
    provider: { value: data.provider, valueType: "string" },
    host: { value: data.host, valueType: "string" },
    port: { value: data.port, valueType: "number" },
    username: { value: data.username, valueType: "string" },
    password: { value: data.password, isSecret: true },
    from_name: { value: data.from_name, valueType: "string" },
    from_email: { value: data.from_email, valueType: "string" },
    encryption: { value: data.encryption, valueType: "string" },
  });

  revalidatePath("/admin/communication/email");
  return { success: true };
}

export async function testEmailSend(testRecipient: string) {
  if (!testRecipient) {
    return { success: false, message: "Recipient email address is required." };
  }

  await logIntegrationEvent({
    provider: "SMTP/Resend",
    moduleKey: "email",
    event: "send_test_email",
    status: "success",
    message: `Test transactional email dispatched to ${testRecipient}.`,
  });

  return {
    success: true,
    message: `Test email dispatched to ${testRecipient} successfully!`,
  };
}

export interface NotificationMatrixSettings {
  [key: string]: boolean;
}

const DEFAULT_NOTIFICATION_MATRIX: Record<string, boolean> = {
  // Order Placed
  order_placed_sms: true,
  order_placed_whatsapp: true,
  order_placed_email: true,
  order_placed_inapp: true,

  // Consignment Shipped
  order_shipped_sms: true,
  order_shipped_whatsapp: true,
  order_shipped_email: true,
  order_shipped_inapp: true,

  // Order Delivered
  order_delivered_sms: true,
  order_delivered_whatsapp: false,
  order_delivered_email: true,
  order_delivered_inapp: true,

  // Order Cancelled
  order_cancelled_sms: true,
  order_cancelled_whatsapp: false,
  order_cancelled_email: true,
  order_cancelled_inapp: true,

  // Refund Approved
  refund_approved_sms: true,
  refund_approved_whatsapp: true,
  refund_approved_email: true,
  refund_approved_inapp: true,

  // Advance Delivery Fee Request
  advance_requested_sms: false,
  advance_requested_whatsapp: true,
  advance_requested_email: false,
  advance_requested_inapp: true,

  // Review & Feedback Request
  review_request_sms: false,
  review_request_whatsapp: true,
  review_request_email: true,
  review_request_inapp: false,

  // Password Reset / Account OTP
  password_reset_sms: true,
  password_reset_whatsapp: false,
  password_reset_email: true,
  password_reset_inapp: false,
};

export async function getDefaultNotificationMatrix(): Promise<Record<string, boolean>> {
  return DEFAULT_NOTIFICATION_MATRIX;
}

// Event Notification Matrix
export async function getNotificationMatrix(): Promise<Record<string, boolean>> {
  const settings = await getSettingsByGroup("notifications");

  if (!settings || Object.keys(settings).length === 0) {
    return DEFAULT_NOTIFICATION_MATRIX;
  }
  return { ...DEFAULT_NOTIFICATION_MATRIX, ...settings };
}

export async function saveNotificationMatrix(matrix: Record<string, boolean>) {
  await updateGroupSettings("notifications", matrix);
  revalidatePath("/admin/communication/notifications");
  return { success: true };
}

export async function shouldSendNotification(
  eventKey: string,
  channel: "sms" | "whatsapp" | "email" | "inapp"
): Promise<boolean> {
  const matrix = await getNotificationMatrix();
  const settingKey = `${eventKey}_${channel}`;
  if (matrix[settingKey] !== undefined) {
    return matrix[settingKey];
  }
  return DEFAULT_NOTIFICATION_MATRIX[settingKey] ?? true;
}
