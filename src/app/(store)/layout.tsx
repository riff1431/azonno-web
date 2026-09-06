import { LanguageProvider } from "@/context/language-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { CartProvider } from "@/context/cart-context";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontMaintenanceScreen } from "@/components/storefront/storefront-maintenance-screen";
import { getLocalizationSettings } from "@/features/settings/actions";
import { getSettingsByGroup } from "@/lib/settings/config-service";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localizationSettings, systemSettings] = await Promise.all([
    getLocalizationSettings(),
    getSettingsByGroup("system"),
  ]);

  // Check Maintenance Mode
  if (systemSettings?.maintenance_mode) {
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";

    const bypassIps = (systemSettings.bypass_ips || "127.0.0.1, ::1")
      .split(",")
      .map((ip: string) => ip.trim())
      .filter(Boolean);

    const isIpWhitelisted = bypassIps.some(
      (ip: string) => ip === clientIp || ip === "127.0.0.1" || ip === "::1" || clientIp.includes(ip)
    );

    let isAdminUser = false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role || user.app_metadata?.role || user.user_metadata?.role;
        isAdminUser = role === "admin" || role === "moderator" || role === "staff";
      }
    } catch (e) {
      // Ignore auth check error
    }

    if (!isAdminUser && !isIpWhitelisted) {
      return (
        <StorefrontMaintenanceScreen
          message={
            systemSettings.maintenance_message ||
            "We are performing scheduled updates to improve your beauty shopping experience. We will return shortly!"
          }
        />
      );
    }
  }

  return (
    <LanguageProvider initialConfig={localizationSettings}>
      <WishlistProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-white">
            <StorefrontHeader />
            <main className="flex-1 min-h-[calc(100vh-80px)]">{children}</main>
            <StorefrontFooter />
            <MobileBottomNav />
            <CartDrawer />
          </div>
        </CartProvider>
      </WishlistProvider>
    </LanguageProvider>
  );
}

