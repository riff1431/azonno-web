"use client";

import { useEffect } from "react";
import { getOrCreateExternalId, getOrCreateFbp, getOrDetectFbc, getOrDetectTikTokIds } from "@/lib/analytics/customer-identity";

/**
 * CookieTracker automatically extracts and persists advertising identifiers:
 * - Meta: _fbp, _fbc (or derives _fbc from URL ?fbclid=...)
 * - TikTok: _ttp, _ttclid (or derives from URL ?ttclid=...)
 * - External ID: _ext_id / ecomx_ext_id
 *
 * This ensures EMQ 9.0+ to 10/10 by providing full click & browser IDs even across multi-page sessions.
 */
export function CookieTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // 1. Ensure persistent External ID exists
      getOrCreateExternalId();

      // 2. Ensure Meta _fbp and _fbc are extracted and synchronized
      getOrCreateFbp();
      getOrDetectFbc();

      // 3. Ensure TikTok IDs are extracted and synchronized
      getOrDetectTikTokIds();

      // 4. Capture Test Event Codes (test_event_code / test_code)
      const urlParams = new URLSearchParams(window.location.search);
      const testCode = urlParams.get("test_event_code") || urlParams.get("test_code") || urlParams.get("fb_test_code");
      if (testCode) {
        sessionStorage.setItem("meta_test_event_code", testCode);
        document.cookie = `meta_test_event_code=${testCode};path=/;max-age=86400;SameSite=Lax`;
      }

      const ttTestCode = urlParams.get("tt_test_code") || urlParams.get("tiktok_test_code") || testCode;
      if (ttTestCode) {
        sessionStorage.setItem("tiktok_test_event_code", ttTestCode);
        document.cookie = `tiktok_test_event_code=${ttTestCode};path=/;max-age=86400;SameSite=Lax`;
      }
    } catch (e) {
      // Non-fatal
    }
  }, []);

  return null;
}

/**
 * Helper to retrieve stored ad cookies for checkout & analytics payloads
 */
export function getStoredAdIdentifiers(): {
  fbp?: string;
  fbc?: string;
  ttp?: string;
  ttclid?: string;
} {
  if (typeof window === "undefined") return {};

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : undefined;
  };

  return {
    fbp: getCookie("_fbp") || localStorage.getItem("ecomx_fbp") || undefined,
    fbc: getCookie("_fbc") || localStorage.getItem("ecomx_fbc") || undefined,
    ttp: getCookie("_ttp") || localStorage.getItem("ecomx_ttp") || undefined,
    ttclid: getCookie("_ttclid") || localStorage.getItem("ecomx_ttclid") || undefined,
  };
}
