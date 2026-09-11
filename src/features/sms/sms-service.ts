/**
 * SMS Provider Gateway Service & API Dispatcher
 * Implements official REST/HTTP adapters for:
 * 1. BulkSMSBD (Bangladesh #1 SMS Gateway)
 * 2. MiMSMS V2 Official REST API (https://www.mimsms.com/api-documentation)
 * 3. Greenweb BD Token API (https://api.greenweb.com.bd/api.php)
 * 4. Twilio Global REST API
 * 5. Onnorokom SMS
 * 6. Custom HTTP Dynamic Gateway
 */

import { logIntegrationEvent } from "@/features/modules/actions";

export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  responseCode?: string | number;
  message?: string;
  rawResponse?: any;
  latencyMs: number;
  balance?: string;
  error?: string;
}

export interface SmsProviderSettings {
  provider_name: string; // "BulkSMSBD" | "MIMSMS" | "Greenweb" | "Twilio" | "Onnorokom" | "Custom"
  api_url?: string;
  api_key?: string;
  sender_id?: string;
  username?: string; // MiMSMS Login Email or Twilio Account SID
  password?: string; // or Twilio Auth Token
  is_active?: boolean;
  custom_headers?: Record<string, string>;
  http_method?: "GET" | "POST";
}

/**
 * Normalize Bangladeshi recipient phone number for various providers.
 * Supports:
 * - format 'bd_local': 01712345678 (11 digits)
 * - format 'bd_country': 8801712345678 (13 digits)
 * - format 'e164': +8801712345678
 */
export function formatBdSmsPhone(rawPhone: string, format: "bd_local" | "bd_country" | "e164" = "bd_country"): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/\D/g, "");

  // Strip international prefix if already present
  if (digits.startsWith("880") && digits.length >= 13) {
    digits = digits.slice(2);
  } else if (digits.startsWith("88") && digits.length === 12) {
    digits = "0" + digits.slice(2);
  }

  // Ensure starts with 0 for 10-digit numbers like 1712345678
  if (digits.length === 10 && digits.startsWith("1")) {
    digits = "0" + digits;
  }

  // If longer than 11 digits, extract last 11 digits if they start with 01
  if (digits.length > 11) {
    const last11 = digits.slice(-11);
    if (last11.startsWith("01")) {
      digits = last11;
    }
  }

  if (format === "bd_local") {
    return digits; // e.g. 01712345678
  } else if (format === "e164") {
    return `+88${digits}`; // e.g. +8801712345678
  } else {
    return `88${digits}`; // e.g. 8801712345678
  }
}

/**
 * 1. BulkSMSBD Driver
 * Official Docs: https://bulksmsbd.net/api/smsapi
 */
export async function sendBulkSmsBd(
  config: SmsProviderSettings,
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const startTime = Date.now();
  const apiKey = (config.api_key || "").trim();
  const senderId = (config.sender_id || "").trim();
  const apiUrl = (config.api_url || "https://bulksmsbd.net/api/smsapi").trim();
  const formattedPhone = formatBdSmsPhone(phone, "bd_country"); // 8801XXXXXXXXX

  if (!apiKey) {
    return {
      success: false,
      provider: "BulkSMSBD",
      latencyMs: 0,
      error: "BulkSMSBD API Key is missing. Please configure it in SMS settings.",
    };
  }

  // Detect Bengali / Unicode characters
  const isUnicode = /[\u0980-\u09FF]/.test(message);
  const smsType = isUnicode ? "unicode" : "text";

  const payload = {
    api_key: apiKey,
    type: smsType,
    number: formattedPhone,
    senderid: senderId || "8809612000000",
    message: message,
  };

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const json = await res.json().catch(() => null);

    // BulkSMSBD returns: { response_code: 202, message_id: 12345, success_message: "SMS Submitted Successfully", error_message: "" }
    if (json && (json.response_code === 202 || json.response_code === "202" || json.success_message)) {
      return {
        success: true,
        provider: "BulkSMSBD",
        responseCode: json.response_code,
        messageId: String(json.message_id || `sms-${Date.now()}`),
        message: json.success_message || "SMS submitted successfully via BulkSMSBD.",
        rawResponse: json,
        latencyMs,
      };
    }

    // Map known BulkSMSBD error codes
    const errMap: Record<number | string, string> = {
      1000: "Invalid/Missing Parameters",
      1002: "Sender ID/Masking Not Found or Not Approved",
      1003: "Invalid API Key or Inactive Account",
      1007: "Insufficient Account Balance / Credits",
      1008: "Invalid Recipient Mobile Number",
      1011: "Account or IP Blocked by BulkSMSBD",
    };

    const code = json?.response_code;
    const errorMsg = json?.error_message || errMap[code] || `BulkSMSBD Error (Code ${code || res.status})`;

    return {
      success: false,
      provider: "BulkSMSBD",
      responseCode: code,
      error: errorMsg,
      rawResponse: json,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      provider: "BulkSMSBD",
      error: err.message || "Network timeout connecting to BulkSMSBD gateway.",
      latencyMs,
    };
  }
}

/**
 * 2. MiMSMS Official API V2 Driver
 * Official Docs: https://www.mimsms.com/api-documentation (OpenAPI v2.0)
 * Base URL: https://api.mimsms.com/api/V2/SMS
 */
export async function sendMimSmsV2(
  config: SmsProviderSettings,
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const startTime = Date.now();
  const apiKey = (config.api_key || "").trim();
  const userName = (config.username || "").trim();
  const senderName = (config.sender_id || "").trim();
  const apiUrl = (config.api_url || "https://api.mimsms.com/api/V2/SMS").trim();
  const formattedPhone = formatBdSmsPhone(phone, "bd_country"); // 8801XXXXXXXXX

  if (!apiKey || !userName) {
    return {
      success: false,
      provider: "MiMSMS",
      latencyMs: 0,
      error: "MiMSMS requires both Account Email (User Name) and API Key. Please configure them in SMS settings.",
    };
  }

  // Primary: JSON POST to /api/V2/SMS
  try {
    const payload = {
      apiKey: apiKey,
      userName: userName,
      senderName: senderName || "8809612444598",
      transactionType: "T",
      mobileNumber: formattedPhone,
      message: message,
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const json = await res.json().catch(() => null);

    // MiMSMS response: { statusCode: "200", status: "Success", responseResult: "SMS Send Successfuly", trxnId: "...", success_Data: [...] }
    if (
      json &&
      (json.statusCode === "200" ||
        json.statusCode === 200 ||
        json.status === "Success" ||
        (Array.isArray(json.success_Data) && json.success_Data.length > 0))
    ) {
      const trackingId =
        json.success_Data?.[0]?.trackingId || json.trxnId || `mim-${Date.now()}`;
      return {
        success: true,
        provider: "MiMSMS",
        responseCode: json.statusCode || "200",
        messageId: String(trackingId),
        message: json.responseResult || "SMS sent successfully via MiMSMS V2 API.",
        rawResponse: json,
        latencyMs,
      };
    }

    // Capture error message from error_Data or responseResult
    let errorMsg = "Failed to send SMS via MiMSMS.";
    if (Array.isArray(json?.error_Data) && json.error_Data.length > 0) {
      errorMsg = json.error_Data.map((e: any) => e.error || e.res_Code).join("; ");
    } else if (json?.responseResult) {
      errorMsg = json.responseResult;
    } else if (json?.message) {
      errorMsg = json.message;
    } else if (json?.status) {
      errorMsg = `MiMSMS Status: ${json.status} (Code: ${json.statusCode || res.status})`;
    }

    return {
      success: false,
      provider: "MiMSMS",
      responseCode: json?.statusCode || res.status,
      error: errorMsg,
      rawResponse: json,
      latencyMs,
    };
  } catch (err: any) {
    // Attempt GET fallback if network / POST failed
    try {
      const fallbackUrl = `https://api.mimsms.com/api/V2/Send?userName=${encodeURIComponent(userName)}&apiKey=${encodeURIComponent(apiKey)}&mobileNumber=${formattedPhone}&senderName=${encodeURIComponent(senderName)}&transactionType=T&message=${encodeURIComponent(message)}`;
      const res = await fetch(fallbackUrl, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      const latencyMs = Date.now() - startTime;

      if (
        json &&
        (json.statusCode === "200" ||
          json.statusCode === 200 ||
          json.status === "Success" ||
          (Array.isArray(json.success_Data) && json.success_Data.length > 0))
      ) {
        return {
          success: true,
          provider: "MiMSMS",
          messageId: String(json.success_Data?.[0]?.trackingId || json.trxnId || `mim-${Date.now()}`),
          message: json.responseResult || "SMS sent successfully via MiMSMS GET API.",
          rawResponse: json,
          latencyMs,
        };
      }
    } catch {
      // ignore fallback error
    }

    return {
      success: false,
      provider: "MiMSMS",
      error:
        err.message ||
        "Failed to reach MiMSMS API server. Ensure your Server IP/Domain is whitelisted in MiMSMS Developer Portal.",
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * 3. Greenweb BD Token API Driver
 * Official Docs: https://api.greenweb.com.bd/api.php
 */
export async function sendGreenwebSms(
  config: SmsProviderSettings,
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const startTime = Date.now();
  const token = (config.api_key || config.password || "").trim();
  const apiUrl = (config.api_url || "https://api.greenweb.com.bd/api.php").trim();
  const formattedPhone = formatBdSmsPhone(phone, "bd_country"); // 8801XXXXXXXXX

  if (!token) {
    return {
      success: false,
      provider: "Greenweb",
      latencyMs: 0,
      error: "Greenweb API Token is missing.",
    };
  }

  const formData = new URLSearchParams();
  formData.append("token", token);
  formData.append("to", formattedPhone);
  formData.append("message", message);
  formData.append("json", "1");

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Plaintext fallback
    }

    // Greenweb returns: [{"to":"88017...","status":"SENT","msgid":"...","statusmsg":"Success"}] or text: "Ok: 1 SMS Sent"
    if (Array.isArray(json) && json[0]?.status === "SENT") {
      return {
        success: true,
        provider: "Greenweb",
        messageId: json[0].msgid,
        message: json[0].statusmsg || "SMS dispatched successfully via Greenweb BD.",
        rawResponse: json,
        latencyMs,
      };
    } else if (text.includes("Ok: ") || text.includes("SENT") || text.includes("Success")) {
      return {
        success: true,
        provider: "Greenweb",
        message: text.trim(),
        latencyMs,
      };
    }

    const err = (Array.isArray(json) && json[0]?.statusmsg) || text || "Failed to dispatch SMS via Greenweb.";
    return {
      success: false,
      provider: "Greenweb",
      error: err,
      rawResponse: json || text,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      provider: "Greenweb",
      error: err.message || "Failed to reach Greenweb API.",
      latencyMs,
    };
  }
}

/**
 * 4. Twilio Global REST API Driver
 * Official Docs: https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
 */
export async function sendTwilioSms(
  config: SmsProviderSettings,
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const startTime = Date.now();
  const accountSid = (config.username || config.api_url?.match(/Accounts\/([^/]+)/)?.[1] || "").trim();
  const authToken = (config.api_key || config.password || "").trim();
  const fromNumber = (config.sender_id || "").trim();
  const toPhone = formatBdSmsPhone(phone, "e164"); // +8801XXXXXXXXX

  if (!accountSid || !authToken) {
    return {
      success: false,
      provider: "Twilio",
      latencyMs: 0,
      error: "Twilio Account SID and Auth Token are required.",
    };
  }

  if (!fromNumber) {
    return {
      success: false,
      provider: "Twilio",
      latencyMs: 0,
      error: "Twilio Sender ID or Twilio Phone Number is required.",
    };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams();
  body.append("To", toPhone);
  body.append("From", fromNumber);
  body.append("Body", message);

  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const json = await res.json().catch(() => null);

    if (res.ok && json?.sid) {
      return {
        success: true,
        provider: "Twilio",
        messageId: json.sid,
        message: `Twilio SMS queued (Status: ${json.status})`,
        rawResponse: json,
        latencyMs,
      };
    }

    return {
      success: false,
      provider: "Twilio",
      responseCode: json?.code || res.status,
      error: json?.message || `Twilio dispatch failed (HTTP ${res.status})`,
      rawResponse: json,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "Twilio",
      error: err.message || "Failed to reach Twilio API.",
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * 5. Onnorokom SMS Driver
 * Official Docs: https://api2.onnorokomsms.com/HttpSendSms.ashx
 */
export async function sendOnnorokomSms(
  config: SmsProviderSettings,
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const startTime = Date.now();
  const apiKey = (config.api_key || "").trim();
  const maskName = (config.sender_id || "").trim();
  const formattedPhone = formatBdSmsPhone(phone, "bd_local"); // 01XXXXXXXXX
  const apiUrl = (config.api_url || "https://api2.onnorokomsms.com/HttpSendSms.ashx").trim();

  if (!apiKey) {
    return {
      success: false,
      provider: "Onnorokom",
      latencyMs: 0,
      error: "Onnorokom API Key is missing.",
    };
  }

  const params = new URLSearchParams({
    type: "TEXT",
    apiKey,
    mobileNumber: formattedPhone,
    smsText: message,
    maskName: maskName || "",
  });

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const text = await res.text();

    // Onnorokom returns e.g. "1900||12345678" on success
    if (text.startsWith("1900") || text.includes("SUCCESS") || res.ok) {
      return {
        success: true,
        provider: "Onnorokom",
        messageId: text.split("||")[1] || `onno-${Date.now()}`,
        message: "SMS sent successfully via Onnorokom SMS.",
        rawResponse: text,
        latencyMs,
      };
    }

    return {
      success: false,
      provider: "Onnorokom",
      error: `Onnorokom Gateway returned: ${text}`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "Onnorokom",
      error: err.message || "Network error connecting to Onnorokom gateway.",
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * 6. Custom HTTP Gateway Driver with Dynamic Placeholder Substitution
 */
export async function sendCustomHttpSms(
  config: SmsProviderSettings,
  phone: string,
  message: string
): Promise<SmsSendResult> {
  const startTime = Date.now();
  const rawUrl = (config.api_url || "").trim();
  if (!rawUrl) {
    return {
      success: false,
      provider: "Custom",
      latencyMs: 0,
      error: "Custom HTTP Endpoint URL is required.",
    };
  }

  const phoneBd = formatBdSmsPhone(phone, "bd_country");
  const phoneLocal = formatBdSmsPhone(phone, "bd_local");
  const encodedMsg = encodeURIComponent(message);
  const apiKey = encodeURIComponent(config.api_key || "");
  const senderId = encodeURIComponent(config.sender_id || "");

  // Replace placeholders in URL
  let targetUrl = rawUrl
    .replaceAll("{apiKey}", apiKey)
    .replaceAll("{api_key}", apiKey)
    .replaceAll("{senderId}", senderId)
    .replaceAll("{sender_id}", senderId)
    .replaceAll("{phone}", phoneBd)
    .replaceAll("{number}", phoneBd)
    .replaceAll("{mobile}", phoneLocal)
    .replaceAll("{message}", encodedMsg)
    .replaceAll("{msg}", encodedMsg)
    .replaceAll("{text}", encodedMsg);

  try {
    const res = await fetch(targetUrl, {
      method: config.http_method || "GET",
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const text = await res.text();

    if (res.ok) {
      return {
        success: true,
        provider: "Custom",
        message: `Custom gateway accepted request (HTTP ${res.status}).`,
        rawResponse: text,
        latencyMs,
      };
    }

    return {
      success: false,
      provider: "Custom",
      error: `Custom gateway returned HTTP ${res.status}: ${text.slice(0, 150)}`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: "Custom",
      error: err.message || "Failed to reach custom SMS gateway.",
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * 7. Live SMS Balance Checker
 * Queries BulkSMSBD, MiMSMS V2, or Greenweb live balance APIs
 */
export async function checkSmsGatewayBalance(config: SmsProviderSettings): Promise<{
  success: boolean;
  provider: string;
  balance?: string | number;
  currency?: string;
  message: string;
  raw?: any;
}> {
  const provider = (config.provider_name || "BulkSMSBD").trim();
  const apiKey = (config.api_key || "").trim();
  const userName = (config.username || "").trim();

  if (!apiKey) {
    return {
      success: false,
      provider,
      message: "Please enter your API Key/Token to query balance.",
    };
  }

  // BulkSMSBD Balance
  if (provider === "BulkSMSBD" || provider.toLowerCase().includes("bulk")) {
    try {
      const url = `https://bulksmsbd.net/api/getBalanceApi?api_key=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (json && (json.response_code === 202 || json.response_code === "202" || json.balance !== undefined)) {
        return {
          success: true,
          provider: "BulkSMSBD",
          balance: json.balance,
          currency: "BDT",
          message: `BulkSMSBD Live Balance: ৳${json.balance}`,
          raw: json,
        };
      }
      return {
        success: false,
        provider: "BulkSMSBD",
        message: json?.error_message || "Invalid BulkSMSBD API Key or account balance check failed.",
        raw: json,
      };
    } catch (e: any) {
      return {
        success: false,
        provider: "BulkSMSBD",
        message: e.message || "Failed to reach BulkSMSBD balance API.",
      };
    }
  }

  // MiMSMS Official V2 Balance Check (POST /api/V2/BalanceCheck)
  if (provider === "MIMSMS" || provider.toLowerCase() === "mimsms") {
    if (!userName) {
      return {
        success: false,
        provider: "MiMSMS",
        message: "MiMSMS requires your Account Login Email (User Name) to query balance.",
      };
    }

    try {
      const res = await fetch("https://api.mimsms.com/api/V2/BalanceCheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ userName, apiKey }),
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (
        json &&
        (json.statusCode === "200" ||
          json.statusCode === 200 ||
          json.status === "Ok" ||
          json.responseResult !== undefined)
      ) {
        const bal = json.responseResult || json.balance || "0.00";
        return {
          success: true,
          provider: "MiMSMS",
          balance: bal,
          currency: "BDT",
          message: `MiMSMS Live Account Balance: ৳${bal}`,
          raw: json,
        };
      }

      return {
        success: false,
        provider: "MiMSMS",
        message:
          json?.responseResult ||
          json?.message ||
          "Failed to query MiMSMS balance. Ensure API Key is active and IP/Domain is whitelisted at mimsms.com.",
        raw: json,
      };
    } catch (e: any) {
      return {
        success: false,
        provider: "MiMSMS",
        message: e.message || "Failed to reach MiMSMS Balance API.",
      };
    }
  }

  // Greenweb BD Balance
  if (provider === "Greenweb" || provider.toLowerCase().includes("greenweb")) {
    try {
      const url = `https://api.greenweb.com.bd/gbalance.php?token=${apiKey}&json`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (Array.isArray(json) && json[0]?.balance !== undefined) {
        return {
          success: true,
          provider: "Greenweb BD",
          balance: json[0].balance,
          currency: "BDT",
          message: `Greenweb Balance: ৳${json[0].balance}`,
          raw: json,
        };
      }
      return {
        success: false,
        provider: "Greenweb BD",
        message: "Invalid Greenweb Token or balance check error.",
        raw: json,
      };
    } catch (e: any) {
      return {
        success: false,
        provider: "Greenweb BD",
        message: e.message || "Failed to reach Greenweb balance API.",
      };
    }
  }

  return {
    success: true,
    provider,
    message: `${provider} active. Balance check via API not supported; please check provider dashboard.`,
  };
}

/**
 * 8. Unified Master Dispatcher: routes SMS to appropriate provider and logs event
 */
export async function dispatchSmsToGateway(
  config: SmsProviderSettings,
  phone: string,
  message: string,
  eventType: string = "general_sms"
): Promise<SmsSendResult> {
  const providerKey = (config.provider_name || "BulkSMSBD").trim().toLowerCase();

  let result: SmsSendResult;

  if (providerKey === "bulksmsbd" || providerKey.includes("bulk")) {
    result = await sendBulkSmsBd(config, phone, message);
  } else if (providerKey === "mimsms" || (providerKey.includes("mim") && !providerKey.includes("greenweb"))) {
    result = await sendMimSmsV2(config, phone, message);
  } else if (providerKey === "greenweb" || providerKey.includes("greenweb")) {
    result = await sendGreenwebSms(config, phone, message);
  } else if (providerKey === "twilio") {
    result = await sendTwilioSms(config, phone, message);
  } else if (providerKey === "onnorokom") {
    result = await sendOnnorokomSms(config, phone, message);
  } else {
    result = await sendCustomHttpSms(config, phone, message);
  }

  // Record into system integration logs
  try {
    await logIntegrationEvent({
      provider: result.provider,
      moduleKey: "sms",
      event: eventType,
      status: result.success ? "success" : "error",
      message: result.success
        ? `SMS sent to ${phone} (Latency: ${result.latencyMs}ms, ID: ${result.messageId || "ok"})`
        : `SMS to ${phone} failed: ${result.error}`,
      metadata: {
        phone,
        messageLength: message.length,
        responseCode: result.responseCode,
        raw: result.rawResponse,
      },
    });
  } catch (logErr) {
    // Non-blocking log
  }

  return result;
}
