"use client";

import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { Sparkles, FolderTree, ChevronRight } from "lucide-react";
import { ItemListTracker } from "@/components/analytics/item-list-tracker";
import { useLanguage } from "@/context/language-context";
import { getShortProductId } from "@/lib/utils";

interface CategoryDetailClientProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  subcategories: Array<{ id: string; name: string; slug: string }>;
  productCards: ProductCardData[];
}

export function CategoryDetailClient({
  category,
  subcategories,
  productCards,
}: CategoryDetailClientProps) {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";

  return (
    <div className="container-main py-4 sm:py-6 space-y-6">
      <ItemListTracker
        items={productCards.map((p, idx) => ({
          item_id: getShortProductId(p),
          item_name: p.name,
          item_brand: p.brand_name || undefined,
          item_category: category.name,
          price: p.sale_price ?? p.regular_price,
          index: idx + 1,
        }))}
        listName={`Category: ${category.name}`}
        listId={`category_${category.slug}`}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          {isBn ? "হোম" : "Home"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <Link href="/products" className="hover:text-text transition-colors">
          {isBn ? "ক্যাটাগরি" : "Categories"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <span className="text-text font-bold">{category.name}</span>
      </nav>

      {/* Category Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-primary-950 to-slate-950 p-6 sm:p-10 text-white shadow-lg">
        <div className="max-w-xl space-y-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {isBn ? "১০০% আসল ও সার্টিফাইড ক্যাটাগরি" : "Verified Authentic Category"}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {category.description ||
              (isBn
                ? "আমাদের যাচাইকৃত অরিজিনাল বিউটি প্রোডাক্টস ও স্কিনকেয়ার আইটেম থেকে আপনার পছন্দের পণ্য বেছে নিন।"
                : "Discover verified genuine formulas and authentic imported beauty items curated for maximum effectiveness.")}
          </p>
        </div>
      </div>

      {/* Subcategories Horizontal Scroll */}
      {subcategories && subcategories.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
            {isBn ? "জনপ্রিয় সাব-ক্যাটাগরি" : "Popular Subcategories"}
          </span>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-text hover:border-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all shadow-xs"
              >
                <FolderTree className="h-3.5 w-3.5 text-primary-600" />
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base sm:text-lg font-black text-text">
            {isBn ? `${category.name}-এর পণ্যসমূহ` : `Products in ${category.name}`}
          </h2>
          <span className="text-xs font-semibold text-text-muted">
            {isBn
              ? `${toBn(productCards.length)}টি পণ্য পাওয়া গেছে`
              : `${productCards.length} product${productCards.length === 1 ? "" : "s"} found`}
          </span>
        </div>

        {productCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-16 text-center text-text-muted space-y-2">
            <p className="text-sm font-bold text-text">
              {isBn
                ? "এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য পাওয়া যায়নি।"
                : "No products found in this category yet."}
            </p>
            <Link
              href="/products"
              className="text-xs font-bold text-primary-600 hover:underline inline-block"
            >
              {isBn ? "সকল পণ্য ব্রাউজ করুন →" : "Browse All Available Products →"}
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
