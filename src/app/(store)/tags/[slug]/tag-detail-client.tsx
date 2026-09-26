"use client";

import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { Tag, ChevronRight, Sparkles } from "lucide-react";
import { ItemListTracker } from "@/components/analytics/item-list-tracker";
import { useLanguage } from "@/context/language-context";
import { getShortProductId } from "@/lib/utils";

interface TagDetailClientProps {
  tag: {
    id: string;
    name: string;
    slug: string;
  };
  productCards: ProductCardData[];
}

export function TagDetailClient({
  tag,
  productCards,
}: TagDetailClientProps) {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";

  return (
    <div className="container-main py-4 sm:py-6 space-y-6">
      <ItemListTracker
        items={productCards.map((p, idx) => ({
          item_id: getShortProductId(p),
          item_name: p.name,
          item_brand: p.brand_name || undefined,
          price: p.sale_price ?? p.regular_price,
          index: idx + 1,
        }))}
        listName={`Tag: #${tag.name}`}
        listId={`tag_${tag.slug}`}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          {isBn ? "" : "Home"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <Link href="/products" className="hover:text-text transition-colors">
          {isBn ? "" : "Tags"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <span className="text-text font-bold">#{tag.name}</span>
      </nav>

      {/* Tag Hero Header Banner */}
      <div className="flex flex-col sm:flex-row items-center gap-5 rounded-3xl border border-teal-200 bg-linear-to-r from-pink-50 via-purple-50 to-pink-50 p-6 sm:p-8 shadow-xs">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-[#1D6474] text-white shadow-md">
          <Tag className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              #{tag.name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/70 px-3 py-0.5 text-xs font-bold text-[#1D6474] border border-teal-200">
              <Sparkles className="h-3.5 w-3.5" />
              {isBn ? "  " : "Curated Tag Collection"}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
            {isBn
              ? `"${tag.name}" added Authentic  Verification items and  Products Cash  Delivery   ।`
              : `Explore all 100% genuine skincare and cosmetics tagged with #${tag.name}, imported from authorized global brand distributors.`}
          </p>
        </div>
      </div>

      {/* Tagged Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base sm:text-lg font-black text-text">
            {isBn ? `"${tag.name}"  All Products` : `Products tagged #${tag.name}`}
          </h2>
          <span className="text-xs font-semibold text-text-muted">
            {isBn
              ? `${toBn(productCards.length)}items Products  `
              : `${productCards.length} product${productCards.length === 1 ? "" : "s"} found`}
          </span>
        </div>

        {productCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-16 text-center text-text-muted space-y-2">
            <p className="text-sm font-bold text-text">
              {isBn
                ? "   Products   Tracking।"
                : "No products currently found under this tag."}
            </p>
            <Link
              href="/products"
              className="text-xs font-bold text-primary-600 hover:underline inline-block"
            >
              {isBn ? "All Products   →" : "Browse All Products →"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productCards.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
