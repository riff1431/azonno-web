import { NextResponse } from "next/server";
import { getMarketingAnalyticsSettings } from "@/features/marketing/meta-actions";
import { getTikTokSettings } from "@/features/marketing/tiktok-actions";
import { isModuleEnabled } from "@/lib/settings/config-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      meta,
      tiktok,
      metaPixelEnabled,
      metaCapiEnabled,
      tiktokPixelEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
      ga4Enabled,
    ] = await Promise.all([
      getMarketingAnalyticsSettings().catch(() => null),
      getTikTokSettings().catch(() => null),
      isModuleEnabled("meta_pixel").catch(() => true),
      isModuleEnabled("meta_capi").catch(() => true),
      isModuleEnabled("tiktok_pixel").catch(() => true),
      isModuleEnabled("tiktok_events_api").catch(() => true),
      isModuleEnabled("gtm").catch(() => true),
      isModuleEnabled("ga4").catch(() => true),
    ]);

    const rawMetaPixel = meta?.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
    const rawTikTokPixel = tiktok?.tiktok_pixel_id || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";
    const rawGtm = meta?.gtm_container_id || process.env.NEXT_PUBLIC_GTM_ID || "";
    const rawGa4 = meta?.ga4_measurement_id || process.env.NEXT_PUBLIC_GA4_ID || "";

    return NextResponse.json(
      {
        meta_pixel_id: metaPixelEnabled ? rawMetaPixel : "",
        meta_capi_enabled: metaCapiEnabled && meta?.meta_capi_enabled !== false,
        meta_advanced_matching_enabled: meta?.meta_advanced_matching_enabled !== false,
        meta_test_event_code: meta?.meta_test_event_code || process.env.META_CAPI_TEST_EVENT_CODE || "",
        tiktok_pixel_id: tiktokPixelEnabled ? rawTikTokPixel : "",
        tiktok_capi_enabled: tiktokCapiEnabled && tiktok?.tiktok_capi_enabled !== false,
        tiktok_advanced_matching_enabled: tiktok?.tiktok_advanced_matching_enabled !== false,
        tiktok_test_event_code: tiktok?.tiktok_test_event_code || process.env.TIKTOK_TEST_EVENT_CODE || "",
        gtm_container_id: gtmEnabled ? rawGtm : "",
        ga4_measurement_id: ga4Enabled ? rawGa4 : "",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        meta_test_event_code: process.env.META_CAPI_TEST_EVENT_CODE || "",
        tiktok_pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "",
        tiktok_test_event_code: process.env.TIKTOK_TEST_EVENT_CODE || "",
        error: err.message,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
