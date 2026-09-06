"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, Users,
  Megaphone, Truck, DollarSign, Image, FileText, Palette,
  Shield, BarChart3, Settings, ScrollText, ChevronDown,
  ChevronRight, Menu, X, Search, Bell, LogOut, User,
  CreditCard, MessageSquare, BookOpen, Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavItems } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { AdminLanguageProvider, useAdminLang } from "@/lib/admin-lang-context";
import type { TranslationKey } from "@/lib/admin-i18n";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, ShoppingBag, Package, Warehouse, Users,
  Megaphone, Truck, DollarSign, Image, FileText, Palette,
  Shield, BarChart3, Settings, ScrollText, CreditCard, MessageSquare, BookOpen,
};

// Map nav item titles to translation keys
const navTitleKeyMap: Record<string, TranslationKey> = {
  "Dashboard": "dashboard",
  "Orders": "orders",
  "All Orders": "all_orders",
  "Invoice & Thermal": "invoice_thermal",
  "Incomplete Orders": "incomplete_orders",
  "Fraud & Blocklist": "fraud_blocklist",
  "Order Tracking": "order_tracking",
  "Returns & RTO": "returns_rto",
  "Order Settings": "order_settings",
  "Products": "products",
  "All Products": "all_products",
  "Add Product": "add_product",
  "Categories": "categories",
  "Brands": "brands",
  "Attributes": "attributes",
  "Inventory": "inventory",
  "Reviews": "reviews",
  "Q&A": "qa",
  "Product Settings": "product_settings",
  "Blog & Editorial": "blog_editorial",
  "All Articles": "all_articles",
  "Write Article": "write_article",
  "Authors & Experts": "authors_experts",
  "Blog Categories": "blog_categories",
  "Customers": "customers",
  "All Customers": "all_customers",
  "Fraud Checker": "fraud_checker",
  "Customer Settings": "customer_settings",
  "Marketing": "marketing",
  "Storefront Sections": "storefront_sections",
  "Coupons": "coupons",
  "SMS Marketing": "sms_marketing",
  "Tracking": "tracking",
  "Catalog Feeds": "catalog_feeds",
  "Search Analytics": "search_analytics",
  "Marketing Settings": "marketing_settings",
  "Shipping & Courier": "shipping_courier",
  "Delivery Partners": "delivery_partners",
  "SteadFast": "steadfast",
  "Pathao": "pathao",
  "Shipping Zones": "shipping_zones",
  "Payments": "payments",
  "Payment Methods": "payment_methods",
  "Cash on Delivery": "cash_on_delivery",
  "bKash": "bkash",
  "Nagad": "nagad",
  "SSLCommerz": "sslcommerz",
  "Stripe": "stripe",
  "PayPal": "paypal",
  "Custom Payments": "custom_payments",
  "Payment Verification": "payment_verification",
  "Communication": "communication",
  "Notification Settings": "notification_settings",
  "WhatsApp Templates": "whatsapp_templates",
  "SMS Providers": "sms_providers",
  "SMS Templates": "sms_templates",
  "Email Settings": "email_settings",
  "Media": "media",
  "Media Library": "media_library",
  "Cloudinary Settings": "cloudinary_settings",
  "Media Settings": "media_settings",
  "Finance": "finance",
  "Sales Reports": "sales_reports",
  "Profit & Loss": "profit_loss",
  "Costs": "costs",
  "Accounting": "accounting",
  "Suppliers": "suppliers",
  "Due Manager": "due_manager",
  "Investors": "investors",
  "Content": "content",
  "Blog Posts": "blog_posts",
  "Blog Authors": "blog_authors",
  "Pages": "pages",
  "Theme Customizer": "theme_customizer",
  "Users & Access": "users_access",
  "Admin Users": "admin_users",
  "Activity Logs": "activity_logs",
  "System": "system",
  "Feature Modules": "feature_modules",
  "Feature Flags": "feature_flags",
  "Store Settings": "store_settings",
  "Invoice & Thermal (Settings)": "invoice_thermal",
  "Checkout Settings": "checkout_settings",
  "SEO Settings": "seo_settings",
  "System Health": "system_health",
  "Maintenance": "maintenance",
};

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  logoImageUrl?: string;
  brandName?: string;
}

function AdminSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, logoImageUrl, brandName }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t } = useAdminLang();

  // Find active parent menu based on current route and auto-expand it
  React.useEffect(() => {
    const activeParent = adminNavItems.find(
      (item) => "children" in item && item.children?.some((c) => pathname.startsWith(c.href))
    );
    if (activeParent) {
      setExpandedItems([activeParent.title]);
    }
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Accordion mode: expanding an item collapses other items so the sidebar height never explodes
  const toggleExpand = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isGroupActive = (children: readonly { href: string }[]) => {
    return children.some((child) => pathname.startsWith(child.href));
  };

  const translateNav = (title: string): string => {
    const key = navTitleKeyMap[title];
    return key ? t(key) : title;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-admin-sidebar text-admin-sidebar-text transition-all duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 shadow-xl lg:shadow-none border-r border-white/5",
          isCollapsed ? "lg:w-18" : "lg:w-64",
          isOpen ? "translate-x-0 w-72" : "-translate-x-full"
        )}
      >
        {/* Header / Logo */}
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-white/10 px-3.5">
          <Link href="/admin" className="flex items-center gap-2 min-w-0 overflow-hidden">
            {logoImageUrl ? (
              /* Website logo image — shown full width when expanded, shrunk when collapsed */
              isCollapsed && !isOpen ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 overflow-hidden">
                  <img
                    src={logoImageUrl}
                    alt={brandName || "Logo"}
                    className="h-8 w-8 object-contain"
                  />
                </div>
              ) : (
                <img
                  src={logoImageUrl}
                  alt={brandName || "Logo"}
                  className="h-9 max-h-9 w-auto max-w-38 object-contain shrink-0"
                />
              )
            ) : (
              /* Fallback: pink eX box + text */
              <>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#e91e63] to-pink-600 text-sm font-black text-white shadow-md shadow-pink-500/20">
                  eX
                </div>
                {(!isCollapsed || isOpen) && (
                  <div className="min-w-0 flex flex-col">
                    <span className="text-base font-black tracking-tight text-white leading-none">
                      {brandName || "ecomX"}
                    </span>
                    <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider mt-0.5">
                      Admin
                    </span>
                  </div>
                )}
              </>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-admin-sidebar-text hover:bg-white/10 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4 -rotate-90" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-admin-sidebar-text hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation - With Custom Smooth Scrollbar and Compact Sizing */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;

              if ("children" in item && item.children) {
                const isCurrentGroupActive = isGroupActive(item.children);
                const expanded = !isCollapsed && (expandedItems.includes(item.title) || isCurrentGroupActive);

                return (
                  <li key={item.title} className="relative group">
                    <button
                      onClick={() => {
                        if (isCollapsed) {
                          onToggleCollapse();
                          setExpandedItems([item.title]);
                        } else {
                          toggleExpand(item.title);
                        }
                      }}
                      title={isCollapsed ? translateNav(item.title) : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all",
                        isCurrentGroupActive
                          ? "bg-white/15 text-white font-black shadow-xs"
                          : "hover:bg-white/10 text-admin-sidebar-text hover:text-white",
                        isCollapsed && "justify-center px-0 py-2.5"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isCurrentGroupActive ? "text-pink-400" : "text-admin-sidebar-text")} />
                      {(!isCollapsed || isOpen) && (
                        <>
                          <span className="flex-1 text-left truncate">{translateNav(item.title)}</span>
                          <span className="shrink-0 opacity-70">
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Collapsed Mode Flyout Dropdown */}
                    {isCollapsed && !isOpen && (
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50 min-w-52 rounded-2xl bg-[#171b26] p-2.5 shadow-2xl border border-white/10">
                        <div className="px-3 py-1.5 text-xs font-black text-white border-b border-white/10 mb-1 flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-pink-400" />
                          {translateNav(item.title)}
                        </div>
                        <ul className="space-y-0.5">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={cn(
                                  "block rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                                  isActive(child.href)
                                    ? "bg-[#e91e63] text-white font-bold"
                                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {translateNav(child.title)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expanded Mode Submenu */}
                    {expanded && (!isCollapsed || isOpen) && (
                      <ul className="ml-3 mt-1 space-y-0.5 border-l-2 border-pink-500/30 pl-2.5 transition-all">
                        {item.children.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  "block rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all truncate",
                                  childActive
                                    ? "bg-[#e91e63] text-white font-bold shadow-xs"
                                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {translateNav(child.title)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const itemActive = "href" in item && isActive(item.href);

              return (
                <li key={item.title} className="relative group">
                  <Link
                    href={"href" in item ? item.href : "#"}
                    onClick={onClose}
                    title={isCollapsed ? translateNav(item.title) : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all",
                      itemActive
                        ? "bg-[#e91e63] text-white font-black shadow-md shadow-pink-600/20"
                        : "hover:bg-white/10 text-admin-sidebar-text hover:text-white",
                      isCollapsed && "justify-center px-0 py-2.5"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", itemActive ? "text-white" : "text-admin-sidebar-text")} />
                    {(!isCollapsed || isOpen) && (
                      <span className="truncate">{translateNav(item.title)}</span>
                    )}
                  </Link>

                  {/* Collapsed Mode Tooltip */}
                  {isCollapsed && !isOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block z-50 whitespace-nowrap rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl border border-white/10 pointer-events-none">
                      {translateNav(item.title)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-white/10 p-2.5">
          <button
            onClick={handleLogout}
            title={isCollapsed ? t("logout") : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-admin-sidebar-text transition-colors hover:bg-rose-500/20 hover:text-rose-400",
              isCollapsed && "justify-center px-0 py-2.5"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!isCollapsed || isOpen) && <span>{t("logout")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

import { AdminNotificationsPopover } from "@/components/admin/admin-notifications-popover";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { AdminQuickSearchDialog } from "@/components/admin/admin-quick-search-dialog";

function LangToggleButton() {
  const { lang, setLang } = useAdminLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      title={lang === "en" ? "বাংলায় দেখুন" : "Switch to English"}
      className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-border px-2 sm:px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-secondary hover:text-text transition-colors select-none"
    >
      <Languages className="h-3.5 w-3.5 shrink-0" />
      <span>{lang === "en" ? "বাংলা" : "EN"}</span>
    </button>
  );
}

function AdminTopBar({
  onMenuClick,
  onToggleCollapse,
  isCollapsed,
}: {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useAdminLang();

  // Global ⌘K / Ctrl+K shortcut listener
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-white px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-surface-secondary lg:hidden"
            aria-label={t("toggle_menu")}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center rounded-xl p-2 text-text-secondary hover:bg-surface-secondary hover:text-text transition-colors border border-border"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Desktop Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-border bg-surface-secondary px-3 py-1.5 text-sm text-text-muted hover:border-border-hover hover:text-text md:flex transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>{t("search_placeholder")}</span>
            <kbd className="ml-4 rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-text-secondary shadow-xs border border-border">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex md:hidden items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-text transition-colors"
            aria-label={t("search_placeholder")}
            title={t("search_placeholder")}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Toggle */}
          <LangToggleButton />

          {/* Functional Notifications Popover */}
          <AdminNotificationsPopover />

          {/* Functional User Menu Dropdown */}
          <AdminUserMenu />
        </div>
      </header>

      {/* Quick Search / Command Dialog */}
      <AdminQuickSearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}

export default function AdminLayoutClient({
  children,
  initialLocalizationSettings,
  logoImageUrl,
  brandName,
}: {
  children: React.ReactNode;
  initialLocalizationSettings?: {
    default_language?: "bn" | "en";
    enable_language_switcher?: boolean;
    show_homepage_language_bar?: boolean;
    admin_default_language?: "bn" | "en";
  };
  logoImageUrl?: string;
  brandName?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Only bypass admin sidebar on dedicated order printable invoice pages (e.g., /admin/orders/[id]/invoice)
  const isOrderPrintPage = pathname?.startsWith("/admin/orders/") && pathname?.endsWith("/invoice");
  if (isOrderPrintPage) {
    return <>{children}</>;
  }

  return (
    <AdminLanguageProvider initialLang={initialLocalizationSettings?.admin_default_language || "en"}>
      <div className="flex h-screen overflow-hidden bg-surface-secondary">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          logoImageUrl={logoImageUrl}
          brandName={brandName}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopBar
            onMenuClick={() => setSidebarOpen(true)}
            onToggleCollapse={toggleCollapse}
            isCollapsed={isCollapsed}
          />

          <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminLanguageProvider>
  );
}

