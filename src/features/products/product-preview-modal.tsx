"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  Tablet,
  Monitor,
  Heart,
  Star,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  FileText,
  BookOpen,
  Beaker,
  Check,
  Plus,
  Minus,
  Maximize2,
  ExternalLink,
  Layers,
  Tag,
  Clock,
  Send,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    name: string;
    slug: string;
    sku: string;
    product_type: string;
    brand_id: string;
    status: string;
    short_description: string;
    description: string;
    benefits: string;
    usage: string;
    ingredients_specifications: string;
    origin_country: string;
    country: string;
    routine_step: string;
    skin_type: string[];
    skin_concern: string[];
    key_actives: string[];
    regular_price: number;
    sale_price: number;
    weight: number;
    initial_stock: number;
    expiry_date?: string;
  };
  galleryImages: string[];
  brandName?: string;
  categoryNames?: string[];
  variants?: Array<{
    sku: string;
    regular_price: number;
    sale_price: number;
    attribute_labels: string[];
  }>;
  comboConfig?: {
    enabled: boolean;
    title: string;
    discount_type: "percentage" | "fixed" | "free_shipping";
    discount_value: number;
    bundle_product_ids: string[];
    badge_text: string;
  };
  catalogProducts?: Array<{
    id: string;
    name: string;
    regular_price: number;
    sale_price?: number | null;
    og_image_url?: string | null;
  }>;
  onPublish?: () => void;
}

function getCountryFlagEmoji(countryName?: string | null): string {
  if (!countryName) return "✨";
  const c = countryName.toLowerCase();
  if (c.includes("korea")) return "🇰🇷";
  if (c.includes("japan")) return "🇯🇵";
  if (c.includes("uk") || c.includes("kingdom") || c.includes("britain")) return "🇬🇧";
  if (c.includes("usa") || c.includes("states") || c.includes("america")) return "🇺🇸";
  if (c.includes("france")) return "🇫🇷";
  if (c.includes("germany")) return "🇩🇪";
  if (c.includes("thailand")) return "🇹🇭";
  if (c.includes("canada")) return "🇨🇦";
  if (c.includes("bangladesh")) return "🇧🇩";
  if (c.includes("india")) return "🇮🇳";
  if (c.includes("italy")) return "🇮🇹";
  if (c.includes("australia")) return "🇦🇺";
  return "🌍";
}

export function ProductPreviewModal({
  isOpen,
  onClose,
  form,
  galleryImages,
  brandName,
  categoryNames = [],
  variants = [],
  comboConfig,
  catalogProducts = [],
  onPublish,
}: ProductPreviewModalProps) {
  const { lang } = useAdminLang();
  const isBn = lang === "bn";

  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "benefits" | "usage" | "ingredients">("description");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [justAddedMsg, setJustAddedMsg] = useState(false);

  if (!isOpen) return null;

  const allImages = galleryImages.length > 0 ? galleryImages : ["/product_placeholder.svg"];
  const currentImage = allImages[activeImageIndex] || allImages[0];

  const currentVariant = variants[selectedVariantIndex];
  const regularPrice = currentVariant ? currentVariant.regular_price : Number(form.regular_price) || 0;
  const salePrice = currentVariant ? currentVariant.sale_price : Number(form.sale_price) || 0;
  const effectivePrice = salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice;

  const discountPercent =
    salePrice > 0 && regularPrice > salePrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const origin = form.origin_country || form.country || "South Korea";
  const flag = getCountryFlagEmoji(origin);

  // Combo bundle items
  const bundleItems = (comboConfig?.bundle_product_ids || [])
    .map((id) => catalogProducts.find((p) => p.id === id))
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    regular_price: number;
    sale_price?: number | null;
    og_image_url?: string | null;
  }>;

  const handleSimulateAddToCart = () => {
    setJustAddedMsg(true);
    setTimeout(() => setJustAddedMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-100 rounded-3xl border border-gray-300 shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-2.5 shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-900">
              {isBn ? "লাইভ স্টোরফ্রন্ট প্রিভিউ" : "Storefront Live Preview"}
            </span>
            <span className="rounded-md bg-pink-100 text-[#e91e63] px-2 py-0.5 text-[10px] font-bold">
              {form.status.toUpperCase()}
            </span>
          </div>

          {/* Device Responsive View Switcher */}
          <div className="flex items-center rounded-xl bg-gray-100 p-1 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={cn(
                "px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all",
                deviceMode === "desktop" ? "bg-white text-[#e91e63] shadow-xs font-black" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isBn ? "ডেস্কটপ" : "Desktop"}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("tablet")}
              className={cn(
                "px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all",
                deviceMode === "tablet" ? "bg-white text-[#e91e63] shadow-xs font-black" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isBn ? "ট্যাবলেট" : "Tablet"}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={cn(
                "px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all",
                deviceMode === "mobile" ? "bg-white text-[#e91e63] shadow-xs font-black" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isBn ? "মোবাইল" : "Mobile"}</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {onPublish && (
              <button
                type="button"
                onClick={() => {
                  onPublish();
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-[#e91e63] hover:bg-[#d81b60] text-white text-xs font-black shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isBn ? "পাবলিশ / সেভ করুন" : "Publish Product"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center bg-zinc-200/60">
          <div
            className={cn(
              "bg-white transition-all duration-300 shadow-xl overflow-hidden flex flex-col",
              deviceMode === "desktop" && "w-full max-w-5xl rounded-3xl",
              deviceMode === "tablet" && "w-[768px] rounded-3xl border-4 border-gray-800 shadow-2xl",
              deviceMode === "mobile" && "w-[390px] rounded-[36px] border-8 border-gray-900 shadow-2xl"
            )}
          >
            {/* Storefront Simulated Navigation Bar */}
            <div className="border-b border-gray-100 bg-white px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-[#e91e63]">Blush &amp; Budget</span>
                <span className="text-gray-300">|</span>
                <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
                  {brandName || "K-Beauty Brand"} &gt; {form.name || "Product Name"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Heart className="h-4 w-4 text-gray-400" />
                <ShoppingBag className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Product Detail Page Body */}
            <div className="p-4 sm:p-8 space-y-8 flex-1 overflow-y-auto">
              {justAddedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-black text-emerald-800 flex items-center justify-center gap-2 animate-in fade-in">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{isBn ? "প্রোডাক্টটি কার্টে সফলভাবে যোগ করা হয়েছে!" : "Product added to Cart (Preview Simulation)!"}</span>
                </div>
              )}

              {/* Main 2-Column Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start">
                {/* 1. Left Gallery Column */}
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gray-50 border border-gray-200/90 shadow-sm flex items-center justify-center group">
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 z-10 rounded-md bg-[#e91e63] px-2.5 py-1 text-xs font-black text-white shadow-md tracking-wider">
                        {discountPercent}% OFF
                      </span>
                    )}

                    <span className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow-md text-gray-700">
                      <Heart className="h-4 w-4" />
                    </span>

                    <img
                      src={currentImage}
                      alt={form.name || "Product Image"}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Free shipping banner */}
                    <div className="absolute bottom-0 inset-x-0 bg-[#e91e63] py-1.5 text-center text-white text-[11px] font-black uppercase tracking-wider">
                      {isBn ? "১০০% খাঁটি ও আসল আমদানিকৃত পণ্য" : "100% Certified Authentic & Fresh Batch"}
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  {allImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={cn(
                            "h-16 w-16 shrink-0 rounded-2xl overflow-hidden border-2 transition-all p-0.5 bg-white shadow-2xs cursor-pointer",
                            activeImageIndex === idx ? "border-[#e91e63] ring-2 ring-pink-500/20" : "border-gray-200 opacity-70 hover:opacity-100"
                          )}
                        >
                          <img src={img} alt="Thumbnail" className="w-full h-full object-cover rounded-xl" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Right Buy Box Column */}
                <div className="space-y-4 text-left">
                  {/* Brand & Origin Country */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {brandName ? (
                      <span className="rounded-full bg-pink-50 border border-pink-200 px-3 py-0.5 text-xs font-extrabold text-[#e91e63] uppercase tracking-wider">
                        {brandName}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-bold text-gray-600">
                        {isBn ? "অথেনটিক ব্র্যান্ড" : "Authentic Brand"}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                      <span>{flag}</span>
                      <span>{origin}</span>
                    </span>
                  </div>

                  {/* Product Title */}
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                    {form.name || (isBn ? "পণ্যের নাম এখানে প্রদর্শিত হবে" : "Product Title Will Render Here")}
                  </h1>

                  {/* Rating & SKU */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <Star className="h-3.5 w-3.5 fill-current text-amber-200" />
                      </div>
                      <span className="font-bold text-gray-800">5.0</span>
                      <span className="text-gray-400 font-medium">(14 Reviews)</span>
                    </div>

                    <span>•</span>
                    <span className="font-mono text-gray-500 font-bold">
                      SKU: {form.sku || "PRD-AUTO"}
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-[#e91e63]">
                        {formatPrice(effectivePrice)}
                      </span>
                      {salePrice > 0 && salePrice < regularPrice && (
                        <span className="text-base text-gray-400 line-through font-bold">
                          {formatPrice(regularPrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {isBn ? "ক্যাশ অন ডেলিভারি প্রযোজ্য • সারাদেশে দ্রুত হোম ডেলিভারি" : "Cash on Delivery Available • Express Fast Shipping"}
                    </p>
                  </div>

                  {/* Short Description */}
                  {form.short_description && (
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                      {form.short_description}
                    </p>
                  )}

                  {/* Beauty Routine Step & Key Actives */}
                  {(form.routine_step || form.key_actives?.length > 0 || form.skin_type?.length > 0) && (
                    <div className="p-3 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-2 text-xs">
                      {form.routine_step && (
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-700">{isBn ? "রুটিনের ধাপ:" : "Routine Step:"}</span>
                          <span className="font-bold text-[#e91e63] bg-white px-2 py-0.5 rounded-md border border-pink-200">
                            {form.routine_step}
                          </span>
                        </div>
                      )}

                      {form.key_actives && form.key_actives.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-black text-gray-700">{isBn ? "মূল উপাদান:" : "Key Actives:"}</span>
                          {form.key_actives.map((act) => (
                            <span key={act} className="px-2 py-0.5 bg-white rounded-md text-[11px] font-bold text-purple-700 border border-purple-200">
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variants Selector if variable product */}
                  {variants && variants.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-gray-700 block">
                        {isBn ? "ভ্যারিয়েন্ট বেছে নিন:" : "Select Variant / Size:"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((v, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedVariantIndex(idx)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                              selectedVariantIndex === idx
                                ? "bg-pink-50 text-[#e91e63] border-[#e91e63] ring-2 ring-pink-500/20"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <span>{v.attribute_labels?.join(" / ") || v.sku}</span>
                            <span className="block text-[10px] text-gray-500 font-mono">
                              {formatPrice(v.sale_price || v.regular_price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity & Add to Cart Controls */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      {/* Quantity counter */}
                      <div className="flex items-center rounded-2xl border border-gray-300 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="p-1.5 rounded-xl text-gray-600 hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-xs font-black text-gray-900">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="p-1.5 rounded-xl text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Add to Cart button */}
                      <button
                        type="button"
                        onClick={handleSimulateAddToCart}
                        className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-pink-50 text-[#e91e63] border-2 border-[#e91e63] font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>{isBn ? "কার্টে যোগ করুন" : "Add to Cart"}</span>
                      </button>
                    </div>

                    {/* Order Now Direct 1-Click COD Button */}
                    <button
                      type="button"
                      onClick={handleSimulateAddToCart}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#e91e63] hover:bg-[#d81b60] text-white font-black text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="h-4 w-4 fill-current" />
                      <span>{isBn ? "ক্যাশ অন ডেলিভারিতে অর্ডার করুন" : "Order Now (Cash on Delivery)"}</span>
                    </button>
                  </div>

                  {/* Trust & Guarantee Box */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-gray-600">
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{isBn ? "১০০% অরিজিনাল গ্যারান্টি" : "100% Authentic Guarantee"}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>{isBn ? "সারাদেশে ক্যাশ অন ডেলিভারি" : "Nationwide Cash on Delivery"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frequently Bought Together Combo Bundle Section (If configured) */}
              {comboConfig?.enabled && bundleItems.length > 0 && (
                <div className="p-5 rounded-3xl bg-pink-50/50 border border-pink-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#e91e63]" />
                      <span>{comboConfig.title || "Frequently Bought Together"}</span>
                    </h3>
                    <span className="text-xs font-black text-[#e91e63] bg-white px-2.5 py-0.5 rounded-full border border-pink-200 shadow-2xs">
                      {comboConfig.badge_text || "Combo Bundle Discount"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Main Product */}
                    <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                      <img src={currentImage} alt="Main" className="h-12 w-12 rounded-xl object-cover" />
                      <div className="text-xs">
                        <strong className="block text-gray-900 max-w-[140px] truncate">{form.name}</strong>
                        <span className="text-[#e91e63] font-black">{formatPrice(effectivePrice)}</span>
                      </div>
                    </div>

                    <span className="text-gray-400 font-black text-lg">+</span>

                    {/* Bundle items */}
                    {bundleItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                        <img src={item.og_image_url || "/product_placeholder.svg"} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                        <div className="text-xs">
                          <strong className="block text-gray-900 max-w-[140px] truncate">{item.name}</strong>
                          <span className="text-[#e91e63] font-black">{formatPrice(item.sale_price ?? item.regular_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Content Tabs (Description, Benefits, How to Use, Specs) */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {/* Tab buttons */}
                <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-1 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setActiveTab("description")}
                    className={cn(
                      "px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                      activeTab === "description"
                        ? "border-[#e91e63] text-[#e91e63] bg-pink-50/50"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{isBn ? "সম্পূর্ণ বিবরণ" : "Full Description"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("benefits")}
                    className={cn(
                      "px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                      activeTab === "benefits"
                        ? "border-[#e91e63] text-[#e91e63] bg-pink-50/50"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isBn ? "উপকারিতা ও সুবিধা" : "Key Benefits"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("usage")}
                    className={cn(
                      "px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                      activeTab === "usage"
                        ? "border-[#e91e63] text-[#e91e63] bg-pink-50/50"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{isBn ? "ব্যবহারবিধি" : "How to Use"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("ingredients")}
                    className={cn(
                      "px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                      activeTab === "ingredients"
                        ? "border-[#e91e63] text-[#e91e63] bg-pink-50/50"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Beaker className="h-3.5 w-3.5" />
                    <span>{isBn ? "উপাদান ও স্পেসিফিকেশন" : "Ingredients & Specs"}</span>
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="p-4 sm:p-6 bg-gray-50/60 rounded-3xl border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed min-h-36">
                  {activeTab === "description" && (
                    form.description ? (
                      <div
                        className="prose prose-sm prose-pink max-w-full font-medium leading-relaxed [&_img]:rounded-2xl [&_img]:border [&_img]:border-gray-200 [&_img]:my-3"
                        dangerouslySetInnerHTML={{ __html: form.description }}
                      />
                    ) : (
                      <p className="text-gray-400 italic text-center py-6">
                        {isBn ? "কোনো বিবরণ এখনো লেখা হয়নি।" : "No detailed description written yet."}
                      </p>
                    )
                  )}

                  {activeTab === "benefits" && (
                    form.benefits ? (
                      <div
                        className="prose prose-sm prose-pink max-w-full font-medium leading-relaxed [&_img]:rounded-2xl"
                        dangerouslySetInnerHTML={{ __html: form.benefits }}
                      />
                    ) : (
                      <p className="text-gray-400 italic text-center py-6">
                        {isBn ? "কোনো উপকারিতা এখনো লেখা হয়নি।" : "No benefits written yet."}
                      </p>
                    )
                  )}

                  {activeTab === "usage" && (
                    form.usage ? (
                      <div
                        className="prose prose-sm prose-pink max-w-full font-medium leading-relaxed [&_img]:rounded-2xl"
                        dangerouslySetInnerHTML={{ __html: form.usage }}
                      />
                    ) : (
                      <p className="text-gray-400 italic text-center py-6">
                        {isBn ? "কোনো ব্যবহারবিধি এখনো লেখা হয়নি।" : "No usage routine written yet."}
                      </p>
                    )
                  )}

                  {activeTab === "ingredients" && (
                    form.ingredients_specifications ? (
                      <div
                        className="prose prose-sm prose-pink max-w-full font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: form.ingredients_specifications }}
                      />
                    ) : (
                      <p className="text-gray-400 italic text-center py-6">
                        {isBn ? "কোনো উপাদান তালিকা বা স্পেক্স লেখা হয়নি।" : "No ingredient specifications written yet."}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
