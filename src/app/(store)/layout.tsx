import { LanguageProvider } from "@/context/language-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { CartProvider } from "@/context/cart-context";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontMaintenanceScreen } from "@/components/storefront/storefront-maintenance-screen";
import { getLocalizationSettings, getThemeSettings } from "@/features/settings/actions";
import { getSettingsByGroup } from "@/lib/settings/config-service";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localizationSettings, systemSettings, themeSettings] = await Promise.all([
    getLocalizationSettings(),
    getSettingsByGroup("system"),
    getThemeSettings(),
  ]);

  let isAdminUser = false;
  let showAdminMaintenanceBanner = false;

  // Check Maintenance Mode
  if (systemSettings?.maintenance_mode) {
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "";

    const bypassIps = (systemSettings.bypass_ips || "")
      .split(",")
      .map((ip: string) => ip.trim())
      .filter(Boolean);

    const isIpWhitelisted =
      bypassIps.length > 0 &&
      bypassIps.some((ip: string) => ip === clientIp || (clientIp && clientIp.startsWith(ip)));

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

    if (isAdminUser) {
      showAdminMaintenanceBanner = true;
    }
  }

  return (
    <LanguageProvider initialConfig={localizationSettings}>
      <WishlistProvider>
        <CartProvider>
          <div
            data-theme={themeSettings.themeColor || "rose"}
            className="flex min-h-screen flex-col bg-white"
          >
            {showAdminMaintenanceBanner && (
              <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold shadow-md z-50 sticky top-0">
                <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    <span>
                      ⚠️ <strong>Maintenance Mode is Active:</strong> Public visitors are currently shown the maintenance screen. You are viewing as Admin.
                    </span>
                  </div>
                  <a
                    href="/admin/settings/maintenance"
                    className="underline font-bold text-slate-900 hover:text-black ml-auto"
                  >
                    Manage Settings →
                  </a>
                </div>
              </div>
            )}
            <StorefrontHeader initialThemeSettings={themeSettings} />
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

