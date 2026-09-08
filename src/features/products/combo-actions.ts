"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isModuleEnabled } from "@/lib/settings/config-service";

export interface ComboBundleConfig {
  product_id: string;
  enabled: boolean;
  title: string;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number; // e.g., 15 for 15% OFF, 250 for ৳250 OFF, 0 for Free Shipping
  bundle_product_ids: string[]; // 1 to 3 complementary products
  badge_text: string; // e.g., "Best Value Combo", "Save 15%", "Free Shipping"
  updated_at?: string;
}

// In-memory persistent registry for product-wise combo configurations
let memoryComboRegistry: Record<string, ComboBundleConfig> = {
  // Pre-configured default high-converting combos for demo
};

/**
 * Get Combo Bundle Configuration for a specific product
 */
export async function getProductComboConfig(productId: string): Promise<ComboBundleConfig | null> {
  if (memoryComboRegistry[productId]) {
    return memoryComboRegistry[productId];
  }
  return null;
}

/**
 * Save or Update Combo Bundle Configuration for a specific product
 */
export async function saveProductComboConfig(config: ComboBundleConfig) {
  memoryComboRegistry[config.product_id] = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  revalidatePath(`/products/[slug]`, "page");
  revalidatePath(`/admin/products`);
  return { success: true, config: memoryComboRegistry[config.product_id] };
}

/**
 * Get full bundle items with live product data for the Storefront Product Detail Page
 */
export async function getFrequentlyBoughtTogetherBundle(mainProductId: string) {
  const globalEnabled = await isModuleEnabled("frequently_bought_together");
  if (!globalEnabled) {
    return null;
  }

  const supabase = await createClient();

  // 1. Fetch main product
  const { data: mainProduct } = await supabase
    .from("products")
    .select("id, name, slug, regular_price, sale_price, og_image_url, brand_id, brands(name)")
    .eq("id", mainProductId)
    .single();

  if (!mainProduct) return null;

  // 2. Check if admin configured custom bundle for this product
  const customConfig = memoryComboRegistry[mainProductId];

  let bundleProducts: any[] = [];
  let offerType: "percentage" | "fixed" | "free_shipping" = "percentage";
  let offerValue: number = 10;
  let title: string = "Frequently Bought Together";
  let badgeText: string = "Combo Special • Save 10%";
  let isEnabled = true;

  if (customConfig) {
    if (!customConfig.enabled) {
      return null; // Disabled by admin for this product
    }

    offerType = customConfig.discount_type;
    offerValue = customConfig.discount_value;
    title = customConfig.title || "Frequently Bought Together";
    badgeText = customConfig.badge_text || (offerType === "free_shipping" ? "Free Shipping Combo" : `Save ${offerValue}%`);

    if (customConfig.bundle_product_ids && customConfig.bundle_product_ids.length > 0) {
      const { data: customItems } = await supabase
        .from("products")
        .select("id, name, slug, regular_price, sale_price, og_image_url, brands(name)")
        .in("id", customConfig.bundle_product_ids)
        .eq("status", "active")
        .limit(3);

      bundleProducts = customItems || [];
    }
  }

  // 3. Fallback: If no custom products configured, auto-select 2 smart complementary items from the catalog
  if (bundleProducts.length === 0) {
    let query = supabase
      .from("products")
      .select("id, name, slug, regular_price, sale_price, og_image_url, brands(name)")
      .neq("id", mainProductId)
      .eq("status", "active")
      .limit(2);

    if (mainProduct.brand_id) {
      query = query.eq("brand_id", mainProduct.brand_id);
    }

    const { data: fallbackItems } = await query;

    if (!fallbackItems || fallbackItems.length === 0) {
      // General catalog fallback
      const { data: generalItems } = await supabase
        .from("products")
        .select("id, name, slug, regular_price, sale_price, og_image_url, brands(name)")
        .neq("id", mainProductId)
        .eq("status", "active")
        .limit(2);

      bundleProducts = generalItems || [];
    } else {
      bundleProducts = fallbackItems;
    }
  }

  if (bundleProducts.length === 0) {
    return null;
  }

  // Calculate pricing breakdown
  const allItems = [mainProduct, ...bundleProducts];
  const originalTotalPrice = allItems.reduce(
    (sum, p) => sum + (p.sale_price ?? p.regular_price),
    0
  );

  let discountAmount = 0;
  if (offerType === "percentage") {
    discountAmount = Math.round((originalTotalPrice * offerValue) / 100);
  } else if (offerType === "fixed") {
    discountAmount = Math.min(offerValue, originalTotalPrice - 50);
  } else if (offerType === "free_shipping") {
    discountAmount = 120; // Delivery fee waived
  }

  const comboTotalPrice = Math.max(0, originalTotalPrice - (offerType === "free_shipping" ? 0 : discountAmount));

  return {
    mainProduct,
    bundleProducts,
    config: {
      title,
      offerType,
      offerValue,
      badgeText,
      originalTotalPrice,
      comboTotalPrice,
      discountAmount,
      isFreeShipping: offerType === "free_shipping",
    },
  };
}
