"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  RotateCcw,
  Award,
  Ticket,
  Bell,
  User,
  Lock,
  LogOut,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { customerNavItems } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/language-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  RotateCcw,
  Award,
  Ticket,
  Bell,
  User,
  Lock,
  Truck,
};

export default function AccountLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, t } = useLanguage();

  const getTranslatedTitle = (href: string, fallback: string) => {
    switch (href) {
      case "/account":
        return t("account", "navDashboard");
      case "/account/orders":
        return t("account", "navOrders");
      case "/account/track":
        return t("account", "navTrack");
      case "/account/wishlist":
        return t("account", "navWishlist");
      case "/account/addresses":
        return t("account", "navAddresses");
      case "/account/reviews":
        return t("account", "navReviews");
      case "/account/returns":
        return t("account", "navReturns");
      case "/account/points":
        return t("account", "navPoints");
      case "/account/vouchers":
        return t("account", "navVouchers");
      case "/account/notifications":
        return t("account", "navNotifications");
      case "/account/profile":
        return language === "bn" ? "Profile Information" : "Profile";
      case "/account/security":
        return t("account", "navSecurity");
      default:
        return fallback;
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 bg-gray-50/40">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Customer Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm space-y-1">
            <div className="border-b border-gray-100 px-3 py-3">
              <h2 className="text-base font-black text-gray-900 tracking-tight">
                {t("account", "myAccount")}
              </h2>
              <p className="text-[11px] text-gray-400">
                {t("account", "portalSubtitle")}
              </p>
            </div>

            <ul className="space-y-0.5 pt-2">
              {customerNavItems.map((item) => {
                const Icon = item.href === "/account/track" ? Truck : (iconMap[item.icon] || User);
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all",
                        active
                          ? "bg-teal-50/60 text-[#1D6474] shadow-xs scale-102"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#1D6474]" : "text-gray-400")} />
                      <span>{getTranslatedTitle(item.href, item.title)}</span>
                    </Link>
                  </li>
                );
              })}

              <li className="pt-2 border-t border-gray-100">
                <button
                  id="customer-logout-btn"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-red-600" />
                  <span>{t("account", "logout")}</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
