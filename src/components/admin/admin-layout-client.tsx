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
  "Shipping Zones": "shipping_zones",
  "Payments": "payments",
  "Payment Methods": "payment_methods",
  "Cash on Delivery": "cash_on_delivery",
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
}

function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t } = useAdminLang();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-admin-sidebar text-admin-sidebar-text transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              eX
            </div>
            <span className="text-lg font-bold text-white">ecomX</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-admin-sidebar-text hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;

              if ("children" in item && item.children) {
                const expanded = expandedItems.includes(item.title) || isGroupActive(item.children);
                return (
                  <li key={item.title}>
                    <button
                      onClick={() => toggleExpand(item.title)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-admin-sidebar-hover",
                        isGroupActive(item.children) && "bg-admin-sidebar-hover text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{translateNav(item.title)}</span>
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                    {expanded && (
                      <ul className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-admin-sidebar-hover hover:text-white",
                                isActive(child.href)
                                  ? "bg-primary-600 text-white font-medium"
                                  : "text-admin-sidebar-text"
                              )}
                            >
                              {translateNav(child.title)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.title}>
                  <Link
                    href={"href" in item ? item.href : "#"}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-admin-sidebar-hover hover:text-white",
                      "href" in item && isActive(item.href)
                        ? "bg-primary-600 text-white font-medium"
                        : "text-admin-sidebar-text"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{translateNav(item.title)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-sidebar-text transition-colors hover:bg-admin-sidebar-hover hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("logout")}</span>
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
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-secondary hover:text-text transition-colors select-none"
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{lang === "en" ? "বাংলা" : "EN"}</span>
    </button>
  );
}

function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-surface-secondary lg:hidden"
            aria-label={t("toggle_menu")}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Global Search Button */}
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
        </div>

        <div className="flex items-center gap-2">
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
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Only bypass admin sidebar on dedicated order printable invoice pages (e.g., /admin/orders/[id]/invoice)
  const isOrderPrintPage = pathname?.startsWith("/admin/orders/") && pathname?.endsWith("/invoice");
  if (isOrderPrintPage) {
    return <>{children}</>;
  }

  return (
    <AdminLanguageProvider>
      <div className="flex h-screen overflow-hidden bg-surface-secondary">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminLanguageProvider>
  );
}
