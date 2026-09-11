"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: string;
    __TIKTOK_PIXEL_ID__?: string;
  }
}

// Helper to extract cookie value
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

import { getResolvedCustomerIdentity } from "@/lib/analytics/customer-identity";

// In-memory sliding window deduplication for TikTok Pixel events
const recentTikTokEventTimestamps = new Map<string, number>();
const TIKTOK_DEDUP_WINDOW_MS = 1200;

export function initTikTokPixel(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;

  (function (w: any, d: any, t: string) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent",
    ];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function (t: any) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
        ttq.setAndDefer(e, ttq.methods[n]);
      }
      return e;
    };
    ttq.load = function (e: any, n: any) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      var o = n && n.partner;
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      var a = document.createElement("script");
      a.type = "text/javascript";
      a.async = true;
      a.src = r + "?sdkid=" + e + "&lib=" + t;
      a.id = "tiktok-pixel-events-script";
      var c = document.getElementsByTagName("script")[0];
      if (c && c.parentNode) {
        c.parentNode.insertBefore(a, c);
      } else if (document.head) {
        document.head.appendChild(a);
      }
    };

    if (!w.__TIKTOK_PIXEL_ID__ || w.__TIKTOK_PIXEL_ID__ !== pixelId) {
      ttq.load(pixelId);
      ttq.page();
      w.__TIKTOK_PIXEL_ID__ = pixelId;
    }
  })(window, document, "ttq");
}

export function TikTokPixel({ pixelId: propPixelId }: { pixelId?: string } = {}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const pixelId = propPixelId?.trim() || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() || "";
  if (!pixelId) return null;

  useEffect(() => {
    if (typeof window !== "undefined" && pixelId) {
      initTikTokPixel(pixelId);
    }
  }, [pixelId]);

  return (
    <Script
      id="tiktok-pixel-fallback"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined' && (!window.__TIKTOK_PIXEL_ID__ || window.__TIKTOK_PIXEL_ID__ !== '${pixelId}')) {
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=document.getElementsByTagName("script")[0];if(c&&c.parentNode){c.parentNode.insertBefore(a,c)}else if(d.head){d.head.appendChild(a)}};
              ttq.load('${pixelId}');
              ttq.page();
              window.__TIKTOK_PIXEL_ID__ = '${pixelId}';
            }(window, document, 'ttq');
          }
        `,
      }}
    />
  );
}

function getOrInitTtq(pixelId?: string) {
  if (typeof window === "undefined") return undefined;
  if (pixelId) {
    initTikTokPixel(pixelId);
  } else if (!window.ttq && window.__TIKTOK_PIXEL_ID__) {
    initTikTokPixel(window.__TIKTOK_PIXEL_ID__);
  }
  return window.ttq;
}

/**
 * Dispatches both Browser-Side TikTok Pixel (`ttq`) and Server-Side TikTok Events API (`CAPI`)
 * with identical matching `event_id` for 100% deduplication and Advanced Matching.
 */
export function trackTikTokEvent(
  eventName: string,
  params: Record<string, any> = {},
  customerData?: Record<string, any>,
  customEventId?: string
) {
  if (typeof window === "undefined") return;
  if (typeof window.location !== "undefined" && window.location.pathname.startsWith("/admin")) return;

  // Map event name to TikTok standard if needed
  let mappedEvent = eventName;
  if (eventName === "Purchase") mappedEvent = "CompletePayment";
  if (eventName === "Lead") mappedEvent = "SubmitForm";

  // 1. Deduplication for CompletePayment (Purchase)
  if (mappedEvent === "CompletePayment" && (params.order_id || params.transaction_id)) {
    const orderKey = params.order_id || params.transaction_id;
    const storageKey = `ecomx_dedup_tt_purchase_${orderKey}`;
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
    params.query ||
    params.search_string ||
    params.content_name ||
    (typeof window !== "undefined" ? window.location.pathname : "") ||
    "";

  const eventFingerprint = `${mappedEvent}::${contentSignature}::${params.value || 0}`;
  const now = Date.now();
  const lastFired = recentTikTokEventTimestamps.get(eventFingerprint);

  if (lastFired && now - lastFired < TIKTOK_DEDUP_WINDOW_MS) {
    return;
  }

  recentTikTokEventTimestamps.set(eventFingerprint, now);

  // 3. Generate deterministic matching eventID
  const eventId = customEventId || `tt_evt_${now}_${Math.random().toString(36).substring(2, 9)}`;

  // Extract effective Test Event Code (from window global, sessionStorage, cookie, or URL search query)
  let testCode: string | undefined = undefined;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    testCode =
      (window as any).__TIKTOK_TEST_CODE__ ||
      urlParams.get("test_event_code") ||
      urlParams.get("tiktok_test_event_code") ||
      urlParams.get("tt_test_code") ||
      sessionStorage.getItem("tiktok_test_event_code") ||
      getCookie("tiktok_test_event_code") ||
      undefined;
  }

  // Helper to sanitize and normalize payload for TikTok Pixel
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

  if (cleanParams.currency) {
    cleanParams.currency = String(cleanParams.currency).trim().toUpperCase();
  }
  if (cleanParams.value !== undefined) {
    cleanParams.value = Number(cleanParams.value) || 0;
  }

  // 4. Resolve rich persistent customer identity & ad identifiers for EMQ 9.0+ / 10/10
  const resolvedIdentity = getResolvedCustomerIdentity(customerData);

  // 4.1. Fire Browser TikTok Pixel (guaranteed queue buffer via getOrInitTtq)
  const ttq = getOrInitTtq();
  if (ttq) {
    let formattedPhone: string | undefined;
    if (resolvedIdentity.phone) {
      let digits = String(resolvedIdentity.phone).replace(/\D/g, "");
      if (digits.startsWith("01") && digits.length === 11) {
        formattedPhone = "+880" + digits.slice(1);
      } else if (digits.startsWith("8801") && digits.length === 13) {
        formattedPhone = "+" + digits;
      } else if (digits.length > 6) {
        formattedPhone = digits.startsWith("+") ? digits : "+" + digits;
      }
    }

    const identifyPayload: Record<string, any> = {
      external_id: resolvedIdentity.externalId,
    };
    if (resolvedIdentity.email) identifyPayload.email = resolvedIdentity.email.trim().toLowerCase();
    if (formattedPhone) identifyPayload.phone_number = formattedPhone;

    try {
      ttq.identify(identifyPayload);
    } catch {}

    if (mappedEvent === "PageView") {
      if (typeof ttq.page === "function") {
        ttq.page();
      }
    } else {
      ttq.track(mappedEvent, cleanParams, { event_id: eventId });
    }
  }

  // 4.2. Record Live Browser TikTok Event to Live Event Logger
  try {
    fetch("/api/analytics/live-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "browser_tiktok",
        eventName: mappedEvent,
        eventId,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        payload: {
          ...cleanParams,
          _event_source: "browser_ttq",
          _tiktok_pixel_id: typeof window !== "undefined" ? window.__TIKTOK_PIXEL_ID__ : undefined,
          _external_id: resolvedIdentity.externalId,
          _test_event_code: testCode,
        },
        status: "success",
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  // 5. Fire Server-Side TikTok Events API (CAPI) in background
  try {
    const userData = {
      email: resolvedIdentity.email,
      phone: resolvedIdentity.phone,
      externalId: resolvedIdentity.externalId,
      clientUserAgent: resolvedIdentity.clientUserAgent || (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      ttp: resolvedIdentity.ttp,
      ttclid: resolvedIdentity.ttclid,
    };

    fetch("/api/analytics/tiktok", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: mappedEvent,
        eventId,
        eventSourceUrl: window.location.href,
        userData,
        properties: cleanParams,
        testEventCode: testCode,
      }),
      keepalive: true,
    }).catch(() => {
      // Non-blocking background catch
    });
  } catch {
    // Non-blocking catch
  }
}
