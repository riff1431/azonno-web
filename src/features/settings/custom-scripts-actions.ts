"use server";

import { getSettingsByGroup, updateGroupSettings, invalidateSettingsCache } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";

export interface CustomScriptsSettings {
  is_enabled: boolean;
  header_scripts: string;
  body_top_scripts: string;
  footer_scripts: string;
  google_site_verification: string;
  facebook_domain_verification: string;
  bing_site_verification: string;
  pinterest_verification: string;
  custom_head_tags: string;
}

const DEFAULT_CUSTOM_SCRIPTS_SETTINGS: CustomScriptsSettings = {
  is_enabled: true,
  header_scripts: "",
  body_top_scripts: "",
  footer_scripts: "",
  google_site_verification: "",
  facebook_domain_verification: "",
  bing_site_verification: "",
  pinterest_verification: "",
  custom_head_tags: "",
};

/**
 * Fetch Custom Scripts & Verification Settings
 */
export async function getCustomScriptsSettings(): Promise<CustomScriptsSettings> {
  try {
    const raw = await getSettingsByGroup("custom_scripts");
    return {
      is_enabled: raw.is_enabled !== false,
      header_scripts: raw.header_scripts || "",
      body_top_scripts: raw.body_top_scripts || "",
      footer_scripts: raw.footer_scripts || "",
      google_site_verification: raw.google_site_verification || "",
      facebook_domain_verification: raw.facebook_domain_verification || "",
      bing_site_verification: raw.bing_site_verification || "",
      pinterest_verification: raw.pinterest_verification || "",
      custom_head_tags: raw.custom_head_tags || "",
    };
  } catch (err) {
    console.error("[getCustomScriptsSettings] Error:", err);
    return DEFAULT_CUSTOM_SCRIPTS_SETTINGS;
  }
}

/**
 * Save Custom Scripts & Verification Settings
 */
export async function saveCustomScriptsSettings(
  settings: Partial<CustomScriptsSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getCustomScriptsSettings();
    const updated = {
      ...current,
      ...settings,
    };

    await updateGroupSettings("custom_scripts", updated);
    invalidateSettingsCache("group:custom_scripts");

    // Revalidate storefront layout and admin pages
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings/custom-scripts");
    revalidatePath("/admin/settings/seo");

    return { success: true };
  } catch (err: any) {
    console.error("[saveCustomScriptsSettings] Error:", err);
    return { success: false, error: err.message || "Failed to save custom scripts settings" };
  }
}
