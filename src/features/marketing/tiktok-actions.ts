"use server";

import { createHash } from "crypto";
import { getSettingsByGroup, updateGroupSettings, invalidateSettingsCache } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/utils";
import { logAnalyticsEvent } from "@/lib/analytics/live-event-logger";

export interface TikTokSettings {
  tiktok_pixel_id: string;
  tiktok_access_token: string;
  tiktok_test_event_code?: string;
  tiktok_capi_enabled: boolean;
  tiktok_advanced_matching_enabled: boolean;
}

/**
 * SHA-256 Hasher for TikTok Events API parameters.
 */
function hashTikTokParameter(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) return undefined;
  return createHash("sha256").update(trimmed).digest("hex");
}

/**
 * Normalizes phone number into E.164 digits with or without leading + (e.g. +88017XXXXXXXX / 88017XXXXXXXX).
 */
function normalizeTikTokPhone(rawPhone?: string | null): string | undefined {
  if (!rawPhone) return undefined;
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return hashTikTokParameter(digits);
}

/**
 * 1. Fetch TikTok Analytics Settings
 */
export async function getTikTokSettings(): Promise<TikTokSettings> {
  const settings = await getSettingsByGroup("marketing_tiktok");
  return {
    tiktok_pixel_id: settings.tiktok_pixel_id !== undefined ? settings.tiktok_pixel_id : (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || ""),
    tiktok_access_token: settings.tiktok_access_token !== undefined ? settings.tiktok_access_token : (process.env.TIKTOK_CAPI_ACCESS_TOKEN || ""),
    tiktok_test_event_code: settings.tiktok_test_event_code !== undefined ? settings.tiktok_test_event_code : (process.env.TIKTOK_TEST_EVENT_CODE || ""),
    tiktok_capi_enabled: settings.tiktok_capi_enabled !== undefined ? Boolean(settings.tiktok_capi_enabled) : true,
    tiktok_advanced_matching_enabled: settings.tiktok_advanced_matching_enabled !== undefined ? Boolean(settings.tiktok_advanced_matching_enabled) : true,
  };
}

/**
 * 2. Save TikTok Analytics Settings
 */
export async function saveTikTokSettings(settings: Partial<TikTokSettings>) {
  await updateGroupSettings("marketing_tiktok", {
    tiktok_pixel_id: settings.tiktok_pixel_id ?? "",
    tiktok_access_token: settings.tiktok_access_token ?? "",
    tiktok_test_event_code: settings.tiktok_test_event_code ?? "",
    tiktok_capi_enabled: settings.tiktok_capi_enabled ?? true,
    tiktok_advanced_matching_enabled: settings.tiktok_advanced_matching_enabled ?? true,
  });

  revalidatePath("/admin/marketing/meta");
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { success: true };
}

/**
 * 3. Send Server-Side Event to TikTok Events API (v1.3)
 */
export async function sendTikTokCapiEvent(input: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  pixelId?: string;
  accessToken?: string;
  userData?: {
    email?: string;
    phone?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    ttclid?: string;
    ttp?: string;
  };
  properties?: Record<string, any>;
  testEventCode?: string;
}) {
  const config = await getTikTokSettings();

  const pixelCode = (input.pixelId && input.pixelId.trim()) || config.tiktok_pixel_id;
  const accessToken = (input.accessToken && input.accessToken.trim()) || config.tiktok_access_token;

  if (!pixelCode || !accessToken) {
    return {
      success: false,
      skipped: true,
      error: "TikTok Pixel Code or Access Token is not configured.",
    };
  }

  // Construct User Identity Payload (SHA-256 Hashed)
  const userPayload: Record<string, any> = {};

  if (input.userData) {
    const { email, phone, externalId, clientIpAddress, clientUserAgent, ttclid, ttp } = input.userData;

    if (email) {
      const hashedEmail = hashTikTokParameter(email);
      if (hashedEmail) userPayload.email = hashedEmail;
    }

    if (phone) {
      const hashedPhone = normalizeTikTokPhone(phone);
      if (hashedPhone) userPayload.phone_number = hashedPhone;
    }

    if (externalId) {
      const hashedExt = hashTikTokParameter(externalId);
      if (hashedExt) userPayload.external_id = hashedExt;
    }

    let effectiveIp = clientIpAddress;
    if (
      !effectiveIp ||
      effectiveIp === "::1" ||
      effectiveIp === "127.0.0.1" ||
      effectiveIp.startsWith("192.168.") ||
      effectiveIp.startsWith("10.")
    ) {
      if (process.env.NODE_ENV === "development") {
        effectiveIp = "103.108.140.25";
      } else {
        effectiveIp = undefined;
      }
    }
    if (effectiveIp) userPayload.ip = effectiveIp;
    if (clientUserAgent) userPayload.user_agent = clientUserAgent;
    if (ttclid) userPayload.ttclid = ttclid;
    userPayload.ttp = ttp || `ttp.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  } else {
    userPayload.ttp = `ttp.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    if (process.env.NODE_ENV === "development") {
      userPayload.ip = "103.108.140.25";
    }
  }

  // Map event name to TikTok standard if needed
  let mappedEvent = input.eventName;
  if (input.eventName === "Purchase") mappedEvent = "CompletePayment";
  if (input.eventName === "Lead") mappedEvent = "SubmitForm";

  // Construct clean properties according to event type
  const propertiesPayload: Record<string, any> = {};

  if (mappedEvent !== "PageView") {
    if (input.properties?.value !== undefined) {
      propertiesPayload.value = Number(input.properties.value);
    }
    if (input.properties?.currency) {
      propertiesPayload.currency = input.properties.currency;
    } else if (input.properties?.value !== undefined || input.properties?.contents) {
      propertiesPayload.currency = "BDT";
    }
    if (input.properties?.content_type) {
      propertiesPayload.content_type = input.properties.content_type;
    } else if (input.properties?.contents || input.properties?.content_id) {
      propertiesPayload.content_type = "product";
    }
    if (Array.isArray(input.properties?.contents) && input.properties.contents.length > 0) {
      propertiesPayload.contents = input.properties.contents.map((it: any) => ({
        content_id: String(it.content_id || it.id || it.item_id),
        content_name: it.content_name || it.item_name || it.title || undefined,
        price: Number(it.price || it.item_price) || 0,
        quantity: Number(it.quantity) || 1,
      }));
    }
    if (input.properties?.content_id || input.properties?.content_ids?.[0]) {
      propertiesPayload.content_id = input.properties?.content_id || input.properties?.content_ids?.[0];
    }
    if (Array.isArray(input.properties?.content_ids) && input.properties.content_ids.length > 0) {
      propertiesPayload.content_ids = input.properties.content_ids.map(String);
    } else if (propertiesPayload.content_id) {
      propertiesPayload.content_ids = [String(propertiesPayload.content_id)];
    }
    if (input.properties?.content_name) {
      propertiesPayload.content_name = input.properties.content_name;
    }
    if (input.properties?.content_category) {
      propertiesPayload.content_category = input.properties.content_category;
    }
    if (input.properties?.item_list_name) {
      propertiesPayload.item_list_name = input.properties.item_list_name;
    }
    if (input.properties?.quantity !== undefined) {
      propertiesPayload.quantity = Number(input.properties.quantity);
    } else if (input.properties?.num_items !== undefined) {
      propertiesPayload.quantity = Number(input.properties.num_items);
    } else if (Array.isArray(input.properties?.contents) && input.properties.contents.length > 0) {
      propertiesPayload.quantity = input.properties.contents.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
    }
    if (input.properties?.order_id || input.properties?.transaction_id) {
      propertiesPayload.order_id = input.properties?.order_id || input.properties?.transaction_id;
    }
    if (input.properties?.payment_type) {
      propertiesPayload.payment_type = input.properties.payment_type;
    }
    if (input.properties?.shipping_tier) {
      propertiesPayload.shipping_tier = input.properties.shipping_tier;
    }
    if (input.properties?.coupon) {
      propertiesPayload.coupon = input.properties.coupon;
    }
    if (input.properties?.discount !== undefined) {
      propertiesPayload.discount = Number(input.properties.discount);
    }
    if (input.properties?.reason) {
      propertiesPayload.reason = input.properties.reason;
    }
    if (input.properties?.status) {
      propertiesPayload.status = input.properties.status;
    }
    if (input.properties?.search_string || input.properties?.query) {
      propertiesPayload.query = input.properties.search_string || input.properties.query;
    }
  }

  const eventPayload: Record<string, any> = {
    event: mappedEvent,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    user: userPayload,
    properties: propertiesPayload,
    page: {
      url: input.eventSourceUrl || getBaseUrl() || undefined,
    },
  };

  const rawTestCode =
    (input.testEventCode && input.testEventCode !== "undefined" && input.testEventCode !== "null"
      ? input.testEventCode
      : undefined) || config.tiktok_test_event_code;
  const testCode = rawTestCode?.trim();

  const requestBody: Record<string, any> = {
    event_source: "web",
    event_source_id: pixelCode,
    data: [eventPayload],
  };

  if (testCode && testCode.length > 0) {
    requestBody.test_event_code = testCode;
  }

  try {
    const tiktokApiUrl = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
    const response = await fetch(tiktokApiUrl, {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const resJson = await response.json();

    if (resJson.code !== 0 && !response.ok) {
      console.error("[TikTok CAPI Error]", resJson);
      logAnalyticsEvent({
        channel: "server_tiktok",
        eventName: mappedEvent,
        eventId: input.eventId,
        sourceUrl: input.eventSourceUrl,
        payload: requestBody,
        status: "failed",
        responseDetails: {
          httpStatus: response.status,
          error: resJson.message || "TikTok Events API request failed",
          requestId: resJson.request_id,
        },
      });
      return {
        success: false,
        error: resJson.message || "TikTok Events API request failed",
        logId: resJson.request_id,
      };
    }

    logAnalyticsEvent({
      channel: "server_tiktok",
      eventName: mappedEvent,
      eventId: input.eventId,
      sourceUrl: input.eventSourceUrl,
      payload: requestBody,
      status: "success",
      responseDetails: {
        httpStatus: response.status,
        requestId: resJson.request_id,
      },
    });

    return {
      success: true,
      code: resJson.code,
      message: resJson.message || "Event tracked successfully",
      requestId: resJson.request_id,
    };
  } catch (err: any) {
    console.error("[TikTok CAPI Network Error]", err);
    logAnalyticsEvent({
      channel: "server_tiktok",
      eventName: mappedEvent,
      eventId: input.eventId,
      sourceUrl: input.eventSourceUrl,
      payload: requestBody,
      status: "failed",
      responseDetails: {
        error: err.message || "Network error dispatching TikTok CAPI event",
      },
    });
    return {
      success: false,
      error: err.message || "Network error dispatching TikTok CAPI event",
    };
  }
}

/**
 * 4. Test Live Diagnostic TikTok Events API Connection
 */
export async function testTikTokCapiDiagnostic(
  params?:
    | string
    | {
        testEventCode?: string;
        pixelId?: string;
        accessToken?: string;
        originUrl?: string;
      },
  originUrlFallback?: string
) {
  let testCodeOverride: string | undefined;
  let pixelId: string | undefined;
  let accessToken: string | undefined;
  let originUrl: string | undefined = originUrlFallback;

  if (typeof params === "string") {
    testCodeOverride = params;
  } else if (params && typeof params === "object") {
    testCodeOverride = params.testEventCode;
    pixelId = params.pixelId?.trim();
    accessToken = params.accessToken?.trim();
    originUrl = params.originUrl || originUrlFallback;
  }

  // If credentials are provided from the UI, auto-sync and persist them
  if (pixelId && accessToken) {
    try {
      await updateGroupSettings("marketing_tiktok", {
        tiktok_pixel_id: pixelId,
        tiktok_access_token: accessToken,
        ...(testCodeOverride !== undefined ? { tiktok_test_event_code: testCodeOverride } : {}),
      });
      invalidateSettingsCache("group:marketing_tiktok");
    } catch (err) {
      console.warn("[testTikTokCapiDiagnostic] Auto-sync to settings skipped:", err);
    }
  }

  const testEventId = `tt_test_evt_${Date.now()}_diag`;
  const base = originUrl || getBaseUrl() || "";
  const result = await sendTikTokCapiEvent({
    eventName: "PageView",
    eventId: testEventId,
    eventSourceUrl: base ? `${base}/admin/marketing/meta` : undefined,
    pixelId,
    accessToken,
    userData: {
      email: "test_customer@example.com",
      phone: "01700000000",
      clientUserAgent: "TikTok-EventsAPI-Diagnostic/1.0",
    },
    properties: {
      currency: "BDT",
      value: 1250,
      content_name: "TikTok Events API Live Diagnostic Verification",
    },
    testEventCode: testCodeOverride,
  });

  return result;
}
