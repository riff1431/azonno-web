"use client";

import { useEffect } from "react";

/**
 * CookieTracker automatically extracts and persists advertising identifiers:
 * - Meta: _fbp, _fbc (or derives _fbc from URL ?fbclid=...)
 * - TikTok: _ttp, _ttclid (or derives from URL ?ttclid=...)
 *
 * This ensures EMQ 9.0+ by providing full click & browser IDs even across multi-page sessions.
 */
export function CookieTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get("fbclid");
      const ttclid = urlParams.get("ttclid");

      // 1. Process Meta Click ID (fbclid -> _fbc format: fb.1.{timestamp}.{fbclid})
      if (fbclid) {
        const creationTime = Date.now();
        const fbcValue = `fb.1.${creationTime}.${fbclid}`;
        document.cookie = `_fbc=${fbcValue};path=/;max-age=7776000;SameSite=Lax`;
        localStorage.setItem("ecomx_fbc", fbcValue);
      }

      // 2. Process TikTok Click ID (ttclid -> _ttclid cookie)
      if (ttclid) {
        document.cookie = `_ttclid=${ttclid};path=/;max-age=7776000;SameSite=Lax`;
        localStorage.setItem("ecomx_ttclid", ttclid);
      }

      // 3. Persist existing cookies in localStorage as backup
      const cookies = document.cookie.split(";");
      cookies.forEach((c) => {
        const [k, v] = c.trim().split("=");
        if (k === "_fbp") localStorage.setItem("ecomx_fbp", v);
        if (k === "_fbc") localStorage.setItem("ecomx_fbc", v);
        if (k === "_ttp") localStorage.setItem("ecomx_ttp", v);
        if (k === "_ttclid") localStorage.setItem("ecomx_ttclid", v);
      });
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
