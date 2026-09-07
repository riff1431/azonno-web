import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Blush & Budget | Authentic Cosmetics & Beauty Shop in Bangladesh",
    template: "%s | Blush & Budget",
  },
  description:
    "Bangladesh's trusted e-commerce destination for 100% authentic international cosmetics, Korean skincare, makeup, and hair care. Nationwide Cash on Delivery across 64 districts.",
  metadataBase: (() => {
    const url =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
    return url ? new URL(url) : undefined;
  })(),
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Blush & Budget",
    title: "Blush & Budget | Authentic Cosmetics & Beauty Shop in Bangladesh",
    description:
      "Shop 100% genuine Korean skincare, makeup, and imported beauty products in Bangladesh with nationwide Cash on Delivery and doorstep parcel inspection.",
  },
  other: {
    "og:category": "shopping.retail",
    "product:retailer_category": "Cosmetics & Beauty",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { StorefrontAnalytics } from "@/components/analytics/storefront-analytics";
import { CookieTracker } from "@/components/analytics/cookie-tracker";
import { getMarketingAnalyticsSettings } from "@/features/marketing/meta-actions";
import { getTikTokSettings } from "@/features/marketing/tiktok-actions";

const storeSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Blush & Budget",
  description:
    "Premier retail e-commerce shop for authentic cosmetics, skincare, and makeup products in Bangladesh.",
  currenciesAccepted: "BDT",
  paymentAccepted: "Cash on Delivery, bKash, Nagad, Visa, Mastercard",
  priceRange: "৳৳",
};

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

  try {
    const [metaSettings, ttSettings] = await Promise.all([
      getMarketingAnalyticsSettings().catch(() => null),
      getTikTokSettings().catch(() => null),
    ]);

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
  }

  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable} lang-bn`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
        {/* Meta Pixel Base Code in Head with Test Code Support */}
        {initialConfig.meta_pixel_id && (
          <script
            id="meta-pixel-base"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                
                // Parse URL test_event_code if present
                var urlParams = new URLSearchParams(window.location.search);
                var urlTestCode = urlParams.get('test_event_code') || urlParams.get('meta_test_event_code');
                var activeTestCode = urlTestCode || '${initialConfig.meta_test_event_code || ""}';
                
                if (activeTestCode) {
                  window.__META_TEST_CODE__ = activeTestCode;
                  try {
                    sessionStorage.setItem('meta_test_event_code', activeTestCode);
                    document.cookie = 'meta_test_event_code=' + activeTestCode + ';path=/;max-age=86400;SameSite=Lax';
                  } catch(e){}
                }
                
                fbq('init', '${initialConfig.meta_pixel_id}');
                window.__META_PIXEL_ID__ = '${initialConfig.meta_pixel_id}';
              `,
            }}
          />
        )}
        {/* TikTok Pixel Base Code in Head with Test Code Support */}
        {initialConfig.tiktok_pixel_id && (
          <script
            id="tiktok-pixel-base"
            dangerouslySetInnerHTML={{
              __html: `
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
                  
                  var urlParams = new URLSearchParams(window.location.search);
                  var urlTtTest = urlParams.get('test_event_code') || urlParams.get('tiktok_test_event_code') || urlParams.get('tt_test_code');
                  var activeTtTest = urlTtTest || '${initialConfig.tiktok_test_event_code || ""}';
                  if (activeTtTest) {
                    window.__TIKTOK_TEST_CODE__ = activeTtTest;
                    try {
                      sessionStorage.setItem('tiktok_test_event_code', activeTtTest);
                      document.cookie = 'tiktok_test_event_code=' + activeTtTest + ';path=/;max-age=86400;SameSite=Lax';
                    } catch(e){}
                  }
                  
                  ttq.load('${initialConfig.tiktok_pixel_id}');
                  window.__TIKTOK_PIXEL_ID__ = '${initialConfig.tiktok_pixel_id}';
                }(window, document, 'ttq');
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-screen bg-white antialiased">
        <CookieTracker />
        <StorefrontAnalytics initialConfig={initialConfig} />
        {children}
      </body>
    </html>
  );
}
