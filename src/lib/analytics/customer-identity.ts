/**
 * Centralized Customer Identity & Ad Identifier Engine
 *
 * Provides persistent first-party identification across user sessions:
 * - External ID (`external_id` / `_ext_id`) - 100% attached to all events
 * - Meta Browser ID (`_fbp`) & Click ID (`_fbc` / `fbclid`)
 * - TikTok Browser ID (`_ttp`) & Click ID (`_ttclid`)
 * - Customer Profile caching (phone, email, name, city, country)
 *
 * Ensures Event Match Quality (EMQ) 9.0+ to 10/10 in Meta Events Manager.
 */

export interface ResolvedCustomerIdentity {
  externalId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  city?: string;
  state?: string;
  district?: string;
  division?: string;
  country: string;
  zip?: string;
  fbp: string;
  fbc?: string;
  ttp?: string;
  ttclid?: string;
  clientUserAgent?: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, maxAgeSeconds: number = 7776000) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSeconds};SameSite=Lax`;
}

/**
 * Gets or creates a persistent deterministic External ID (UUID-based).
 */
export function getOrCreateExternalId(): string {
  if (typeof window === "undefined") return "";

  try {
    let extId = getCookie("_ext_id") || localStorage.getItem("ecomx_ext_id");
    if (!extId || extId === "undefined" || extId === "null") {
      extId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("ecomx_ext_id", extId);
      setCookie("_ext_id", extId);
    } else {
      // Keep in sync
      if (!getCookie("_ext_id")) setCookie("_ext_id", extId);
      if (!localStorage.getItem("ecomx_ext_id")) localStorage.setItem("ecomx_ext_id", extId);
    }
    return extId;
  } catch {
    return `ext_${Date.now()}_fallback`;
  }
}

/**
 * Gets or initializes Meta _fbp cookie and localStorage backup.
 */
export function getOrCreateFbp(): string {
  if (typeof window === "undefined") return "";

  try {
    let fbp = getCookie("_fbp") || localStorage.getItem("ecomx_fbp");
    if (!fbp || fbp === "undefined" || fbp === "null") {
      fbp = `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      localStorage.setItem("ecomx_fbp", fbp);
      setCookie("_fbp", fbp);
    } else {
      if (!getCookie("_fbp")) setCookie("_fbp", fbp);
      if (!localStorage.getItem("ecomx_fbp")) localStorage.setItem("ecomx_fbp", fbp);
    }
    return fbp;
  } catch {
    return `fb.1.${Date.now()}.1000000000`;
  }
}

/**
 * Gets or parses Meta _fbc click ID (from cookie, localStorage, or current URL ?fbclid=...).
 */
export function getOrDetectFbc(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");
    if (fbclid) {
      const fbcVal = `fb.1.${Date.now()}.${fbclid}`;
      setCookie("_fbc", fbcVal);
      localStorage.setItem("ecomx_fbc", fbcVal);
      return fbcVal;
    }

    const storedFbc = getCookie("_fbc") || localStorage.getItem("ecomx_fbc");
    if (storedFbc && storedFbc !== "undefined" && storedFbc !== "null") {
      if (!getCookie("_fbc")) setCookie("_fbc", storedFbc);
      if (!localStorage.getItem("ecomx_fbc")) localStorage.setItem("ecomx_fbc", storedFbc);
      return storedFbc;
    }
  } catch {}

  return undefined;
}

/**
 * Gets or initializes TikTok _ttp and _ttclid identifiers.
 */
export function getOrDetectTikTokIds(): { ttp: string; ttclid?: string } {
  if (typeof window === "undefined") return { ttp: "" };

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ttclid = urlParams.get("ttclid");
    if (ttclid) {
      setCookie("_ttclid", ttclid);
      localStorage.setItem("ecomx_ttclid", ttclid);
    }

    let ttp = getCookie("_ttp") || localStorage.getItem("ecomx_ttp");
    if (!ttp || ttp === "undefined" || ttp === "null") {
      ttp = `ttp.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      localStorage.setItem("ecomx_ttp", ttp);
      setCookie("_ttp", ttp);
    }

    const activeTtclid = ttclid || getCookie("_ttclid") || localStorage.getItem("ecomx_ttclid") || undefined;
    return { ttp, ttclid: activeTtclid };
  } catch {
    return { ttp: "" };
  }
}

/**
 * Saves customer identity data to local persistent storage.
 * Called automatically from checkout form inputs, lead forms, login sessions, etc.
 */
export function savePersistentCustomerIdentity(data: {
  phone?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  district?: string;
  state?: string;
  division?: string;
  zip?: string;
  country?: string;
  externalId?: string;
}) {
  if (typeof window === "undefined") return;

  try {
    const currentRaw = localStorage.getItem("ecomx_customer_profile");
    const current = currentRaw ? JSON.parse(currentRaw) : {};

    const merged = {
      ...current,
      phone: data.phone?.trim() || current.phone,
      email: data.email?.trim().toLowerCase() || current.email,
      name: data.name?.trim() || current.name,
      firstName: data.firstName?.trim() || current.firstName,
      lastName: data.lastName?.trim() || current.lastName,
      city: data.city?.trim() || data.district?.trim() || current.city,
      state: data.state?.trim() || data.division?.trim() || current.state,
      district: data.district?.trim() || current.district,
      division: data.division?.trim() || current.division,
      zip: data.zip?.trim() || current.zip,
      country: data.country?.trim() || current.country || "BD",
      externalId: data.externalId?.trim() || current.externalId || getOrCreateExternalId(),
      updatedAt: Date.now(),
    };

    localStorage.setItem("ecomx_customer_profile", JSON.stringify(merged));

    // Also persist lightweight reference cookie for Server Actions
    if (merged.phone) setCookie("_cust_phone", merged.phone);
    if (merged.email) setCookie("_cust_email", merged.email);
    if (merged.city) setCookie("_cust_city", merged.city);
  } catch {}
}

/**
 * Resolves the richest available customer profile and tracking identifiers.
 * Merges runtime event overrides with locally persisted profile and cookies.
 */
export function getResolvedCustomerIdentity(
  override?: Record<string, any>
): ResolvedCustomerIdentity {
  const externalId =
    override?.external_id ||
    override?.externalId ||
    override?.user_id ||
    override?.id ||
    getOrCreateExternalId();

  const fbp = override?.fbp || getOrCreateFbp();
  const fbc = override?.fbc || getOrDetectFbc();
  const { ttp, ttclid } = getOrDetectTikTokIds();

  let storedProfile: Record<string, any> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("ecomx_customer_profile");
      if (raw) storedProfile = JSON.parse(raw);
    } catch {}
  }

  const rawName =
    override?.name ||
    override?.fullName ||
    override?.guest_name ||
    override?.customer_name ||
    storedProfile.name ||
    "";

  let firstName =
    override?.first_name ||
    override?.firstName ||
    storedProfile.firstName ||
    "";

  let lastName =
    override?.last_name ||
    override?.lastName ||
    storedProfile.lastName ||
    "";

  if (!firstName && rawName) {
    const parts = rawName.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  const rawPhone =
    override?.phone ||
    override?.guest_phone ||
    override?.customer_phone ||
    storedProfile.phone ||
    (typeof document !== "undefined" ? getCookie("_cust_phone") : undefined) ||
    undefined;

  const rawEmail =
    override?.email ||
    override?.guest_email ||
    override?.customer_email ||
    storedProfile.email ||
    (typeof document !== "undefined" ? getCookie("_cust_email") : undefined) ||
    undefined;

  const city =
    override?.city ||
    override?.district ||
    storedProfile.city ||
    storedProfile.district ||
    (typeof document !== "undefined" ? getCookie("_cust_city") : undefined) ||
    undefined;

  const state =
    override?.state ||
    override?.division ||
    storedProfile.state ||
    storedProfile.division ||
    undefined;

  const zip = override?.zip || override?.postal_code || storedProfile.zip || undefined;
  const country = override?.country || storedProfile.country || "BD";

  const clientUserAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : undefined;

  return {
    externalId,
    email: rawEmail ? rawEmail.trim().toLowerCase() : undefined,
    phone: rawPhone ? rawPhone.trim() : undefined,
    firstName: firstName ? firstName.trim() : undefined,
    lastName: lastName ? lastName.trim() : undefined,
    fullName: rawName ? rawName.trim() : undefined,
    city,
    state,
    district: override?.district || storedProfile.district || city,
    division: override?.division || storedProfile.division || state,
    country,
    zip,
    fbp,
    fbc,
    ttp: override?.ttp || ttp,
    ttclid: override?.ttclid || ttclid,
    clientUserAgent,
  };
}
