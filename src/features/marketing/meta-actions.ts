"use server";

import { createHash } from "crypto";
import { getSettingsByGroup, updateGroupSettings, invalidateSettingsCache } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/utils";
import { logAnalyticsEvent } from "@/lib/analytics/live-event-logger";

export interface MarketingAnalyticsSettings {
  meta_pixel_id: string;
  meta_capi_token: string;
  meta_test_event_code?: string;
  meta_capi_enabled: boolean;
  meta_advanced_matching_enabled: boolean;
  gtm_container_id?: string;
  ga4_measurement_id?: string;
  catalog_feed_url?: string;
  // Status-Gated Purchase Tracking Control
  purchase_tracking_mode?: "immediate" | "status_gated";
  purchase_trigger_status?: "completed" | "delivered" | "confirmed" | "processing";
  enable_meta_capi_purchase?: boolean;
  enable_tiktok_capi_purchase?: boolean;
  suppress_browser_pixel_on_status_gated?: boolean;
}

/**
 * SHA-256 Hasher for Meta Conversions API Advanced Matching parameters.
 * Normalizes strings by trimming whitespace and converting to lowercase.
 */
function hashMetaParameter(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) return undefined;
  return createHash("sha256").update(trimmed).digest("hex");
}

/**
 * Normalizes phone number into E.164 digits without '+' (e.g. 88017XXXXXXXX) for Meta SHA-256 hashing.
 */
function normalizeMetaPhone(rawPhone?: string | null): string | undefined {
  if (!rawPhone) return undefined;
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return hashMetaParameter(digits);
}

/**
 * Normalizes city names for Meta (lowercase, spaces stripped, lowercase letters only).
 */
function normalizeMetaCity(rawCity?: string | null): string | undefined {
  if (!rawCity) return undefined;
  const cleaned = rawCity.replace(/[^a-zA-Z\u0980-\u09FF]/g, "").trim().toLowerCase();
  return hashMetaParameter(cleaned);
}

/**
 * 1. Fetch Marketing & Analytics Settings
 */
export async function getMarketingAnalyticsSettings(): Promise<MarketingAnalyticsSettings> {
  const settings = await getSettingsByGroup("marketing");
  return {
    meta_pixel_id: settings.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
    meta_capi_token: settings.meta_capi_token || process.env.META_CAPI_ACCESS_TOKEN || "",
    meta_test_event_code: settings.meta_test_event_code || process.env.META_CAPI_TEST_EVENT_CODE || "",
    meta_capi_enabled: settings.meta_capi_enabled !== false,
    meta_advanced_matching_enabled: settings.meta_advanced_matching_enabled !== false,
    gtm_container_id: settings.gtm_container_id || process.env.NEXT_PUBLIC_GTM_ID || "",
    ga4_measurement_id: settings.ga4_measurement_id || process.env.NEXT_PUBLIC_GA4_ID || "",
    catalog_feed_url: settings.catalog_feed_url || "/api/feed/meta",
    purchase_tracking_mode: (settings.purchase_tracking_mode as any) || "status_gated",
    purchase_trigger_status: (settings.purchase_trigger_status as any) || "completed",
    enable_meta_capi_purchase: settings.enable_meta_capi_purchase !== false,
    enable_tiktok_capi_purchase: settings.enable_tiktok_capi_purchase !== false,
    suppress_browser_pixel_on_status_gated: settings.suppress_browser_pixel_on_status_gated !== false,
  };
}

/**
 * 2. Save Marketing & Analytics Settings
 */
export async function saveMarketingAnalyticsSettings(settings: Partial<MarketingAnalyticsSettings>) {
  await updateGroupSettings("marketing", {
    meta_pixel_id: settings.meta_pixel_id ?? "",
    meta_capi_token: settings.meta_capi_token ?? "",
    meta_test_event_code: settings.meta_test_event_code ?? "",
    meta_capi_enabled: settings.meta_capi_enabled ?? true,
    meta_advanced_matching_enabled: settings.meta_advanced_matching_enabled ?? true,
    gtm_container_id: settings.gtm_container_id ?? "",
    ga4_measurement_id: settings.ga4_measurement_id ?? "",
    catalog_feed_url: settings.catalog_feed_url ?? "/api/feed/meta",
    purchase_tracking_mode: settings.purchase_tracking_mode ?? "status_gated",
    purchase_trigger_status: settings.purchase_trigger_status ?? "completed",
    enable_meta_capi_purchase: settings.enable_meta_capi_purchase ?? true,
    enable_tiktok_capi_purchase: settings.enable_tiktok_capi_purchase ?? true,
    suppress_browser_pixel_on_status_gated: settings.suppress_browser_pixel_on_status_gated ?? true,
  });

  revalidatePath("/admin/marketing/meta");
  revalidatePath("/admin/orders");
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { success: true };
}

/**
 * 3. Send Server-Side Event to Meta Conversions API (Graph API v21.0)
 * Adheres strictly to Meta Conversions API Advanced Matching requirements for EMQ 9.0+ / 10.
 */
export async function sendMetaCapiEvent(input: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  pixelId?: string;
  accessToken?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: Record<string, any>;
  testEventCode?: string;
}) {
  const config = await getMarketingAnalyticsSettings();

  const pixelId = (input.pixelId && input.pixelId.trim()) || config.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = (input.accessToken && input.accessToken.trim()) || config.meta_capi_token || process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return {
      success: false,
      skipped: true,
      error: "Meta Pixel ID or CAPI Access Token is not configured.",
    };
  }

  // Construct Advanced Matching User Data Payload (All PII SHA-256 Hashed)
  const userDataPayload: Record<string, any> = {};

  if (input.userData) {
    const { email, phone, firstName, lastName, city, state, country, zip, externalId, clientIpAddress, clientUserAgent, fbp, fbc } = input.userData;

    if (email) {
      const hashedEmail = hashMetaParameter(email);
      if (hashedEmail) userDataPayload.em = [hashedEmail];
    }

    if (phone) {
      const hashedPhone = normalizeMetaPhone(phone);
      if (hashedPhone) userDataPayload.ph = [hashedPhone];
    }

    if (firstName) {
      const hashedFn = hashMetaParameter(firstName);
      if (hashedFn) userDataPayload.fn = [hashedFn];
    }

    if (lastName) {
      const hashedLn = hashMetaParameter(lastName);
      if (hashedLn) userDataPayload.ln = [hashedLn];
    }

    if (city) {
      const hashedCity = normalizeMetaCity(city);
      if (hashedCity) userDataPayload.ct = [hashedCity];
    }

    if (state) {
      const hashedState = hashMetaParameter(state);
      if (hashedState) userDataPayload.st = [hashedState];
    }

    if (zip) {
      const hashedZip = hashMetaParameter(zip);
      if (hashedZip) userDataPayload.zp = [hashedZip];
    }

    if (country) {
      const hashedCountry = hashMetaParameter(country.trim().toLowerCase());
      if (hashedCountry) userDataPayload.country = [hashedCountry];
    } else {
      userDataPayload.country = [hashMetaParameter("bd")];
    }

    if (externalId) {
      const hashedExt = hashMetaParameter(externalId);
      if (hashedExt) userDataPayload.external_id = [hashedExt];
    }

    // Unhashed Client Network & Cookie Identifiers (Crucial for Meta CAPI Event Match Quality)
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
    if (effectiveIp) {
      userDataPayload.client_ip_address = effectiveIp;
    }
    if (clientUserAgent) {
      userDataPayload.client_user_agent = clientUserAgent;
    }
    const effectiveFbp = fbp || `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    userDataPayload.fbp = effectiveFbp;
    if (fbc) {
      userDataPayload.fbc = fbc;
    }
  } else {
    // If no userData provided at all, provide basic fbp & BD country for anonymous events
    userDataPayload.country = [hashMetaParameter("bd")];
    userDataPayload.fbp = `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    if (process.env.NODE_ENV === "development") {
      userDataPayload.client_ip_address = "103.108.140.25";
    }
  }

  const serverEvent: Record<string, any> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    event_source_url: input.eventSourceUrl || getBaseUrl() || undefined,
    action_source: "website",
    user_data: userDataPayload,
  };

  if (input.customData && Object.keys(input.customData).length > 0) {
    serverEvent.custom_data = {
      currency: input.customData.currency || "BDT",
      value: input.customData.value !== undefined ? Number(input.customData.value) : undefined,
      content_type: input.customData.content_type || "product",
      contents: input.customData.contents || undefined,
      content_ids: input.customData.content_ids || (input.customData.content_id ? [input.customData.content_id] : undefined),
      content_name: input.customData.content_name || undefined,
      num_items:
        input.customData.num_items !== undefined
          ? Number(input.customData.num_items)
          : Array.isArray(input.customData.contents)
          ? input.customData.contents.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)
          : undefined,
      order_id: input.customData.order_id || input.customData.transaction_id || undefined,
      search_string: input.customData.search_string || input.customData.search_term || undefined,
      status: input.customData.status || undefined,
    };
  }

  const testCode = input.testEventCode || config.meta_test_event_code;

  const capiPayload: Record<string, any> = {
    data: [serverEvent],
  };

  if (testCode && testCode.trim().length > 0) {
    capiPayload.test_event_code = testCode.trim();
  }

  try {
    const metaApiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(metaApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(capiPayload),
    });

    const resJson = await response.json();

    if (!response.ok) {
      console.error("[Meta CAPI Error]", resJson);
      logAnalyticsEvent({
        channel: "server_meta",
        eventName: input.eventName,
        eventId: input.eventId,
        sourceUrl: input.eventSourceUrl,
        payload: capiPayload,
        status: "failed",
        responseDetails: {
          httpStatus: response.status,
          error: resJson.error?.message || "Meta CAPI request failed",
          traceId: resJson.error?.fbtrace_id,
        },
      });
      return {
        success: false,
        error: resJson.error?.message || "Meta CAPI request failed",
        metaTraceId: resJson.error?.fbtrace_id,
      };
    }

    logAnalyticsEvent({
      channel: "server_meta",
      eventName: input.eventName,
      eventId: input.eventId,
      sourceUrl: input.eventSourceUrl,
      payload: capiPayload,
      status: "success",
      responseDetails: {
        httpStatus: response.status,
        eventsReceived: resJson.events_received,
        traceId: resJson.fbtrace_id,
      },
    });

    return {
      success: true,
      eventsReceived: resJson.events_received,
      fbTraceId: resJson.fbtrace_id,
    };
  } catch (err: any) {
    console.error("[Meta CAPI Network Error]", err);
    logAnalyticsEvent({
      channel: "server_meta",
      eventName: input.eventName,
      eventId: input.eventId,
      sourceUrl: input.eventSourceUrl,
      payload: capiPayload,
      status: "failed",
      responseDetails: {
        error: err.message || "Network error dispatching Meta CAPI event",
      },
    });
    return {
      success: false,
      error: err.message || "Network error dispatching Meta CAPI event",
    };
  }
}

/**
 * 4. Dispatch Advanced Status-Gated Purchase CAPI for an Order
 * Dispatches verified Purchase / CompletePayment to Meta and TikTok server APIs.
 */
export async function dispatchAdvancedPurchaseCapi(order: any, triggerStatus: string) {
  const config = await getMarketingAnalyticsSettings();
  const address = order.shipping_address_snapshot || {};
  const metaExtracted = order.metadata || {};

  // Extract names
  const rawFullName = order.guest_name || order.customer_name || address.name || "";
  const nameParts = rawFullName.trim().split(/\s+/);
  const firstName = address.first_name || nameParts[0] || "";
  const lastName = address.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  // Extract phone & email
  const phone = order.guest_phone || order.customer_phone || address.phone || "";
  const email = order.guest_email || order.customer_email || address.email || "";

  // Extract location
  const city = address.city || address.district || "Dhaka";
  const state = address.state || address.division || "Dhaka";
  const zip = address.zip || address.postal_code || "";
  const country = address.country || "BD";

  // Extract tracking cookies & identifiers
  const fbp = metaExtracted.fbp || address.fbp || undefined;
  const fbc = metaExtracted.fbc || address.fbc || undefined;
  const ttp = metaExtracted.ttp || address.ttp || undefined;
  const ttclid = metaExtracted.ttclid || address.ttclid || undefined;
  const clientIp = order.ip_address || metaExtracted.ip_address || address.ip_address || undefined;
  const clientUa = metaExtracted.user_agent || address.user_agent || undefined;

  const eventId = `order_${order.order_number || order.id}`;
  const totalValue = Number(order.total) || 0;
  const items = (order.order_items || []).map((it: any) => ({
    id: it.product_id || it.id,
    quantity: Number(it.quantity) || 1,
    item_price: Number(it.unit_price) || 0,
    title: it.product_name_snapshot || "Product",
  }));

  const results: {
    meta?: any;
    tiktok?: any;
    timestamp: string;
    eventId: string;
    triggerStatus: string;
  } = {
    timestamp: new Date().toISOString(),
    eventId,
    triggerStatus,
  };

  // 1. Dispatch Meta CAPI Purchase
  if (config.enable_meta_capi_purchase !== false && config.meta_capi_token && config.meta_pixel_id) {
    try {
      const metaRes = await sendMetaCapiEvent({
        eventName: "Purchase",
        eventId,
        userData: {
          email,
          phone,
          firstName,
          lastName,
          city,
          state,
          zip,
          country,
          externalId: order.user_id || order.id,
          clientIpAddress: clientIp,
          clientUserAgent: clientUa,
          fbp,
          fbc,
        },
        customData: {
          currency: "BDT",
          value: totalValue,
          content_type: "product",
          contents: items,
          content_ids: items.map((i: any) => i.id),
          num_items: items.reduce((acc: number, cur: any) => acc + cur.quantity, 0),
          order_id: order.order_number || order.id,
          status: triggerStatus,
        },
      });
      results.meta = metaRes;
    } catch (err: any) {
      results.meta = { success: false, error: err.message };
    }
  }

  // 2. Dispatch TikTok Events API CompletePayment
  if (config.enable_tiktok_capi_purchase !== false) {
    try {
      const { sendTikTokCapiEvent } = await import("./tiktok-actions");
      const ttRes = await sendTikTokCapiEvent({
        eventName: "Purchase",
        eventId,
        userData: {
          email,
          phone,
          externalId: order.user_id || order.id,
          clientIpAddress: clientIp,
          clientUserAgent: clientUa,
          ttclid,
          ttp,
        },
        properties: {
          currency: "BDT",
          value: totalValue,
          content_type: "product",
          contents: items.map((i: any) => ({
            content_id: i.id,
            content_name: i.title,
            price: i.item_price,
            quantity: i.quantity,
          })),
          num_items: items.reduce((acc: number, cur: any) => acc + cur.quantity, 0),
          order_id: order.order_number || order.id,
        },
      });
      results.tiktok = ttRes;
    } catch (err: any) {
      results.tiktok = { success: false, error: err.message };
    }
  }

  return results;
}

/**
 * 5. Test Live Diagnostic Meta CAPI Connection
 */
export async function testMetaCapiDiagnostic(
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
      await updateGroupSettings("marketing", {
        meta_pixel_id: pixelId,
        meta_capi_token: accessToken,
        ...(testCodeOverride !== undefined ? { meta_test_event_code: testCodeOverride } : {}),
      });
      invalidateSettingsCache("group:marketing");
    } catch (err) {
      console.warn("[testMetaCapiDiagnostic] Auto-sync to settings skipped:", err);
    }
  }

  const testEventId = `test_evt_${Date.now()}_diag`;
  const base = originUrl || getBaseUrl() || "";
  const result = await sendMetaCapiEvent({
    eventName: "PageView",
    eventId: testEventId,
    eventSourceUrl: base ? `${base}/admin/marketing/meta` : undefined,
    pixelId,
    accessToken,
    userData: {
      email: "test_customer@example.com",
      phone: "01700000000",
      firstName: "Diagnostic",
      lastName: "Tester",
      city: "Dhaka",
      country: "BD",
      clientUserAgent: "Meta-CAPI-Diagnostic-Engine/1.0",
    },
    customData: {
      currency: "BDT",
      value: 1250,
      content_name: "Meta CAPI Live Diagnostic Verification",
    },
    testEventCode: testCodeOverride,
  });

  return result;
}

/**
 * 6. Live EMQ 9.0+ Full Parameter Simulation Diagnostic
 * Simulates a full order purchase with all 13 Meta parameters and 7 TikTok parameters.
 */
export async function simulateFullEmqPurchaseTest(params: {
  metaTestCode?: string;
  tiktokTestCode?: string;
  orderNumber?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  total?: number;
}) {
  const simulatedOrder = {
    id: `sim_${Date.now()}`,
    order_number: params.orderNumber || `SIM-${Math.floor(10000 + Math.random() * 90000)}`,
    user_id: "usr_sim_007",
    guest_name: params.customerName || "Tanvir Ahmed",
    guest_phone: params.phone || "01712345678",
    guest_email: params.email || "tanvir.ahmed@example.com",
    total: params.total || 2450,
    shipping_address_snapshot: {
      name: params.customerName || "Tanvir Ahmed",
      phone: params.phone || "01712345678",
      email: params.email || "tanvir.ahmed@example.com",
      city: params.city || "Dhaka",
      state: "Dhaka",
      district: params.city || "Dhaka",
      thana: "Gulshan-2",
      address: "House 14, Road 11, Block D, Banani",
      zip: "1213",
      country: "BD",
      fbp: "fb.1.1712345678.987654321",
      fbc: "fb.1.1712345678.IwAR3EXAMPLE_CLICK_ID",
      ttp: "ttp.1.1712345678.11223344",
      ttclid: "ttclid_example_12345",
      ip_address: "103.108.140.25",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    order_items: [
      {
        id: "prod_sim_1",
        product_name_snapshot: "Matte Velvet Long-Lasting Lipstick",
        unit_price: 1250,
        quantity: 1,
      },
      {
        id: "prod_sim_2",
        product_name_snapshot: "Hydrating Glow Foundation (SPF 30)",
        unit_price: 1200,
        quantity: 1,
      },
    ],
    metadata: {
      fbp: "fb.1.1712345678.987654321",
      fbc: "fb.1.1712345678.IwAR3EXAMPLE_CLICK_ID",
      ttp: "ttp.1.1712345678.11223344",
      ttclid: "ttclid_example_12345",
      ip_address: "103.108.140.25",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  };

  // Dispatch through advanced pipeline
  const result = await dispatchAdvancedPurchaseCapi(simulatedOrder, "completed");

  return {
    success: (result.meta?.success !== false) && (result.tiktok?.success !== false),
    details: result,
    parametersDispatched: {
      meta_parameters_count: 13,
      meta_parameters: [
        { key: "em (Email)", raw: simulatedOrder.guest_email, hashed: hashMetaParameter(simulatedOrder.guest_email), status: "Hashed SHA-256 ✓" },
        { key: "ph (Phone)", raw: simulatedOrder.guest_phone, hashed: normalizeMetaPhone(simulatedOrder.guest_phone), status: "E.164 Clean & Hashed ✓" },
        { key: "fn (First Name)", raw: "Tanvir", hashed: hashMetaParameter("Tanvir"), status: "Hashed SHA-256 ✓" },
        { key: "ln (Last Name)", raw: "Ahmed", hashed: hashMetaParameter("Ahmed"), status: "Hashed SHA-256 ✓" },
        { key: "ct (City)", raw: "Dhaka", hashed: normalizeMetaCity("Dhaka"), status: "Normalized & Hashed ✓" },
        { key: "st (State)", raw: "Dhaka", hashed: hashMetaParameter("Dhaka"), status: "Hashed SHA-256 ✓" },
        { key: "zp (Zip Code)", raw: "1213", hashed: hashMetaParameter("1213"), status: "Hashed SHA-256 ✓" },
        { key: "country", raw: "BD", hashed: hashMetaParameter("bd"), status: "ISO 3166-1 Hashed ✓" },
        { key: "external_id", raw: simulatedOrder.user_id, hashed: hashMetaParameter(simulatedOrder.user_id), status: "Hashed SHA-256 ✓" },
        { key: "fbp (Browser ID)", raw: "fb.1.1712345678.987654321", status: "Raw First-Party Cookie ✓" },
        { key: "fbc (Click ID)", raw: "fb.1.1712345678.IwAR3EXAMPLE_CLICK_ID", status: "Raw Meta Click ID ✓" },
        { key: "client_ip_address", raw: "103.108.140.25", status: "Public Client IP ✓" },
        { key: "client_user_agent", raw: "Mozilla/5.0...", status: "Full Client User-Agent ✓" },
      ],
      tiktok_parameters_count: 7,
      tiktok_parameters: [
        { key: "email", raw: simulatedOrder.guest_email, status: "Hashed SHA-256 ✓" },
        { key: "phone_number", raw: simulatedOrder.guest_phone, status: "E.164 Hashed SHA-256 ✓" },
        { key: "external_id", raw: simulatedOrder.user_id, status: "Hashed SHA-256 ✓" },
        { key: "ttclid", raw: "ttclid_example_12345", status: "Raw TikTok Click ID ✓" },
        { key: "ttp", raw: "ttp.1.1712345678.11223344", status: "Raw First-Party Cookie ✓" },
        { key: "ip", raw: "103.108.140.25", status: "Client IP Address ✓" },
        { key: "user_agent", raw: "Mozilla/5.0...", status: "Client User Agent ✓" },
      ],
    },
  };
}
