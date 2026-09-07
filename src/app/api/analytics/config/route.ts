import { NextResponse } from "next/server";
import { getMarketingAnalyticsSettings } from "@/features/marketing/meta-actions";
import { getTikTokSettings } from "@/features/marketing/tiktok-actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [meta, tiktok] = await Promise.all([
      getMarketingAnalyticsSettings().catch(() => null),
      getTikTokSettings().catch(() => null),
    ]);

    return NextResponse.json(
      {
        meta_pixel_id: meta?.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        meta_capi_enabled: meta?.meta_capi_enabled !== false,
        meta_advanced_matching_enabled: meta?.meta_advanced_matching_enabled !== false,
        tiktok_pixel_id: tiktok?.tiktok_pixel_id || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "",
        tiktok_capi_enabled: tiktok?.tiktok_capi_enabled !== false,
        tiktok_advanced_matching_enabled: tiktok?.tiktok_advanced_matching_enabled !== false,
        gtm_container_id: meta?.gtm_container_id || process.env.NEXT_PUBLIC_GTM_ID || "",
        ga4_measurement_id: meta?.ga4_measurement_id || process.env.NEXT_PUBLIC_GA4_ID || "",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        tiktok_pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "",
        error: err.message,
      },
      { status: 200 }
    );
  }
}
