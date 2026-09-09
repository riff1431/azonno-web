"use server";

import { getSettingsByGroup, updateGroupSettings } from "@/lib/settings/config-service";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/utils";

// Store Settings
export async function getStoreSettings() {
  return getSettingsByGroup("general");
}

export async function saveStoreSettings(settings: {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  store_url?: string;
  custom_domain?: string;
}) {
  await updateGroupSettings("general", settings);
  revalidatePath("/admin/settings/store");
  revalidatePath("/admin/settings/seo");
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { success: true };
}

// SEO & Favicon Settings
export interface SeoSettingsPayload {
  meta_title: string;
  meta_description: string;
  meta_keywords?: string;
  site_author?: string;
  favicon_url?: string;
  apple_touch_icon_url?: string;
  android_icon_url?: string;
  og_image_url?: string;
  og_type?: string;
  canonical_url?: string;
  twitter_handle?: string;
  twitter_card?: "summary_large_image" | "summary";
  facebook_app_id?: string;
  robots_index?: boolean;
  robots_follow?: boolean;
  enable_structured_data?: boolean;
  enable_breadcrumbs_schema?: boolean;
  custom_robots_txt?: string;
}

export async function getSeoSettings() {
  return getSettingsByGroup("seo");
}

export async function saveSeoSettings(settings: Partial<SeoSettingsPayload> | Record<string, any>) {
  await updateGroupSettings("seo", settings);
  revalidatePath("/admin/settings/seo");
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { success: true };
}

// Checkout & Customer Settings
export async function getCheckoutSettings() {
  return getSettingsByGroup("checkout");
}

export async function saveCheckoutSettings(settings: {
  guest_checkout_enabled?: boolean;
  allow_customer_registration?: boolean;
  cod_enabled?: boolean;
  cod_max_amount?: number;
  min_order_amount?: number;
  require_phone?: boolean;
  require_email?: boolean;
  order_notes_enabled?: boolean;
  show_location_hierarchy?: boolean;
}) {
  await updateGroupSettings("checkout", settings);
  revalidatePath("/admin/settings/checkout");
  revalidatePath("/checkout");
  revalidatePath("/login");
  revalidatePath("/register");
  return { success: true };
}

// Invoice & Thermal Printing Customization Settings
export interface InvoiceSettings {
  invoice_logo_url?: string;
  invoice_brand_name?: string;
  invoice_tagline?: string;
  invoice_address?: string;
  invoice_phone?: string;
  invoice_email?: string;
  invoice_website?: string;
  invoice_tax_id_or_bin?: string;

  invoice_title?: string;
  invoice_accent_color?: string;
  invoice_footer_notes?: string;
  invoice_authorized_signatory_text?: string;
  invoice_signature_image_url?: string;
  invoice_show_qr_code?: boolean;
  invoice_show_barcode?: boolean;
  invoice_show_paid_stamp?: boolean;

  thermal_logo_url?: string;
  thermal_header_title?: string;
  thermal_return_address?: string;
  thermal_sender_phone?: string;
  thermal_show_item_breakdown?: boolean;
  thermal_show_item_prices?: boolean;
  thermal_instructions?: string;
  thermal_footer_tagline?: string;

  default_print_mode?: "invoice" | "thermal";
  default_language?: "en" | "bn";
}

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  const settings = await getSettingsByGroup("invoice");
  return {
    invoice_logo_url: settings.invoice_logo_url || "",
    invoice_brand_name: settings.invoice_brand_name || "BLUSH & BUDGET",
    invoice_tagline: settings.invoice_tagline || "AUTHENTIC BEAUTY & SKINCARE ESSENTIALS",
    invoice_address: settings.invoice_address || "House 42, Road 11, Banani, Dhaka-1213, Bangladesh",
    invoice_phone: settings.invoice_phone || "+880 1700-000000",
    invoice_email: settings.invoice_email || "",
    invoice_website: settings.invoice_website || getBaseUrl() || "",
    invoice_tax_id_or_bin: settings.invoice_tax_id_or_bin || "BIN: 002349182-0101",

    invoice_title: settings.invoice_title || "TAX INVOICE",
    invoice_accent_color: settings.invoice_accent_color || "#e91e63",
    invoice_footer_notes:
      settings.invoice_footer_notes ||
      "Thank you for choosing us! All products are 100% genuine and imported directly from verified authorized distributors. For any warranty claims or return assistance, please keep this invoice handy.",
    invoice_authorized_signatory_text: settings.invoice_authorized_signatory_text || "Authorized Signature",
    invoice_signature_image_url: settings.invoice_signature_image_url || "",
    invoice_show_qr_code: settings.invoice_show_qr_code !== false,
    invoice_show_barcode: settings.invoice_show_barcode !== false,
    invoice_show_paid_stamp: settings.invoice_show_paid_stamp !== false,

    thermal_logo_url: settings.thermal_logo_url || "",
    thermal_header_title: settings.thermal_header_title || "BLUSH & BUDGET • DISPATCH",
    thermal_return_address: settings.thermal_return_address || "House 42, Road 11, Banani, Dhaka",
    thermal_sender_phone: settings.thermal_sender_phone || "+880 1700-000000",
    thermal_show_item_breakdown: settings.thermal_show_item_breakdown !== false,
    thermal_show_item_prices: settings.thermal_show_item_prices !== false,
    thermal_instructions:
      settings.thermal_instructions ||
      "FRAGILE / HANDLE WITH CARE • Please inspect the parcel package before accepting handover.",
    thermal_footer_tagline: settings.thermal_footer_tagline || "100% Genuine Guaranteed Imports",

    default_print_mode: (settings.default_print_mode as any) || "invoice",
    default_language: (settings.default_language as any) || "en",
  };
}

export async function saveInvoiceSettings(settings: Partial<InvoiceSettings>) {
  await updateGroupSettings("invoice", settings);
  revalidatePath("/admin/settings/invoice");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  return { success: true };
}

// Storefront Localization & Language Settings
export interface LocalizationSettings {
  default_language: "bn" | "en";
  enable_language_switcher: boolean;
  show_homepage_language_bar: boolean;
  admin_default_language?: "bn" | "en";
}

const DEFAULT_LOCALIZATION_SETTINGS: LocalizationSettings = {
  default_language: "bn",
  enable_language_switcher: true,
  show_homepage_language_bar: true,
  admin_default_language: "en",
};

export async function getLocalizationSettings(): Promise<LocalizationSettings> {
  try {
    const settings = await getSettingsByGroup("localization");
    return {
      default_language: settings.default_language === "en" ? "en" : "bn",
      enable_language_switcher: settings.enable_language_switcher !== false,
      show_homepage_language_bar: settings.show_homepage_language_bar !== false,
      admin_default_language: settings.admin_default_language === "bn" ? "bn" : "en",
    };
  } catch {
    return DEFAULT_LOCALIZATION_SETTINGS;
  }
}

export async function saveLocalizationSettings(settings: Partial<LocalizationSettings>) {
  await updateGroupSettings("localization", settings);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/store");
  return { success: true };
}

// Storefront Theme & Branding Settings
export interface ThemeSettings {
  themeColor: string;
  announcement: string;
  announcementEnabled?: boolean;
  announcementLink?: string;
  announcementBg?: string;
  supportPhone: string;
  supportEmail?: string;
  insideDhakaFree: number;
  outsideDhakaFree: number;
  insideDhakaDeliveryFee?: number;
  outsideDhakaDeliveryFee?: number;
  showFreeDeliveryBar?: boolean;
  productCardStyle?: "rounded" | "pill" | "square";
  showAuthenticBadge?: boolean;
  showDiscountBadge?: boolean;
  showStockBadge?: boolean;
  footerTagline?: string;
  copyrightText?: string;
}

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  themeColor: "rose",
  announcement: "100% Authentic Korean & UK Skincare | Free Delivery over ৳2,500!",
  announcementEnabled: true,
  announcementLink: "/shop",
  announcementBg: "theme",
  supportPhone: "+880 1753-804797",
  supportEmail: "support@blushandbudget.com",
  insideDhakaFree: 2500,
  outsideDhakaFree: 3500,
  insideDhakaDeliveryFee: 70,
  outsideDhakaDeliveryFee: 130,
  showFreeDeliveryBar: true,
  productCardStyle: "rounded",
  showAuthenticBadge: true,
  showDiscountBadge: true,
  showStockBadge: true,
  footerTagline: "Authentic Korean & UK Skincare & Cosmetics in Bangladesh",
  copyrightText: `© ${new Date().getFullYear()} Blush & Budget. Authentic Skincare & Cosmetics Bangladesh.`,
};

export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const settings = await getSettingsByGroup("theme");
    return {
      themeColor: settings.themeColor || DEFAULT_THEME_SETTINGS.themeColor,
      announcement: settings.announcement || DEFAULT_THEME_SETTINGS.announcement,
      announcementEnabled: settings.announcementEnabled !== false,
      announcementLink: settings.announcementLink || DEFAULT_THEME_SETTINGS.announcementLink,
      announcementBg: settings.announcementBg || DEFAULT_THEME_SETTINGS.announcementBg,
      supportPhone: settings.supportPhone || DEFAULT_THEME_SETTINGS.supportPhone,
      supportEmail: settings.supportEmail || DEFAULT_THEME_SETTINGS.supportEmail,
      insideDhakaFree: Number(settings.insideDhakaFree || DEFAULT_THEME_SETTINGS.insideDhakaFree),
      outsideDhakaFree: Number(settings.outsideDhakaFree || DEFAULT_THEME_SETTINGS.outsideDhakaFree),
      insideDhakaDeliveryFee: Number(settings.insideDhakaDeliveryFee || DEFAULT_THEME_SETTINGS.insideDhakaDeliveryFee),
      outsideDhakaDeliveryFee: Number(settings.outsideDhakaDeliveryFee || DEFAULT_THEME_SETTINGS.outsideDhakaDeliveryFee),
      showFreeDeliveryBar: settings.showFreeDeliveryBar !== false,
      productCardStyle: (settings.productCardStyle as any) || DEFAULT_THEME_SETTINGS.productCardStyle,
      showAuthenticBadge: settings.showAuthenticBadge !== false,
      showDiscountBadge: settings.showDiscountBadge !== false,
      showStockBadge: settings.showStockBadge !== false,
      footerTagline: settings.footerTagline || DEFAULT_THEME_SETTINGS.footerTagline,
      copyrightText: settings.copyrightText || DEFAULT_THEME_SETTINGS.copyrightText,
    };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export async function saveThemeSettings(settings: Partial<ThemeSettings>) {
  await updateGroupSettings("theme", settings);

  if (settings.insideDhakaFree) {
    try {
      await updateGroupSettings("checkout_fraud", {
        free_shipping_threshold: Number(settings.insideDhakaFree),
      });
    } catch {}
  }

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/admin/settings/theme");
  revalidatePath("/admin/settings/checkout");
  return { success: true };
}

// Maintenance Mode Settings
export interface MaintenanceSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  bypass_ips: string;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  const settings = await getSettingsByGroup("system");
  return {
    maintenance_mode: Boolean(settings.maintenance_mode),
    maintenance_message:
      settings.maintenance_message ||
      "We are performing scheduled updates to improve your beauty shopping experience. We will return shortly!",
    bypass_ips: settings.bypass_ips || "",
  };
}

export async function saveMaintenanceSettings(settings: Partial<MaintenanceSettings>) {
  await updateGroupSettings("system", {
    maintenance_mode: Boolean(settings.maintenance_mode),
    maintenance_message: String(settings.maintenance_message || ""),
    bypass_ips: String(settings.bypass_ips || ""),
  });
  revalidatePath("/admin/settings/maintenance");
  revalidatePath("/(store)", "layout");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/shop");
  return { success: true };
}

