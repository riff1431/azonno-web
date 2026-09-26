"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  Tag,
  Flame,
  CheckCircle2,
  Clock,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  ChevronLeft,
  Eye,
  Layers,
  Sparkle
} from "lucide-react";
import { AzonnoProductCard } from "@/components/storefront/azonno-product-card";
import { QuickViewModal } from "@/components/storefront/quick-view-modal";
import {
  AZONNO_PRODUCTS,
  CLOTHING_CATEGORIES,
  ClothingProduct,
  ClothingCategory
} from "@/data/clothing-catalog";

type DepartmentFilter = "all" | "men" | "women" | "festive";

export function AzonnoHomepage() {
  const [department, setDepartment] = useState<DepartmentFilter>("all");
  const [subTab, setSubTab] = useState<string>("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<ClothingProduct | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Flash Sale Timer State
  const [flashTime, setFlashTime] = useState({
    hours: 11,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Department-specific Hero Slides
  const heroSlides = useMemo(() => {
    if (department === "men") {
      return [
        {
          title: "The Oxford & Slub Linen Edition",
          subtitle: "Men's Signature Casuals",
          tag: "100% Combed Cotton",
          description: "Engineered for Dhaka's climate with breathable oxford weave, tailored regular fits, and durable resin buttons.",
          ctaText: "Shop Men's Shirts",
          ctaLink: "/category/casual-shirt",
          badge: "Starts ৳1,815",
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&q=85",
        },
        {
          title: "Festive & Eastern Luxury",
          subtitle: "Eid & Jumu'ah Panjabis",
          tag: "Jacquard Weaves",
          description: "Semi-fitted tailored cuts with metallic snap fasteners and deep dual pockets for refined festive elegance.",
          ctaText: "Explore Panjabis",
          ctaLink: "/category/panjabi",
          badge: "New Eid Drop",
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=85",
        },
      ];
    }

    if (department === "women") {
      return [
        {
          title: "Contemporary Linen Co-ords",
          subtitle: "Women's & Girls' Collection",
          tag: "Effortless Silhouette",
          description: "Coordinated slub linen tunics and wide-leg trousers designed for modern everyday elegance.",
          ctaText: "Shop Co-ord Sets",
          ctaLink: "/category/women-coords",
          badge: "Trending Now",
          image: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1600&q=85",
        },
        {
          title: "Embroidered Festive 3-Piece",
          subtitle: "Royal Jacquard Lawn",
          tag: "Fine Handcrafted Threadwork",
          description: "Opulent kameez, matching cigarette pants, and pure digitally printed organza dupattas.",
          ctaText: "Shop 3-Piece Sets",
          ctaLink: "/category/salwar-kameez",
          badge: "Festive Exclusive",
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&q=85",
        },
      ];
    }

    // Default "All" Slides
    return [
      {
        title: "Everyday Luxury, Within Reach",
        subtitle: "Summer 2026 Collection",
        tag: "Men & Women Apparel",
        description: "Premium menswear and womenswear crafted with pure combed cotton, slub linen, and tailored Bangladeshi fits.",
        ctaText: "Explore All Products",
        ctaLink: "/shop",
        badge: "Nationwide COD",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&q=85",
      },
      {
        title: "Festive Elegance For Him & Her",
        subtitle: "The Celebration Wardrobe",
        tag: "Handcrafted & Tailored",
        description: "Discover festive Panjabis, embroidered kurtis, and coordinated sets for Eid, weddings, and memorable occasions.",
        ctaText: "Shop Festive Drop",
        ctaLink: "/shop?filter=festive",
        badge: "Free Delivery > ৳1,999",
        image: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1600&q=85",
      },
    ];
  }, [department]);

  // Autoplay hero slides
  useEffect(() => {
    setCurrentHeroIndex(0);
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length, department]);

  // Filter Categories based on department
  const visibleCategories = useMemo(() => {
    if (department === "men") {
      return CLOTHING_CATEGORIES.filter((c) => c.gender === "men");
    }
    if (department === "women") {
      return CLOTHING_CATEGORIES.filter((c) => c.gender === "women");
    }
    return CLOTHING_CATEGORIES;
  }, [department]);

  // Filter Products based on department and subTab
  const filteredProducts = useMemo(() => {
    let pool = AZONNO_PRODUCTS;

    if (department === "men") {
      pool = pool.filter((p) => p.gender === "men" || p.gender === "unisex");
    } else if (department === "women") {
      pool = pool.filter((p) => p.gender === "women");
    } else if (department === "festive") {
      pool = pool.filter((p) => p.subCategory === "Panjabi" || p.subCategory === "Festive 3-Piece Sets");
    }

    if (subTab === "new") return pool.filter((p) => p.isNew);
    if (subTab === "bestseller") return pool.filter((p) => p.isBestSeller);
    if (subTab === "shirts") return pool.filter((p) => p.subCategory === "Casual Shirt");
    if (subTab === "kurtis") return pool.filter((p) => p.subCategory === "Embroidered Kurtis" || p.subCategory === "Co-ord Sets");
    if (subTab === "panjabi") return pool.filter((p) => p.subCategory === "Panjabi");

    return pool;
  }, [department, subTab]);

  // Specific spotlit deals
  const spotlitProduct = useMemo(() => {
    if (department === "women") {
      return AZONNO_PRODUCTS.find((p) => p.slug === "florence-linen-two-piece-coord") || AZONNO_PRODUCTS[6];
    }
    return AZONNO_PRODUCTS.find((p) => p.slug === "robin-oxford-casual-shirt") || AZONNO_PRODUCTS[0];
  }, [department]);

  return (
    <div className="bg-[#FCFCFD] text-slate-900 min-h-screen">
      {/* ============================================================
          1. DEPARTMENT & GENDER SELECTOR BAR (HERO TOP)
          ============================================================ */}
      <section className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between py-2 sm:py-2.5 overflow-x-auto scrollbar-none gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDepartment("all");
                  setSubTab("featured");
                }}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  department === "all"
                    ? "bg-[#1D6474] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>All Collections</span>
                <span className="text-[11px] opacity-80 font-normal">({AZONNO_PRODUCTS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartment("men");
                  setSubTab("featured");
                }}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  department === "men"
                    ? "bg-[#164E63] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>👔 Men's Collection</span>
                <span className="text-[11px] opacity-80 font-normal">
                  ({AZONNO_PRODUCTS.filter((p) => p.gender === "men" || p.gender === "unisex").length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartment("women");
                  setSubTab("featured");
                }}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  department === "women"
                    ? "bg-[#D97706] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>👗 Women & Girls</span>
                <span className="text-[11px] opacity-80 font-normal">
                  ({AZONNO_PRODUCTS.filter((p) => p.gender === "women").length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartment("festive");
                  setSubTab("featured");
                }}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  department === "festive"
                    ? "bg-[#4C1D95] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>🌙 Festive & Eid</span>
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
              <span className="flex items-center gap-1 text-[#1D6474]">
                <Truck className="w-3.5 h-3.5" /> Free Shipping &gt; ৳1,999
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <RefreshCw className="w-3.5 h-3.5" /> 7-Day Exchange
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. DYNAMIC HERO LOOKBOOK BANNER
          ============================================================ */}
      <section className="relative w-full bg-slate-950 overflow-hidden">
        <div className="relative h-[480px] sm:h-[580px] lg:h-[620px] w-full">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentHeroIndex ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                className="object-cover object-center filter brightness-[0.82]"
                sizes="100vw"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

              {/* Hero Copy */}
              <div className="absolute inset-0 max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center text-white">
                <div className="max-w-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-left duration-500">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3.5 py-1.5 bg-[#1D6474] text-white text-xs font-black uppercase tracking-widest rounded-full shadow-sm">
                      {slide.tag}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      {slide.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-teal-300">
                    {slide.subtitle}
                  </p>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] uppercase">
                    {slide.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-lg font-normal">
                    {slide.description}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-3.5 sm:gap-4">
                    <Link
                      href={slide.ctaLink}
                      className="px-7 py-3.5 bg-[#1D6474] hover:bg-[#15515E] text-white font-extrabold uppercase tracking-wider text-xs sm:text-sm rounded-md shadow-xl transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/shop"
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs sm:text-sm rounded-md backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
                    >
                      View All Catalog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Pagination Controls */}
          <div className="absolute bottom-6 right-6 sm:right-12 z-20 flex items-center gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentHeroIndex(i)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  i === currentHeroIndex ? "w-8 bg-amber-400" : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. CATEGORY VISUAL STORIES & BUBBLES
          ============================================================ */}
      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#1D6474]">
              {department === "women" ? "Women & Girls Catalog" : department === "men" ? "Men's Apparel" : "All Departments"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Categories
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-extrabold text-[#1D6474] hover:text-[#15515E] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Circular & Rounded Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-5">
          {visibleCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1D6474] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 p-1 ring-2 ring-slate-100 group-hover:ring-[#1D6474] transition-all">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 96px, 112px"
                />
                {cat.badge && (
                  <span className="absolute bottom-0 inset-x-0 bg-[#D97706] text-white text-[10px] font-black uppercase py-0.5 text-center shadow-xs">
                    {cat.badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1D6474] transition-colors leading-snug">
                {cat.name}
              </h3>
              <span className="text-xs text-slate-500 font-medium mt-0.5">
                {cat.itemCount} Designs
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================
          4. DUAL GENDER EDITORIAL BANNER (FOR HIM & FOR HER)
          ============================================================ */}
      {department === "all" && (
        <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* For Him Card */}
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden group shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=85"
                alt="Men's Wardrobe"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                <span className="text-xs font-black uppercase tracking-widest text-teal-300 mb-1">
                  Tailored Essentials
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mb-2 uppercase">
                  Men's Signature Drop
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mb-4 max-w-sm line-clamp-2">
                  Oxford casual shirts, festive Panjabis, and heavy piqué polos built for comfort and polish.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment("men");
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 bg-white text-slate-900 font-bold uppercase tracking-wider text-xs rounded-md shadow-md hover:bg-[#1D6474] hover:text-white transition-all cursor-pointer"
                  >
                    Explore Men's Only &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* For Her Card */}
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden group shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1200&q=85"
                alt="Women's & Girls Collection"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                <span className="text-xs font-black uppercase tracking-widest text-amber-300 mb-1">
                  Contemporary Elegance
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mb-2 uppercase">
                  Women & Girls Drops
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mb-4 max-w-sm line-clamp-2">
                  Fine embroidered lawn kurtis, two-piece linen co-ord sets, and festive 3-piece suits.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartment("women");
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 bg-[#D97706] text-white font-bold uppercase tracking-wider text-xs rounded-md shadow-md hover:bg-[#B45309] transition-all cursor-pointer"
                  >
                    Explore Women's Only &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          5. MAIN PRODUCT CATALOG & FILTERABLE DROPS
          ============================================================ */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4 mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#1D6474]">
              {department === "women" ? "Women & Girls" : department === "men" ? "Men's Collection" : "Curated Styles"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {department === "women"
                ? "Trending Girls & Women Apparel"
                : department === "men"
                ? "Men's Signature Apparel"
                : "Popular This Week"}
            </h2>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSubTab("featured")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                subTab === "featured"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All {department === "all" ? "Items" : department === "men" ? "Men" : "Women"}
            </button>
            <button
              type="button"
              onClick={() => setSubTab("new")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                subTab === "new"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              New Drops 🔥
            </button>
            <button
              type="button"
              onClick={() => setSubTab("bestseller")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                subTab === "bestseller"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Bestsellers ⭐
            </button>
            {department !== "women" && (
              <button
                type="button"
                onClick={() => setSubTab("shirts")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  subTab === "shirts"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Casual Shirts
              </button>
            )}
            {department !== "men" && (
              <button
                type="button"
                onClick={() => setSubTab("kurtis")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  subTab === "kurtis"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Kurtis & Co-ords
              </button>
            )}
          </div>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredProducts.map((product) => (
            <AzonnoProductCard
              key={product.id}
              product={product}
              columns={4}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <p className="text-base font-bold text-slate-700 mb-2">No items found in this category.</p>
            <button
              type="button"
              onClick={() => {
                setDepartment("all");
                setSubTab("featured");
              }}
              className="px-5 py-2.5 bg-[#1D6474] text-white rounded text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ============================================================
          6. FLASH DEAL OF THE DAY SPOTLIGHT
          ============================================================ */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-linear-to-r from-[#164E63] via-[#1D6474] to-slate-950 text-white p-6 sm:p-10 shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Deal Info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Limited Time Flash Deal</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                Deal of the Day: {spotlitProduct.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
                {spotlitProduct.description}
              </p>

              {/* Countdown Clocks */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-200 mb-2">
                  Special Offer Ends In:
                </p>
                <div className="flex items-center gap-2 text-center">
                  <div className="bg-black/40 border border-white/20 px-3.5 py-2 rounded-xl min-w-14">
                    <span className="block text-xl sm:text-2xl font-black text-white">
                      {String(flashTime.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-300">Hours</span>
                  </div>
                  <span className="text-xl font-black">:</span>
                  <div className="bg-black/40 border border-white/20 px-3.5 py-2 rounded-xl min-w-14">
                    <span className="block text-xl sm:text-2xl font-black text-white">
                      {String(flashTime.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-300">Mins</span>
                  </div>
                  <span className="text-xl font-black">:</span>
                  <div className="bg-black/40 border border-white/20 px-3.5 py-2 rounded-xl min-w-14">
                    <span className="block text-xl sm:text-2xl font-black text-white">
                      {String(flashTime.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-300">Secs</span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    ৳ {spotlitProduct.price.toLocaleString("en-BD")}
                  </span>
                  <span className="text-base text-slate-300 line-through">
                    ৳ {spotlitProduct.regularPrice.toLocaleString("en-BD")}
                  </span>
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded">
                    SAVE {spotlitProduct.discountPercentage}%
                  </span>
                </div>

                <Link
                  href={`/product/${spotlitProduct.slug}`}
                  className="px-6 py-3 bg-white text-slate-900 hover:bg-teal-50 font-bold uppercase tracking-wider text-xs sm:text-sm rounded-md shadow-lg transition-all"
                >
                  Claim Flash Deal &rarr;
                </Link>
              </div>
            </div>

            {/* Right Product Image */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative aspect-[3/4] w-full max-w-xs rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <Image
                  src={spotlitProduct.primaryImage}
                  alt={spotlitProduct.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 300px, 400px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. THE AZONNO CRAFTSMANSHIP & VALUE STANDARD
          ============================================================ */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#1D6474]">
              Quality Assurance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              The Azonno Difference
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every shirt, kurti, panjabi, and denim trouser is built to outlast seasons with premium fabrics tailored for Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#1D6474] flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">100% Combed Cotton</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Super-fine long staple cotton yarn that prevents pilling and maintains an ultra-soft feel wash after wash.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">7-Day Size Exchange</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fit not 100% perfect? Enjoy seamless doorstep size exchanges across all 64 districts in Bangladesh.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cash on Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect your parcel at your doorstep before payment with fast 24-48h dispatch in Dhaka and nationwide coverage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pre-Shrunk Weaves</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Garment-washed and silicone finished to ensure your clothing never shrinks or warps after regular laundry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          8. VERIFIED CUSTOMER REVIEWS & LOVED STYLES
          ============================================================ */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#1D6474]">
            Customer Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Loved By Thousands in Bangladesh
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              "The Robin Oxford Shirt fit is on another level. Fabric is so breathable for Dhaka's hot weather, and stitching is sharper than expensive international mall brands."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <strong className="block text-slate-900 font-bold">Tanvir Ahmed</strong>
                <span className="text-slate-400">Dhanmondi, Dhaka</span>
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Buyer
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              "Ordered the Florence Linen Co-ord set and it arrived within 24 hours. The linen drape is super premium and comfortable. Highly recommend to all girls looking for classy daily wear."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <strong className="block text-slate-900 font-bold">Nusrat Jahan</strong>
                <span className="text-slate-400">Gulshan, Dhaka</span>
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Buyer
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              "The Zafran Jacquard Panjabi was the highlight of our family Eid gathering. The metallic buttons and collar finish look very high-end. 10/10 purchase."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <strong className="block text-slate-900 font-bold">Rakibul Hasan</strong>
                <span className="text-slate-400">Chittagong</span>
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Buyer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
