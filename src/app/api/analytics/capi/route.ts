import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/features/marketing/meta-actions";
import { extractClientIp } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      eventName,
      eventId,
      eventSourceUrl,
      userData = {},
      customData = {},
      testEventCode,
    } = body;

    if (!eventName || !eventId) {
      return NextResponse.json(
        { success: false, error: "Missing required eventName or eventId" },
        { status: 400 }
      );
    }

    // Dynamically resolve client IP address from proxy headers (Cloudflare, Vercel, Nginx, X-Forwarded-For)
    let clientIpAddress =
      userData.clientIpAddress ||
      extractClientIp(req.headers) ||
      undefined;

    // In local development only (loopback / private network), fallback for offline testing
    if (
      !clientIpAddress ||
      clientIpAddress === "::1" ||
      clientIpAddress === "127.0.0.1" ||
      clientIpAddress.startsWith("192.168.") ||
      clientIpAddress.startsWith("10.")
    ) {
      if (process.env.NODE_ENV === "development") {
        clientIpAddress = "103.108.140.25"; // Standard Bangladesh public ISP IP for local development testing
      } else {
        clientIpAddress = undefined;
      }
    }

    const clientUserAgent =
      userData.clientUserAgent ||
      req.headers.get("user-agent") ||
      undefined;

    // Automatically read or generate Meta cookies (_fbp, _fbc)
    let fbp = userData.fbp || req.cookies.get("_fbp")?.value;
    let newlyGeneratedFbp = false;

    if (!fbp || fbp === "undefined" || fbp === "null") {
      fbp = `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      newlyGeneratedFbp = true;
    }

    const fbc = userData.fbc || req.cookies.get("_fbc")?.value || undefined;

    const enrichedUserData = {
      ...userData,
      clientIpAddress,
      clientUserAgent,
      fbp,
      fbc,
    };

    const effectiveTestCode =
      testEventCode ||
      req.cookies.get("meta_test_event_code")?.value ||
      req.nextUrl.searchParams.get("test_event_code") ||
      req.nextUrl.searchParams.get("test_code") ||
      process.env.META_CAPI_TEST_EVENT_CODE ||
      undefined;

    const result = await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || req.headers.get("referer") || undefined,
      userData: enrichedUserData,
      customData,
      testEventCode: effectiveTestCode,
    });

    const response = NextResponse.json(result);

    // Set _fbp cookie on response if newly generated so client browser reuses it
    if (newlyGeneratedFbp) {
      response.cookies.set("_fbp", fbp, {
        path: "/",
        maxAge: 7776000, // 90 days
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: any) {
    console.error("[CAPI Route Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
