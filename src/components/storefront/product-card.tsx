"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Star, Check, ShoppingBag } from "lucide-react";
import { formatPrice, cn, getShortProductId } from "@/lib/utils";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { triggerMicroRipple } from "@/lib/ui-effects";
import { QuickViewModal } from "./quick-view-modal";
import { useLanguage } from "@/context/language-context";
import { type ProductCardConfig } from "@/features/marketing/homepage-types";
import {
  trackAddToCart as trackGA4AddToCart,
  trackAddToWishlist as trackGA4AddToWishlist,
  trackSelectItem,
} from "@/lib/analytics/datalayer";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  regular_price: number;
  sale_price: number | null;
  image_url?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  origin_country?: string | null;
  country?: string | null;
  rating?: number;
  review_count?: number;
  size?: string | null;
  is_in_stock?: boolean;
  is_free_shipping?: boolean | null;
  shipping_class?: string | null;
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

export function ProductCard({
  product,
  cardSettings,
}: {
  product: ProductCardData;
  cardSettings?: ProductCardConfig;
}) {
  const router = useRouter();
  const { language, toBn, formatPriceBn } = useLanguage();
  const [showQuickView, setShowQuickView] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.image_url || "/product_placeholder.svg");
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const inWishlist = isWishlisted(product.id);

  const effectivePrice = product.sale_price ?? product.regular_price;

  const discountPercent =
    product.sale_price && product.regular_price > product.sale_price
      ? Math.round(
          ((product.regular_price - product.sale_price) / product.regular_price) * 100
        )
      : 0;

  // Extract volume/size from product name (e.g. 245ml, 125ml, 100g, 30ml) if not explicitly given
  const detectedSize =
    product.size ||
    product.name.match(/\b\d+\s?(?:ml|g|gm|oz|kg)\b/i)?.[0] ||
    "Standard";

  const handleProductClick = () => {
    trackSelectItem({
      item_id: getShortProductId(product),
      item_name: product.name,
      item_brand: product.brand_name || undefined,
      item_category: product.category_name || undefined,
      price: effectivePrice,
      quantity: 1,
    });
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    triggerMicroRipple(e);

    trackGA4AddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: product.brand_name || undefined,
          item_category: product.category_name || undefined,
          price: effectivePrice,
          quantity: 1,
        },
      ],
      effectivePrice
    );

    addItem(
      {
        id: product.id,
        product_id: product.id,
        sku: getShortProductId(product),
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        regular_price: product.regular_price,
        image_url: product.image_url || null,
        brand_name: product.brand_name || null,
      },
      1
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleOrderNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    triggerMicroRipple(e);

    trackGA4AddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: product.brand_name || undefined,
          item_category: product.category_name || undefined,
          price: effectivePrice,
          quantity: 1,
        },
      ],
      effectivePrice
    );

    addItem(
      {
        id: product.id,
        product_id: product.id,
        sku: getShortProductId(product),
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        regular_price: product.regular_price,
        image_url: product.image_url || null,
        brand_name: product.brand_name || null,
      },
      1
    );
    router.push("/checkout");
  };

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    triggerMicroRipple(e, true);

    if (!inWishlist) {
      trackGA4AddToWishlist(
        [
          {
            item_id: getShortProductId(product),
            item_name: product.name,
            item_brand: product.brand_name || undefined,
            item_category: product.category_name || undefined,
            price: effectivePrice,
            quantity: 1,
          },
        ],
        effectivePrice
      );
    }

    toggleWishlist({
      id: product.id,
      name: product.name,
      slug: product.slug,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      image_url: product.image_url || null,
      brand_name: product.brand_name || null,
    });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200/90 bg-white transition-all duration-300 ease-out hover:scale-[1.04] hover:-translate-y-1 hover:shadow-2xl hover:border-[#e91e63] cursor-pointer btn-soft-fill">
      {/* 1. Top Image & Badges Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-white flex items-center justify-center">
        {/* Top-Left Discount Badge */}
        {cardSettings?.showDiscountBadge !== false && discountPercent > 0 && (
          <div
            style={{ position: "absolute", top: "10px", left: "10px", zIndex: 20 }}
            className="pointer-events-none"
          >
            <span className="rounded-md bg-[#e91e63] px-2 py-0.5 text-[11px] sm:text-xs font-black text-white shadow-xs tracking-wider">
              {toBn(discountPercent)}% {language === "bn" ? "ছাড়" : "OFF"}
            </span>
          </div>
        )}

        {/* Top-Right Wishlist Button (Guaranteed Explicit Top-Right Positioning) */}
        {cardSettings?.showWishlistButton !== false && (
          <button
            type="button"
            style={{ position: "absolute", top: "10px", right: "10px", zIndex: 30 }}
            onClick={handleWishlistToggle}
            aria-label="Add to wishlist"
            className="ripple-container flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-xs transition-all duration-200 hover:bg-white hover:scale-115 active:scale-90 border border-gray-200/80 text-gray-700"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                inWishlist
                  ? "fill-[#e91e63] text-[#e91e63]"
                  : "text-gray-700 hover:text-[#e91e63]"
              )}
            />
          </button>
        )}

        {/* Product Image Link with Fallback - 100% Full Edge-to-Edge Size with Smooth Image Zoom */}
        <Link
          href={`/products/${product.slug}`}
          onClick={handleProductClick}
          className="h-full w-full overflow-hidden flex items-center justify-center"
        >
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc("/product_placeholder.svg")}
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        </Link>

        {/* Solid Pink FREE SHIPPING Strip at the bottom of the image - Controlled per product */}
        {(product.is_free_shipping === true || product.shipping_class === "free_shipping") && (
          <div
            style={{ position: "absolute", bottom: "0px", left: "0px", right: "0px", zIndex: 10 }}
            className="bg-[#e91e63] py-1 text-center shadow-xs pointer-events-none"
          >
            <span className="text-xs sm:text-[12.5px] font-black uppercase tracking-wider text-white">
              {language === "bn" ? "ফ্রি ডেলিভারি" : (cardSettings?.freeShippingText || "FREE SHIPPING")}
            </span>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />

      {/* 2. Product Information Body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
        {/* Brand & Sourcing Origin Row */}
        {(product.brand_name || product.origin_country || product.country) && (
          <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs md:text-sm font-bold text-gray-500">
            {product.brand_name ? (
              <span className="truncate text-[#e91e63] uppercase tracking-wider font-extrabold hover:underline">
                {product.brand_name}
              </span>
            ) : <span />}
            {(product.origin_country || product.country) && (
              <span
                className="inline-flex items-center gap-1 text-gray-600 shrink-0 bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-200/70 font-semibold text-[10px] sm:text-xs"
                title={`Made in / Sourced from: ${product.origin_country || product.country}`}
              >
                <span>{getCountryFlagEmoji(product.origin_country || product.country)}</span>
                <span className="truncate max-w-[80px] sm:max-w-[95px]">{product.origin_country || product.country}</span>
              </span>
            )}
          </div>
        )}

        {/* Product Title */}
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 overflow-hidden text-xs sm:text-sm md:text-base font-bold text-gray-900 leading-tight sm:leading-snug hover:text-[#e91e63] transition-colors min-h-[2.2rem] sm:min-h-[2.85rem]"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Rating & Size Badge Row */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {/* Star Rating */}
          {cardSettings?.showRating !== false ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center text-amber-400">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current text-amber-200" />
              </div>
              <span className="text-[11px] sm:text-xs md:text-sm text-gray-600 font-bold">
                ({toBn(product.rating ? product.rating.toFixed(1) : "4.3")})
              </span>
            </div>
          ) : <div />}

          {/* Size / Volume Pill Badge */}
          {cardSettings?.showSizeBadge !== false && detectedSize && (
            <span className="rounded-md bg-pink-50 border border-pink-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs md:text-sm font-bold text-[#e91e63] whitespace-nowrap">
              {detectedSize}
            </span>
          )}
        </div>

        {/* Pricing Row */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5">
          <span className="text-sm sm:text-lg lg:text-xl font-black text-[#e91e63]">
            {formatPriceBn(product.sale_price ?? product.regular_price)}
          </span>
          {product.sale_price && product.sale_price < product.regular_price && (
            <span className="text-[11px] sm:text-xs md:text-sm text-gray-400 line-through font-medium">
              {formatPriceBn(product.regular_price)}
            </span>
          )}
        </div>

        {/* Dual Action Buttons: ADD TO CART & ORDER NOW below it */}
        <div className="overflow-hidden transition-all duration-300 ease-out max-h-28 sm:max-h-0 sm:opacity-0 group-hover:max-h-28 group-hover:opacity-100 group-hover:pt-2">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 w-full">
            {/* 1. ADD TO CART Button (Hover shifts to Midnight Noir) */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.is_in_stock === false}
              aria-label={`Add ${product.name} to cart`}
              className={cn(
                "ripple-container w-full rounded-xl py-2.5 px-2 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-1 transition-all active:scale-95",
                justAdded
                  ? "bg-emerald-600! text-white shadow-sm"
                  : product.is_in_stock === false
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "btn-add-to-cart-action"
              )}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-3 animate-in zoom-in-50" />
                  <span>{language === "bn" ? "যোগ হয়েছে" : "ADDED"}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{language === "bn" ? "কার্টে যোগ" : "ADD TO CART"}</span>
                </>
              )}
            </button>

            {/* 2. ORDER NOW Button (Direct to One-Click Checkout with Item) */}
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={product.is_in_stock === false}
              aria-label={`Order ${product.name} now`}
              className={cn(
                "ripple-container w-full rounded-xl py-2.5 px-2 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-1 transition-all active:scale-95",
                product.is_in_stock === false
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-[#e91e63] text-white hover:bg-sg-pink-hover shadow-xs"
              )}
            >
              <span>{language === "bn" ? "অর্ডার করুন" : "ORDER NOW"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
