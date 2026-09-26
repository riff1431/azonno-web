"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

import {
  type BDCourierConfig,
  type BDCourierReport,
  type BDCourierCourierStat,
  BDCOURIER_PROVIDERS,
} from "./types";

export type { BDCourierConfig, BDCourierReport, BDCourierCourierStat };

const BDCOURIER_SETTINGS_KEY = "bdcourier_settings";
const BDCOURIER_REPORTS_STORE_KEY = "bdcourier_cached_reports";
const BDCOURIER_API_URL = "https://api.bdcourier.com/courier-check";

// In-process fast lookup map synchronized with DB to prevent redundant API queries
const persistentReportsMemoryMap = new Map<string, BDCourierReport>();
let hasLoadedPersistentStore = false;

async function getStoredBDCourierReports(): Promise<Record<string, BDCourierReport>> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", BDCOURIER_REPORTS_STORE_KEY)
      .maybeSingle();

    if (data && data.value && typeof data.value === "object") {
      const records = data.value as Record<string, BDCourierReport>;
      for (const [p, rep] of Object.entries(records)) {
        persistentReportsMemoryMap.set(p, rep);
      }
      hasLoadedPersistentStore = true;
      return records;
    }
  } catch (err) {
    console.warn("Could not read bdcourier_cached_reports from store_settings:", err);
  }
  return {};
}

async function saveStoredBDCourierReport(phone: string, report: BDCourierReport) {
  try {
    persistentReportsMemoryMap.set(phone, report);
    const supabase = createAdminClient();
    const current = await getStoredBDCourierReports();
    current[phone] = {
      ...report,
      source: "cached",
    };

    await supabase.from("store_settings").upsert(
      {
        key: BDCOURIER_REPORTS_STORE_KEY,
        value: current as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.warn("Could not save bdcourier report to store_settings:", err);
  }
}

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
  const envApiKey = (process.env.BDCOURIER_API_KEY || "").trim();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", BDCOURIER_SETTINGS_KEY)
      .maybeSingle();

    if (data && data.value && typeof data.value === "object") {
      const saved = data.value as Partial<BDCourierConfig>;
      return {
        ...DEFAULT_BDCOURIER_CONFIG,
        ...saved,
        apiKey: (saved.apiKey || envApiKey).trim(),
      };
    }
  } catch (err) {
    console.warn("Error reading BDCourier settings:", err);
  }
  return {
    ...DEFAULT_BDCOURIER_CONFIG,
    apiKey: envApiKey,
  };
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
    persistentReportsMemoryMap.clear();

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
export async function getBDCourierCustomerReport(
  phone: string,
  options?: { forceLive?: boolean }
): Promise<BDCourierReport> {
  return fetchBDCourierReport(phone, options);
}

export async function fetchBDCourierReport(
  phone: string,
  options?: { forceLive?: boolean }
): Promise<BDCourierReport> {
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

  // 1. Check persistent memory map & DB store if NOT forcing a live check
  if (!options?.forceLive) {
    if (persistentReportsMemoryMap.has(normalizedPhone)) {
      return {
        ...persistentReportsMemoryMap.get(normalizedPhone)!,
        source: "cached",
      };
    }

    const stored = await getStoredBDCourierReports();
    if (stored[normalizedPhone]) {
      return {
        ...stored[normalizedPhone],
        source: "cached",
      };
    }
  }

  const settings = await getBDCourierSettings();

  // 2. Query Live BDCourier API (1st time check or Admin manual refresh)
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
              await saveStoredBDCourierReport(normalizedPhone, report);
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

  // 3. Fallback: Query internal store orders history for this customer phone
  try {
    const supabase = createAdminClient();
    const { data: storeOrders } = await supabase
      .from("orders")
      .select("id, status, created_at, total, consignment_id, is_courier_cancelled, is_courier_returned")
      .or(`guest_phone.eq.${normalizedPhone},shipping_address_snapshot->>phone.eq.${normalizedPhone}`);

    const ordList = storeOrders || [];
    if (ordList.length > 0) {
      const courierDetails = createEmptyCourierDetails();
      let delCount = 0;
      let canCount = 0;

      for (const o of ordList) {
        const isDel = o.status === "delivered" || o.status === "completed";
        const isCan = ["cancelled", "returned", "failed"].includes(o.status) || Boolean(o.is_courier_cancelled) || Boolean(o.is_courier_returned);
        if (isDel) delCount++;
        else if (isCan) canCount++;

        // Map order to courier
        let cKey = "steadfast";
        const cid = (o.consignment_id || "").toLowerCase();
        if (cid.startsWith("pt-") || cid.startsWith("pth-") || cid.startsWith("de-") || cid.includes("pathao")) cKey = "pathao";
        else if (cid.startsWith("rx-") || cid.includes("redx")) cKey = "redx";
        else if (cid.startsWith("pf-") || cid.includes("paperfly")) cKey = "paperfly";
        else if (cid.startsWith("cb-") || cid.includes("carrybee")) cKey = "carrybee";
        else if (cid.startsWith("pd-") || cid.includes("parceldex")) cKey = "parceldex";
        else if (cid.startsWith("cf-") || cid.startsWith("crf-") || cid.includes("courierfast")) cKey = "courrierfast";
        else if (cid.startsWith("ec-") || cid.includes("ecourier")) cKey = "ecourier";
        else if (cid.startsWith("dt-") || cid.includes("deliverytiger")) cKey = "deliverytiger";
        else if (cid.startsWith("sc-") || cid.includes("sundarban")) cKey = "sundarban";
        else if (cid.startsWith("sa-") || cid.includes("saparibahan")) cKey = "saparibahan";
        else if (cid.startsWith("sf-") || cid.includes("steadfast")) cKey = "steadfast";

        if (courierDetails[cKey]) {
          courierDetails[cKey]!.total += 1;
          if (isDel) courierDetails[cKey]!.success += 1;
          else if (isCan) courierDetails[cKey]!.cancelled += 1;
          const cTot = courierDetails[cKey]!.total;
          const cSuc = courierDetails[cKey]!.success;
          courierDetails[cKey]!.ratio = cTot > 0 ? Math.round((cSuc / cTot) * 100) : 100;
        }
      }

      const totCount = ordList.length;
      const finishedCount = delCount + canCount;
      const storeRatio = finishedCount > 0
        ? Math.round((delCount / finishedCount) * 100)
        : 100; // If all are newly placed / in-transit with 0 cancellations, ratio is 100%

      const isRed = storeRatio < 50 && canCount > 0;
      const isAmber = storeRatio >= 50 && storeRatio < 75;

      const report: BDCourierReport = {
        success: true,
        phone: normalizedPhone,
        total_parcel: totCount,
        success_parcel: delCount,
        cancelled_parcel: canCount,
        success_ratio: storeRatio,
        risk_level: isRed ? "critical" : isAmber ? "medium" : "safe",
        color: isRed ? "red" : isAmber ? "amber" : "emerald",
        badge_text: `${storeRatio}% (${delCount}/${totCount})`,
        risk_verdict: delCount === 0 && canCount === 0
          ? `${totCount} active parcel(s) dispatched / in-transit. Clean record with 0 cancellations.`
          : `Store History: ${delCount}/${totCount} parcels delivered (${storeRatio}% success rate, ${canCount} cancelled).`,
        courier_details: courierDetails,
        reports_count: 0,
        reports: [],
        source: "cached",
        checked_at: new Date().toISOString(),
        message: `${storeRatio}% delivery rate based on ${totCount} store orders.`,
      };

      await saveStoredBDCourierReport(normalizedPhone, report);
      return report;
    }
  } catch (storeErr) {
    // Non-fatal
  }

  // 4. Default for new buyers (0 parcels recorded)
  const defaultReport: BDCourierReport = {
    success: false,
    phone: normalizedPhone,
    total_parcel: 0,
    success_parcel: 0,
    cancelled_parcel: 0,
    success_ratio: 100,
    risk_level: "safe",
    color: "zinc",
    badge_text: "New Customer (0)",
    risk_verdict: settings.apiKey
      ? "No delivery records found on BDCourier or store history for this phone number."
      : "BDCourier API Key not configured. Please add your API key in Fraud Settings for nationwide multi-courier checking.",
    courier_details: createEmptyCourierDetails(),
    reports_count: 0,
    reports: [],
    source: "cached",
    checked_at: new Date().toISOString(),
    message: settings.apiKey
      ? "No courier history found."
      : "API Key missing. Please configure BDCourier in settings.",
  };

  await saveStoredBDCourierReport(normalizedPhone, defaultReport);
  return defaultReport;
}

export async function getBulkStoredBDCourierReports(
  phones: string[]
): Promise<Record<string, BDCourierReport>> {
  const result: Record<string, BDCourierReport> = {};
  if (!Array.isArray(phones) || phones.length === 0) return result;

  const stored = await getStoredBDCourierReports();
  for (const rawPhone of phones) {
    const clean = cleanBdPhoneNumber(rawPhone);
    if (clean && stored[clean]) {
      result[clean] = stored[clean];
    }
  }
  return result;
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
  if (!data || data.status === "error" || data.status === false) return null;

  // Courier breakdown lives under data.data (nested) OR directly under data
  const dataObj: Record<string, any> = (data.data && typeof data.data === "object") ? data.data : data;
  const summary = dataObj.summary || {};

  // Extract totals from summary object or calculate across all couriers
  let total = Number(summary.total_parcel ?? data.total_parcel ?? 0);
  let success = Number(summary.success_parcel ?? data.success_parcel ?? 0);
  let cancelled = Number(summary.cancelled_parcel ?? data.cancelled_parcel ?? 0);
  // Real API returns success_ratio at ROOT level (not nested in data); prefer that
  let ratio = Number(data.success_ratio ?? summary.success_ratio ?? 0);
  if (ratio === 0 && total > 0) ratio = Math.round((success / total) * 100);

  // Extract ALL courier provider breakdowns (All 7 supported couriers)
  const courierDetails: BDCourierReport["courier_details"] = {};

  for (const provider of BDCOURIER_PROVIDERS) {
    // Try nested (data.data.steadfast) first, then flat (data.steadfast)
    const raw = dataObj[provider.key] ?? data[provider.key];
    if (raw && typeof raw === "object") {
      const cTot = Number(raw.total_parcel ?? raw.total ?? 0);
      const cSuc = Number(raw.success_parcel ?? raw.success ?? 0);
      const cCan = Number(raw.cancelled_parcel ?? raw.cancelled ?? 0);
      // Prefer API-provided success_ratio; calculate only as fallback
      const cRatio = raw.success_ratio !== undefined
        ? Number(raw.success_ratio)
        : (cTot > 0 ? Math.round((cSuc / cTot) * 100) : 0);

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
      if (data.success_ratio === undefined && summary.success_ratio === undefined) {
        ratio = Math.round((success / total) * 100);
      }
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
  // Real BDCourier API risk_level values: "low" | "medium" | "high"
  const apiRiskLevel = (data.risk_level || "").toLowerCase();
  let riskLevel: "safe" | "medium" | "high" | "critical" = "safe";
  let color: "emerald" | "amber" | "red" | "zinc" = "emerald";
  let badgeText = "";

  if (rawVerdict && typeof rawVerdict === "object") {
    const reasonsStr = Array.isArray(rawVerdict.reasons) && rawVerdict.reasons.length > 0
      ? rawVerdict.reasons.join(". ")
      : "";
    verdictString = [rawVerdict.label, rawVerdict.action, reasonsStr].filter(Boolean).join(" • ");
  } else if (typeof rawVerdict === "string") {
    verdictString = rawVerdict;
  }

  // Determine badge text and color — use real API risk_level if available
  if (total === 0 && reports.length === 0) {
    riskLevel = "safe";
    color = "zinc";
    badgeText = "New Buyer";
    verdictString = verdictString || "First-time buyer with 0 courier parcels recorded. No cancellation history found.";
  } else if (reports.length > 0 || apiRiskLevel === "high") {
    riskLevel = "critical";
    color = "red";
    badgeText = reports.length > 0 ? `${reports.length} Fraud Report${reports.length > 1 ? "s" : ""}` : `${ratio}% Low Ratio`;
  } else if (apiRiskLevel === "medium" || ratio < 50) {
    riskLevel = ratio < 50 ? "critical" : "medium";
    color = ratio < 50 ? "red" : "amber";
    badgeText = `${ratio}% ${ratio < 50 ? "Low Ratio" : "Moderate"}`;
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
