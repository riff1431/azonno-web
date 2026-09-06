"use server";

import { getSettingsByGroup, updateGroupSettings } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";

export interface StoreFeatureSettings {
  // Beauty Catalog & Filter Controls
  enable_beauty_filters: boolean; // Skin Concern, Skin Type, Key Actives, Origin filters
  enable_origin_badges: boolean;
  enable_routine_step_guide: boolean;

  // Product Detail Page (PDP) Experience
  enable_sticky_mobile_cta: boolean; // Floating Order Now bar on mobile screens
  enable_authenticity_verification: boolean; // Batch number & importer verification card
  enable_volume_shade_selector: boolean;
  enable_combo_bundle_section: boolean;

  // Customer Reviews & Community UGC
  enable_customer_reviews: boolean;
  enable_review_photo_uploads: boolean;
  auto_approve_reviews: boolean; // Auto-approve verified buyer reviews or require admin moderation

  // Transactional SMS & Notifications
  enable_order_placed_sms: boolean;
  enable_order_shipped_sms: boolean;
  enable_abandoned_cart_sms: boolean;
  sms_sender_id?: string;

  // Customer Return & Exchange Portal
  enable_return_portal: boolean;
  return_window_days: number;
  enable_reverse_courier_booking: boolean;
  default_return_warehouse_address: string;
}

const DEFAULT_FEATURE_SETTINGS: StoreFeatureSettings = {
  enable_beauty_filters: true,
  enable_origin_badges: true,
  enable_routine_step_guide: true,

  enable_sticky_mobile_cta: true,
  enable_authenticity_verification: true,
  enable_volume_shade_selector: true,
  enable_combo_bundle_section: true,

  enable_customer_reviews: true,
  enable_review_photo_uploads: true,
  auto_approve_reviews: false,

  enable_order_placed_sms: true,
  enable_order_shipped_sms: true,
  enable_abandoned_cart_sms: true,
  sms_sender_id: "BLUSHBUDGET",

  enable_return_portal: true,
  return_window_days: 7,
  enable_reverse_courier_booking: true,
  default_return_warehouse_address: "Blush & Budget Fulfilment Hub, House 14, Road 11, Block D, Banani, Dhaka-1213",
};

/**
 * Fetch all store feature toggle settings from database
 */
export async function getStoreFeatureSettings(): Promise<StoreFeatureSettings> {
  try {
    const data = await getSettingsByGroup("store_features");
    return {
      enable_beauty_filters: data.enable_beauty_filters !== false,
      enable_origin_badges: data.enable_origin_badges !== false,
      enable_routine_step_guide: data.enable_routine_step_guide !== false,

      enable_sticky_mobile_cta: data.enable_sticky_mobile_cta !== false,
      enable_authenticity_verification: data.enable_authenticity_verification !== false,
      enable_volume_shade_selector: data.enable_volume_shade_selector !== false,
      enable_combo_bundle_section: data.enable_combo_bundle_section !== false,

      enable_customer_reviews: data.enable_customer_reviews !== false,
      enable_review_photo_uploads: data.enable_review_photo_uploads !== false,
      auto_approve_reviews: data.auto_approve_reviews === true,

      enable_order_placed_sms: data.enable_order_placed_sms !== false,
      enable_order_shipped_sms: data.enable_order_shipped_sms !== false,
      enable_abandoned_cart_sms: data.enable_abandoned_cart_sms !== false,
      sms_sender_id: data.sms_sender_id || DEFAULT_FEATURE_SETTINGS.sms_sender_id,

      enable_return_portal: data.enable_return_portal !== false,
      return_window_days: Number(data.return_window_days ?? DEFAULT_FEATURE_SETTINGS.return_window_days),
      enable_reverse_courier_booking: data.enable_reverse_courier_booking !== false,
      default_return_warehouse_address: data.default_return_warehouse_address || DEFAULT_FEATURE_SETTINGS.default_return_warehouse_address,
    };
  } catch {
    return DEFAULT_FEATURE_SETTINGS;
  }
}

/**
 * Save store feature toggle settings to database
 */
export async function saveStoreFeatureSettings(
  settings: Partial<StoreFeatureSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateGroupSettings("store_features", settings);
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/admin/settings/features");
    revalidatePath("/admin/returns");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update feature settings",
    };
  }
}

export async function updateStoreFeatureSettings(
  settings: Partial<StoreFeatureSettings>
): Promise<{ success: boolean; error?: string }> {
  return saveStoreFeatureSettings(settings);
}

