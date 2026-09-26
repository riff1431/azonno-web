"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ArrowUpDown,
  Filter,
  DollarSign,
  Search,
  Globe,
  Droplets,
  Zap,
  Tag,
} from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { Button } from "@/components/shared/ui/button";
import { cn, getShortProductId } from "@/lib/utils";
import { trackViewItemList } from "@/lib/analytics/datalayer";
import { useLanguage } from "@/context/language-context";

interface ProductsListingClientProps {
  products: ProductCardData[];
  fallbackProducts?: ProductCardData[];
  isFallbackApplied?: boolean;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
  currentCategory?: string;
  currentType?: string;
  currentSubcategory?: string;
  currentDiscount?: boolean;
  currentBrand?: string;
  currentTag?: string;
  currentSort?: string;
  currentSearch?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentSkinType?: string;
  currentSkinConcern?: string;
  currentKeyActive?: string;
  currentOrigin?: string;
  currentInStock?: boolean;
  enableBeautyFilters?: boolean;
  customSkinTypes?: string[];
  customSkinConcerns?: string[];
  customKeyActives?: string[];
}

const TYPE_NAME_MAP: Record<string, { en: string; bn: string }> = {
  lotion: { en: "Lotion & Creams", bn: "  " },
  moisturizer: { en: "Moisturizer & Hydration", bn: "" },
  cleanser: { en: "Cleanser & Facewash", bn: "  " },
  wash: { en: "Body Wash & Shower Gel", bn: "    " },
  serum: { en: "Serum & Essence", bn: "Oxford Shirt  " },
  sunscreen: { en: "Sunscreen & SPF", bn: "Panjabi (SPF)" },
  toner: { en: "Toner & Mist", bn: "  " },
  oil: { en: "Hair Oil & Serum", bn: " " },
  shampoo: { en: "Shampoo & Scalp Care", bn: "" },
  conditioner: { en: "Conditioner & Mask", bn: "" },
  scalp: { en: "Scalp Scrub", bn: " " },
  styling: { en: "Hair Styling", bn: " :00" },
  scrub: { en: "Body Scrub", bn: " " },
  "hand-foot": { en: "Hand & Foot Care", bn: "   " },
  diaper: { en: "Diaper Care", bn: " " },
  maternity: { en: "Mom Care", bn: " " },
  foundation: { en: "Foundation & BB Cream", bn: "" },
  lipstick: { en: "Lipstick & Lip Tint", bn: "items" },
  eyeliner: { en: "Eyeliner & Kajal", bn: "" },
  eyes: { en: "Eyeshadow & Mascara", bn: "  " },
  powder: { en: "Setting Powder & Spray", bn: "  " },
  blush: { en: "Blush & Highlighter", bn: "  :00" },
  women: { en: "Women's Fragrance", bn: "" },
  men: { en: "Men's Cologne", bn: " " },
  mist: { en: "Body Mist", bn: " " },
  attar: { en: "Attar & Perfume Oil", bn: "  " },
};

const PRICE_PRESETS = [
  { label: "All Prices", min: null, max: null },
  { label: "Under ৳500", min: null, max: "500" },
  { label: "৳500 - ৳1,000", min: "500", max: "1000" },
  { label: "৳1,000 - ৳2,000", min: "1000", max: "2000" },
  { label: "Above ৳2,000", min: "2000", max: null },
];

const SKIN_CONCERNS = [
  "Clear Skin & Blemishes",
  "Brightening & Even Tone",
  "Smoothing & Firming Care",
  "Hydration & Moisture",
  "Pore & Oil Care",
  "Redness & Soothing",
  "Sun Protection (SPF)",
  "Oil Balance & Freshness",
  "Barrier Care & Comfort",
];

const SKIN_CONCERN_MAP: Record<string, { en: string; bn: string }> = {
  "Clear Skin & Blemishes": { en: "Clear Skin & Blemishes", bn: "Clean Cotton   " },
  "Acne & Blemishes": { en: "Clear Skin & Blemishes", bn: "Clean Cotton   " },
  "Brightening & Even Tone": { en: "Brightening & Even Tone", bn: "    " },
  "Brightening & Pigmentation": { en: "Brightening & Even Tone", bn: "    " },
  "Smoothing & Firming Care": { en: "Smoothing & Firming Care", bn: "  :00:00 " },
  "Smooth Lines & Firmness": { en: "Smoothing & Firming Care", bn: "  :00:00 " },
  "Anti-Aging & Wrinkles": { en: "Smoothing & Firming Care", bn: "  :00:00 " },
  "Hydration & Moisture": { en: "Hydration & Moisture", bn: "  " },
  "Dryness & Hydration": { en: "Hydration & Moisture", bn: "  " },
  "Pore & Oil Care": { en: "Pore & Oil Care", bn: "    " },
  "Pore Minimizing": { en: "Pore & Oil Care", bn: "    " },
  "Redness & Soothing": { en: "Redness & Soothing", bn: "    " },
  "Redness & Rosacea": { en: "Redness & Soothing", bn: "    " },
  "Sun Protection": { en: "Sun Protection (SPF)", bn: "  (Sun Protection / SPF)" },
  "Sun Protection (SPF)": { en: "Sun Protection (SPF)", bn: "  (Sun Protection / SPF)" },
  "Oil Control": { en: "Oil Balance & Freshness", bn: "    " },
  "Oil Balance & Freshness": { en: "Oil Balance & Freshness", bn: "    " },
  "Barrier Care & Comfort": { en: "Barrier Care & Comfort", bn: "    " },
  "Barrier Repair": { en: "Barrier Care & Comfort", bn: "    " },
  "Barrier Care": { en: "Barrier Care & Comfort", bn: "    " },
};

const SKIN_TYPES = [
  "Oily",
  "Dry",
  "Combination",
  "Sensitive",
  "Normal",
  "All Skin Types",
];

const SKIN_TYPE_MAP: Record<string, { en: string; bn: string }> = {
  "Oily": { en: "Oily", bn: "Cotton Twill" },
  "Dry": { en: "Dry", bn: "Linen Blend" },
  "Combination": { en: "Combination", bn: "Premium Oxford /  Cotton" },
  "Sensitive": { en: "Sensitive", bn: "items Cotton" },
  "Normal": { en: "Normal", bn: " Cotton" },
  "All Skin Types": { en: "All Skin Types", bn: "All Sizes (S to XXL)" },
};

const KEY_ACTIVES = [
  "Niacinamide",
  "Hyaluronic Acid",
  "Salicylic Acid (BHA)",
  "Glycolic Acid (AHA)",
  "Vitamin C",
  "Retinol",
  "Centella Asiatica (Cica)",
  "Snail Secretion Filtrate",
  "Ceramides",
  "Tea Tree",
  "Alpha Arbutin",
];

const ORIGINS = [
  { value: "South Korea", flag: "🇰🇷", en: "South Korea (K-Beauty)", bn: "  (-items)" },
  { value: "Japan", flag: "🇯🇵", en: "Japan (J-Beauty)", bn: " (-items)" },
  { value: "United Kingdom", flag: "🇬🇧", en: "United Kingdom (UK)", bn: "added (UK)" },
  { value: "United States", flag: "🇺🇸", en: "United States (USA)", bn: "added (USA)" },
  { value: "France", flag: "🇫🇷", en: "France (French Beauty)", bn: " (France)" },
  { value: "Germany", flag: "🇩🇪", en: "Germany", bn: " (Germany)" },
  { value: "Canada", flag: "🇨🇦", en: "Canada", bn: " (Canada)" },
  { value: "Thailand", flag: "🇹🇭", en: "Thailand", bn: " (Thailand)" },
  { value: "Italy", flag: "🇮🇹", en: "Italy", bn: " (Italy)" },
  { value: "Bangladesh", flag: "🇧🇩", en: "Bangladesh", bn: "English (Bangladesh)" },
  { value: "India", flag: "🇮🇳", en: "India", bn: " (India)" },
];

export function ProductsListingClient({
  products,
  fallbackProducts = [],
  isFallbackApplied = false,
  categories,
  brands,
  tags = [],
  currentCategory,
  currentType,
  currentSubcategory,
  currentDiscount,
  currentBrand,
  currentTag,
  currentSort,
  currentSearch,
  currentMinPrice,
  currentMaxPrice,
  currentSkinType,
  currentSkinConcern,
  currentKeyActive,
  currentOrigin,
  currentInStock,
  enableBeautyFilters = true,
  customSkinTypes = [],
  customSkinConcerns = [],
  customKeyActives = [],
}: ProductsListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { language, t, toBn, formatPriceBn } = useLanguage();

  const allSkinConcerns = useMemo(() => {
    return [...new Set([...SKIN_CONCERNS, ...(customSkinConcerns || [])])];
  }, [customSkinConcerns]);

  const allSkinTypes = useMemo(() => {
    return [...new Set([...SKIN_TYPES, ...(customSkinTypes || [])])];
  }, [customSkinTypes]);

  const allKeyActives = useMemo(() => {
    return [...new Set([...KEY_ACTIVES, ...(customKeyActives || [])])];
  }, [customKeyActives]);

  // Track view_item_list event on product catalog load
  useEffect(() => {
    if (products && products.length > 0) {
      const listName = currentCategory
        ? `Category: ${categories.find((c) => c.slug === currentCategory)?.name || currentCategory}`
        : currentBrand
        ? `Brand: ${brands.find((b) => b.slug === currentBrand)?.name || currentBrand}`
        : currentTag
        ? `Tag: #${tags.find((t) => t.slug === currentTag || t.name === currentTag)?.name || currentTag}`
        : currentSkinConcern
        ? `Concern: ${currentSkinConcern}`
        : currentSearch
        ? `Search: "${currentSearch}"`
        : "Product Catalog";

      trackViewItemList(
        products.map((p, idx) => ({
          item_id: getShortProductId(p),
          item_name: p.name,
          item_brand: p.brand_name || undefined,
          item_category: p.category_name || undefined,
          price: p.sale_price ?? p.regular_price,
          index: idx + 1,
        })),
        listName
      );
    }
  }, [products, currentCategory, currentBrand, currentTag, currentSkinConcern, currentSearch]);

  // Custom price input local state
  const [customMin, setCustomMin] = useState(currentMinPrice || "");
  const [customMax, setCustomMax] = useState(currentMaxPrice || "");

  // Search within brand, category & tag lists
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [catSearchTerm, setCatSearchTerm] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  const activeFiltersCount = [
    currentCategory,
    currentType || currentSubcategory ? "type" : null,
    currentDiscount ? "discount" : null,
    currentBrand,
    currentTag,
    currentSearch,
    currentSkinType,
    currentSkinConcern,
    currentKeyActive,
    currentOrigin,
    currentInStock ? "instock" : null,
    currentMinPrice || currentMaxPrice ? "price" : null,
  ].filter(Boolean).length;

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const updatePriceRange = (min: string | null, max: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set("min_price", min);
    else params.delete("min_price");

    if (max) params.set("max_price", max);
    else params.delete("max_price");

    router.push(`/products?${params.toString()}`);
    setMobileFilterOpen(false);
  };

  const applyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    updatePriceRange(customMin.trim() || null, customMax.trim() || null);
  };

  const handleSortChange = (newSort: string) => {
    updateParam("sort", newSort === "default" ? null : newSort);
  };

  const clearAllFilters = () => {
    router.push("/products");
    setCustomMin("");
    setCustomMax("");
    setMobileFilterOpen(false);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearchTerm.toLowerCase())
  );

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
  );

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const pricePresets = [
    { label: t("catalog", "allPrices"), min: null, max: null },
    { label: language === "bn" ? "500 :00 " : "Under ৳500", min: null, max: "500" },
    { label: language === "bn" ? "৳500 - ৳1,000" : "৳500 - ৳1,000", min: "500", max: "1000" },
    { label: language === "bn" ? "৳1,000 - ৳2,000" : "৳1,000 - ৳2,000", min: "1000", max: "2000" },
    { label: language === "bn" ? "2,000 :00 " : "Above ৳2,000", min: "2000", max: null },
  ];

  // Filter content component reused in both desktop sidebar & mobile drawer
  const FilterContent = () => (
    <div className="space-y-6">
      {/* 1. FILTER BY SKIN CONCERN (Beauty Exclusive) */}
      {enableBeautyFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> {t("catalog", "skinConcern")}
            </span>
            {currentSkinConcern && (
              <button
                type="button"
                onClick={() => updateParam("skin_concern", null)}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                {t("catalog", "resetFilters")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allSkinConcerns.map((concern) => {
              const isSelected = currentSkinConcern === concern;
              const label = language === "bn" ? (SKIN_CONCERN_MAP[concern]?.bn || concern) : (SKIN_CONCERN_MAP[concern]?.en || concern);
              return (
                <button
                  key={concern}
                  type="button"
                  onClick={() => {
                    updateParam("skin_concern", isSelected ? null : concern);
                    setMobileFilterOpen(false);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold transition-all border text-left",
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  )}
                >
                  {isSelected && <Check className="inline-block h-3 w-3 mr-1 -mt-0.5" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FILTER BY SKIN TYPE (Beauty Exclusive) */}
      {enableBeautyFilters && (
        <div className="space-y-3 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-[#1D6474]" /> {t("catalog", "skinType")}
            </span>
            {currentSkinType && (
              <button
                type="button"
                onClick={() => updateParam("skin_type", null)}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                {t("catalog", "resetFilters")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allSkinTypes.map((type) => {
              const isSelected = currentSkinType === type;
              const label = language === "bn" ? (SKIN_TYPE_MAP[type]?.bn || type) : (SKIN_TYPE_MAP[type]?.en || type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    updateParam("skin_type", isSelected ? null : type);
                    setMobileFilterOpen(false);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold transition-all border",
                    isSelected
                      ? "bg-[#164E63] text-white border-pink-600 shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  )}
                >
                  {isSelected && <Check className="inline-block h-3 w-3 mr-1 -mt-0.5" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. KEY ACTIVE INGREDIENTS */}
      {enableBeautyFilters && (
        <div className="space-y-3 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-600" /> {t("catalog", "keyActives")}
            </span>
            {currentKeyActive && (
              <button
                type="button"
                onClick={() => updateParam("key_actives", null)}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                {t("catalog", "resetFilters")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {allKeyActives.map((active) => {
              const isSelected = currentKeyActive === active;
              return (
                <button
                  key={active}
                  type="button"
                  onClick={() => {
                    updateParam("key_actives", isSelected ? null : active);
                    setMobileFilterOpen(false);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold transition-all border",
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  )}
                >
                  {isSelected && <Check className="inline-block h-3 w-3 mr-1 -mt-0.5" />}
                  {active}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. COUNTRY OF ORIGIN */}
      {enableBeautyFilters && (
        <div className="space-y-3 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-600" /> {t("catalog", "origin")}
            </span>
            {currentOrigin && (
              <button
                type="button"
                onClick={() => updateParam("origin", null)}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                {t("catalog", "resetFilters")}
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {ORIGINS.map((orig) => {
              const isSelected = currentOrigin === orig.value;
              const label = language === "bn" ? orig.bn : orig.en;
              return (
                <button
                  key={orig.value}
                  type="button"
                  onClick={() => {
                    updateParam("origin", isSelected ? null : orig.value);
                    setMobileFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors text-left",
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm">{orig.flag}</span>
                    <span>{label}</span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. FILTER BY PRICE */}
      <div className="space-y-3 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <span className="text-[#1D6474]">৳</span> {t("catalog", "priceRange")}
          </span>
          {(currentMinPrice || currentMaxPrice) && (
            <button
              type="button"
              onClick={() => updatePriceRange(null, null)}
              className="text-[10px] font-bold text-red-600 hover:underline"
            >
              {language === "bn" ? " Reset" : "Reset Price"}
            </button>
          )}
        </div>

        {/* Quick Price Preset Chips */}
        <div className="grid grid-cols-1 gap-1.5">
          {pricePresets.map((preset, idx) => {
            const isSelected =
              preset.min === (currentMinPrice || null) &&
              preset.max === (currentMaxPrice || null);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCustomMin(preset.min || "");
                  setCustomMax(preset.max || "");
                  updatePriceRange(preset.min, preset.max);
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all text-left",
                  isSelected
                    ? "bg-teal-50/60 text-[#1D6474] border border-teal-200 shadow-2xs"
                    : "text-gray-700 bg-gray-50/70 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#1D6474]" />}
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Inputs */}
        <form onSubmit={applyCustomPrice} className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">৳</span>
              <input
                type="number"
                placeholder={language === "bn" ? "" : "Min"}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-full rounded-xl border pl-6 pr-2 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
            <span className="text-gray-400 font-bold text-xs">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">৳</span>
              <input
                type="number"
                placeholder={language === "bn" ? "" : "Max"}
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="w-full rounded-xl border pl-6 pr-2 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 py-1.5 text-[11px] font-bold text-white hover:bg-[#1D6474] transition-colors"
          >
            {language === "bn" ? " :00  " : "Apply Price Filter"}
          </button>
        </form>
      </div>

      {/* 6. FILTER BY BRAND */}
      <div className="space-y-3 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-900">
            {t("catalog", "brands")}
          </span>
          {currentBrand && (
            <button
              type="button"
              onClick={() => updateParam("brand", null)}
              className="text-[10px] font-bold text-red-600 hover:underline"
            >
              {t("catalog", "resetFilters")}
            </button>
          )}
        </div>

        {/* Brand Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder={language === "bn" ? "Brand Search..." : "Search brands..."}
            value={brandSearchTerm}
            onChange={(e) => setBrandSearchTerm(e.target.value)}
            className="w-full rounded-lg border pl-7 pr-2 py-1 text-[11px] focus:outline-none"
          />
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              updateParam("brand", null);
              setMobileFilterOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors text-left",
              !currentBrand
                ? "bg-teal-50/60 text-[#1D6474] font-bold border border-teal-200 shadow-2xs"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span>{language === "bn" ? "All Brand" : "All Brands"}</span>
            {!currentBrand && <Check className="h-3.5 w-3.5 text-[#1D6474]" />}
          </button>

          {filteredBrands.map((b) => {
            const isSelected = currentBrand === b.slug;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  updateParam("brand", isSelected ? null : b.slug);
                  setMobileFilterOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors text-left",
                  isSelected
                    ? "bg-teal-50/60 text-[#1D6474] font-bold border border-teal-200 shadow-2xs"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <span>{b.name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#1D6474]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. PRODUCT CATEGORIES */}
      <div className="space-y-3 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-900">
            {t("catalog", "categories")}
          </span>
          {currentCategory && (
            <button
              type="button"
              onClick={() => updateParam("category", null)}
              className="text-[10px] font-bold text-red-600 hover:underline"
            >
              {t("catalog", "resetFilters")}
            </button>
          )}
        </div>

        {categories.length > 6 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder={language === "bn" ? "Category Search..." : "Search categories..."}
              value={catSearchTerm}
              onChange={(e) => setCatSearchTerm(e.target.value)}
              className="w-full rounded-lg border pl-7 pr-2 py-1 text-[11px] focus:outline-none"
            />
          </div>
        )}

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              updateParam("category", null);
              setMobileFilterOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors text-left",
              !currentCategory
                ? "bg-teal-50/60 text-[#1D6474] font-bold border border-teal-200 shadow-2xs"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span>{language === "bn" ? "All Category" : "All Categories"}</span>
            {!currentCategory && <Check className="h-3.5 w-3.5 text-[#1D6474]" />}
          </button>

          {filteredCategories.map((c) => {
            const isSelected = currentCategory === c.slug;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  updateParam("category", isSelected ? null : c.slug);
                  setMobileFilterOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors text-left",
                  isSelected
                    ? "bg-teal-50/60 text-[#1D6474] font-bold border border-teal-200 shadow-2xs"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <span>{c.name}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#1D6474]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. PRODUCT TAGS */}
      {tags.length > 0 && (
        <div className="space-y-3 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[#1D6474]" /> {language === "bn" ? "" : "Tags"}
            </span>
            {currentTag && (
              <button
                type="button"
                onClick={() => updateParam("tag", null)}
                className="text-[10px] font-bold text-red-600 hover:underline"
              >
                {t("catalog", "resetFilters")}
              </button>
            )}
          </div>

          {tags.length > 6 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder={language === "bn" ? " Search..." : "Search tags..."}
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                className="w-full rounded-lg border pl-7 pr-2 py-1 text-[11px] focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredTags.map((tg) => {
              const isSelected = currentTag === tg.slug || currentTag === tg.name;
              return (
                <button
                  key={tg.id}
                  type="button"
                  onClick={() => {
                    updateParam("tag", isSelected ? null : tg.slug);
                    setMobileFilterOpen(false);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold transition-all border text-left",
                    isSelected
                      ? "bg-[#1D6474] text-white border-[#1D6474] shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  )}
                >
                  {isSelected && <Check className="inline-block h-3 w-3 mr-1 -mt-0.5" />}
                  #{tg.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Mobile Filter & Sort Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 lg:hidden shadow-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileFilterOpen(true)}
          className="flex-1 rounded-xl text-xs font-extrabold border-gray-200 hover:bg-teal-50/60 hover:text-[#1D6474] hover:border-teal-200"
        >
          <Filter className="h-3.5 w-3.5 mr-1.5 text-[#1D6474]" />
          {t("catalog", "filterBy")} {activeFiltersCount > 0 && `(${toBn(activeFiltersCount)})`}
        </Button>

        <div className="relative flex-1">
          <select
            value={currentSort || "default"}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-gray-800 shadow-2xs focus:outline-none"
          >
            <option value="default">{t("catalog", "sortDefault")}</option>
            <option value="price_asc">{t("catalog", "sortPriceAsc")}</option>
            <option value="price_desc">{t("catalog", "sortPriceDesc")}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>

      {/* 2. Main Layout Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 items-start">
        {/* Desktop Sidebar (Sticky, Left 1 Col) */}
        <aside className="hidden lg:block lg:col-span-1 rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sticky top-24 max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#1D6474]" /> {t("catalog", "filterBy")}
            </h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-[#1D6474] hover:underline"
              >
                {t("catalog", "resetFilters")} ({toBn(activeFiltersCount)})
              </button>
            )}
          </div>

          <div className="pt-4">
            <FilterContent />
          </div>
        </aside>

        {/* Product Grid Area (Right 3 Cols) */}
        <main className="lg:col-span-3 space-y-4">
          {/* Desktop Sort Header & Active Filter Chips */}
          <div className="hidden lg:flex items-center justify-between pb-2">
            <div className="text-xs font-bold text-gray-500">
              {language === "bn" ? (
                <>Total <span className="font-extrabold text-gray-900">{toBn(products.length)}</span> items Products  </>
              ) : (
                <>Showing <span className="font-extrabold text-gray-900">{products.length}</span> authentic products</>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">{t("catalog", "sortBy")}:</span>
              <div className="relative">
                <select
                  value={currentSort || "default"}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs font-extrabold text-gray-800 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="default">{t("catalog", "sortDefault")}</option>
                  <option value="price_asc">{t("catalog", "sortPriceAsc")}</option>
                  <option value="price_desc">{t("catalog", "sortPriceDesc")}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-teal-50/60/50 border border-teal-100 p-2.5 rounded-2xl">
              <span className="text-[11px] font-bold text-pink-950">
                {language === "bn" ? "Active :00:" : "Active Filters:"}
              </span>
              {currentCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-[#164E63] shadow-2xs">
                  {t("catalog", "categories")}: {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                  <button onClick={() => updateParam("category", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(currentType || currentSubcategory) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-700 shadow-2xs">
                  {language === "bn" ? ":" : "Type:"}{" "}
                  {currentType
                    ? (language === "bn" ? (TYPE_NAME_MAP[currentType]?.bn || currentType) : (TYPE_NAME_MAP[currentType]?.en || currentType))
                    : currentSubcategory}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("type");
                      params.delete("subcategory");
                      router.push(`/products?${params.toString()}`);
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentDiscount && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-2xs">
                  {language === "bn" ? ":   Discount" : "Offer: Deals & Discounts"}
                  <button onClick={() => updateParam("discount", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentSearch && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700 shadow-2xs">
                  {language === "bn" ? ":" : "Search:"} &ldquo;{currentSearch}&rdquo;
                  <button onClick={() => updateParam("search", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentBrand && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-[#164E63] shadow-2xs">
                  {t("catalog", "brands")}: {brands.find((b) => b.slug === currentBrand)?.name || currentBrand}
                  <button onClick={() => updateParam("brand", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentTag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-[#164E63] shadow-2xs">
                  {language === "bn" ? ":" : "Tag:"} #{tags.find((t) => t.slug === currentTag || t.name === currentTag)?.name || currentTag}
                  <button onClick={() => updateParam("tag", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentSkinConcern && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-700 shadow-2xs">
                  {t("catalog", "skinConcern")}: {language === "bn" ? (SKIN_CONCERN_MAP[currentSkinConcern]?.bn || currentSkinConcern) : (SKIN_CONCERN_MAP[currentSkinConcern]?.en || currentSkinConcern)}
                  <button onClick={() => updateParam("skin_concern", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentSkinType && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-[#164E63] shadow-2xs">
                  {t("catalog", "skinType")}: {language === "bn" ? (SKIN_TYPE_MAP[currentSkinType]?.bn || currentSkinType) : (SKIN_TYPE_MAP[currentSkinType]?.en || currentSkinType)}
                  <button onClick={() => updateParam("skin_type", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentKeyActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 shadow-2xs">
                  {t("catalog", "keyActives")}: {currentKeyActive}
                  <button onClick={() => updateParam("key_actives", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentOrigin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                  {t("catalog", "origin")}: {language === "bn" ? (ORIGINS.find((o) => o.value === currentOrigin)?.bn || currentOrigin) : (ORIGINS.find((o) => o.value === currentOrigin)?.en || currentOrigin)}
                  <button onClick={() => updateParam("origin", null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-[#164E63] shadow-2xs">
                  {t("catalog", "priceRange")}: {currentMinPrice ? formatPriceBn(Number(currentMinPrice)) : (language === "bn" ? "" : "0")} – {currentMaxPrice ? formatPriceBn(Number(currentMaxPrice)) : (language === "bn" ? "" : "Any")}
                  <button onClick={() => updatePriceRange(null, null)} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[11px] font-extrabold text-red-600 hover:underline ml-auto"
              >
                {t("catalog", "resetFilters")}
              </button>
            </div>
          )}

          {/* Fallback Notice */}
          {isFallbackApplied && products.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-teal-50/60/70 border border-teal-200 p-3 text-xs text-pink-900 font-bold">
              <Sparkles className="h-4 w-4 text-[#1D6474] shrink-0" />
              <span>
                {language === "bn"
                  ? ` Category  items Products (${toBn(products.length)} items )`
                  : `Showing all available authentic products in this category (${products.length} items)`}
              </span>
            </div>
          )}

          {/* Product Cards Grid */}
          {products.length === 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-8 sm:p-12 text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50/60 text-[#1D6474]">
                  <ShoppingBag className="h-8 w-8 stroke-1" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-gray-900">{t("catalog", "noProductsFound")}</h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    {language === "bn"
                      ? "   :00   Products ।  :00 :00  or  Popular items  View।"
                      : "No products currently found for this exact filter. Try removing some filters or explore our authentic bestsellers below."}
                  </p>
                </div>
                <Button
                  onClick={clearAllFilters}
                  className="rounded-xl bg-[#1D6474] hover:bg-[#164E63] text-white font-extrabold text-xs shadow-xs"
                >
                  {t("catalog", "resetFilters")}
                </Button>
              </div>

              {fallbackProducts && fallbackProducts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#1D6474]" />
                    <h3 className="text-sm sm:text-base font-black text-gray-900">
                      {language === "bn" ? " Popular items Products:" : "Explore Our Authentic Bestsellers:"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
                    {fallbackProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 3. Mobile Filter Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#1D6474]" />
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">
                  {t("catalog", "filterBy")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
              <FilterContent />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <Button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full rounded-xl bg-[#1D6474] hover:bg-[#164E63] text-white font-extrabold text-xs"
              >
                {language === "bn"
                  ? `${toBn(products.length)} items Products View`
                  : `View ${products.length} Results`}
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="w-full text-xs font-bold text-gray-500 hover:text-red-600"
                >
                  {t("catalog", "resetFilters")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
