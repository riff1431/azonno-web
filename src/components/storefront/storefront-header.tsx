"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Sparkles,
  Truck,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Tag,
  Loader2,
  Compass,
  ArrowRight,
  Sparkle,
  Phone,
  Layers,
  BookOpen,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/shared/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";
import {
  type HomepageFullConfig,
  type HeaderNavCategory,
  DEFAULT_HOMEPAGE_CONFIG,
} from "@/features/marketing/homepage-types";
import { trackSearch } from "@/lib/analytics/datalayer";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/storefront/language-switcher";
import type { ThemeSettings } from "@/features/settings/actions";

interface SearchResult {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    regular_price: number;
    sale_price: number | null;
    og_image_url: string | null;
    brands: { name: string } | null;
  }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  ingredients?: Array<{ name: string; slug: string }>;
  concerns?: Array<{ name: string; slug: string }>;
}

const TOP_BRANDS_DEFAULT = [
  { name: "COSRX", slug: "cosrx" },
  { name: "The Ordinary", slug: "the-ordinary" },
  { name: "CeraVe", slug: "cerave" },
  { name: "Beauty of Joseon", slug: "beauty-of-joseon" },
  { name: "Cetaphil", slug: "cetaphil" },
  { name: "Neutrogena", slug: "neutrogena" },
  { name: "Simple", slug: "simple" },
  { name: "L'Oréal Paris", slug: "loreal" },
];

export interface StorefrontHeaderProps {
  initialThemeSettings?: ThemeSettings;
}

export function StorefrontHeader({ initialThemeSettings }: StorefrontHeaderProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const { itemCount, openCart } = useCart();
  const { language, t, isSwitcherEnabled, toBn, formatPriceBn } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<string[]>([]);

  // Config from Admin Dashboard
  const [config, setConfig] = useState<HomepageFullConfig>(DEFAULT_HOMEPAGE_CONFIG);

  useEffect(() => {
    getHomepageConfig().then((data) => {
      if (data) setConfig(data);
    });
  }, []);

  const headerConfig = config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig;
  const navCategories = headerConfig.navCategories?.length > 0
    ? headerConfig.navCategories
    : DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories;
  const campaignPills = config.campaignPills?.length > 0
    ? config.campaignPills
    : DEFAULT_HOMEPAGE_CONFIG.campaignPills;
  const searchPlaceholders = headerConfig.searchPlaceholders?.length > 0
    ? headerConfig.searchPlaceholders
    : DEFAULT_HOMEPAGE_CONFIG.headerConfig.searchPlaceholders;

  const bnPlaceholders = [
    "প্রোডাক্ট খুঁজুন... যেমন সিরাম, সানস্ক্রিন",
    "কোরিয়ান স্কিনকেয়ার বা মেকআপ খুঁজুন...",
    "ব্র্যান্ড বা উপাদানের নাম লিখে খুঁজুন...",
  ];
  const activePlaceholders =
    language === "bn"
      ? bnPlaceholders
      : searchPlaceholders?.length > 0
      ? searchPlaceholders
      : DEFAULT_HOMEPAGE_CONFIG.headerConfig.searchPlaceholders;

  // Hoverable Mega Menu State (with smooth debounce)
  const [activeMegaCategory, setActiveMegaCategory] = useState<HeaderNavCategory | null>(null);
  const [brandsMegaOpen, setBrandsMegaOpen] = useState(false);
  const menuCloseTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterCategory = (cat: HeaderNavCategory) => {
    if (menuCloseTimeout.current) clearTimeout(menuCloseTimeout.current);
    setBrandsMegaOpen(false);
    setActiveMegaCategory(cat);
  };

  const handleMouseLeaveCategory = () => {
    menuCloseTimeout.current = setTimeout(() => {
      setActiveMegaCategory(null);
    }, 150);
  };

  const handleMouseEnterBrands = () => {
    if (menuCloseTimeout.current) clearTimeout(menuCloseTimeout.current);
    setActiveMegaCategory(null);
    setBrandsMegaOpen(true);
  };

  const handleMouseLeaveBrands = () => {
    menuCloseTimeout.current = setTimeout(() => {
      setBrandsMegaOpen(false);
    }, 150);
  };

  // Dynamic animated placeholder cycling
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % activePlaceholders.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [activePlaceholders.length]);
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Check auth user and listen to auth state changes
  useEffect(() => {
    const supabase = createClient();

    const checkRole = async (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        setIsAdmin(profile?.role === "admin" || profile?.role === "moderator");
      } else {
        setIsAdmin(false);
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      checkRole(data?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkRole(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close mobile drawer and dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowSearchDropdown(false);
    setActiveMegaCategory(null);
    setBrandsMegaOpen(false);
  }, [pathname]);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Close search dropdown on click outside (handling both desktop and mobile inputs)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktop = searchContainerRef.current?.contains(target);
      const insideMobile = mobileSearchContainerRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSearchDropdown = () => {
    if (!showSearchDropdown) return null;

    const hasAnyResults =
      searchResults &&
      (searchResults.products.length > 0 ||
        searchResults.categories.length > 0 ||
        searchResults.brands.length > 0 ||
        (searchResults.ingredients && searchResults.ingredients.length > 0) ||
        (searchResults.concerns && searchResults.concerns.length > 0));

    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
        {isSearching ? (
          <div className="p-6 text-center text-xs text-gray-500">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#e91e63]" />
            <p className="mt-2 font-medium">
              {language === "bn" ? "প্রোডাক্ট অনুসন্ধান করা হচ্ছে..." : "Searching authentic beauty & skincare..."}
            </p>
          </div>
        ) : hasAnyResults ? (
          <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
            {/* Matching Ingredients */}
            {searchResults.ingredients && searchResults.ingredients.length > 0 && (
              <div>
                <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-[#e91e63] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t("header", "actives")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {searchResults.ingredients.map((ing) => (
                    <Link
                      key={ing.slug}
                      href={`/products?key_actives=${encodeURIComponent(ing.slug)}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs font-bold text-pink-700 hover:bg-pink-100 hover:border-pink-300 transition-colors"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-pink-600 shrink-0" />
                      <span>{ing.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Concerns */}
            {searchResults.concerns && searchResults.concerns.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                  {t("header", "concerns")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {searchResults.concerns.map((con) => (
                    <Link
                      key={con.slug}
                      href={`/products?skin_concern=${encodeURIComponent(con.slug)}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-purple-600 shrink-0" />
                      <span>{con.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Categories */}
            {searchResults.categories.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t("header", "categories")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {searchResults.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-pink-50 hover:text-[#e91e63] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Brands */}
            {searchResults.brands.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t("header", "brands")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {searchResults.brands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/products?brand=${b.slug}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-pink-50 hover:text-[#e91e63] transition-colors"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Products */}
            {searchResults.products.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t("header", "products")}
                </span>
                <div className="mt-1 space-y-1">
                  {searchResults.products.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {prod.og_image_url ? (
                          <img
                            src={prod.og_image_url}
                            alt={prod.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-gray-900">{prod.name}</p>
                          {prod.brands && (
                            <span className="text-[10px] font-medium text-gray-500">
                              {prod.brands.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-gray-900">
                          {formatPriceBn(prod.sale_price ?? prod.regular_price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Full Results CTA */}
            <div className="pt-2 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full text-center text-xs font-bold text-[#e91e63] hover:underline py-1"
              >
                {t("header", "viewAllResults")} &ldquo;{searchQuery}&rdquo; &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-gray-500">
            {t("header", "noResults")}
          </div>
        )}
      </div>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    trackSearch(searchQuery);
    setShowSearchDropdown(false);
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const toggleMobileCategory = (catName: string) => {
    setExpandedMobileCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs border-b border-gray-100">
      {/* 1. Top Utility Announcement Bar (Fully Responsive on All Devices) */}
      <div className="bg-sg-black px-3 sm:px-4 py-1.5 text-white text-[11px] sm:text-xs">
        <div className="container-main flex items-center justify-between gap-2 overflow-hidden">
          {/* Mobile Single-Line Compact View (< 640px) */}
          <div className="flex items-center justify-between gap-2 sm:hidden w-full">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="shrink-0 rounded-full bg-sg-pink px-2 py-0.5 text-[9.5px] font-black text-white uppercase tracking-wider">
                {t("header", "announcementBadge")}
              </span>
              <span className="truncate text-zinc-200 font-semibold text-[11.5px] sm:text-xs">
                {initialThemeSettings?.announcement || t("header", "announcementText")}
              </span>
            </div>
            {isSwitcherEnabled && (
              <div className="shrink-0 flex items-center gap-1.5">
                <LanguageSwitcher variant="header-top" />
              </div>
            )}
          </div>

          {/* Desktop & Tablet View (>= 640px) */}
          <div className="hidden sm:flex items-center gap-2 flex-1">
            <span className="rounded-full bg-sg-pink px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
              {t("header", "announcementBadge")}
            </span>
            <span className="text-zinc-200 font-semibold text-xs sm:text-sm">
              {initialThemeSettings?.announcement || t("header", "announcementText")}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3.5 text-zinc-400 font-medium shrink-0">
            {initialThemeSettings?.supportPhone && (
              <>
                <a
                  href={`tel:${initialThemeSettings.supportPhone.replace(/\s+/g, "")}`}
                  className="hidden lg:flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
                >
                  <Phone className="h-3 w-3 text-pink-400" />
                  <span>{initialThemeSettings.supportPhone}</span>
                </a>
                <span className="hidden lg:inline text-zinc-700">|</span>
              </>
            )}
            <Link
              href={config.routineFinderHref || "/products?category=skin-care"}
              className="flex items-center gap-1 text-pink-300 hover:text-white transition-colors text-xs font-bold"
            >
              <Sparkles className="h-3 w-3 text-pink-400" />
              <span>{t("header", "routineFinder")}</span>
            </Link>
            <span className="hidden md:inline text-zinc-700">|</span>
            <Link
              href={config.trackOrderHref || "/account/orders"}
              className="hidden md:flex items-center gap-1 hover:text-white transition-colors"
            >
              <Truck className="h-3 w-3" />
              <span>{t("header", "trackOrder")}</span>
            </Link>
            <span className="hidden md:inline text-zinc-700">|</span>
            <span className="hidden sm:inline-flex text-emerald-400 font-semibold items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> {t("header", "authenticGuarantee")}
            </span>
            {isSwitcherEnabled && (
              <>
                <span className="hidden sm:inline text-zinc-700">|</span>
                <LanguageSwitcher variant="header-top" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar (Mobile + Desktop) */}
      <div className="container-main py-2 sm:py-3">
        {/* Mobile View: Top Row (Hamburger + Centered Logo + Wishlist & Bag on Right) */}
        <div className="flex items-center justify-between lg:hidden mb-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-gray-700 hover:text-sg-pink focus:outline-none transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 stroke-[2.2]" />
          </button>

          <Link href={headerConfig.logoLink || "/"} className="flex items-center justify-center">
            {headerConfig.mobileLogoImageUrl || headerConfig.logoImageUrl ? (
              <img
                src={headerConfig.mobileLogoImageUrl || headerConfig.logoImageUrl}
                alt={headerConfig.mobileLogoText || headerConfig.logoText || "Blush & Budget"}
                className="h-8 sm:h-9 max-h-9 w-auto max-w-37.5 sm:max-w-45 object-contain shrink-0"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-black tracking-[0.15em] uppercase font-sans">
                {headerConfig.mobileLogoText || headerConfig.logoText || "Blush & Budget"}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/account/wishlist"
              className="relative p-1.5 text-gray-700 hover:text-sg-pink focus:outline-none"
              aria-label="Wishlist"
            >
              <Heart className="h-6 w-6 stroke-2" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-sg-pink px-1 text-[9px] font-black text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="relative p-1.5 text-gray-700 hover:text-sg-pink focus:outline-none"
              aria-label="View Cart"
            >
              <ShoppingBag className="h-6 w-6 stroke-2" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-sg-pink px-1 text-[9px] font-black text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop View: 3-column Header Row */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          {/* Left: Brand Logo & Brands Mega-Menu Link */}
          <div className="flex items-center gap-8">
            <Link href={headerConfig.logoLink || "/"} className="flex items-center shrink-0">
              {headerConfig.logoImageUrl ? (
                <img
                  src={headerConfig.logoImageUrl}
                  alt={headerConfig.logoText || "Blush & Budget"}
                  className="h-10 xl:h-11 max-h-12 w-auto max-w-50 xl:max-w-60 object-contain shrink-0"
                />
              ) : (
                <span className="text-2xl xl:text-3xl font-black text-black tracking-[0.15em] uppercase font-sans">
                  {headerConfig.logoText || "Blush & Budget"}
                </span>
              )}
            </Link>

            {/* Desktop Brands dropdown trigger */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnterBrands}
              onMouseLeave={handleMouseLeaveBrands}
            >
              <button
                type="button"
                className="text-xs font-bold uppercase tracking-wider text-gray-800 hover:text-[#e91e63] flex items-center gap-1 py-2"
              >
                <span>{t("header", "brands")}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {/* Brands Mega-Dropdown Menu */}
              {brandsMegaOpen && (
                <div className="absolute top-full left-0 z-50 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl animate-in fade-in-0 zoom-in-95">
                  <div className="border-b border-gray-100 pb-2 mb-3 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                      {t("header", "topBrands")}
                    </span>
                    <Link
                      href="/products"
                      className="text-[11px] font-bold text-[#e91e63] hover:underline"
                    >
                      {t("header", "viewAll")} &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TOP_BRANDS_DEFAULT.map((brand) => (
                      <Link
                        key={brand.name}
                        href={`/products?brand=${brand.slug}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-pink-50 hover:text-[#e91e63] transition-colors"
                      >
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Signature Pink-Border Pill Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center rounded-full border-2 border-sg-pink bg-white shadow-xs transition-all text-gray-900">
                <Search className="h-4 w-4 ml-4 text-gray-400 shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder={activePlaceholders[placeholderIndex] || activePlaceholders[0]}
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none rounded-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mr-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {renderSearchDropdown()}
          </div>

          {/* Right: Wishlist, Account, and Cart Bag */}
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher variant="header-main" className="hidden xl:inline-flex" />

            <Link
              href="/account/wishlist"
              className="text-gray-700 hover:text-[#e91e63] flex items-center gap-1.5 text-xs font-bold uppercase transition-colors px-2 py-2"
            >
              <Heart className="h-4 w-4" />
              <span>{t("header", "wishlist")}</span>
              {wishlistCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e91e63] px-1 text-[9px] font-black text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* If Admin: Direct Admin Dashboard Button only. If Customer: Account / Login */}
            {isAdmin ? (
              <Link
                href="/admin"
                className="bg-[#e91e63] hover:bg-sg-pink-hover text-white flex items-center gap-1.5 text-xs font-black uppercase transition-all px-3.5 py-1.5 rounded-full shadow-xs"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t("header", "admin")}</span>
              </Link>
            ) : (
              <Link
                href={user ? "/account" : "/login"}
                className="text-gray-700 hover:text-[#e91e63] flex items-center gap-1.5 text-xs font-bold uppercase transition-colors px-2 py-2"
              >
                <User className="h-4 w-4" />
                <span>{user ? t("header", "account") : t("header", "login")}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={openCart}
              className="bg-sg-pink text-white font-bold text-xs uppercase px-4 py-2.5 rounded-full hover:bg-sg-pink-hover transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{t("header", "cart")}</span>
              <span className="ml-1 inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-white text-sg-pink text-[10px] font-black">
                {itemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Full-Width Pink-Bordered Pill Search Input */}
        <div ref={mobileSearchContainerRef} className="lg:hidden mt-1 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center rounded-full border-2 border-sg-pink bg-white shadow-xs px-3.5 py-2 text-gray-900">
              <Search className="h-4 w-4 mr-2 text-gray-700 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder={activePlaceholders[placeholderIndex] || activePlaceholders[0]}
                className="w-full bg-transparent text-sm placeholder:text-gray-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
          {renderSearchDropdown()}
        </div>
      </div>

      {/* 3. Desktop Category Navigation Menu Bar with FULL HOVERABLE MEGA-MENU */}
      <nav
        className="hidden lg:block border-t border-gray-100 bg-white relative"
        onMouseLeave={handleMouseLeaveCategory}
      >
        <div className="container-main">
          <div className="flex items-center justify-between py-2 overflow-x-auto no-scrollbar">
            {/* Left: Interactive Category Links with Mega Menu Triggers */}
            <div className="flex items-center gap-6 xl:gap-8 text-xs font-bold text-gray-700">
              {navCategories.map((cat) => {
                const isHovered = activeMegaCategory?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => handleMouseEnterCategory(cat)}
                    className="relative py-1"
                  >
                    <Link
                      href={cat.href || `/products?category=${cat.slug}`}
                      className={cn(
                        "hover:text-sg-pink transition-colors whitespace-nowrap flex items-center gap-1",
                        isHovered ? "text-sg-pink" : ""
                      )}
                    >
                      <span>{cat.name}</span>
                      {cat.subcategories?.length > 0 && (
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            isHovered ? "rotate-180 text-sg-pink" : "text-gray-400"
                          )}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Right: Signature Colorful Campaign Pills */}
            <div className="flex items-center gap-2 xl:gap-3">
              {campaignPills.map((pill) => (
                <Link
                  key={pill.id}
                  href={pill.href}
                  className={cn(
                    "rounded-full text-white font-black text-[10px] sm:text-[11px] uppercase px-3 py-1 shadow-2xs tracking-wider transition-transform hover:scale-105",
                    pill.bgClass || "bg-sg-pink"
                  )}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE FULL HOVERABLE MEGA MENU PANEL */}
        {/* ============================================================ */}
        {activeMegaCategory && (
          <div
            onMouseEnter={() => {
              if (menuCloseTimeout.current) clearTimeout(menuCloseTimeout.current);
            }}
            onMouseLeave={handleMouseLeaveCategory}
            className="absolute top-full left-0 right-0 z-50 bg-white border-y border-gray-200 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-200"
          >
            <div className="container-main py-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Column 1 & 2: Subcategories List (6 cols) */}
                <div className="col-span-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sg-pink" />
                      {activeMegaCategory.name} Essentials
                    </h3>
                    <Link
                      href={activeMegaCategory.href || `/products?category=${activeMegaCategory.slug}`}
                      className="text-xs font-bold text-sg-pink hover:underline flex items-center gap-0.5"
                    >
                      View All {activeMegaCategory.name} &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {activeMegaCategory.subcategories?.map((sub, idx) => (
                      <Link
                        key={idx}
                        href={sub.href}
                        className="group flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-gray-700 hover:bg-pink-50 hover:text-sg-pink transition-colors"
                      >
                        <span className="truncate">{sub.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-sg-pink group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Column 3: Featured Brands (3 cols) */}
                <div className="col-span-3 space-y-3 border-l border-gray-100 pl-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                    Popular Brands
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activeMegaCategory.featuredBrands || ["COSRX", "The Ordinary", "CeraVe", "Beauty of Joseon"]).map(
                      (brand, idx) => (
                        <Link
                          key={idx}
                          href={`/products?search=${encodeURIComponent(brand)}`}
                          className="rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-bold text-gray-700 hover:border-sg-pink hover:bg-pink-50 hover:text-sg-pink transition-colors"
                        >
                          {brand}
                        </Link>
                      )
                    )}
                  </div>
                </div>

                {/* Column 4: Promotional Banner Card (3 cols) */}
                <div className="col-span-3 border-l border-gray-100 pl-6">
                  <Link
                    href={activeMegaCategory.promoBanner?.href || activeMegaCategory.href || "/products"}
                    className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-pink-500 to-rose-600 text-white p-4 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between"
                  >
                    {activeMegaCategory.promoBanner?.image && (
                      <img
                        src={activeMegaCategory.promoBanner.image}
                        alt="Promo"
                        className="absolute inset-0 h-full w-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="relative z-10 space-y-1">
                      <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        Special Highlight
                      </span>
                      <h4 className="text-sm font-black text-white pt-1">
                        {activeMegaCategory.promoBanner?.title || `Shop ${activeMegaCategory.name}`}
                      </h4>
                      <p className="text-[11px] text-pink-100 line-clamp-2">
                        {activeMegaCategory.promoBanner?.subtitle || "100% genuine guaranteed authentic imports."}
                      </p>
                    </div>

                    <div className="relative z-10 pt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors">
                        Shop Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 4. Slide-Over Mobile Menu Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-full bg-white shadow-2xl transition-transform lg:hidden flex flex-col">
            {/* Drawer Header */}
            <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-gray-200 bg-white">
              <Link href={headerConfig.logoLink || "/"} onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                {headerConfig.drawerLogoImageUrl || headerConfig.mobileLogoImageUrl || headerConfig.logoImageUrl ? (
                  <img
                    src={headerConfig.drawerLogoImageUrl || headerConfig.mobileLogoImageUrl || headerConfig.logoImageUrl}
                    alt={headerConfig.drawerLogoText || headerConfig.mobileLogoText || headerConfig.logoText || "Blush & Budget"}
                    className="h-7 sm:h-8 max-h-8 w-auto max-w-40 object-contain shrink-0"
                  />
                ) : (
                  <span className="text-base font-black text-gray-900 tracking-wider">
                    {headerConfig.drawerLogoText || headerConfig.mobileLogoText || headerConfig.logoText || "Blush & Budget"}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-sg-pink hover:text-sg-pink-hover focus:outline-none"
                aria-label="Close Menu"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* User Account Strip */}
            <div className="p-4 bg-pink-50/50 border-b border-gray-100 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e91e63] text-white">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  {language === "bn"
                    ? `${headerConfig.logoText || "Blush & Budget"}-এ স্বাগতম`
                    : `Welcome to ${headerConfig.logoText || "Blush & Budget"}`}
                </p>
                <Link
                  href={user ? "/account" : "/login"}
                  className="text-xs font-black text-[#e91e63] hover:underline"
                >
                  {user ? t("header", "account") : `${t("header", "login")} / ${t("auth", "signUpBtn")}`}
                </Link>
              </div>
            </div>

            {/* Quick Mobile Action Shortcuts: Wishlist, Routine Finder */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-gray-50 border-b border-gray-100">
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:border-[#e91e63] hover:text-[#e91e63] transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-[#e91e63]" />
                  <span>{t("header", "wishlist")}</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#e91e63] px-1.5 text-[10px] font-black text-white">
                    {toBn(wishlistCount)}
                  </span>
                )}
              </Link>

              <Link
                href={config.routineFinderHref || "/quiz"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:border-[#e91e63] hover:text-[#e91e63] transition-colors shadow-2xs"
              >
                <Sparkles className="h-4 w-4 text-pink-500" />
                <span className="truncate">{t("header", "routineFinder")}</span>
              </Link>
            </div>

            {/* Mobile Language Switcher */}
            {isSwitcherEnabled && (
              <div className="p-3 border-b border-gray-100 bg-white">
                <LanguageSwitcher variant="mobile" />
              </div>
            )}

              {/* Beauty Blog & Editorial Guide Link */}
              <div className="py-1">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <Link
                    href="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-black text-pink-600 hover:text-pink-700 flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4 text-pink-500" />
                    <span>{t("blog", "title")}</span>
                  </Link>
                  <span className="text-[10px] font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    {language === "bn" ? "জার্নাল" : "Journal"}
                  </span>
                </div>
              </div>

            {/* Scrollable Categories List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {navCategories.map((cat) => {
                const isExpanded = expandedMobileCategories.includes(cat.name);
                return (
                  <div key={cat.id} className="py-1">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <Link
                        href={cat.href || `/products?category=${cat.slug}`}
                        className="text-xs font-bold text-gray-800 hover:text-[#e91e63]"
                      >
                        {cat.name}
                      </Link>
                      {cat.subcategories?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleMobileCategory(cat.name)}
                          className="p-1 text-gray-400 hover:text-gray-700"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isExpanded ? "rotate-180 text-[#e91e63]" : ""
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories Accordion */}
                    {isExpanded && cat.subcategories?.length > 0 && (
                      <div className="bg-gray-50/80 px-4 py-2 space-y-1.5 border-t border-gray-100">
                        {cat.subcategories.map((sub, idx) => (
                          <Link
                            key={idx}
                            href={sub.href}
                            className="block text-[11px] font-semibold text-gray-600 hover:text-[#e91e63] py-1 pl-2 border-l-2 border-transparent hover:border-[#e91e63]"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Campaign Badges Grid */}
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Featured Campaigns
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {campaignPills.map((pill) => (
                    <Link
                      key={pill.id}
                      href={pill.href}
                      className={cn(
                        "rounded-xl text-white font-black text-[10px] uppercase p-2 text-center shadow-2xs",
                        pill.bgClass || "bg-[#e91e63]"
                      )}
                    >
                      {pill.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-2">
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#e91e63] py-2.5 text-center text-xs font-black text-white shadow-md"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              ) : (
                <Link
                  href={user ? "/account" : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-white border border-gray-300 py-2.5 text-center text-xs font-bold text-gray-800 shadow-2xs"
                >
                  <User className="h-4 w-4 text-gray-600" />
                  <span>{user ? t("header", "account") : t("header", "login")}</span>
                </Link>
              )}
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-xl bg-gray-900 py-2.5 text-center text-xs font-bold text-white shadow-md"
              >
                {language === "bn" ? "সকল প্রোডাক্ট ব্রাউজ করুন" : "Browse All Products"}
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
