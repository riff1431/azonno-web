"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  X,
  Package,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { StorefrontBrand } from "@/features/brands/actions";

interface BrandsClientProps {
  brands: StorefrontBrand[];
}

export function BrandsClient({ brands }: BrandsClientProps) {
  const { language, t, toBn } = useLanguage();
  const isBn = language === "bn";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("ALL");

  // Available First Letters from dataset
  const alphabetLetters = useMemo(() => {
    const letters = new Set<string>();
    brands.forEach((b) => {
      const firstChar = (b.name || "").trim().charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      } else {
        letters.add("#");
      }
    });
    return Array.from(letters).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [brands]);

  // Filtered Brands
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      // 1. Search query filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        brand.name.toLowerCase().includes(query) ||
        brand.slug.toLowerCase().includes(query) ||
        (brand.description && brand.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Letter filter
      if (selectedLetter === "ALL") return true;

      const firstChar = (brand.name || "").trim().charAt(0).toUpperCase();
      if (selectedLetter === "#") {
        return !/[A-Z]/.test(firstChar);
      }
      return firstChar === selectedLetter;
    });
  }, [brands, searchQuery, selectedLetter]);

  // Grouped by Alphabet for rich browsing when no specific filter is active
  const groupedBrands = useMemo(() => {
    const map = new Map<string, StorefrontBrand[]>();
    filteredBrands.forEach((b) => {
      const firstChar = (b.name || "").trim().charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [filteredBrands]);

  return (
    <div className="min-h-screen bg-[#faf8f9] pb-16">
      {/* Hero Header Section */}
      <div className="relative border-b border-pink-100/80 bg-gradient-to-b from-pink-50/70 via-white to-[#faf8f9] pt-6 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link href="/" className="hover:text-pink-600 transition-colors">
              {t("mobileNav", "home")}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold">{t("header", "brands")}</span>
          </nav>

          {/* Title & Badge */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/80 border border-pink-200 text-[#e91e63] text-xs font-extrabold tracking-wide uppercase shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isBn ? "১০০% আসল ও অনুমোদিত ব্র্যান্ড ডিরেক্টরি" : "100% Authentic Authorized Brands"}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                {isBn ? "সকল স্কিনকেয়ার ও বিউটি ব্র্যান্ডসমূহ" : "All Authentic Skincare & Beauty Brands"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 max-w-2xl">
                {isBn
                  ? "দক্ষিণ কোরিয়া, যুক্তরাজ্য, যুক্তরাষ্ট্র ও জাপানের সেরা কসমেটিক্স এবং স্কিনকেয়ার ব্র্যান্ডগুলো থেকে আপনার পছন্দের আসল পণ্যটি বেছে নিন।"
                  : "Discover certified 100% genuine skincare and cosmetics from top South Korean, UK, US & Japanese dermatological brands."}
              </p>
            </div>

            {/* Total Brands Counter Badge */}
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-pink-100 shadow-sm shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-[#e91e63] font-black text-base">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {isBn ? "মোট ব্র্যান্ড" : "Total Brands"}
                </p>
                <p className="text-lg font-black text-gray-900 leading-tight">
                  {toBn(brands.length)} {isBn ? "টি ব্র্যান্ড" : "Brands"}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="pt-2">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isBn
                    ? "ব্র্যান্ডের নাম বা উপাদান লিখে খুঁজুন (যেমন: COSRX, The Ordinary, CeraVe)..."
                    : "Search brands by name (e.g. COSRX, The Ordinary, CeraVe, Anua)..."
                }
                className="w-full rounded-2xl border-2 border-pink-200 bg-white pl-12 pr-10 py-3.5 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#e91e63] focus:outline-none focus:ring-4 focus:ring-pink-500/10 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* A-Z Alphabetical Navigation Bar */}
          <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedLetter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 ${
                selectedLetter === "ALL"
                  ? "bg-[#e91e63] text-white shadow-xs"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-[#e91e63]"
              }`}
            >
              {isBn ? "সকল (All)" : "ALL"}
            </button>
            {alphabetLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  selectedLetter === letter
                    ? "bg-[#e91e63] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-[#e91e63]"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Search Results Summary Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#e91e63]" />
            <h2 className="text-sm font-extrabold text-gray-800">
              {searchQuery || selectedLetter !== "ALL"
                ? isBn
                  ? `খোঁজের ফলাফল (${toBn(filteredBrands.length)}টি ব্র্যান্ড পাওয়া গেছে)`
                  : `Filtered Results (${filteredBrands.length} brands found)`
                : isBn
                ? "আমাদের সকল অথেনটিক ব্র্যান্ড কালেকশন"
                : "Explore All Authentic Brand Collections"}
            </h2>
          </div>

          {(searchQuery || selectedLetter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedLetter("ALL");
              }}
              className="text-xs font-bold text-[#e91e63] hover:underline flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              {isBn ? "ফিল্টার রিসেট করুন" : "Reset Filters"}
            </button>
          )}
        </div>

        {/* Brand Cards Grid */}
        {filteredBrands.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-[#e91e63]">
              <Search className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isBn ? "কোনো ব্র্যান্ড খুঁজে পাওয়া যায়নি" : "No brands found matching your search"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {isBn
                  ? `"${searchQuery}" এর সাথে কোনো ব্র্যান্ড মিলেনি। অনুগ্রহ করে বানানের সঠিকতা চেক করুন বা ফিল্টার রিসেট করুন।`
                  : `We couldn't find any brand matching "${searchQuery}". Please check your spelling or clear filters.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedLetter("ALL");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e91e63] text-white text-xs font-bold hover:bg-pink-700 transition-colors shadow-xs"
            >
              {isBn ? "সকল ব্র্যান্ড দেখুন" : "View All Brands"}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedBrands.map(([letter, groupList]) => (
              <div key={letter} className="space-y-4">
                {/* Alphabet Section Marker */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e91e63] text-white text-sm font-black shadow-2xs">
                    {letter}
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {toBn(groupList.length)} {isBn ? "টি ব্র্যান্ড" : "Brands"}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Brands Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {groupList.map((brand) => {
                    return (
                      <Link
                        key={brand.id}
                        href={`/brands/${brand.slug}`}
                        className="group relative flex flex-col items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[#e91e63] hover:shadow-lg shadow-2xs overflow-hidden"
                      >
                        {/* Verified Guarantee Badge */}
                        <div className="w-full flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            100% {isBn ? "আসল" : "Original"}
                          </span>
                          {brand.product_count > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded-md border border-pink-100">
                              <Package className="h-2.5 w-2.5" />
                              {toBn(brand.product_count)}
                            </span>
                          )}
                        </div>

                        {/* Brand Logo Box */}
                        <div className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-50/70 p-2.5 border border-gray-100 group-hover:bg-pink-50/40 group-hover:border-pink-200 transition-all">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-2xs group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <span className="font-black text-[#e91e63] text-xl tracking-wider">
                              {brand.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Brand Details */}
                        <div className="mt-3 w-full space-y-1">
                          <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#e91e63] transition-colors line-clamp-1">
                            {brand.name}
                          </h3>
                          {brand.description ? (
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight min-h-[24px]">
                              {brand.description}
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">
                              {isBn ? "অথেনটিক স্কিনকেয়ার কালেকশন" : "Authentic Skincare Collection"}
                            </p>
                          )}
                        </div>

                        {/* Action CTA Button */}
                        <div className="mt-3.5 w-full pt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-[11px] font-bold text-[#e91e63] group-hover:text-pink-700">
                          <span>{isBn ? "কালেকশন দেখুন" : "View Products"}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
