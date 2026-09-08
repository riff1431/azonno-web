"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Star, ShoppingBag, Plus, Minus, Zap, ShieldCheck, Heart } from "lucide-react";
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
  regular_price: number;
  sale_price: number | null;
  image_url?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
}

interface QuickViewModalProps {
  product: QuickViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { language, toBn, formatPriceBn } = useLanguage();
  const isBn = language === "bn";

  useEffect(() => {
    if (isOpen && product) {
      const effectivePrice = product.sale_price ?? product.regular_price;
      trackViewItem({
        item_id: getShortProductId(product),
        item_name: product.name,
        item_brand: product.brand_name || undefined,
        item_category: product.category_name || undefined,
        price: effectivePrice,
        quantity: 1,
      });
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const inWishlist = isWishlisted(product.id);
  const effectivePrice = product.sale_price ?? product.regular_price;
  const discountPercent =
    product.sale_price && product.regular_price > product.sale_price
      ? Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)
      : 0;

  const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerMicroRipple(e);
    trackGA4AddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: product.brand_name || undefined,
          item_category: product.category_name || undefined,
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
        regular_price: product.regular_price,
        image_url: product.image_url || null,
        brand_name: product.brand_name || null,
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
            {product.image_url ? (
              <img
                src={product.image_url}
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
                {isBn ? `${toBn(discountPercent)}% ছাড়` : `-${discountPercent}% OFF`}
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col p-6 space-y-4">
            <div>
              {product.brand_name && (
                <span className="text-xs font-bold uppercase tracking-wide text-primary-600">
                  {product.brand_name}
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
                <span className="font-semibold text-text">{isBn ? "৫.০" : "5.0"}</span>
                <span className="text-text-muted">({isBn ? "যাচাইকৃত আসল পণ্য" : "Verified Authentic"})</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-text">
                {formatPriceBn(product.sale_price ?? product.regular_price)}
              </span>
              {product.sale_price && product.sale_price < product.regular_price && (
                <span className="text-sm text-text-muted line-through">
                  {formatPriceBn(product.regular_price)}
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">{isBn ? "পরিমাণ:" : "Quantity:"}</span>
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
                className="btn-add-to-cart ripple-container w-full py-5 text-xs font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                {isBn ? `কার্টে যোগ করুন (${toBn(quantity)})` : `Add to Cart (${quantity})`}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWishlistClick}
                  className="flex-1 text-xs"
                >
                  <Heart className={`h-3.5 w-3.5 mr-1 ${inWishlist ? "fill-accent-500 text-accent-500" : ""}`} />
                  {inWishlist ? (isBn ? "সংরক্ষিত" : "Saved") : (isBn ? "উইশলিস্ট" : "Wishlist")}
                </Button>

                <Link href={`/products/${product.slug}`} onClick={onClose} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    {isBn ? "বিস্তারিত দেখুন" : "Full Details"} &rarr;
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{isBn ? "১০০% আসল পণ্যের নিশ্চয়তা | ক্যাশ অন ডেলিভারি সুবিধা" : "100% Genuine Guaranteed | Cash on Delivery Available"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
