"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function GoogleTagManager({
  gtmId: propGtmId,
  ga4Id: propGa4Id,
}: {
  gtmId?: string;
  ga4Id?: string;
} = {}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const gtmId = propGtmId || process.env.NEXT_PUBLIC_GTM_ID || "";
  const ga4Id = propGa4Id || process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";

  return (
    <>
      {/* 1. Global DataLayer Initialization Script */}
      <Script
        id="datalayer-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
          `,
        }}
      />

      {/* 2. Google Tag Manager (GTM) Container Script */}
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* 3. Direct Google Analytics 4 (gtag.js) if GA4 ID is configured directly */}
      {ga4Id && !gtmId && (
        <>
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}', {
                  send_page_view: false // Managed dynamically via NavigationEvents
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
