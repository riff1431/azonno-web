"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSetting, invalidateSettingsCache } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";
import {
  type HomepageFullConfig,
  DEFAULT_HOMEPAGE_CONFIG,
} from "./homepage-types";

/**
 * Fetch the homepage configuration from database or return default
 */
export async function getHomepageConfig(): Promise<HomepageFullConfig> {
  try {
    const configStr = await getSetting<string>("marketing", "homepage_layout_config");
    if (configStr) {
      const parsed = typeof configStr === "string" ? JSON.parse(configStr) : configStr;
      return {
        ...DEFAULT_HOMEPAGE_CONFIG,
        ...parsed,
        heroSlides: parsed.heroSlides?.length > 0 ? parsed.heroSlides : DEFAULT_HOMEPAGE_CONFIG.heroSlides,
        dealsYouCannotMiss: parsed.dealsYouCannotMiss?.length > 0 ? parsed.dealsYouCannotMiss : DEFAULT_HOMEPAGE_CONFIG.dealsYouCannotMiss,
        topBrandsAndOffers: parsed.topBrandsAndOffers?.length > 0 ? parsed.topBrandsAndOffers : DEFAULT_HOMEPAGE_CONFIG.topBrandsAndOffers,
        limitedTimeOffers: parsed.limitedTimeOffers?.length > 0 ? parsed.limitedTimeOffers : DEFAULT_HOMEPAGE_CONFIG.limitedTimeOffers,
        shopByCategories: parsed.shopByCategories?.length > 0 ? parsed.shopByCategories : DEFAULT_HOMEPAGE_CONFIG.shopByCategories,
        campaignPills: parsed.campaignPills?.length > 0 ? parsed.campaignPills : DEFAULT_HOMEPAGE_CONFIG.campaignPills,
        trustPillars: parsed.trustPillars?.length > 0 ? parsed.trustPillars : DEFAULT_HOMEPAGE_CONFIG.trustPillars,
        faqSection: {
          ...DEFAULT_HOMEPAGE_CONFIG.faqSection,
          ...(parsed.faqSection || {}),
          faqs: parsed.faqSection?.faqs?.length > 0 ? parsed.faqSection.faqs : DEFAULT_HOMEPAGE_CONFIG.faqSection?.faqs,
        },
        footerConfig: {
          ...DEFAULT_HOMEPAGE_CONFIG.footerConfig,
          ...(parsed.footerConfig || {}),
          categoryLinks:
            parsed.footerConfig?.categoryLinks?.length > 0
              ? parsed.footerConfig.categoryLinks
              : DEFAULT_HOMEPAGE_CONFIG.footerConfig?.categoryLinks,
          customerCareLinks: (() => {
            const raw =
              parsed.footerConfig?.customerCareLinks?.length > 0
                ? parsed.footerConfig.customerCareLinks
                : DEFAULT_HOMEPAGE_CONFIG.footerConfig?.customerCareLinks || [];
            const exists = raw.some((l: any) => l.href === "/quiz" || l.href?.includes("quiz"));
            if (exists) return raw;
            return [
              ...raw.slice(0, 2),
              {
                label: "Routine Finder (Quiz)",
                labelBn: "items  ()",
                href: "/quiz",
                isHighlight: true,
              },
              ...raw.slice(2),
            ];
          })(),
        },
      };
    }
  } catch {
    // Return default on error
  }
  return DEFAULT_HOMEPAGE_CONFIG;
}

/**
 * Save updated homepage configuration from Admin Dashboard
 */
export async function saveHomepageConfig(
  config: Partial<HomepageFullConfig>
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();
    const current = await getHomepageConfig();
    const updated = { ...current, ...config };

    const { error } = await supabase.from("settings").upsert(
      {
        group: "marketing",
        key: "homepage_layout_config",
        value: JSON.stringify(updated),
        type: "json",
      },
      { onConflict: "group,key" }
    );

    if (error) {
      console.error("Failed to save homepage config:", error);
      return { success: false, message: error.message };
    }

    invalidateSettingsCache("setting:marketing");
    revalidatePath("/", "layout");

    return { success: true, message: "Homepage sections updated and published live!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to save configuration." };
  }
}
