"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Star, ShoppingBag, Plus, Minus, ShieldCheck, Heart } from "lucide-react";
import { formatPrice, getShortProductId } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { triggerMicroRipple } from "@/lib/ui-effects";
import {
  trackViewItem,
  trackAddToCart as trackGA4AddToCart,
  trackAddToWishlist as trackGA4AddToWishlist,
} from "@/lib/analytics/datalayer";

interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  regular_price?: number;
  sale_price?: number | null;
  regularPrice?: number;
  salePrice?: number | null;
  image_url?: string | null;
  primaryImage?: string;
  images?: string[];
  brand_name?: string | null;
  brandName?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
}

interface QuickViewModalProps {
  product: QuickViewProduct | null;
  isOpen?: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen = true, onClose }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { language, toBn, formatPriceBn } = useLanguage();
  const isBn = language === "bn";

  const regularPrice = product?.regular_price ?? product?.regularPrice ?? 0;
  const salePrice = product?.sale_price ?? product?.salePrice ?? null;
  const effectivePrice = salePrice ?? regularPrice;
  const imageUrl = product?.image_url || product?.primaryImage || (product?.images && product.images[0]) || "";
  const brand = product?.brand_name || product?.brandName || "Azonno";
  const category = product?.category_name || product?.categoryName || "Clothing";

  useEffect(() => {
    if (isOpen && product) {
      trackViewItem({
        item_id: getShortProductId(product),
        item_name: product.name,
        item_brand: brand,
        item_category: category,
        price: effectivePrice,
        quantity: 1,
      });
    }
  }, [isOpen, product, brand, category, effectivePrice]);

  if (!isOpen || !product) return null;

  const inWishlist = isWishlisted(product.id);
  const discountPercent =
    salePrice && regularPrice > salePrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerMicroRipple(e);
    trackGA4AddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: brand,
          item_category: category,
          price: effectivePrice,
          quantity,
        },
      ],
      effectivePrice * quantity
    );

    addItem(
      {
        id: product.id,
        product_id: product.id,
        sku: getShortProductId(product),
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        regular_price: regularPrice,
        image_url: imageUrl || null,
        brand_name: brand || null,
      },
      quantity
    );
    onClose();
  };

  const handleWishlistClick = () => {
    if (!inWishlist) {
      trackGA4AddToWishlist(
        [
          {
            item_id: getShortProductId(product),
            item_name: product.name,
            item_brand: brand,
            item_category: category,
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
      regular_price: regularPrice,
      sale_price: salePrice,
      image_url: imageUrl || null,
      brand_name: brand || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-10 rounded-full bg-surface-secondary p-1.5 text-text-muted hover:bg-surface-tertiary hover:text-text transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square w-full overflow-hidden bg-surface-secondary">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <ShoppingBag className="h-16 w-16 stroke-1" />
              </div>
            )}
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 rounded-md bg-accent-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                {isBn ? `${toBn(discountPercent)}% OFF` : `-${discountPercent}% OFF`}
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col p-6 space-y-4">
            <div>
              {brand && (
                <span className="text-xs font-bold uppercase tracking-wide text-[#1D6474]">
                  {brand}
                </span>
              )}
              <h2 className="mt-1 text-base sm:text-lg font-bold text-text line-clamp-2">
                {product.name}
              </h2>

              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <div className="flex text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="font-semibold text-text">{isBn ? "5.0" : "5.0"}</span>
                <span className="text-text-muted">({isBn ? "100% Authentic Cotton Products" : "Verified Authentic"})</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-text">
                {formatPriceBn(effectivePrice)}
              </span>
              {salePrice && salePrice < regularPrice && (
                <span className="text-sm text-text-muted line-through">
                  {formatPriceBn(regularPrice)}
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">{isBn ? "Quantity:" : "Quantity:"}</span>
              <div className="flex items-center rounded-lg border border-border bg-surface-secondary">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 text-text hover:bg-white rounded-l-lg transition-colors disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-text">{isBn ? toBn(quantity) : quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-text hover:bg-white rounded-r-lg transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleAddToCartClick}
                className="w-full py-5 text-xs sm:text-sm font-black shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider bg-[#1D6474] hover:bg-[#164E63] text-white cursor-pointer rounded-lg"
              >
                <ShoppingBag className="h-4 w-4" />
                {isBn ? `Add to Bag (${toBn(quantity)})` : `Add to Bag (${quantity})`}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWishlistClick}
                  className="flex-1 text-xs sm:text-[13px] font-bold"
                >
                  <Heart className={`h-3.5 w-3.5 mr-1 ${inWishlist ? "fill-accent-500 text-accent-500" : ""}`} />
                  {inWishlist ? "Saved" : "Wishlist"}
                </Button>

                <Link href={`/product/${product.slug}`} onClick={onClose} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-[13px] font-bold">
                    Full Details &rarr;
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs sm:text-[13px] text-text-muted font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>100% Authentic Cotton | Cash on Delivery Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
