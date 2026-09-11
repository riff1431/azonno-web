"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { getResolvedCustomerIdentity } from "@/lib/analytics/customer-identity";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    __META_PIXEL_ID__?: string;
    __META_TEST_CODE__?: string;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

const recentMetaEventTimestamps = new Map<string, number>();
const META_DEDUP_WINDOW_MS = 1200;

export function MetaPixel({ pixelId: propPixelId }: { pixelId?: string } = {}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const pixelId = propPixelId?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  if (!pixelId) return null;

  useEffect(() => {
    if (typeof window !== "undefined" && pixelId) {
      const fbq = getOrInitFbq();
      if (fbq) {
        if (!window.__META_PIXEL_ID__ || window.__META_PIXEL_ID__ !== pixelId) {
          fbq("init", pixelId);
          window.__META_PIXEL_ID__ = pixelId;
        }
      }
    }
  }, [pixelId]);

  return (
    <Script
      id="meta-pixel-fallback"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined' && !window.__META_PIXEL_ID__) {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            window.__META_PIXEL_ID__ = '${pixelId}';
          }
        `,
      }}
    />
  );
}

function getOrInitFbq() {
  if (typeof window === "undefined") return undefined;
  if (!window.fbq) {
    const n: any = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    window.fbq = n;

    if (!document.getElementById("meta-fbevents-script")) {
      const s = document.createElement("script");
      s.id = "meta-fbevents-script";
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      const headOrFirst = document.head || document.getElementsByTagName("script")[0]?.parentNode;
      headOrFirst?.appendChild(s);
    }
  }
  return window.fbq;
}

/**
 * Dispatches both Browser-Side Meta Pixel (`fbq`) and Server-Side Meta Conversions API (`CAPI`)
 * with identical matching `eventID` for 100% deduplication and Advanced Matching.
 */
export function trackMetaEvent(
  eventName: string,
  params: Record<string, any> = {},
  customerData?: Record<string, any>,
  customEventId?: string
) {
  if (typeof window === "undefined") return;
  if (typeof window.location !== "undefined" && window.location.pathname.startsWith("/admin")) return;

  // 1. Strict persistent deduplication for Purchase event
  if (eventName === "Purchase" && (params.order_id || params.transaction_id)) {
    const orderKey = params.order_id || params.transaction_id;
    const storageKey = `ecomx_dedup_meta_purchase_${orderKey}`;
    try {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage errors
    }
  }

  // 2. Sliding window fingerprint deduplication for other events
  const contentSignature =
    params.order_id ||
    params.transaction_id ||
    params.content_id ||
    (Array.isArray(params.content_ids) ? params.content_ids.join(",") : "") ||
    params.search_string ||
    params.content_name ||
    (typeof window !== "undefined" ? window.location.pathname : "") ||
    "";

  const eventFingerprint = `${eventName}::${contentSignature}::${params.value || 0}`;
  const now = Date.now();
  const lastFired = recentMetaEventTimestamps.get(eventFingerprint);

  if (lastFired && now - lastFired < META_DEDUP_WINDOW_MS) {
    return;
  }

  recentMetaEventTimestamps.set(eventFingerprint, now);

  // 3. Generate deterministic matching eventID for Browser Pixel & Server CAPI deduplication
  const eventId = customEventId || `evt_${now}_${Math.random().toString(36).substring(2, 9)}`;

  // Extract effective Test Event Code (from window global, sessionStorage, cookie, or URL search query)
  let testCode: string | undefined = undefined;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    testCode =
      (window as any).__META_TEST_CODE__ ||
      urlParams.get("test_event_code") ||
      urlParams.get("meta_test_event_code") ||
      sessionStorage.getItem("meta_test_event_code") ||
      getCookie("meta_test_event_code") ||
      undefined;
  }

  // Helper to sanitize and normalize payload for Meta Pixel
  const cleanParams: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      if (Array.isArray(v)) {
        const cleanedArr = v
          .map((item) => (typeof item === "object" && item !== null ? Object.fromEntries(Object.entries(item).filter(([_, val]) => val !== undefined && val !== null && val !== "")) : item))
          .filter((item) => item !== undefined && item !== null);
        if (cleanedArr.length > 0) cleanParams[k] = cleanedArr;
      } else if (typeof v === "object") {
        const subCleaned = Object.fromEntries(Object.entries(v).filter(([_, val]) => val !== undefined && val !== null && val !== ""));
        if (Object.keys(subCleaned).length > 0) cleanParams[k] = subCleaned;
      } else {
        cleanParams[k] = v;
      }
    }
  }

  // Strictly enforce Meta ISO-4217 uppercase currency and numeric value
  if (cleanParams.currency) {
    cleanParams.currency = String(cleanParams.currency).trim().toUpperCase();
  }
  if (cleanParams.value !== undefined) {
    cleanParams.value = Number(cleanParams.value) || 0;
  }

  // Ensure Purchase event strictly complies with Meta required parameters
  if (eventName === "Purchase") {
    if (!cleanParams.currency) {
      cleanParams.currency = "BDT";
    }
    cleanParams.value = Number(cleanParams.value) || 0;
  }

  // 4. Resolve rich persistent customer identity & ad identifiers for EMQ 9.0+ / 10/10
  const resolvedIdentity = getResolvedCustomerIdentity(customerData);

  // 4.1. Fire Browser Meta Pixel with Advanced Matching
  const fbq = getOrInitFbq();
  if (fbq) {
    const advancedData: Record<string, any> = {
      country: "bd",
      external_id: resolvedIdentity.externalId,
      fbp: resolvedIdentity.fbp,
    };

    if (resolvedIdentity.fbc) advancedData.fbc = resolvedIdentity.fbc;
    if (resolvedIdentity.email) advancedData.em = resolvedIdentity.email.trim().toLowerCase();
    if (resolvedIdentity.phone) {
      let digits = resolvedIdentity.phone.replace(/\D/g, "");
      if (digits.startsWith("01") && digits.length === 11) digits = "88" + digits;
      advancedData.ph = digits;
    }
    if (resolvedIdentity.firstName) advancedData.fn = resolvedIdentity.firstName.trim().toLowerCase();
    if (resolvedIdentity.lastName) advancedData.ln = resolvedIdentity.lastName.trim().toLowerCase();
    if (resolvedIdentity.city) advancedData.ct = resolvedIdentity.city.trim().toLowerCase();
    if (resolvedIdentity.state) advancedData.st = resolvedIdentity.state.trim().toLowerCase();
    if (resolvedIdentity.zip) advancedData.zp = resolvedIdentity.zip.trim().toLowerCase();

    try {
      fbq("set", "userData", advancedData);
    } catch {}

    const isStandardMetaEvent = [
      "AddPaymentInfo",
      "AddToCart",
      "AddToWishlist",
      "CompleteRegistration",
      "Contact",
      "CustomizeProduct",
      "Donate",
      "FindLocation",
      "InitiateCheckout",
      "Lead",
      "PageView",
      "Purchase",
      "Schedule",
      "Search",
      "StartTrial",
      "SubmitApplication",
      "Subscribe",
      "ViewContent",
    ].includes(eventName);

    const trackFn = isStandardMetaEvent ? "track" : "trackCustom";
    if (Object.keys(cleanParams).length > 0) {
      fbq(trackFn, eventName, cleanParams, { eventID: eventId });
    } else {
      fbq(trackFn, eventName, {}, { eventID: eventId });
    }
  }

  // 4.2. Record Live Browser Meta Event to Live Event Logger
  try {
    fetch("/api/analytics/live-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "browser_meta",
        eventName,
        eventId,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        payload: {
          ...cleanParams,
          _event_source: "browser_fbq",
          _meta_pixel_id: typeof window !== "undefined" ? window.__META_PIXEL_ID__ : undefined,
          _external_id: resolvedIdentity.externalId,
          _test_event_code: testCode,
        },
        status: "success",
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  // 5. Fire Server-Side Meta Conversions API (CAPI) with full 13 parameters
  try {
    const userData = {
      email: resolvedIdentity.email,
      phone: resolvedIdentity.phone,
      firstName: resolvedIdentity.firstName,
      lastName: resolvedIdentity.lastName,
      city: resolvedIdentity.city,
      state: resolvedIdentity.state,
      country: resolvedIdentity.country || "BD",
      zip: resolvedIdentity.zip,
      externalId: resolvedIdentity.externalId,
      clientUserAgent: resolvedIdentity.clientUserAgent || (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      fbp: resolvedIdentity.fbp,
      fbc: resolvedIdentity.fbc,
    };

    fetch("/api/analytics/capi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        userData,
        customData: cleanParams,
        testEventCode: testCode,
      }),
      keepalive: true,
    }).catch(() => {
      // Non-blocking CAPI background catch
    });
  } catch {
    // Non-blocking catch
  }
}

