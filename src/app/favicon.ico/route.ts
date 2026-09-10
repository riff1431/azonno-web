import { NextResponse } from "next/server";
import { getSeoSettings } from "@/features/settings/actions";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seo = await getSeoSettings().catch(() => null);
    const faviconUrl = seo?.favicon_url;

    if (faviconUrl && (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://"))) {
      return NextResponse.redirect(faviconUrl, { status: 307 });
    }

    if (faviconUrl && faviconUrl.startsWith("/") && faviconUrl !== "/favicon.ico") {
      return NextResponse.redirect(faviconUrl, { status: 307 });
    }

    const filePath = path.join(process.cwd(), "public", "favicon.ico");
    const fileBuffer = await fs.readFile(filePath).catch(() => null);
    if (fileBuffer) {
      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "image/x-icon",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    return new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
