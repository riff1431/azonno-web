import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/admin-layout-client";
import { getLocalizationSettings, getSeoSettings } from "@/features/settings/actions";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings().catch(() => null);
  const faviconUrl = seo?.favicon_url || "/favicon.ico";
  const appleIconUrl = seo?.apple_touch_icon_url || undefined;
  const androidIconUrl = seo?.android_icon_url || undefined;

  return {
    title: {
      default: "Admin",
      template: "%s | Admin — Azonno",
    },
    robots: { index: false, follow: false },
    icons: {
      icon: [
        { url: faviconUrl, sizes: "any" },
        ...(androidIconUrl ? [{ url: androidIconUrl, sizes: "192x192", type: "image/png" }] : []),
      ],
      apple: appleIconUrl ? [{ url: appleIconUrl, sizes: "180x180" }] : undefined,
      shortcut: [faviconUrl],
    },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localizationSettings, homepageConfig] = await Promise.all([
    getLocalizationSettings(),
    getHomepageConfig().catch(() => null),
  ]);

  const logoImageUrl =
    homepageConfig?.headerConfig?.adminLogoImageUrl ||
    homepageConfig?.headerConfig?.logoImageUrl ||
    "/images/azonno-logo-dark.png";
  const brandName = homepageConfig?.headerConfig?.logoText || "Azonno";

  return (
    <AdminLayoutClient
      initialLocalizationSettings={localizationSettings}
      logoImageUrl={logoImageUrl}
      brandName={brandName}
    >
      {children}
    </AdminLayoutClient>
  );
}
