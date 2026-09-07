import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsLogs,
  logAnalyticsEvent,
  clearAnalyticsLogs,
  type TrackingChannel,
} from "@/lib/analytics/live-event-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const channel = (searchParams.get("channel") as TrackingChannel | "all") || "all";
  const eventName = searchParams.get("event") || "all";
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

  const data = getAnalyticsLogs({ channel, eventName, limit });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = logAnalyticsEvent(body);
    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE() {
  const result = clearAnalyticsLogs();
  return NextResponse.json(result);
}
