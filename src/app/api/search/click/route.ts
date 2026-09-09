import { NextResponse } from "next/server";
import { recordSearchClick } from "@/lib/analytics/search-analytics-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, productId, productName } = body;
    if (query) {
      await recordSearchClick(query, productId, productName);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
