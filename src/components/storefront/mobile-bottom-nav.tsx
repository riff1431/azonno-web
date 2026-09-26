"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Tag,
  LayoutGrid,
  ShoppingBag,
  Heart,
  User,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number | string;
  action?: () => void;
  external?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { language, t, toBn } = useLanguage();

  // Don't show in admin dashboard or checkout
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  const navItems: NavItem[] = [
    {
      label: t("mobileNav", "home"),
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Shop",
      href: "/shop",
      icon: LayoutGrid,
      isActive: pathname === "/shop" || pathname.startsWith("/category") || pathname.startsWith("/product/"),
    },
    {
      label: "Wishlist",
      href: "/account/wishlist",
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : undefined,
      isActive: pathname === "/account/wishlist",
    },
    {
      label: "Bag",
      action: openCart,
      icon: ShoppingBag,
      badge: itemCount > 0 ? itemCount : undefined,
      isActive: false,
    },
    {
      label: "Account",
      href: "/account",
      icon: User,
      isActive: pathname.startsWith("/account") && pathname !== "/account/wishlist",
    },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-1 py-1.5 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe"
    >
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;

          const buttonContent = (
            <div className="flex flex-col items-center justify-center py-1 text-center group">
              <div className="relative inline-flex items-center justify-center">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-150 group-active:scale-90",
                    item.isActive ? "text-[#1D6474] stroke-[2.4]" : "text-slate-600 stroke-[1.8]"
                  )}
                />
                {item.badge !== undefined && item.badge !== "" && item.badge !== 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1D6474] px-1 text-[10px] font-black text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-xs font-black transition-colors leading-tight",
                  item.isActive ? "text-[#1D6474]" : "text-slate-700"
                )}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.action) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full focus:outline-none"
                aria-label={`Open ${item.label}`}
              >
                {buttonContent}
              </button>
            );
          }

          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full focus:outline-none"
                aria-label={item.label}
              >
                {buttonContent}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className="w-full focus:outline-none"
              aria-label={item.label}
            >
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
