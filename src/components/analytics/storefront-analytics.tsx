"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleTagManager } from "./google-tag-manager";
import { NavigationEvents } from "./navigation-events";
import { MetaPixel } from "./meta-pixel";
import { TikTokPixel, initTikTokPixel } from "./tiktok-pixel";

export interface AnalyticsConfig {
  meta_pixel_id?: string;
  meta_capi_enabled?: boolean;
  meta_advanced_matching_enabled?: boolean;
  meta_test_event_code?: string;
  tiktok_pixel_id?: string;
  tiktok_capi_enabled?: boolean;
  tiktok_advanced_matching_enabled?: boolean;
  tiktok_test_event_code?: string;
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

          if (data.tiktok_pixel_id) {
            initTikTokPixel(data.tiktok_pixel_id);
          }

          if (data.meta_test_event_code && typeof window !== "undefined") {
            (window as any).__META_TEST_CODE__ = data.meta_test_event_code;
            try {
              sessionStorage.setItem("meta_test_event_code", data.meta_test_event_code);
              document.cookie = `meta_test_event_code=${data.meta_test_event_code};path=/;max-age=86400;SameSite=Lax`;
            } catch (e) {}
          }

          if (data.tiktok_test_event_code && typeof window !== "undefined") {
            (window as any).__TIKTOK_TEST_CODE__ = data.tiktok_test_event_code;
            try {
              sessionStorage.setItem("tiktok_test_event_code", data.tiktok_test_event_code);
              document.cookie = `tiktok_test_event_code=${data.tiktok_test_event_code};path=/;max-age=86400;SameSite=Lax`;
            } catch (e) {}
          }
        }
      })
      .catch(() => {
        // Fall back to initialConfig
      });
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
