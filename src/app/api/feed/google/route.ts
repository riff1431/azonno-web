import { NextRequest, NextResponse } from "next/server";
import { getRequestBaseUrl } from "@/lib/utils";
import { generateGoogleFeed, type FeedFormat } from "@/lib/feeds/catalog-builder";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const formatParam = (searchParams.get("format") || "xml").toLowerCase();
  const format: FeedFormat = formatParam === "csv" ? "csv" : "xml";

  const baseUrl = getRequestBaseUrl(request);
  const { content, contentType, filename } = await generateGoogleFeed(baseUrl, format);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": format === "csv" ? `attachment; filename="${filename}"` : "inline",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
