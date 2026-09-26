"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { trackAddToCart } from "@/lib/analytics/datalayer";
import { getShortProductId } from "@/lib/utils";

export interface ShoppableProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  regular_price: number;
  sale_price?: number | null;
  og_image_url?: string | null;
  callout_note?: string | null;
  brands?: { name: string } | null;
}

interface ShoppableArticleProductsProps {
  products: ShoppableProduct[];
  articleTitle: string;
}

export function ShoppableArticleProducts({
  products,
  articleTitle,
}: ShoppableArticleProductsProps) {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const { addItem, openCart } = useCart();
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [addingAll, setAddingAll] = useState(false);

  if (!products || products.length === 0) return null;

  const handleAddToCart = (product: ShoppableProduct) => {
    const currentPrice = product.sale_price ?? product.regular_price;

    addItem(
      {
        id: product.id,
        product_id: product.id,
        sku: getShortProductId(product),
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        regular_price: product.regular_price,
        image_url: product.og_image_url || null,
        brand_name: product.brands?.name || null,
      },
      1
    );

    trackAddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: product.brands?.name || undefined,
          price: currentPrice,
          quantity: 1,
        },
      ],
      currentPrice
    );

    setAddedIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== product.id));
    }, 2000);

    openCart();
  };

  const handleAddAllToCart = () => {
    setAddingAll(true);
    products.forEach((product) => {
      const currentPrice = product.sale_price ?? product.regular_price;
      addItem(
        {
          id: product.id,
          product_id: product.id,
          sku: getShortProductId(product),
          name: product.name,
          slug: product.slug,
          price: currentPrice,
          regular_price: product.regular_price,
          image_url: product.og_image_url || null,
          brand_name: product.brands?.name || null,
        },
        1
      );
    });

    setTimeout(() => {
      setAddingAll(false);
      openCart();
    }, 400);
  };

  return (
    <div className="rounded-3xl border border-teal-200 bg-linear-to-br from-pink-50/50 via-white to-pink-50/30 p-6 sm:p-8 space-y-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1D6474] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1D6474]">
              {language === "bn" ? "Style Guide" : "Shoppable Routine"}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#1D6474]" />
            {t("blog", "shoppableProducts")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === "bn"
              ? "Featured in this article 100% Authentic Premium Clothing Products।"
              : "100% authentic beauty and skincare products mentioned in this guide."}
          </p>
        </div>

        {products.length > 1 && (
          <Button
            type="button"
            onClick={handleAddAllToCart}
            disabled={addingAll}
            className="bg-[#1D6474] hover:bg-[#164E63] text-white text-xs font-black rounded-xl shadow-md shrink-0 h-9"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {addingAll
              ? (language === "bn" ? "added  ..." : "Adding All...")
              : (language === "bn" ? `Complete items Add to Cart (${toBn(products.length)})` : `Add Complete Routine (${products.length})`)}
          </Button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => {
          const currentPrice = product.sale_price ?? product.regular_price;
          const isAdded = addedIds.includes(product.id);
          const hasDiscount =
            product.sale_price && product.sale_price < product.regular_price;
          const discountPercent = hasDiscount
            ? Math.round(
                ((product.regular_price - (product.sale_price as number)) /
                  product.regular_price) *
                  100
              )
            : 0;

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs hover:border-[#1D6474] hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 group"
                >
                  <img
                    src={product.og_image_url || "/product_placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {hasDiscount && (
                    <span className="absolute top-1 left-1 rounded bg-[#1D6474] px-1.5 py-0.5 text-[9px] font-black text-white">
                      -{toBn(discountPercent)}%
                    </span>
                  )}
                </Link>

                <div className="flex-1 min-w-0 space-y-1">
                  {product.brands?.name && (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {product.brands.name}
                    </span>
                  )}
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-[#1D6474] transition-colors"
                  >
                    {product.name}
                  </Link>

                  {product.callout_note && (
                    <p className="text-[11px] text-[#1D6474] font-semibold italic">
                      “{product.callout_note}”
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-sm font-black text-[#1D6474]">
                      {formatPriceBn(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[11px] text-gray-400 line-through font-medium">
                        {formatPriceBn(product.regular_price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <Link href={`/products/${product.slug}`} className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold rounded-xl h-8 border-gray-200 text-gray-700 hover:text-gray-900"
                  >
                    {t("product", "quickView")}
                  </Button>
                </Link>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddToCart(product)}
                  className={`flex-1 text-xs font-black rounded-xl h-8 shadow-2xs transition-all ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-[#1D6474] hover:bg-[#164E63] text-white"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> {t("product", "addedToCart")}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" /> {t("product", "addToCart")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

