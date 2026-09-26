"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ShoppingBag, Check } from "lucide-react";
import { ClothingProduct } from "@/data/clothing-catalog";
import { useCart } from "@/context/cart-context";

interface AzonnoProductCardProps {
  product: ClothingProduct;
  onQuickView?: (product: ClothingProduct) => void;
  className?: string;
  columns?: 3 | 4 | 5;
}

export function AzonnoProductCard({
  product,
  onQuickView,
  className = "",
  columns = 4,
}: AzonnoProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const { addItem, openCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If size not selected and product has sizes, toggle quick size picker
    if (!selectedSize && product.sizes.length > 0) {
      setShowSizePicker(true);
      return;
    }

    // Add item to cart context
    addItem(
      {
        id: `${product.id}-${selectedSize || "default"}-${selectedColor?.name || "default"}`,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regularPrice,
        image_url: product.primaryImage,
        sku: product.sku,
        variant_label: `${selectedColor?.name ? selectedColor.name + " / " : ""}${selectedSize || product.sizes[0]}`,
      },
      1
    );

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      openCart();
    }, 400);
  };

  const handleSelectSizeAndAdd = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
    setShowSizePicker(false);

    addItem(
      {
        id: `${product.id}-${size}-${selectedColor?.name || "default"}`,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regularPrice,
        image_url: product.primaryImage,
        sku: product.sku,
        variant_label: `${selectedColor?.name ? selectedColor.name + " / " : ""}${size}`,
      },
      1
    );

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      openCart();
    }, 400);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
  };

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-md transition-all duration-300 border border-transparent hover:border-slate-200/80 hover:shadow-lg ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizePicker(false);
      }}
    >
      {/* --- Image Frame (2:3 vertical aspect ratio) --- */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-md bg-[#F4F5F7] select-none">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          {/* Primary Front Image */}
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-500 ease-out ${
              isHovered && product.secondaryImage
                ? "opacity-0 scale-105"
                : "opacity-100 scale-100"
            }`}
            priority={false}
          />

          {/* Secondary Back Image (Flip effect) */}
          {product.secondaryImage && (
            <Image
              src={product.secondaryImage}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-center transition-all duration-500 ease-out ${
                isHovered
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            />
          )}
        </Link>

        {/* --- Top Badges (Discount & New) --- */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
          {product.discountPercentage && product.discountPercentage > 0 && (
            <span className="inline-flex items-center justify-center bg-[#D97706] text-white text-xs font-extrabold tracking-wider px-2.5 py-1 rounded shadow-sm">
              -{product.discountPercentage}%
            </span>
          )}
          {product.isNew && (
            <span className="inline-flex items-center justify-center bg-[#1D6474] text-white text-[11px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded shadow-sm">
              NEW
            </span>
          )}
        </div>

        {/* --- Right Floating Action Buttons --- */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-2 transition-all duration-300 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-x-2 sm:group-hover:translate-x-0">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title="Wishlist"
            className={`flex items-center justify-center w-9 h-9 rounded-full shadow-md transition-all duration-200 cursor-pointer ${
              isWishlisted
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-white/95 text-slate-800 hover:bg-[#1D6474] hover:text-white"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? "fill-rose-500" : ""}`}
            />
          </button>

          {/* Quick View Button */}
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label="Quick view product"
              title="Quick view"
              className="flex items-center justify-center w-9 h-9 bg-white/95 text-slate-800 hover:bg-[#1D6474] hover:text-white rounded-full shadow-md transition-all duration-200 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* --- Slide-Up Quick Size Selector Overlay --- */}
        {showSizePicker && (
          <div className="absolute inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md p-3.5 border-t border-slate-200 shadow-xl animate-in slide-in-from-bottom duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
              Select Size
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={(e) => handleSelectSizeAndAdd(sz, e)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded hover:border-[#1D6474] hover:bg-[#1D6474] hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Slide-Up Bottom "Select Options / Add to Cart" Bar --- */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 hidden sm:block">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-[#1D6474] text-white hover:bg-[#15515E]"
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Select Options
              </>
            )}
          </button>
        </div>
      </div>

      {/* --- Product Meta Wrapper --- */}
      <div className="flex flex-col p-3.5 flex-1 justify-between bg-white rounded-b-md">
        <div>
          {/* Category Tag & SKU */}
          <div className="flex items-center justify-between gap-1 text-xs text-slate-500 font-bold tracking-wide uppercase mb-1.5">
            <span className="text-[#1D6474] font-bold truncate hover:underline">
              <Link href={`/category/${product.subCategory.toLowerCase().replace(/\s+/g, "-")}`}>
                {product.subCategory}
              </Link>
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {product.sku}
            </span>
          </div>

          {/* Product Name Title */}
          <h3 className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug line-clamp-1 hover:text-[#1D6474] transition-colors mb-2">
            <Link href={`/product/${product.slug}`} title={product.name}>
              {product.name}
            </Link>
          </h3>

          {/* Price Container (BDT ৳ symbol) */}
          <div className="flex items-baseline gap-2.5 mb-2.5">
            <span className="text-lg sm:text-xl font-black text-[#1D6474]">
              ৳ {product.price.toLocaleString("en-BD")}
            </span>
            {product.regularPrice > product.price && (
              <span className="text-sm text-slate-400 line-through font-medium">
                ৳ {product.regularPrice.toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>

        {/* Color Swatches & Sizes Row */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          {/* Color Dots */}
          <div className="flex items-center gap-1.5" title="Available Colors">
            {product.colors.slice(0, 4).map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(c);
                }}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                  selectedColor?.name === c.name
                    ? "ring-2 ring-offset-1 ring-[#1D6474] scale-110"
                    : "border-slate-300 hover:scale-110"
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={`Select color ${c.name}`}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-slate-400 font-semibold">+{product.colors.length - 4}</span>
            )}
          </div>

          {/* Sizes preview */}
          <div className="flex items-center gap-1 text-xs text-slate-700 font-bold font-mono">
            {product.sizes.slice(0, 3).map((s) => (
              <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                {s}
              </span>
            ))}
            {product.sizes.length > 3 && (
              <span className="text-xs text-slate-400">+{product.sizes.length - 3}</span>
            )}
          </div>
        </div>

        {/* Mobile Quick Add Button */}
        <div className="mt-3 sm:hidden">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full py-2 px-3 bg-slate-900 text-white hover:bg-[#1D6474] rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Select Options
          </button>
        </div>
      </div>
    </div>
  );
}
