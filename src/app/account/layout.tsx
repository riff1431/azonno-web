import type { Metadata } from "next";
import AccountLayoutClient from "@/components/account/account-layout-client";
import { LanguageProvider } from "@/context/language-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { CartProvider } from "@/context/cart-context";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { getLocalizationSettings } from "@/features/settings/actions";

export const metadata: Metadata = {
  title: {
    default: "My Account",
    template: "%s | My Account — Azonno",
  },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localizationSettings = await getLocalizationSettings();

  return (
    <LanguageProvider initialConfig={localizationSettings}>
      <WishlistProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-white">
            <StorefrontHeader />
            <main className="flex-1 pb-16 lg:pb-0">
              <AccountLayoutClient>{children}</AccountLayoutClient>
            </main>
            <StorefrontFooter />
            <MobileBottomNav />
            <CartDrawer />
          </div>
        </CartProvider>
      </WishlistProvider>
    </LanguageProvider>
  );
}
