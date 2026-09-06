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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${inter.variable} ${hindSiliguri.variable} lang-bn`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <CookieTracker />
        <StorefrontAnalytics />
        {children}
      </body>
    </html>
  );
}
