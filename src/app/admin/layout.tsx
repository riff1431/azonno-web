import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/admin-layout-client";
import { getLocalizationSettings } from "@/features/settings/actions";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin — ecomXbangladesh",
  },
  robots: { index: false, follow: false },
};

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
    "/images/blush-logo.png";
  const brandName = homepageConfig?.headerConfig?.logoText || "Blush & Budget";

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
