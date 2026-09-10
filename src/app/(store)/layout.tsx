import { LanguageProvider } from "@/context/language-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { CartProvider } from "@/context/cart-context";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontMaintenanceScreen } from "@/components/storefront/storefront-maintenance-screen";
import { getLocalizationSettings, getStoreSettings, getThemeSettings } from "@/features/settings/actions";
import { getSettingsByGroup } from "@/lib/settings/config-service";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [localizationSettings, systemSettings, themeSettings, storeSettings] = await Promise.all([
    getLocalizationSettings(),
    getSettingsByGroup("system"),
    getThemeSettings(),
    getStoreSettings(),
  ]);

  let isAdminUser = false;
  let showAdminMaintenanceBanner = false;

  // Check Maintenance Mode
  if (systemSettings?.maintenance_mode) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "";

    // Allow essential auth routes so admins and staff can sign in dynamically
    const isAuthRoute =
      pathname === "/login" ||
      pathname.startsWith("/login") ||
      pathname === "/forgot-password" ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/auth");

    // Dynamically parse whitelisted bypass IPs from database settings
    const bypassIps = (systemSettings.bypass_ips || "")
      .split(",")
      .map((ip: string) => ip.trim())
      .filter(Boolean);

    const isIpWhitelisted =
      bypassIps.length > 0 &&
      Boolean(clientIp) &&
      bypassIps.some((ip: string) => ip === clientIp || clientIp.startsWith(ip));

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

    // Check if admin has explicitly requested live storefront preview mode
    const referer = headerList.get("referer") || "";
    const xUrl = headerList.get("x-url") || "";
    const isExplicitAdminPreview =
      isAdminUser && (referer.includes("admin_preview=1") || xUrl.includes("admin_preview=1"));

    // If not admin, not whitelisted IP, and not an auth route (e.g. login), render the maintenance screen!
    if (!isAdminUser && !isIpWhitelisted && !isExplicitAdminPreview && !isAuthRoute) {
      return (
        <StorefrontMaintenanceScreen
          message={systemSettings.maintenance_message}
          isAdminUser={isAdminUser}
          supportPhone={storeSettings?.store_phone || themeSettings?.supportPhone}
          storeName={storeSettings?.store_name || themeSettings?.footerTagline}
          copyrightText={themeSettings?.copyrightText}
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

