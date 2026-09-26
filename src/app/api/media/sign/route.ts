import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSignedUploadParams } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin/moderator role
    let userRole = user.app_metadata?.role || user.user_metadata?.role;
    if (!userRole) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        userRole = profile?.role;
      } catch {
        // Non-blocking fallback
      }
    }

    if (userRole !== "admin" && userRole !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { folder } = await request.json();

    if (!folder) {
      return NextResponse.json({ error: "Folder is required" }, { status: 400 });
    }

    const uploadParams = generateSignedUploadParams(folder);
    return NextResponse.json(uploadParams);
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
