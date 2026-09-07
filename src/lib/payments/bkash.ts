/**
 * Official bKash Tokenized Checkout API Client (v1.2.0-beta)
 * Implements standard bKash PGW REST workflow:
 * 1. Grant Token (POST /tokenized/checkout/token/grant)
 * 2. Create Payment (POST /tokenized/checkout/create)
 * 3. Execute Payment (POST /tokenized/checkout/execute)
 * 4. Query Payment (POST /tokenized/checkout/payment/status)
 * 5. Search Transaction (POST /tokenized/checkout/general/searchTransaction)
 * 6. Refund Payment (POST /tokenized/checkout/payment/refund)
 */

import { getModuleSettings } from "@/lib/settings/config-service";

export interface BkashConfig {
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
  environment: "sandbox" | "live";
  tokenized?: boolean;
}

// In-memory token cache to avoid redundant grant calls
let cachedToken: {
  idToken: string;
  expiresAt: number;
} | null = null;

// Official Sandbox Credentials from bKash Developer Portal
export const BKASH_SANDBOX_DEFAULTS: BkashConfig = {
  app_key: "4f6o0cjiki2rfm34kfdadl1eqq",
  app_secret: "2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b",
  username: "sandboxTokenizedUser02",
  password: "sandboxTokenizedUser02@12345",
  environment: "sandbox",
  tokenized: true,
};

export async function getBkashConfig(): Promise<BkashConfig> {
  try {
    const settings = await getModuleSettings("bkash", "all", true);
    const env = (settings.environment === "live" ? "live" : "sandbox") as "sandbox" | "live";

    const config: BkashConfig = {
      app_key: settings.app_key || (env === "sandbox" ? BKASH_SANDBOX_DEFAULTS.app_key : ""),
      app_secret: settings.app_secret || (env === "sandbox" ? BKASH_SANDBOX_DEFAULTS.app_secret : ""),
      username: settings.username || (env === "sandbox" ? BKASH_SANDBOX_DEFAULTS.username : ""),
      password: settings.password || (env === "sandbox" ? BKASH_SANDBOX_DEFAULTS.password : ""),
      environment: env,
      tokenized: settings.tokenized !== false,
    };

    return config;
  } catch (err) {
    console.warn("Failed to load bKash config from settings, using sandbox defaults:", err);
    return BKASH_SANDBOX_DEFAULTS;
  }
}

function getBaseUrl(env: "sandbox" | "live"): string {
  return env === "live"
    ? "https://tokenized.pay.bka.sh/v1.2.0-beta"
    : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
}

/**
 * 1. Grant Token: POST /tokenized/checkout/token/grant
 */
export async function grantBkashToken(config?: BkashConfig): Promise<{
  success: boolean;
  idToken?: string;
  statusCode?: string;
  statusMessage?: string;
  error?: string;
}> {
  const cfg = config || (await getBkashConfig());

  // Return cached token if valid (buffer of 60 seconds)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return { success: true, idToken: cachedToken.idToken };
  }

  const baseUrl = getBaseUrl(cfg.environment);

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: cfg.username,
        password: cfg.password,
      },
      body: JSON.stringify({
        app_key: cfg.app_key,
        app_secret: cfg.app_secret,
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (data.id_token) {
      const expiresInSec = Number(data.expires_in) || 3600;
      cachedToken = {
        idToken: data.id_token,
        expiresAt: Date.now() + expiresInSec * 1000,
      };
      return {
        success: true,
        idToken: data.id_token,
        statusCode: data.statusCode || "0000",
        statusMessage: data.statusMessage || "Successful",
      };
    }

    return {
      success: false,
      statusCode: data.statusCode || "UNKNOWN",
      statusMessage: data.statusMessage || data.message || "Failed to grant token",
      error: data.statusMessage || data.message || "Invalid credentials or authorization failed",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error connecting to bKash PGW",
    };
  }
}

/**
 * 2. Create Payment: POST /tokenized/checkout/create
 */
export async function createBkashPayment(params: {
  amount: number | string;
  orderNumber: string;
  payerReference?: string;
  callbackUrl: string;
}): Promise<{
  success: boolean;
  paymentID?: string;
  bkashURL?: string;
  statusMessage?: string;
  statusCode?: string;
  error?: string;
  raw?: any;
}> {
  const cfg = await getBkashConfig();
  const tokenRes = await grantBkashToken(cfg);

  if (!tokenRes.success || !tokenRes.idToken) {
    return {
      success: false,
      error: tokenRes.error || "Could not obtain authorization token from bKash",
      statusCode: tokenRes.statusCode,
    };
  }

  const baseUrl = getBaseUrl(cfg.environment);
  const formattedAmount = Number(params.amount).toFixed(2);
  const sanitizedPayerRef =
    (params.payerReference || params.orderNumber || "order")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 20) || "customer";

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: tokenRes.idToken,
        "X-APP-Key": cfg.app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: sanitizedPayerRef,
        callbackURL: params.callbackUrl,
        amount: formattedAmount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: params.orderNumber,
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (data.statusCode === "0000" && data.bkashURL) {
      return {
        success: true,
        paymentID: data.paymentID,
        bkashURL: data.bkashURL,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
        raw: data,
      };
    }

    return {
      success: false,
      statusCode: data.statusCode,
      statusMessage: data.statusMessage || "Failed to create payment session",
      error: data.statusMessage || "bKash checkout session could not be created",
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error initiating bKash checkout",
    };
  }
}

/**
 * 3. Execute Payment: POST /tokenized/checkout/execute
 */
export async function executeBkashPayment(paymentID: string): Promise<{
  success: boolean;
  trxID?: string;
  paymentID?: string;
  amount?: string;
  customerMsisdn?: string;
  transactionStatus?: string;
  statusCode?: string;
  statusMessage?: string;
  error?: string;
  raw?: any;
}> {
  const cfg = await getBkashConfig();
  const tokenRes = await grantBkashToken(cfg);

  if (!tokenRes.success || !tokenRes.idToken) {
    return {
      success: false,
      error: tokenRes.error || "Could not obtain authorization token from bKash",
    };
  }

  const baseUrl = getBaseUrl(cfg.environment);

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: tokenRes.idToken,
        "X-APP-Key": cfg.app_key,
      },
      body: JSON.stringify({ paymentID }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (data.statusCode === "0000" && data.transactionStatus === "Completed") {
      return {
        success: true,
        trxID: data.trxID,
        paymentID: data.paymentID,
        amount: data.amount,
        customerMsisdn: data.customerMsisdn,
        transactionStatus: data.transactionStatus,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
        raw: data,
      };
    }

    return {
      success: false,
      statusCode: data.statusCode,
      statusMessage: data.statusMessage || "Payment execution was not successful",
      error: data.statusMessage || `bKash execution failed with status: ${data.transactionStatus || data.statusCode}`,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error executing bKash payment",
    };
  }
}

/**
 * 4. Query Payment: POST /tokenized/checkout/payment/status
 */
export async function queryBkashPayment(paymentID: string): Promise<{
  success: boolean;
  payment?: any;
  error?: string;
}> {
  const cfg = await getBkashConfig();
  const tokenRes = await grantBkashToken(cfg);

  if (!tokenRes.success || !tokenRes.idToken) {
    return { success: false, error: tokenRes.error };
  }

  const baseUrl = getBaseUrl(cfg.environment);

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/payment/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: tokenRes.idToken,
        "X-APP-Key": cfg.app_key,
      },
      body: JSON.stringify({ paymentID }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return { success: data.statusCode === "0000", payment: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 5. Search Transaction: POST /tokenized/checkout/general/searchTransaction
 */
export async function searchBkashTransaction(trxID: string): Promise<{
  success: boolean;
  transaction?: any;
  error?: string;
}> {
  const cfg = await getBkashConfig();
  const tokenRes = await grantBkashToken(cfg);

  if (!tokenRes.success || !tokenRes.idToken) {
    return { success: false, error: tokenRes.error };
  }

  const baseUrl = getBaseUrl(cfg.environment);

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/general/searchTransaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: tokenRes.idToken,
        "X-APP-Key": cfg.app_key,
      },
      body: JSON.stringify({ trxID }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return { success: data.statusCode === "0000", transaction: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
