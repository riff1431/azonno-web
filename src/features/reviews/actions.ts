"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";

export async function submitReview(input: {
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
  reviewer_name?: string;
  reviewer_email?: string;
  skin_type?: string;
}) {
  const featureSettings = await getStoreFeatureSettings();
  if (featureSettings.enable_customer_reviews === false) {
    return { error: "Customer reviews are currently disabled by store management." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return {
      error: "Please log in to submit a review.",
      requireLogin: true,
    };
  }

  const adminClient = createAdminClient();

  // Check if user has purchased this product for verified badge
  let orderItemId: string | null = null;
  try {
    const { data: orderItem } = await adminClient
      .from("order_items")
      .select("id, order_id, orders!inner(user_id)")
      .eq("product_id", input.product_id)
      .eq("orders.user_id", user.id)
      .limit(1)
      .maybeSingle();

    orderItemId = orderItem?.id || null;
  } catch (err) {
    console.error("Verified purchase lookup error:", err);
  }

  // Fetch customer profile to get their full name
  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const reviewerName =
    input.reviewer_name?.trim() ||
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Verified Customer";

  // Logged-in user reviews are published immediately so customer sees their review instantly
  const reviewStatus = "approved";

  const { data: review, error } = await adminClient
    .from("reviews")
    .insert({
      product_id: input.product_id,
      user_id: user.id,
      order_item_id: orderItemId,
      rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
      status: reviewStatus,
    })
    .select()
    .single();

  if (error) {
    console.error("Review submission error:", error);
    return { error: error.message };
  }

  revalidatePath(`/products`);
  return {
    success: true,
    review: {
      ...review,
      profiles: {
        full_name: reviewerName,
        email: user.email,
      },
    },
    pendingModeration: false,
  };
}

export async function getProductReviews(productId: string) {
  const adminClient = createAdminClient();

  const { data: reviews, error } = await adminClient
    .from("reviews")
    .select(`
      id,
      rating,
      title,
      comment,
      status,
      admin_reply,
      created_at,
      order_item_id,
      user_id,
      profiles (
        full_name,
        email
      )
    `)
    .eq("product_id", productId)
    .in("status", ["approved", "pending"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return reviews || [];
}

export async function getAdminReviews() {
  const adminClient = createAdminClient();

  const { data: reviews, error } = await adminClient
    .from("reviews")
    .select(`
      id,
      rating,
      title,
      comment,
      status,
      admin_reply,
      created_at,
      products (
        id,
        name,
        slug
      ),
      profiles (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin reviews:", error);
    return [];
  }

  return reviews || [];
}

export async function moderateReview(
  reviewId: string,
  status: "approved" | "rejected" | "spam",
  adminReply?: string
) {
  const adminClient = createAdminClient();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminReply !== undefined) {
    updateData.admin_reply = adminReply.trim() || null;
    updateData.admin_reply_at = adminReply.trim() ? new Date().toISOString() : null;
  }

  const { data, error } = await adminClient
    .from("reviews")
    .update(updateData)
    .eq("id", reviewId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/products");
  return { success: true, review: data };
}

export async function deleteReview(reviewId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("reviews").delete().eq("id", reviewId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/products");
  return { success: true };
}
