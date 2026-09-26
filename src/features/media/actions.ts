"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteCloudinaryAsset, uploadToCloudinaryStream } from "@/lib/cloudinary";
import { logActivity } from "@/services/activity-log";

export async function uploadMediaDirectly(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized: Please sign in as an administrator." };
  }

  // Strict Admin & Moderator Role Verification (Block customer uploads)
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
    return { error: "Access Denied: Only store administrators are authorized to upload media to this website." };
  }

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "ecommerce";

  if (!file) {
    return { error: "No file provided" };
  }

  // Security: File Type & MIME Whitelist
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
  ];

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { error: `Security Error: File type '${file.type}' is not allowed. Only safe images (JPG, PNG, WebP, GIF) and videos (MP4, WebM) are permitted.` };
  }

  // Max 15MB file size limit
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "File too large: Maximum file size allowed is 15MB." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const resourceType = file.type.startsWith("video") ? "video" : "image";

    const uploadResult = await uploadToCloudinaryStream(buffer, {
      folder,
      resource_type: resourceType,
    });

    const altText = file.name.replace(/\.[^/.]+$/, "");

    const saveResult = await saveMediaRecord({
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      resource_type: uploadResult.resource_type || resourceType,
      format: uploadResult.format || file.name.split(".").pop() || "",
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes || file.size,
      folder,
      alt_text: altText,
    });

    return saveResult;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload file";
    return { error: message };
  }
}

export interface GalleryImageItem {
  id: string;
  url: string;
  title: string;
  source: "media" | "product" | "banner";
  created_at?: string;
}

export async function getStoreGalleryImages(search?: string): Promise<GalleryImageItem[]> {
  const supabase = await createClient();
  const items: GalleryImageItem[] = [];
  const seenUrls = new Set<string>();

  try {
    // 1. Fetch from media table
    let mediaQuery = supabase
      .from("media")
      .select("id, secure_url, alt_text, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(40);

    if (search && search.trim()) {
      mediaQuery = mediaQuery.or(`alt_text.ilike.%${search.trim()}%,public_id.ilike.%${search.trim()}%`);
    }

    const { data: mediaRows } = await mediaQuery;
    if (mediaRows) {
      for (const m of mediaRows) {
        if (m.secure_url && !seenUrls.has(m.secure_url)) {
          seenUrls.add(m.secure_url);
          items.push({
            id: `media-${m.id}`,
            url: m.secure_url,
            title: m.alt_text || "Store Image",
            source: "media",
            created_at: m.created_at,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Error fetching media table images:", err);
  }

  try {
    // 2. Fetch from products table (product thumbnails & gallery images)
    let prodQuery = supabase
      .from("products")
      .select("id, name, thumbnail_url, images, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (search && search.trim()) {
      prodQuery = prodQuery.ilike("name", `%${search.trim()}%`);
    }

    const { data: prodRows } = await prodQuery;
    if (prodRows) {
      for (const p of prodRows) {
        if (p.thumbnail_url && !seenUrls.has(p.thumbnail_url)) {
          seenUrls.add(p.thumbnail_url);
          items.push({
            id: `prod-thumb-${p.id}`,
            url: p.thumbnail_url,
            title: p.name || "Product Thumbnail",
            source: "product",
            created_at: p.created_at,
          });
        }
        if (Array.isArray(p.images)) {
          p.images.forEach((imgUrl: string, idx: number) => {
            if (imgUrl && typeof imgUrl === "string" && !seenUrls.has(imgUrl)) {
              seenUrls.add(imgUrl);
              items.push({
                id: `prod-img-${p.id}-${idx}`,
                url: imgUrl,
                title: `${p.name || "Product"} (${idx + 1})`,
                source: "product",
                created_at: p.created_at,
              });
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn("Error fetching product images for gallery:", err);
  }

  return items;
}

export async function getMedia(filters?: {
  folder?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("media")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.folder) {
    query = query.eq("folder", filters.folder);
  }

  if (filters?.search) {
    query = query.or(`alt_text.ilike.%${filters.search}%,public_id.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function saveMediaRecord(input: {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
  alt_text?: string;
  caption?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("media")
    .insert({
      public_id: input.public_id,
      secure_url: input.secure_url,
      resource_type: input.resource_type || "image",
      format: input.format,
      width: input.width || null,
      height: input.height || null,
      bytes: input.bytes || null,
      folder: input.folder || "general",
      alt_text: input.alt_text || null,
      caption: input.caption || null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await logActivity({
    action: "media.upload",
    targetType: "media",
    targetId: data.id,
    afterData: { public_id: input.public_id, url: input.secure_url },
  });

  revalidatePath("/admin/media");
  return { data };
}

export async function updateMediaMetadata(
  id: string,
  input: { alt_text?: string; caption?: string }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media")
    .update({
      alt_text: input.alt_text || null,
      caption: input.caption || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/media");
  return { data };
}

export async function deleteMediaRecord(id: string, public_id: string) {
  const supabase = await createClient();

  // Try to delete from Cloudinary
  try {
    await deleteCloudinaryAsset(public_id);
  } catch (cloudErr) {
    console.warn("Could not delete from Cloudinary:", cloudErr);
  }

  // Soft delete in database
  const { error } = await supabase
    .from("media")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logActivity({
    action: "media.delete",
    targetType: "media",
    targetId: id,
    beforeData: { public_id },
  });

  revalidatePath("/admin/media");
  return { success: true };
}
