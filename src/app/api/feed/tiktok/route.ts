import { NextRequest, NextResponse } from "next/server";
import { getRequestBaseUrl } from "@/lib/utils";
import { generateTikTokFeed, type FeedFormat } from "@/lib/feeds/catalog-builder";
import { isModuleEnabled } from "@/lib/settings/config-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const enabled = await isModuleEnabled("tiktok_catalog");
  if (!enabled) {
    return new NextResponse("TikTok Catalog Feed is currently disabled by administrator.", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const { searchParams } = new URL(request.url);
  const formatParam = (searchParams.get("format") || "xml").toLowerCase();
  const format: FeedFormat = formatParam === "csv" ? "csv" : "xml";

  const baseUrl = getRequestBaseUrl(request);
  const { content, contentType, filename } = await generateTikTokFeed(baseUrl, format);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": format === "csv" ? `attachment; filename="${filename}"` : "inline",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
