"use server";

import { getModuleSettings, saveModuleSettings } from "@/lib/settings/config-service";
import { logIntegrationEvent } from "@/features/modules/actions";
import { revalidatePath } from "next/cache";

// SteadFast Settings
export async function getSteadfastSettings(includeSecrets = false) {
  const settings = await getModuleSettings("steadfast", "all", includeSecrets);
  return {
    api_key: (settings.api_key || process.env.STEADFAST_API_KEY || "").trim(),
    secret_key: (settings.secret_key || (process.env.STEADFAST_SECRET_KEY ? (includeSecrets ? process.env.STEADFAST_SECRET_KEY : "••••••••") : "")).trim(),
    webhook_auth_token: (settings.webhook_auth_token || (process.env.STEADFAST_WEBHOOK_TOKEN ? (includeSecrets ? process.env.STEADFAST_WEBHOOK_TOKEN : "••••••••") : "")).trim(),
    webhook_domain_override: settings.webhook_domain_override || process.env.NEXT_PUBLIC_APP_URL || "",
    api_base_url: settings.api_base_url || "https://portal.steadfast.com.bd/api/v1",
    auto_booking: settings.auto_booking ?? true,
    auto_sync_status: settings.auto_sync_status ?? true,
    environment: settings.environment || "live",
    default_service: settings.default_service || "standard",
  };
}

export async function saveSteadfastSettings(data: {
  api_key: string;
  secret_key: string;
  webhook_auth_token?: string;
  webhook_domain_override?: string;
  api_base_url: string;
  auto_booking: boolean;
  auto_sync_status: boolean;
  environment: string;
  default_service: string;
}) {
  await saveModuleSettings("steadfast", {
    api_key: { value: data.api_key?.trim(), valueType: "string" },
    secret_key: { value: data.secret_key?.trim(), isSecret: true },
    webhook_auth_token: { value: data.webhook_auth_token?.trim() || "", isSecret: true },
    webhook_domain_override: { value: data.webhook_domain_override?.trim() || "", valueType: "string" },
    api_base_url: { value: data.api_base_url?.trim(), valueType: "string" },
    auto_booking: { value: data.auto_booking, valueType: "boolean" },
    auto_sync_status: { value: data.auto_sync_status, valueType: "boolean" },
    environment: { value: data.environment, valueType: "string" },
    default_service: { value: data.default_service, valueType: "string" },
  });

  revalidatePath("/admin/shipping/steadfast");
  revalidatePath("/admin/shipping");
  return { success: true };
}

export async function testSteadfastConnection(formData?: { api_key?: string; secret_key?: string }) {
  const saved = await getSteadfastSettings(true);
  const apiKey = (formData?.api_key ?? saved.api_key ?? "").trim();
  let secretKey = (formData?.secret_key ?? saved.secret_key ?? "").trim();
  if (secretKey.startsWith("••••") || !secretKey) {
    secretKey = (saved.secret_key ?? "").trim();
  }

  if (!apiKey || !secretKey) {
    await logIntegrationEvent({
      provider: "SteadFast",
      moduleKey: "steadfast",
      event: "test_connection",
      status: "error",
      message: "Missing SteadFast API Key or Secret Key.",
    });
    return {
      success: false,
      message: "Both SteadFast API Key and Secret Key are required to test gateway connectivity.",
    };
  }

  const startTime = Date.now();
  const endpoints = [
    (saved.api_base_url || "https://portal.steadfast.com.bd/api/v1").replace(/\/$/, ""),
    "https://portal.packzy.com/api/v1",
  ];

  let lastError = "";
  for (const baseUrl of endpoints) {
    try {
      const res = await fetch(`${baseUrl}/get_balance`, {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => null);

      if (res.ok && data && (data.status === 200 || data.current_balance !== undefined)) {
        await logIntegrationEvent({
          provider: "SteadFast",
          moduleKey: "steadfast",
          event: "test_connection",
          status: "success",
          message: `SteadFast Courier Gateway responded (HTTP 200 OK, latency: ${latencyMs}ms). Current Merchant Balance: ৳${data.current_balance || 0}.`,
          metadata: { endpoint: baseUrl, balance: data.current_balance },
        });

        return {
          success: true,
          message: `SteadFast Courier API Handshake Successful! Connected to live portal (${latencyMs}ms response, Current Balance: ৳${data.current_balance ?? 0}). Ready for automated parcel dispatch.`,
          balance: data.current_balance,
        };
      } else if (res.status === 401 || (data && data.status === 401)) {
        return {
          success: false,
          message: `SteadFast Authentication Failed (401 Unauthorized): ${data?.message || "Invalid API Key or Secret Key. Please check your credentials at SteadFast portal."}`,
        };
      } else if (data?.message) {
        lastError = data.message;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  return {
    success: false,
    message: `Could not connect to SteadFast API: ${lastError || "Gateway unreachable"}. Please verify your API Key & Secret Key.`,
  };
}

// Pathao Settings
export async function getPathaoSettings(includeSecrets = false) {
  const settings = await getModuleSettings("pathao", "all", includeSecrets);
  return {
    client_id: (settings.client_id || process.env.PATHAO_CLIENT_ID || "").trim(),
    client_secret: (settings.client_secret || (process.env.PATHAO_CLIENT_SECRET ? (includeSecrets ? process.env.PATHAO_CLIENT_SECRET : "••••••••") : "")).trim(),
    username: (settings.username || process.env.PATHAO_USERNAME || "").trim(),
    password: (settings.password || (process.env.PATHAO_PASSWORD ? (includeSecrets ? process.env.PATHAO_PASSWORD : "••••••••") : "")).trim(),
    store_id: settings.store_id || "",
    webhook_domain_override: settings.webhook_domain_override || process.env.NEXT_PUBLIC_APP_URL || "",
    auto_booking: settings.auto_booking ?? false,
    environment: settings.environment || "live",
  };
}

export async function savePathaoSettings(data: {
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  store_id: string;
  webhook_domain_override?: string;
  auto_booking: boolean;
  environment: string;
}) {
  await saveModuleSettings("pathao", {
    client_id: { value: data.client_id?.trim(), valueType: "string" },
    client_secret: { value: data.client_secret?.trim(), isSecret: true },
    username: { value: data.username?.trim(), valueType: "string" },
    password: { value: data.password?.trim(), isSecret: true },
    store_id: { value: data.store_id?.trim(), valueType: "string" },
    webhook_domain_override: { value: data.webhook_domain_override?.trim() || "", valueType: "string" },
    auto_booking: { value: data.auto_booking, valueType: "boolean" },
    environment: { value: data.environment, valueType: "string" },
  });

  revalidatePath("/admin/shipping/pathao");
  revalidatePath("/admin/shipping");
  return { success: true };
}

export async function testPathaoConnection(formData?: {
  client_id?: string;
  client_secret?: string;
  username?: string;
  password?: string;
  environment?: string;
}) {
  const savedSettings = await getPathaoSettings(true);

  const clientId = (formData?.client_id ?? savedSettings.client_id ?? "").trim();
  let clientSecret = (formData?.client_secret ?? savedSettings.client_secret ?? "").trim();
  if (clientSecret.startsWith("••••") || !clientSecret) {
    clientSecret = (savedSettings.client_secret ?? "").trim();
  }

  const username = (formData?.username ?? savedSettings.username ?? "").trim();
  let password = (formData?.password ?? savedSettings.password ?? "").trim();
  if (password.startsWith("••••") || !password) {
    password = (savedSettings.password ?? "").trim();
  }

  const environment = formData?.environment ?? savedSettings.environment ?? "live";

  if (!clientId || !clientSecret || !username || !password) {
    await logIntegrationEvent({
      provider: "Pathao",
      moduleKey: "pathao",
      event: "test_connection",
      status: "error",
      message: "Missing Pathao credentials (Client ID, Secret, Username, Password).",
    });
    return {
      success: false,
      message: "Pathao Client ID, Client Secret, Username/Email, and Password are all required.",
    };
  }

  const isLive = environment === "live";
  const authUrl = isLive
    ? "https://api-hermes.pathao.com/aladdin/api/v1/issue-token"
    : "https://courier-api-sandbox.pathao.com/aladdin/api/v1/issue-token";

  try {
    const res = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
        grant_type: "password",
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      // Fetch merchant stores
      const storeRes = await fetch(
        isLive
          ? "https://api-hermes.pathao.com/aladdin/api/v1/stores"
          : "https://courier-api-sandbox.pathao.com/aladdin/api/v1/stores",
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: "application/json",
          },
        }
      );
      const storeData = await storeRes.json();
      const storesCount = storeData?.data?.data?.length || 0;

      await logIntegrationEvent({
        provider: "Pathao",
        moduleKey: "pathao",
        event: "test_connection",
        status: "success",
        message: `Pathao Hermes OAuth2 token granted successfully (${storesCount} stores available).`,
      });

      return {
        success: true,
        message: `Pathao OAuth2 Handshake Successful! Connected to ${isLive ? "Production (Live)" : "Sandbox"} (${storesCount} Store${storesCount === 1 ? "" : "s"} Found).`,
        stores: storeData?.data?.data || [],
      };
    } else {
      return {
        success: false,
        message: data.message || data.error || "Pathao rejected credentials. Please verify Client ID, Secret, Email, and Password.",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reach Pathao Hermes API servers.",
    };
  }
}

export async function fetchPathaoStoresAction(formData?: any) {
  const result = await testPathaoConnection(formData);
  if (result.success && result.stores) {
    return { success: true, stores: result.stores };
  }
  return { success: false, error: result.message };
}

