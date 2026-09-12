"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Zap,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { BeforeAfterSlider } from "@/components/storefront/before-after-slider";
import {
  type HomepageFullConfig,
  DEFAULT_HOMEPAGE_CONFIG,
} from "@/features/marketing/homepage-types";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/storefront/language-switcher";
import { HomepageSeoFaq } from "@/components/storefront/homepage-seo-faq";

interface HomepageInteractiveProps {
  products: ProductCardData[];
  config?: HomepageFullConfig;
}

export function HomepageInteractive({
  products,
  config = DEFAULT_HOMEPAGE_CONFIG,
}: HomepageInteractiveProps) {
  const { language, t, isSwitcherEnabled, showHomepageBar } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const heroSlides =
    config?.heroSlides?.length > 0 ? config.heroSlides : DEFAULT_HOMEPAGE_CONFIG.heroSlides;
  const stripBanner = config?.stripBanner || DEFAULT_HOMEPAGE_CONFIG.stripBanner;
  const deals =
    config?.dealsYouCannotMiss?.length > 0
      ? config.dealsYouCannotMiss
      : DEFAULT_HOMEPAGE_CONFIG.dealsYouCannotMiss;
  const topBrands =
    config?.topBrandsAndOffers?.length > 0
      ? config.topBrandsAndOffers
      : DEFAULT_HOMEPAGE_CONFIG.topBrandsAndOffers;
  const limitedOffers =
    config?.limitedTimeOffers?.length > 0
      ? config.limitedTimeOffers
      : DEFAULT_HOMEPAGE_CONFIG.limitedTimeOffers;
  const categories =
    config?.shopByCategories?.length > 0
      ? config.shopByCategories
      : DEFAULT_HOMEPAGE_CONFIG.shopByCategories;
  const trustPillars =
    config?.trustPillars?.length > 0
      ? config.trustPillars
      : DEFAULT_HOMEPAGE_CONFIG.trustPillars;

  const trendingTitle = config?.trendingTitle || DEFAULT_HOMEPAGE_CONFIG.trendingTitle;
  const trendingSubtitle = config?.trendingSubtitle || DEFAULT_HOMEPAGE_CONFIG.trendingSubtitle;
  const trendingViewAllText = config?.trendingViewAllText || DEFAULT_HOMEPAGE_CONFIG.trendingViewAllText;

  // Auto-rotate hero slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    } else if (distance < -50) {
      setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const renderTrustIcon = (iconName: string, imageUrl?: string) => {
    if (imageUrl) {
      return <img src={imageUrl} alt="icon" className="h-6 w-6 object-contain shrink-0 rounded" />;
    }
    switch (iconName) {
      case "shield":
        return <ShieldCheck className="h-6 w-6 text-[#e91e63] shrink-0" />;
      case "truck":
        return <Truck className="h-6 w-6 text-[#e91e63] shrink-0" />;
      case "zap":
        return <Zap className="h-6 w-6 text-[#e91e63] shrink-0" />;
      case "clock":
        return <Clock className="h-6 w-6 text-[#e91e63] shrink-0" />;
      case "rotate":
      default:
        return <RotateCcw className="h-6 w-6 text-[#e91e63] shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-[#fafafa]">
      {/* ============================================================ */}
      {/* 1. HERO CAROUSEL BANNER (Full Dynamic Responsive Display) */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden select-none bg-white border-b border-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full aspect-16/7 sm:aspect-1920/650 max-h-125 bg-white flex items-center justify-center">
          {heroSlides.map((slide, idx) => (
            <Link
              key={slide.id || idx}
              href={slide.href}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 flex items-center justify-center overflow-hidden bg-white",
                currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-contain"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </Link>
          ))}

          {/* Desktop Left/Right Arrows */}
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/60 backdrop-blur-xs transition-colors active:scale-90"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/60 backdrop-blur-xs transition-colors active:scale-90"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 6 Pagination Dots */}
        <div className="flex items-center justify-center gap-2 py-2.5 bg-white">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "rounded-full transition-all duration-300",
                currentSlide === idx
                  ? "h-2.5 w-2.5 bg-[#e91e63] scale-110"
                  : "h-2 w-2 bg-[#4a4a4a] hover:bg-gray-600"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 1.5 HOMEPAGE AUTHENTICITY TRUST BAR */}
      {/* ============================================================ */}
      <section className="container-main py-1.5 sm:py-2">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-pink-50 via-rose-50/70 to-pink-50 border border-pink-200/80 px-4 py-2 sm:py-2.5 text-center shadow-xs">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#e91e63] shrink-0" />
          <span className="text-xs sm:text-sm md:text-base font-black text-gray-900 tracking-normal">
            {language === "bn"
              ? "১০০% খাঁটি ও অথেনটিক প্রসাধনী — সারা দেশে দ্রুত ডেলিভারি"
              : "100% Genuine & Authentic Beauty Products — Fast Nationwide Delivery"}
          </span>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. POND'S MIRACLE ME SLIM STRIP BANNER */}
      {/* ============================================================ */}
      <section className="container-main">
        <Link
          href={stripBanner.href || "/products?search=ponds"}
          className="group relative block overflow-hidden rounded-xl shadow-xs transition-all hover:shadow-md aspect-1200/180 bg-white btn-soft-fill"
        >
          <img
            src={stripBanner.image || "/banners/strip_ponds.svg"}
            alt={stripBanner.title}
            className="h-full w-full object-contain rounded-xl"
            loading="lazy"
          />
        </Link>
      </section>

      {/* ============================================================ */}
      {/* 3. DEALS YOU CANNOT MISS (Section 1: 4 Square Image Banners) */}
      {/* ============================================================ */}
      <section className="container-main">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wide text-gray-900">
            {language === "bn" ? t("home", "dealsTitle") : "DEALS YOU CANNOT MISS"}
          </h2>
          {language === "bn" && (
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-600 mt-1">{t("home", "dealsSubtitle")}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {deals.map((deal, idx) => (
            <Link
              key={deal.id || idx}
              href={deal.href}
              className="group relative aspect-square overflow-hidden rounded-2xl shadow-xs border border-gray-100 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] bg-white flex items-center justify-center btn-soft-fill"
            >
              <img
                src={deal.image}
                alt={deal.title}
                className="h-full w-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. TOP BRANDS & OFFERS (Section 2: Separate 6 Brand Promo Cards) */}
      {/* ============================================================ */}
      <section className="container-main space-y-3">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wide text-gray-900">
            {language === "bn" ? t("home", "topBrandsTitle") : "TOP BRANDS & OFFERS"}
          </h2>
          {language === "bn" && (
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-600 mt-1">{t("home", "topBrandsSubtitle")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {topBrands.map((brand, idx) => (
            <Link
              key={brand.id || idx}
              href={brand.href}
              className="group relative overflow-hidden rounded-2xl shadow-xs border border-gray-100 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] aspect-800/350 bg-white flex items-center justify-center btn-soft-fill"
            >
              <img
                src={brand.image}
                alt={brand.title}
                className="h-full w-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. VIBRANT PROMOTIONAL CARDS (Compact & Responsive Across All Screens) */}
      {/* ============================================================ */}
      <section className="container-main">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {limitedOffers.map((offer, idx) => {
            const cardGradients = [
              "from-[#e91e63] via-[#db2777] to-[#be185d]", // BOGO - Signature Blush Pink
              "from-[#9333ea] via-[#7e22ce] to-[#581c87]", // COMBO - Royal Purple
              "from-[#f43f5e] via-[#e11d48] to-[#9f1239]", // OFFERS - Radiant Ruby
              "from-[#0284c7] via-[#0369a1] to-[#075985]", // CLEARANCE - Sapphire Blue
            ];
            const gradient = cardGradients[idx % cardGradients.length];

            return (
              <Link
                key={offer.id || idx}
                href={offer.href}
                className={cn(
                  "group relative overflow-hidden p-3.5 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-center text-center rounded-2xl sm:rounded-3xl border border-white/20 bg-linear-to-br select-none",
                  gradient,
                  "h-28 sm:h-32 md:h-36 lg:h-38 w-full"
                )}
              >
                {/* Decorative Ambient Glass Glow */}
                <div className="pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-white/15 blur-xl group-hover:scale-150 transition-transform duration-500" />
                <div className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-full bg-black/10 blur-lg" />

                {/* Slanted Contrast Ribbon Badge */}
                <div className="relative z-10 bg-[#0f172a] text-white text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-md shadow-2xs -rotate-2 uppercase tracking-wider mb-1 transform transition-transform group-hover:rotate-0 group-hover:scale-105">
                  {offer.ribbonText}
                </div>

                {/* Main Bold Typography */}
                <h3 className="relative z-10 text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight drop-shadow-xs group-hover:scale-105 transition-transform duration-300">
                  {offer.mainText}
                </h3>

                {/* Subtle Action Pill */}
                <span className="relative z-10 mt-1 text-xs sm:text-sm font-bold text-white/90 group-hover:text-white flex items-center gap-1 transition-colors">
                  <span>{language === "bn" ? "অফার দেখুন" : "Shop Deals"}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SHOP BEAUTY PRODUCTS BY CATEGORY (Girl Model Cards - Shajgoj Style) */}
      {/* ============================================================ */}
      <section className="container-main">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wide text-gray-900">
            {language === "bn" ? t("home", "shopByCategoryTitle") : "SHOP BEAUTY PRODUCTS BY CATEGORY"}
          </h2>
          {language === "bn" && (
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-600 mt-1">{t("home", "shopByCategorySubtitle")}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id || idx}
              href={`/products?category=${cat.slug}`}
              className="group relative flex flex-col items-center justify-between overflow-hidden rounded-3xl sm:rounded-[30px] border border-gray-200/90 bg-linear-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#e91e63] aspect-square btn-soft-fill"
            >
              {/* Model Photo Background */}
              <img
                src={cat.image || `/categories/cat_${cat.slug.replace('-', '_')}.jpg`}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Dual Vignette Gradient Overlays for High Legibility */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-sky-900/60 pointer-events-none" />

              {/* Sparkle Star Accents */}
              <Sparkles className="absolute top-8 left-2.5 h-3.5 w-3.5 text-pink-300 opacity-90 drop-shadow-xs pointer-events-none" />
              <Sparkles className="absolute top-12 right-2.5 h-3 w-3 text-pink-200 opacity-80 drop-shadow-xs pointer-events-none" />

              {/* Top Category Title */}
              <div className="relative z-10 pt-3 sm:pt-4 px-2 text-center w-full">
                <span className="font-black text-sm sm:text-base md:text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {cat.name}
                </span>
              </div>

              {/* Bottom Subtle Pill */}
              <div className="relative z-10 pb-2.5 px-2 text-center w-full">
                <span className="inline-block rounded-full bg-white/25 backdrop-blur-xs px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider group-hover:bg-[#e91e63] group-hover:text-white transition-colors shadow-xs">
                  {language === "bn" ? "কিনুন" : "SHOP NOW"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. INTERACTIVE BEFORE / AFTER SPLIT SLIDER (Beauty Tech Widget) */}
      {/* ============================================================ */}
      {config?.beforeAfterSection?.enabled !== false && (
        <BeforeAfterSlider
          title={config?.beforeAfterSection?.title}
          subtitle={config?.beforeAfterSection?.subtitle}
          beforeImage={config?.beforeAfterSection?.beforeImage}
          afterImage={config?.beforeAfterSection?.afterImage}
          beforeLabel={config?.beforeAfterSection?.beforeLabel}
          afterLabel={config?.beforeAfterSection?.afterLabel}
          imageFit={config?.beforeAfterSection?.imageFit}
          aspectRatio={config?.beforeAfterSection?.aspectRatio}
          eyebrowBadge={config?.beforeAfterSection?.eyebrowBadge}
          heading={config?.beforeAfterSection?.heading}
          description={config?.beforeAfterSection?.description}
          metric1={config?.beforeAfterSection?.metric1}
          metric2={config?.beforeAfterSection?.metric2}
          metric3={config?.beforeAfterSection?.metric3}
          buttonText={config?.beforeAfterSection?.buttonText}
          buttonHref={config?.beforeAfterSection?.buttonHref}
        />
      )}

      {/* ============================================================ */}
      {/* 8. TRENDING PRODUCTS GRID (Controlled Header) */}
      {/* ============================================================ */}
      <section className="container-main space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-wide text-gray-900">
              {language === "bn" ? t("home", "trendingTitle") : trendingTitle}
            </h2>
            <p className="text-sm sm:text-base font-semibold text-gray-600 mt-0.5">
              {language === "bn" ? t("home", "trendingSubtitle") : trendingSubtitle}
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm sm:text-base font-bold text-[#e91e63] hover:underline flex items-center gap-1 group"
          >
            <span>{language === "bn" ? t("home", "trendingViewAll") : trendingViewAllText}</span>
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} cardSettings={config?.cardSettings} />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. TRUST PILLARS STRIP (Fully Controlled) */}
      {/* ============================================================ */}
      <section className="container-main">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {trustPillars.map((tp, idx) => {
            const bnPillars = [
              { title: t("home", "authenticProducts"), subtitle: t("home", "authenticDesc") },
              { title: t("home", "fastDelivery"), subtitle: t("home", "fastDeliveryDesc") },
              { title: t("home", "codAvailable"), subtitle: t("home", "codDesc") },
              { title: t("home", "easyReturns"), subtitle: t("home", "easyReturnsDesc") },
            ];
            const title = language === "bn" && bnPillars[idx] ? bnPillars[idx].title : tp.title;
            const subtitle = language === "bn" && bnPillars[idx] ? bnPillars[idx].subtitle : tp.subtitle;
            return (
              <div
                key={tp.id || idx}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-4.5 shadow-xs transition-all duration-300 hover:shadow-sm hover:border-gray-300"
              >
                {renderTrustIcon(tp.iconName, tp.imageUrl)}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. HOMEPAGE SEO & HUMANIZED FAQ SECTION (Admin Controlled) */}
      {/* ============================================================ */}
      {config?.faqSection?.enabled !== false && (
        <HomepageSeoFaq config={config?.faqSection} />
      )}
    </div>
  );
}
