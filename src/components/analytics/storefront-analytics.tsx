"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleTagManager } from "./google-tag-manager";
import { NavigationEvents } from "./navigation-events";
import { MetaPixel } from "./meta-pixel";
import { TikTokPixel } from "./tiktok-pixel";

export interface AnalyticsConfig {
  meta_pixel_id?: string;
  meta_capi_enabled?: boolean;
  meta_advanced_matching_enabled?: boolean;
  tiktok_pixel_id?: string;
  tiktok_capi_enabled?: boolean;
  tiktok_advanced_matching_enabled?: boolean;
  gtm_container_id?: string;
  ga4_measurement_id?: string;
}

export function StorefrontAnalytics({
  initialConfig,
}: {
  initialConfig?: AnalyticsConfig;
} = {}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [config, setConfig] = useState<AnalyticsConfig>(initialConfig || {});

  // Fetch dynamic marketing settings on client mount to ensure real-time settings sync
  useEffect(() => {
    if (isAdmin) return;

    fetch("/api/analytics/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.meta_pixel_id || data.tiktok_pixel_id || data.gtm_container_id || data.ga4_measurement_id)) {
          setConfig((prev) => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch(() => {
        // Fall back to initialConfig
      });
  }, [isAdmin]);

  // Safeguard: revoke tracking consent if transitioning into admin
  useEffect(() => {
    if (isAdmin && typeof window !== "undefined") {
      if (typeof window.fbq === "function") {
        try {
          window.fbq("consent", "revoke");
        } catch {}
      }
      if (window.ttq && typeof window.ttq.revokeConsent === "function") {
        try {
          window.ttq.revokeConsent();
        } catch {}
      }
    } else if (!isAdmin && typeof window !== "undefined") {
      if (typeof window.fbq === "function") {
        try {
          window.fbq("consent", "grant");
        } catch {}
      }
      if (window.ttq && typeof window.ttq.grantConsent === "function") {
        try {
          window.ttq.grantConsent();
        } catch {}
      }
    }
  }, [isAdmin]);

  // NEVER render any pixel scripts on admin routes
  if (isAdmin) {
    return null;
  }

  return (
    <>
      <GoogleTagManager gtmId={config.gtm_container_id} ga4Id={config.ga4_measurement_id} />
      <NavigationEvents />
      <MetaPixel pixelId={config.meta_pixel_id} />
      <TikTokPixel pixelId={config.tiktok_pixel_id} />
    </>
  );
}
