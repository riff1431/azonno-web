"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check, ShoppingBag, Zap, Sparkles, Truck, Tag, ShieldCheck } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { triggerMicroRipple } from "@/lib/ui-effects";
import { trackAddToCart } from "@/lib/analytics/datalayer";

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  sale_price: number | null;
  og_image_url: string | null;
  brands?: { name: string } | null;
}

interface FrequentlyBoughtTogetherProps {
  bundleData: {
    mainProduct: BundleProduct;
    bundleProducts: BundleProduct[];
    config: {
      title: string;
      offerType: "percentage" | "fixed" | "free_shipping";
      offerValue: number;
      badgeText: string;
      originalTotalPrice: number;
      comboTotalPrice: number;
      discountAmount: number;
      isFreeShipping: boolean;
    };
  } | null;
}

export function FrequentlyBoughtTogether({ bundleData }: FrequentlyBoughtTogetherProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { language, toBn, formatPriceBn } = useLanguage();
  const isBn = language === "bn";

  if (!bundleData || !bundleData.bundleProducts || bundleData.bundleProducts.length === 0) {
    return null;
  }

  const { mainProduct, bundleProducts, config } = bundleData;
  const allProducts = [mainProduct, ...bundleProducts];

  // State: Set of selected product IDs (all selected by default)
  const [selectedIds, setSelectedIds] = useState<string[]>(allProducts.map((p) => p.id));
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Toggle selection
  const toggleSelect = (id: string) => {
    // Keep at least main product selected
    if (id === mainProduct.id && selectedIds.includes(id) && selectedIds.length === 1) {
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter selected products
  const selectedProducts = allProducts.filter((p) => selectedIds.includes(p.id));
  const isComboActive = selectedProducts.length >= 2;

  // Calculate live dynamic totals based on selection
  const currentRegularTotal = selectedProducts.reduce(
    (sum, p) => sum + (p.sale_price ?? p.regular_price),
    0
  );

  let currentDiscount = 0;
  if (isComboActive) {
    if (config.offerType === "percentage") {
      currentDiscount = Math.round((currentRegularTotal * config.offerValue) / 100);
    } else if (config.offerType === "fixed") {
      currentDiscount = Math.min(config.offerValue, currentRegularTotal - 50);
    } else if (config.offerType === "free_shipping") {
      currentDiscount = 120; // Delivery value
    }
  }

  const finalComboPrice =
    config.offerType === "free_shipping"
      ? currentRegularTotal
      : Math.max(0, currentRegularTotal - currentDiscount);

  // Add all selected products to bag
  const handleAddBundleToCart = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) triggerMicroRipple(e);

    const bundleItems = selectedProducts.map((prod) => ({
      item_id: prod.id,
      item_name: prod.name,
      item_brand: (prod.brands as any)?.name || undefined,
      price: Number(prod.sale_price ?? prod.regular_price) || 0,
      quantity: 1,
    }));

    trackAddToCart(bundleItems, finalBundleTotal);

    selectedProducts.forEach((prod) => {
      addItem({
        id: prod.id,
        product_id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price: prod.sale_price ?? prod.regular_price,
        regular_price: prod.regular_price,
        image_url: prod.og_image_url || null,
        brand_name: (prod.brands as any)?.name || null,
      });
    });

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      openCart();
    }, 1000);
  };

  // One-click fast checkout with entire combo
  const handleBuyBundleNow = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) triggerMicroRipple(e);

    const bundleItems = selectedProducts.map((prod) => ({
      item_id: prod.id,
      item_name: prod.name,
      item_brand: (prod.brands as any)?.name || undefined,
      price: Number(prod.sale_price ?? prod.regular_price) || 0,
      quantity: 1,
    }));

    trackAddToCart(bundleItems, finalBundleTotal);

    selectedProducts.forEach((prod) => {
      addItem({
        id: prod.id,
        product_id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price: prod.sale_price ?? prod.regular_price,
        regular_price: prod.regular_price,
        image_url: prod.og_image_url || null,
        brand_name: (prod.brands as any)?.name || null,
      });
    });

    router.push("/checkout");
  };

  return (
    <div className="rounded-3xl border border-pink-200/80 bg-linear-to-br from-pink-50/50 via-white to-pink-50/30 p-5 sm:p-7 shadow-sm transition-all space-y-6 relative overflow-hidden">
      {/* Decorative Brand Accent Background */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#e91e63]/5 blur-2xl pointer-events-none" />

      {/* Header with Heading & Offer Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#e91e63] animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              {isBn ? "একসাথে কিনতে পছন্দ করেন" : (config.title || "Frequently Bought Together")}
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {isBn
              ? "কার্যকর ফলাফল ও বিশেষ ছাড়ে আসল পণ্যের আকর্ষণীয় কম্বো প্যাক।"
              : "Pair with complementary authentic formulas for enhanced results & combo savings."}
          </p>
        </div>

        {/* Dynamic Highlight Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e91e63] px-3.5 py-1 text-xs font-black text-white shadow-xs">
          {config.offerType === "free_shipping" ? (
            <>
              <Truck className="h-3.5 w-3.5" /> {isBn ? "সারা দেশে ফ্রি ডেলিভারি" : "FREE Nationwide Shipping"}
            </>
          ) : (
            <>
              <Tag className="h-3.5 w-3.5" />{" "}
              {isBn
                ? `কম্বো অফার: সাশ্রয় ${toBn(config.offerValue)}%`
                : (config.badgeText || `Combo Offer: Save ${config.offerValue}%`)}
            </>
          )}
        </div>
      </div>

      {/* Main Bundle Chain Layout: Images + Checkboxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 8 Cols: Visual Product Thumbnails & Selector List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Thumbnails Row with '+' connectors */}
          <div className="flex flex-wrap items-center gap-3">
            {allProducts.map((prod, index) => {
              const isSelected = selectedIds.includes(prod.id);
              const isMain = prod.id === mainProduct.id;

              return (
                <div key={prod.id} className="flex items-center gap-3">
                  <div
                    onClick={() => toggleSelect(prod.id)}
                    className={cn(
                      "relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 bg-white p-1 shadow-xs cursor-pointer transition-all duration-200 overflow-hidden flex items-center justify-center select-none",
                      isSelected
                        ? "border-[#e91e63] shadow-md scale-100"
                        : "border-gray-200 opacity-40 grayscale scale-95"
                    )}
                  >
                    {prod.og_image_url ? (
                      <img
                        src={prod.og_image_url}
                        alt={prod.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400 text-xs font-bold">
                        {isBn ? "পণ্য" : "Item"}
                      </div>
                    )}

                    {/* Checkbox badge on thumbnail */}
                    <div
                      className={cn(
                        "absolute top-1 left-1 h-5 w-5 rounded-md flex items-center justify-center transition-all",
                        isSelected ? "bg-[#e91e63] text-white" : "bg-gray-300 text-transparent"
                      )}
                    >
                      <Check className="h-3.5 w-3.5 stroke-3" />
                    </div>

                    {isMain && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-black px-1.5 py-0.2 rounded-md uppercase">
                        {isBn ? "মূল পণ্য" : "Main"}
                      </span>
                    )}
                  </div>

                  {/* '+' separator */}
                  {index < allProducts.length - 1 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-[#e91e63] font-black text-sm shadow-xs shrink-0">
                      <Plus className="h-4 w-4 stroke-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Checkbox Items List with Prices */}
          <div className="space-y-2 pt-2 border-t border-pink-100/60">
            {allProducts.map((prod) => {
              const isSelected = selectedIds.includes(prod.id);
              const isMain = prod.id === mainProduct.id;
              const itemPrice = prod.sale_price ?? prod.regular_price;

              return (
                <label
                  key={prod.id}
                  className={cn(
                    "flex items-start gap-2.5 p-2 rounded-xl transition-colors cursor-pointer text-xs select-none",
                    isSelected ? "bg-white/80 border border-pink-100/80" : "opacity-50 hover:opacity-80"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(prod.id)}
                    className="mt-0.5 h-4 w-4 rounded text-[#e91e63] focus:ring-[#e91e63] accent-[#e91e63] cursor-pointer"
                  />
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-gray-900 font-bold leading-tight">
                      {isMain && (
                        <strong className="text-[#e91e63] font-black uppercase text-[10px] mr-1">
                          {isBn ? "[মূল পণ্য]:" : "[This Item]:"}
                        </strong>
                      )}
                      {prod.name}
                    </span>
                    <span className="font-mono font-black text-gray-900 shrink-0">
                      {formatPriceBn(itemPrice)}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Bundle Pricing Summary & Action CTA */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-pink-200 p-5 shadow-sm space-y-4 text-center sm:text-left">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
              {isBn
                ? `বান্ডেল মোট (${toBn(selectedProducts.length)}টি পণ্য):`
                : `Bundle Total (${selectedProducts.length} items):`}
            </span>

            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className="text-2xl font-black text-[#e91e63]">
                {formatPriceBn(finalComboPrice)}
              </span>

              {isComboActive && currentDiscount > 0 && config.offerType !== "free_shipping" && (
                <span className="text-xs font-bold text-gray-400 line-through">
                  {formatPriceBn(currentRegularTotal)}
                </span>
              )}
            </div>

            {/* Savings Callout */}
            {isComboActive && (
              <div className="pt-1">
                {config.offerType === "free_shipping" ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <Truck className="h-3 w-3" />{" "}
                    {isBn ? "সারা দেশে ফ্রি ডেলিভারি যুক্ত হয়েছে" : "FREE Nationwide Shipping Applied"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    {isBn
                      ? `কম্বো ডিলে ${formatPriceBn(currentDiscount)} সাশ্রয়!`
                      : `Save ${formatPriceBn(currentDiscount)} with Combo Deal!`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handleAddBundleToCart}
              disabled={selectedProducts.length === 0}
              className={cn(
                "ripple-container w-full h-11 rounded-xl font-black text-xs shadow-md transition-all active:scale-95",
                addedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#e91e63] hover:bg-sg-pink-hover text-white"
              )}
            >
              {addedSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-1.5 animate-in zoom-in-50" />{" "}
                  {isBn ? "কম্বো কার্টে যোগ হয়েছে!" : "Bundle Added to Bag!"}
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-1.5" />{" "}
                  {isBn
                    ? `${toBn(selectedProducts.length)}টি আইটেম কার্টে যোগ করুন`
                    : `Add ${selectedProducts.length} Items to Bag`}
                </>
              )}
            </Button>

            <Button
              onClick={handleBuyBundleNow}
              disabled={selectedProducts.length === 0}
              variant="outline"
              className="w-full h-10 rounded-xl font-bold text-xs border-pink-200 text-gray-800 hover:bg-pink-50 hover:text-black"
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-[#e91e63] fill-[#e91e63]" />
              {isBn ? "কম্বো কিনুন (ক্যাশ অন ডেলিভারি)" : "Buy Combo (Cash on Delivery)"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
