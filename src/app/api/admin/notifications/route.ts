import { NextResponse } from "next/server";
import { getAdminNotifications } from "@/features/admin/notifications-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getAdminNotifications();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { notifications: [], unreadCount: 0, error: error.message },
      { status: 500 }
    );
  }
}
