"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutAndFraudSettings } from "@/features/settings/checkout-settings-actions";

export interface FraudCheckResult {
  allowed: boolean;
  requiresOtp: boolean;
  riskScore: number; // 0 to 100
  riskReasons: string[];
}

/**
 * Validate customer phone number and evaluate risk scoring for Bangladesh COD orders
 */
export async function evaluateCheckoutFraudRisk(params: {
  phone: string;
  email?: string;
  userId?: string;
  orderTotal: number;
  paymentMethod: string;
  ipAddress?: string;
}): Promise<FraudCheckResult> {
  const settings = await getCheckoutAndFraudSettings();
  const supabase = createAdminClient();

  const reasons: string[] = [];
  let riskScore = 0;

  // 1. Phone number format validation (Bangladesh 11-digit mobile: 013, 014, 015, 016, 017, 018, 019)
  const cleanPhone = params.phone.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.startsWith("880")
    ? cleanPhone.slice(2)
    : cleanPhone.startsWith("+880")
    ? cleanPhone.slice(3)
    : cleanPhone;

  const isValidBdMobile = /^01[3-9]\d{8}$/.test(normalizedPhone);
  if (!isValidBdMobile) {
    return {
      allowed: false,
      requiresOtp: false,
      riskScore: 100,
      riskReasons: ["Invalid Bangladesh mobile phone number. Must be 11 digits starting with 01."],
    };
  }

  // 2. Blacklist & Fraud Block Check (Profiles, Fraud Store & Customer Blacklist)
  try {
    // Check fraud_profiles_store
    const { data: storeSetting } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "fraud_profiles_store")
      .single();

    if (storeSetting && Array.isArray(storeSetting.value)) {
      const blacklistedItem = storeSetting.value.find((fp: any) => {
        if (!fp.is_blacklisted) return false;
        const val = (fp.identifier_value || "").trim().toLowerCase();
        const valDigits = val.replace(/\D/g, "");
        const matchPhone = normalizedPhone && (valDigits === normalizedPhone || val === normalizedPhone);
        const matchEmail = params.email && val === params.email.trim().toLowerCase();
        const matchIp = params.ipAddress && val === params.ipAddress.trim();
        return matchPhone || matchEmail || matchIp;
      });

      if (blacklistedItem) {
        return {
          allowed: false,
          requiresOtp: false,
          riskScore: 100,
          riskReasons: [
            blacklistedItem.blacklist_reason ||
              "This contact (phone/email) is restricted on the security blacklist. Orders cannot be placed.",
          ],
        };
      }
    }

    // Check customer_blacklist table
    const { data: blocked } = await supabase
      .from("customer_blacklist")
      .select("reason")
      .or(`phone.eq.${normalizedPhone},phone.eq.+88${normalizedPhone}`)
      .maybeSingle();

    if (blocked) {
      return {
        allowed: false,
        requiresOtp: false,
        riskScore: 100,
        riskReasons: [`Customer phone is flagged on the security blocklist: ${blocked.reason || "Restricted"}`],
      };
    }
  } catch (e) {
    // Fail gracefully
  }

  // 3. Duplicate Order Blocker (Within configured window)
  if (settings.enable_duplicate_blocker) {
    const windowMinutes = settings.duplicate_window_minutes || 5;
    const windowTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    try {
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, created_at, total")
        .or(`shipping_phone.eq.${normalizedPhone},shipping_phone.eq.+88${normalizedPhone}`)
        .gte("created_at", windowTime);

      if (recentOrders && recentOrders.length > 0) {
        return {
          allowed: false,
          requiresOtp: false,
          riskScore: 90,
          riskReasons: [
            `An order was already placed with phone ${normalizedPhone} in the last ${windowMinutes} minutes. Please wait before ordering again to avoid duplicate billing.`,
          ],
        };
      }
    } catch (e) {
      // Ignore if table query fails
    }
  }

  // 4. SMS OTP Verification Rule Evaluation (Admin Configurable)
  let requiresOtp = false;

  // Rule A: Admin configured OTP verification on ALL orders
  if (settings.require_otp_all_orders) {
    requiresOtp = true;
    riskScore += 10;
    reasons.push("SMS phone verification is required for all orders.");
  }

  // Rule B: Admin configured OTP verification if BDCourier delivery success ratio is below threshold (e.g. < 60%)
  if (settings.enable_courier_ratio_otp) {
    try {
      const { fetchBDCourierReport } = await import("./bdcourier-service");
      const courierReport = await fetchBDCourierReport(normalizedPhone);
      const threshold = settings.courier_ratio_otp_threshold ?? 60;

      if (courierReport && courierReport.total_parcel > 0 && courierReport.success_ratio < threshold) {
        requiresOtp = true;
        riskScore += 40;
        reasons.push(
          `Customer courier delivery success ratio is ${courierReport.success_ratio}% (below ${threshold}% safety threshold). Phone verification required.`
        );
      }

      if (courierReport && courierReport.reports_count > 0) {
        requiresOtp = true;
        riskScore += 50;
        reasons.push(
          `Customer has ${courierReport.reports_count} courier fraud report(s) flagged across courier hubs. Phone verification required before COD approval.`
        );
      }
    } catch (e) {
      // Fallback gracefully
    }
  }

  // Rule C: High-Value COD Security Threshold Check
  if (
    settings.enable_cod_otp &&
    params.paymentMethod === "cod" &&
    params.orderTotal >= settings.cod_otp_threshold
  ) {
    requiresOtp = true;
    riskScore += 30;
    reasons.push(
      `Order total BDT ${params.orderTotal} exceeds COD security threshold of BDT ${settings.cod_otp_threshold}. OTP verification required.`
    );
  }

  // If Admin has disabled all OTP rules (or conditions not met), requiresOtp stays false (No SMS needed)

  return {
    allowed: true,
    requiresOtp,
    riskScore,
    riskReasons: reasons,
  };
}

// In-memory OTP storage for rapid verification (Auto-expires in 5 minutes)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

/**
 * Generate and send SMS OTP via SMS Gateway for order phone verification
 */
export async function generateCheckoutOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const cleanPhone = phone.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.slice(-11);

  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith("01")) {
    return { success: false, message: "items  11  EnglishBangladeshi Mobile Number Enter।" };
  }

  // Generate 4-digit OTP
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  otpStore.set(normalizedPhone, { code, expiresAt });

  // Send real SMS through configured SMS Gateway (MiMSMS / BulkSMSBD / Greenweb)
  try {
    const { sendSmsNotification } = await import("@/features/sms/actions");
    const smsRes = await sendSmsNotification({
      recipientPhone: normalizedPhone,
      eventType: "order_otp",
      variables: {
        customer_name: "Customer",
        otp_code: code,
        store_name: "Azonno",
      },
    });

    if (!smsRes.success && !smsRes.skipped) {
      console.error("[Anti-Fraud SMS Gateway] Failed to dispatch OTP:", smsRes.error);
      return {
        success: false,
        message: " Code   । Please  your Mobile Numberitems     again :00 ।",
      };
    }
  } catch (err: any) {
    console.warn("SMS gateway send warning:", err);
    return {
      success: false,
      message: "    Code  Tracking। Please    :00 ।",
    };
  }

  return {
    success: true,
    message: `your Mobile Number 4   Code  successfully।`,
  };
}

/**
 * Verify customer-entered OTP code
 */
export async function verifyCheckoutOtp(phone: string, inputCode: string): Promise<{ valid: boolean; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.slice(-11);

  const entry = otpStore.get(normalizedPhone);
  if (!entry) {
    return { valid: false, error: " Code    । Please   Code ।" };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedPhone);
    return { valid: false, error: " Code    । Please    Code ।" };
  }

  if (entry.code !== inputCode.trim()) {
    return { valid: false, error: "Invalid  Code। Please   4- Codeitems ।" };
  }

  // OTP verified successfully, clear entry
  otpStore.delete(normalizedPhone);
  return { valid: true };
}
