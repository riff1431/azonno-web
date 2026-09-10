import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { StorefrontAnalytics } from "@/components/analytics/storefront-analytics";
import { CookieTracker } from "@/components/analytics/cookie-tracker";
import { getMarketingAnalyticsSettings } from "@/features/marketing/meta-actions";
import { getTikTokSettings } from "@/features/marketing/tiktok-actions";
import { getStoreSettings, getSeoSettings } from "@/features/settings/actions";
import { getCustomScriptsSettings, type CustomScriptsSettings } from "@/features/settings/custom-scripts-actions";
import { getBaseUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bengali",
});

export async function generateMetadata(): Promise<Metadata> {
  const [seo, store, customScripts, headerList] = await Promise.all([
    getSeoSettings().catch(() => ({} as Record<string, any>)),
    getStoreSettings().catch(() => ({} as Record<string, any>)),
    getCustomScriptsSettings().catch(() => ({} as CustomScriptsSettings)),
    headers().catch(() => null),
  ]);

  const host = headerList?.get("x-forwarded-host") || headerList?.get("host") || "";
  const proto = headerList?.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const requestUrl = host ? `${proto}://${host}` : undefined;
  const siteUrl = seo?.canonical_url || store?.store_url || requestUrl || getBaseUrl();
  const storeName = store?.store_name || "Blush & Budget";
  const title = seo?.meta_title || `${storeName} | 100% Authentic Cosmetics & Skincare in Bangladesh`;
  const description =
    seo?.meta_description ||
    "Shop 100% authentic Korean skincare, makeup, and beauty products from trusted global brands in Bangladesh. Best prices, fast nationwide doorstep delivery & Cash on Delivery.";
  const ogImage = seo?.og_image_url || undefined;

  const otherMeta: Record<string, string> = {
    "og:category": "shopping.retail",
    "product:retailer_category": "Cosmetics & Beauty",
  };

  if (customScripts.is_enabled) {
    if (customScripts.facebook_domain_verification) {
      otherMeta["facebook-domain-verification"] = customScripts.facebook_domain_verification;
    }
    if (customScripts.pinterest_verification) {
      otherMeta["p:domain_verify"] = customScripts.pinterest_verification;
    }
    if (customScripts.bing_site_verification) {
      otherMeta["msvalidate.01"] = customScripts.bing_site_verification;
    }
  }

  return {
    title: {
      default: title,
      template: `%s | ${storeName}`,
    },
    description,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    verification: customScripts.is_enabled && customScripts.google_site_verification
      ? { google: customScripts.google_site_verification }
      : undefined,
    icons: {
      icon: [
        { url: seo?.favicon_url || "/favicon.ico", sizes: "any" },
        ...(seo?.android_icon_url ? [{ url: seo.android_icon_url, sizes: "192x192", type: "image/png" }] : []),
      ],
      apple: seo?.apple_touch_icon_url ? [{ url: seo.apple_touch_icon_url, sizes: "180x180" }] : undefined,
      shortcut: [seo?.favicon_url || "/favicon.ico"],
    },
    keywords: seo?.meta_keywords
      ? seo.meta_keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : undefined,
    authors: seo?.site_author ? [{ name: seo.site_author }] : undefined,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: (seo?.og_type as any) || "website",
      locale: "en_BD",
      siteName: storeName,
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: (seo?.twitter_card as any) || "summary_large_image",
      site: seo?.twitter_handle || undefined,
      creator: seo?.twitter_handle || undefined,
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    other: otherMeta,
    robots: {
      index: seo?.robots_index !== false,
      follow: seo?.robots_follow !== false,
      googleBot: {
        index: seo?.robots_index !== false,
        follow: seo?.robots_follow !== false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialConfig = {
    meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
    meta_capi_enabled: true,
    meta_advanced_matching_enabled: true,
    meta_test_event_code: process.env.META_CAPI_TEST_EVENT_CODE || "",
    tiktok_pixel_id: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "",
    tiktok_capi_enabled: true,
    tiktok_advanced_matching_enabled: true,
    tiktok_test_event_code: process.env.TIKTOK_TEST_EVENT_CODE || "",
    gtm_container_id: process.env.NEXT_PUBLIC_GTM_ID || "",
    ga4_measurement_id: process.env.NEXT_PUBLIC_GA4_ID || "",
  };

  let storeName = "Blush & Budget";
  let storeDesc = "Premier retail e-commerce shop for 100% authentic cosmetics, skincare, and makeup products in Bangladesh.";
  let storeCurrency = "BDT";
  let dynamicSiteUrl = getBaseUrl();
  let storeEmail = "support@blushbudget.com";
  let storePhone = "+880 1700-000000";

  let customScripts: CustomScriptsSettings = {
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

  let seoSettings: any = null;

  try {
    const [fetchedSeo, metaSettings, ttSettings, storeSettings, fetchedCustomScripts, headerList] = await Promise.all([
      getSeoSettings().catch(() => null),
      getMarketingAnalyticsSettings().catch(() => null),
      getTikTokSettings().catch(() => null),
      getStoreSettings().catch(() => null),
      getCustomScriptsSettings().catch(() => null),
      headers().catch(() => null),
    ]);

    if (fetchedSeo) seoSettings = fetchedSeo;
    if (fetchedCustomScripts) customScripts = fetchedCustomScripts;

    const host = headerList?.get("x-forwarded-host") || headerList?.get("host") || "";
    const proto = headerList?.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    const reqUrl = host ? `${proto}://${host}` : "";

    if (storeSettings?.store_name) storeName = storeSettings.store_name;
    if (storeSettings?.currency) storeCurrency = storeSettings.currency;
    if (storeSettings?.store_email) storeEmail = storeSettings.store_email;
    if (storeSettings?.store_phone) storePhone = storeSettings.store_phone;
    if (storeSettings?.description) storeDesc = storeSettings.description;

    dynamicSiteUrl = storeSettings?.store_url || reqUrl || getBaseUrl();

    initialConfig = {
      meta_pixel_id: metaSettings?.meta_pixel_id || initialConfig.meta_pixel_id,
      meta_capi_enabled: metaSettings?.meta_capi_enabled ?? true,
      meta_advanced_matching_enabled: metaSettings?.meta_advanced_matching_enabled ?? true,
      meta_test_event_code: metaSettings?.meta_test_event_code || initialConfig.meta_test_event_code,
      tiktok_pixel_id: ttSettings?.tiktok_pixel_id || initialConfig.tiktok_pixel_id,
      tiktok_capi_enabled: ttSettings?.tiktok_capi_enabled ?? true,
      tiktok_advanced_matching_enabled: ttSettings?.tiktok_advanced_matching_enabled ?? true,
      tiktok_test_event_code: ttSettings?.tiktok_test_event_code || initialConfig.tiktok_test_event_code,
      gtm_container_id: metaSettings?.gtm_container_id || initialConfig.gtm_container_id,
      ga4_measurement_id: metaSettings?.ga4_measurement_id || initialConfig.ga4_measurement_id,
    };
  } catch {
    // Non-blocking fallback to defaults
    dynamicSiteUrl = getBaseUrl();
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: dynamicSiteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${dynamicSiteUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: storeName,
    description: storeDesc,
    url: dynamicSiteUrl,
    currenciesAccepted: storeCurrency,
    paymentAccepted: "Cash on Delivery, bKash, Nagad, Visa, Mastercard",
    priceRange: "৳৳",
    areaServed: "BD",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: storePhone,
      email: storeEmail,
      contactType: "customer service",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"],
    },
  };

  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable} lang-bn`} suppressHydrationWarning>
      <head>
        {/* Dynamic Favicon & Mobile App Icons */}
        {seoSettings?.favicon_url ? (
          <>
            <link rel="icon" href={seoSettings.favicon_url} sizes="any" />
            <link rel="shortcut icon" href={seoSettings.favicon_url} />
          </>
        ) : (
          <link rel="icon" href="/favicon.ico" sizes="any" />
        )}
        {seoSettings?.apple_touch_icon_url && (
          <link rel="apple-touch-icon" sizes="180x180" href={seoSettings.apple_touch_icon_url} />
        )}
        {seoSettings?.android_icon_url && (
          <link rel="icon" type="image/png" sizes="192x192" href={seoSettings.android_icon_url} />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />

        {/* 100% Reliable HTML Domain Verification Meta Tags */}
        {customScripts.is_enabled && customScripts.google_site_verification && (
          <meta name="google-site-verification" content={customScripts.google_site_verification} />
        )}
        {customScripts.is_enabled && customScripts.facebook_domain_verification && (
          <meta name="facebook-domain-verification" content={customScripts.facebook_domain_verification} />
        )}
        {customScripts.is_enabled && customScripts.pinterest_verification && (
          <meta name="p:domain_verify" content={customScripts.pinterest_verification} />
        )}
        {customScripts.is_enabled && customScripts.bing_site_verification && (
          <meta name="msvalidate.01" content={customScripts.bing_site_verification} />
        )}

        {/* Custom Header Scripts (Injected safely) */}
        {customScripts.is_enabled && customScripts.header_scripts && (
          <script
            id="custom-header-scripts"
            type="text/javascript"
            dangerouslySetInnerHTML={{ __html: customScripts.header_scripts.replace(/<\/?script[^>]*>/gi, '') }}
          />
        )}
      </head>
      <body className="min-h-screen bg-white antialiased" suppressHydrationWarning>
        {/* Custom Body Top Scripts (Immediately after <body>) */}
        {customScripts.is_enabled && customScripts.body_top_scripts && (
          <div
            id="custom-body-top-scripts"
            style={{ display: "contents" }}
            dangerouslySetInnerHTML={{ __html: customScripts.body_top_scripts }}
          />
        )}
        <CookieTracker />
        <StorefrontAnalytics initialConfig={initialConfig} />
        {children}

        {/* Custom Footer Scripts (Before </body>) */}
        {customScripts.is_enabled && customScripts.footer_scripts && (
          <div
            id="custom-footer-scripts"
            style={{ display: "contents" }}
            dangerouslySetInnerHTML={{ __html: customScripts.footer_scripts }}
          />
        )}
      </body>
    </html>
  );
}
