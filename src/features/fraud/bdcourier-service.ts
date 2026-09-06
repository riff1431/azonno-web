"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface BDCourierConfig {
  apiKey: string;
  enabled: boolean;
  autoCheckOnOrder: boolean;
  minSuccessRatioWarning: number; // e.g., 70%
  blockThresholdRatio: number; // e.g., 40%
  updated_at?: string;
}

export interface BDCourierCourierStat {
  name: string;
  logo?: string;
  total: number;
  success: number;
  cancelled: number;
  ratio: number;
}

export interface BDCourierReport {
  success: boolean;
  phone: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number; // 0 to 100
  risk_level: "safe" | "medium" | "high" | "critical";
  color: "emerald" | "amber" | "red" | "zinc";
  badge_text: string;
  risk_verdict: string;
  raw_risk_verdict?: any;
  courier_details: {
    steadfast?: BDCourierCourierStat;
    pathao?: BDCourierCourierStat;
    redx?: BDCourierCourierStat;
    paperfly?: BDCourierCourierStat;
    carrybee?: BDCourierCourierStat;
    parceldex?: BDCourierCourierStat;
    courrierfast?: BDCourierCourierStat;
    ecourier?: BDCourierCourierStat;
    [key: string]: BDCourierCourierStat | undefined;
  };
  reports_count: number;
  reports: Array<{
    id?: number;
    name?: string;
    reason: string;
    date?: string;
    courier?: string;
    courierLogo?: string;
  }>;
  source: "live_api" | "cached";
  checked_at: string;
  message?: string;
}

const BDCOURIER_PROVIDERS = [
  { key: "pathao", name: "Pathao", logo: "https://api.bdcourier.com/c-logo/pathao-logo.png" },
  { key: "steadfast", name: "SteadFast", logo: "https://api.bdcourier.com/c-logo/steadfast-logo.png" },
  { key: "redx", name: "Redx", logo: "https://api.bdcourier.com/c-logo/redx-logo.png" },
  { key: "paperfly", name: "PaperFly", logo: "https://api.bdcourier.com/c-logo/paperfly-logo.png" },
  { key: "carrybee", name: "CarryBee", logo: "https://api.bdcourier.com/c-logo/carrybee-logo.webp" },
  { key: "courrierfast", name: "CourrierFast", logo: "https://api.bdcourier.com/c-logo/courierfast-logo.png" },
  { key: "parceldex", name: "ParcelDex", logo: "https://api.bdcourier.com/c-logo/parceldex-logo.png" },
];

const BDCOURIER_SETTINGS_KEY = "bdcourier_settings";
const BDCOURIER_API_URL = "https://api.bdcourier.com/courier-check";

// In-memory cache store (15 minutes TTL) to prevent redundant API queries
const reportCache = new Map<string, { report: BDCourierReport; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

const DEFAULT_BDCOURIER_CONFIG: BDCourierConfig = {
  apiKey: "",
  enabled: true,
  autoCheckOnOrder: true,
  minSuccessRatioWarning: 70,
  blockThresholdRatio: 40,
};

export async function normalizeBdPhoneNumber(rawPhone: string): Promise<string> {
  return cleanBdPhoneNumber(rawPhone);
}

function cleanBdPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("880")) {
    digits = digits.slice(2);
  }
  if (digits.length === 10 && digits.startsWith("1")) {
    digits = "0" + digits;
  }
  return digits;
}

/**
 * 1. Get BDCourier Settings from Supabase store_settings
 */
export async function getBDCourierSettings(): Promise<BDCourierConfig> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", BDCOURIER_SETTINGS_KEY)
      .maybeSingle();

    if (data && data.value && typeof data.value === "object") {
      return { ...DEFAULT_BDCOURIER_CONFIG, ...(data.value as Partial<BDCourierConfig>) };
    }
  } catch (err) {
    console.warn("Error reading BDCourier settings:", err);
  }
  return DEFAULT_BDCOURIER_CONFIG;
}

/**
 * 2. Save BDCourier Settings
 */
export async function saveBDCourierSettings(settings: Partial<BDCourierConfig>) {
  try {
    const supabase = createAdminClient();
    const current = await getBDCourierSettings();
    const updated: BDCourierConfig = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("store_settings").upsert(
      {
        key: BDCOURIER_SETTINGS_KEY,
        value: updated as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    // Clear memory cache when settings change
    reportCache.clear();

    revalidatePath("/admin/orders/fraud");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/shipping");
    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("Failed to save BDCourier settings:", err);
    return { success: false, error: err.message || "Failed to save settings" };
  }
}

/**
 * 3. Verify BDCourier API Key by pinging the official BDCourier endpoint
 */
export async function verifyBDCourierApiKey(apiKey: string): Promise<{
  success: boolean;
  message: string;
  isLive: boolean;
  data?: any;
}> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return {
      success: false,
      isLive: false,
      message: "Please enter your BDCourier API Key.",
    };
  }

  try {
    const testPhone = "01711111111";
    const endpoints = [
      BDCOURIER_API_URL,
      "https://bdcourier.com/api/courier-check",
    ];

    let lastError = "";
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cleanKey}`,
            "X-API-Key": cleanKey,
            Accept: "application/json",
          },
          body: JSON.stringify({ phone: testPhone }),
          cache: "no-store",
        });

        const json = await response.json().catch(() => null);

        if (response.ok && json && json.status !== "error") {
          return {
            success: true,
            isLive: true,
            message: "BDCourier API Key verified successfully! Live multi-courier connection is active.",
            data: json,
          };
        } else if (response.status === 401 || response.status === 403 || (json && json.message && json.message.toLowerCase().includes("invalid"))) {
          return {
            success: false,
            isLive: false,
            message: json?.message || "Invalid BDCourier API Key (Authentication Failed: 401 Unauthorized). Please check your key at bdcourier.com.",
          };
        } else if (json && (json.message || json.error)) {
          lastError = json.message || json.error;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return {
      success: false,
      isLive: false,
      message: `Could not connect to BDCourier API: ${lastError || "Request failed"}. Please check your key or network.`,
    };
  } catch (err: any) {
    return {
      success: false,
      isLive: false,
      message: err.message || "Failed to verify BDCourier API key.",
    };
  }
}

/**
 * 4. Fetch Multi-Courier Delivery History & Order Ratio for a Customer Phone Number
 */
export async function getBDCourierCustomerReport(phone: string): Promise<BDCourierReport> {
  return fetchBDCourierReport(phone);
}

export async function fetchBDCourierReport(phone: string): Promise<BDCourierReport> {
  const normalizedPhone = cleanBdPhoneNumber(phone);

  if (!normalizedPhone || normalizedPhone.length < 11 || !normalizedPhone.startsWith("01")) {
    return {
      success: false,
      phone: normalizedPhone || phone,
      total_parcel: 0,
      success_parcel: 0,
      cancelled_parcel: 0,
      success_ratio: 0,
      risk_level: "high",
      color: "red",
      badge_text: "Invalid Phone",
      risk_verdict: "Invalid Bangladesh mobile phone number. Must be 11 digits starting with 01.",
      courier_details: {},
      reports_count: 0,
      reports: [],
      source: "live_api",
      checked_at: new Date().toISOString(),
      message: "Invalid Bangladesh mobile phone number format.",
    };
  }

  // 1. Check in-memory cache
  const cached = reportCache.get(normalizedPhone);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      ...cached.report,
      source: "cached",
    };
  }

  const settings = await getBDCourierSettings();

  // 2. Query Live BDCourier API
  if (settings.enabled && settings.apiKey) {
    try {
      const endpoints = [
        BDCOURIER_API_URL,
        "https://bdcourier.com/api/courier-check",
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${settings.apiKey.trim()}`,
              "X-API-Key": settings.apiKey.trim(),
              Accept: "application/json",
            },
            body: JSON.stringify({ phone: normalizedPhone }),
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            const report = parseBDCourierApiResponse(normalizedPhone, data);
            if (report) {
              // Store in memory cache
              reportCache.set(normalizedPhone, {
                report,
                expiresAt: Date.now() + CACHE_TTL_MS,
              });
              return report;
            }
          }
        } catch (e) {
          // Try next endpoint fallback
        }
      }
    } catch (e) {
      console.warn("BDCourier Live API lookup error:", e);
    }
  }

  // 3. Fallback when API key is not configured or query fails (No fake data!)
  return {
    success: false,
    phone: normalizedPhone,
    total_parcel: 0,
    success_parcel: 0,
    cancelled_parcel: 0,
    success_ratio: 0,
    risk_level: "safe",
    color: "zinc",
    badge_text: "No Records",
    risk_verdict: settings.apiKey
      ? "No delivery records found on BDCourier for this phone number."
      : "BDCourier API Key not configured. Please add your API key in Fraud Settings.",
    courier_details: createEmptyCourierDetails(),
    reports_count: 0,
    reports: [],
    source: "live_api",
    checked_at: new Date().toISOString(),
    message: settings.apiKey
      ? "No courier history found."
      : "API Key missing. Please configure BDCourier in settings.",
  };
}

/**
 * Helper to build empty courier details for all supported couriers
 */
function createEmptyCourierDetails(): BDCourierReport["courier_details"] {
  const details: BDCourierReport["courier_details"] = {};
  for (const c of BDCOURIER_PROVIDERS) {
    details[c.key] = {
      name: c.name,
      logo: c.logo,
      total: 0,
      success: 0,
      cancelled: 0,
      ratio: 0,
    };
  }
  return details;
}

/**
 * Parse live BDCourier response format into standard BDCourierReport
 */
function parseBDCourierApiResponse(phone: string, data: any): BDCourierReport | null {
  if (!data || data.status === "error") return null;

  const dataObj = data.data || {};
  const summary = dataObj.summary || {};

  // Extract totals from summary object or calculate across all couriers
  let total = Number(summary.total_parcel ?? data.total_parcel ?? 0);
  let success = Number(summary.success_parcel ?? data.success_parcel ?? 0);
  let cancelled = Number(summary.cancelled_parcel ?? data.cancelled_parcel ?? 0);
  let ratio = Number(summary.success_ratio ?? data.success_ratio ?? (total > 0 ? Math.round((success / total) * 100) : 100));

  // Extract ALL courier provider breakdowns (All 7 supported couriers)
  const courierDetails: BDCourierReport["courier_details"] = {};

  for (const provider of BDCOURIER_PROVIDERS) {
    const raw = dataObj[provider.key];
    if (raw && typeof raw === "object") {
      const cTot = Number(raw.total_parcel ?? raw.total ?? 0);
      const cSuc = Number(raw.success_parcel ?? raw.success ?? 0);
      const cCan = Number(raw.cancelled_parcel ?? raw.cancelled ?? 0);
      const cRatio = Number(raw.success_ratio ?? raw.ratio ?? (cTot > 0 ? Math.round((cSuc / cTot) * 100) : 0));

      courierDetails[provider.key] = {
        name: raw.name || provider.name,
        logo: raw.logo || provider.logo,
        total: cTot,
        success: cSuc,
        cancelled: cCan,
        ratio: cRatio,
      };
    } else {
      courierDetails[provider.key] = {
        name: provider.name,
        logo: provider.logo,
        total: 0,
        success: 0,
        cancelled: 0,
        ratio: 0,
      };
    }
  }

  // Include any extra courier keys returned by BDCourier not in standard list
  for (const key of Object.keys(dataObj)) {
    if (key === "summary" || courierDetails[key]) continue;
    const extra = dataObj[key];
    if (extra && typeof extra === "object" && ("total_parcel" in extra || "total" in extra)) {
      const eTot = Number(extra.total_parcel ?? extra.total ?? 0);
      const eSuc = Number(extra.success_parcel ?? extra.success ?? 0);
      const eCan = Number(extra.cancelled_parcel ?? extra.cancelled ?? 0);
      const eRatio = Number(extra.success_ratio ?? extra.ratio ?? (eTot > 0 ? Math.round((eSuc / eTot) * 100) : 0));
      courierDetails[key] = {
        name: extra.name || key.toUpperCase(),
        logo: extra.logo,
        total: eTot,
        success: eSuc,
        cancelled: eCan,
        ratio: eRatio,
      };
    }
  }

  // If summary was 0 or missing, calculate by summing active couriers
  if (total === 0) {
    let calcTot = 0;
    let calcSuc = 0;
    let calcCan = 0;
    for (const c of Object.values(courierDetails)) {
      if (c) {
        calcTot += c.total;
        calcSuc += c.success;
        calcCan += c.cancelled;
      }
    }
    if (calcTot > 0) {
      total = calcTot;
      success = calcSuc;
      cancelled = calcCan;
      ratio = Math.round((success / total) * 100);
    }
  }

  // Normalize reports
  const rawReports = Array.isArray(data.reports)
    ? data.reports
    : Array.isArray(data.data?.reports)
    ? data.data.reports
    : [];

  const reports = rawReports.map((r: any) => ({
    id: r.id,
    name: r.name,
    reason: r.details || r.reason || "Courier incident report",
    date: r.created_at || r.date,
    courier: r.courierName || r.courier,
    courierLogo: r.courierLogo,
  }));

  // Format risk verdict safely as a string
  const rawVerdict = data.risk_verdict;
  let verdictString = "";
  let riskLevel: "safe" | "medium" | "high" | "critical" = "safe";
  let color: "emerald" | "amber" | "red" | "zinc" = "emerald";
  let badgeText = "";

  if (rawVerdict && typeof rawVerdict === "object") {
    const reasonsStr = Array.isArray(rawVerdict.reasons) && rawVerdict.reasons.length > 0
      ? rawVerdict.reasons.join(". ")
      : "";
    verdictString = [rawVerdict.label, rawVerdict.action, reasonsStr].filter(Boolean).join(" • ");

    const lvl = (rawVerdict.level || "").toLowerCase();
    if (lvl === "danger" || lvl === "high_risk" || lvl === "high" || reports.length > 0) {
      riskLevel = "critical";
      color = "red";
    } else if (lvl === "medium" || ratio < 70) {
      riskLevel = "medium";
      color = "amber";
    } else if (lvl === "low" || lvl === "safe") {
      riskLevel = "safe";
      color = "emerald";
    }
  } else if (typeof rawVerdict === "string") {
    verdictString = rawVerdict;
  }

  // Determine badge and color indicator
  if (total === 0 && reports.length === 0) {
    riskLevel = "safe";
    color = "zinc";
    badgeText = "New Buyer";
    verdictString = "First-time buyer with 0 courier parcels recorded. No cancellation history found.";
  } else if (reports.length > 0) {
    riskLevel = "critical";
    color = "red";
    badgeText = `${reports.length} Fraud Reports`;
  } else if (ratio < 50) {
    riskLevel = "critical";
    color = "red";
    badgeText = `${ratio}% Low Ratio`;
  } else if (ratio < 75) {
    riskLevel = "medium";
    color = "amber";
    badgeText = `${ratio}% Moderate`;
  } else {
    riskLevel = "safe";
    color = "emerald";
    badgeText = `${ratio}% Verified`;
  }

  if (!verdictString) {
    verdictString =
      riskLevel === "critical"
        ? `High cancellation rate (${ratio}%). Require advance delivery fee before dispatch.`
        : riskLevel === "medium"
        ? `Moderate delivery track record (${ratio}%). Phone call confirmation advised.`
        : `Trusted buyer with ${ratio}% delivery success rate across courier networks.`;
  }

  return {
    success: true,
    phone,
    total_parcel: total,
    success_parcel: success,
    cancelled_parcel: cancelled,
    success_ratio: ratio,
    risk_level: riskLevel,
    color,
    badge_text: badgeText,
    risk_verdict: verdictString,
    raw_risk_verdict: rawVerdict,
    courier_details: courierDetails,
    reports_count: reports.length,
    reports,
    source: "live_api",
    checked_at: new Date().toISOString(),
  };
}
