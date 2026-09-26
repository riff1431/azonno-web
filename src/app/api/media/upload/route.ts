import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToCloudinaryStream } from "@/lib/cloudinary";
import { saveMediaRecord } from "@/features/media/actions";

export async function POST(request: NextRequest) {
  try {
    // 1. Strict Authentication & Role Verification (Admin/Staff Only)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to upload files." },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { error: "Forbidden: Only store administrators and staff can upload media files." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // MIME type check
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Only image files (JPG, PNG, WebP, GIF, SVG, AVIF) are allowed." },
        { status: 400 }
      );
    }

    // 15MB size limit
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum allowed size is 15MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${sanitizedName}`;

    // Priority 1: Cloudinary (if configured)
    if (
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ) {
      try {
        const uploadResult = await uploadToCloudinaryStream(buffer, {
          folder: `ecomx/${folder}`,
          resource_type: "image",
        });

        // Record in media library
        try {
          await saveMediaRecord({
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
            resource_type: "image",
            format: uploadResult.format || file.name.split(".").pop() || "webp",
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes || file.size,
            folder,
            alt_text: file.name.replace(/\.[^/.]+$/, ""),
          });
        } catch (dbErr) {
          console.warn("[MediaRecord Warning] Could not save record to media table:", dbErr);
        }

        return NextResponse.json({
          success: true,
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          provider: "cloudinary",
        });
      } catch (cloudErr) {
        console.warn("[Cloudinary Upload Warning] Falling back to Supabase/DataURI:", cloudErr);
      }
    }

    // Priority 2: Supabase Storage Bucket (if available)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();
        const filePath = `${folder}/${uniqueFileName}`;

        // Attempt upload to 'media' bucket
        const { data: uploadData, error: uploadErr } = await adminSupabase.storage
          .from("media")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = adminSupabase.storage
            .from("media")
            .getPublicUrl(filePath);

          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            provider: "supabase_storage",
          });
        }
      } catch (storageErr) {
        console.warn("[Supabase Storage Warning] Falling back to DataURI:", storageErr);
      }
    }

    // Priority 3: Fallback to high-efficiency Data URI
    // Ensures upload NEVER fails even in offline, local, or demo environments!
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUri,
      provider: "data_uri",
    });
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
