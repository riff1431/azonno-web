"use client";

import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { ItemListTracker } from "@/components/analytics/item-list-tracker";
import { useLanguage } from "@/context/language-context";
import { getShortProductId } from "@/lib/utils";

interface BrandDetailClientProps {
  brand: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    description?: string | null;
  };
  productCards: ProductCardData[];
}

export function BrandDetailClient({
  brand,
  productCards,
}: BrandDetailClientProps) {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";

  return (
    <div className="container-main py-4 sm:py-6 space-y-6">
      <ItemListTracker
        items={productCards.map((p, idx) => ({
          item_id: getShortProductId(p),
          item_name: p.name,
          item_brand: brand.name,
          price: p.sale_price ?? p.regular_price,
          index: idx + 1,
        }))}
        listName={`Brand: ${brand.name}`}
        listId={`brand_${brand.slug}`}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          {isBn ? "হোম" : "Home"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <Link href="/products" className="hover:text-text transition-colors">
          {isBn ? "ব্র্যান্ডস" : "Brands"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <span className="text-text font-bold">{brand.name}</span>
      </nav>

      {/* Brand Hero Card */}
      <div className="flex flex-col sm:flex-row items-center gap-5 rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card">
        {brand.logo_url ? (
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-2 shadow-xs">
            <img
              src={brand.logo_url}
              alt={brand.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 font-black text-2xl border border-primary-100">
            {brand.name.substring(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-text">
              {brand.name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isBn ? "১০০% অনুমোদিত ও খাঁটি পণ্য" : "100% Authorized & Authentic"}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
            {brand.description ||
              (isBn
                ? `বাংলাদেশে ${brand.name}-এর আসল ও সার্টিফাইড পণ্য কিনুন সরাসরি ক্যাশ অন ডেলিভারি সুবিধাসহ।`
                : `Browse genuine ${brand.name} skincare and cosmetics with certified authenticity and nationwide Cash on Delivery.`)}
          </p>
        </div>
      </div>

      {/* Brand Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base sm:text-lg font-black text-text">
            {isBn ? `${brand.name}-এর সকল পণ্য` : `Products from ${brand.name}`}
          </h2>
          <span className="text-xs font-semibold text-text-muted">
            {isBn
              ? `${toBn(productCards.length)}টি পণ্য`
              : `${productCards.length} product${productCards.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {productCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-16 text-center text-text-muted space-y-2">
            <p className="text-sm font-bold text-text">
              {isBn
                ? "এই ব্র্যান্ডের কোনো পণ্য বর্তমানে স্টকে নেই।"
                : "No products available from this brand currently."}
            </p>
            <Link
              href="/products"
              className="text-xs font-bold text-primary-600 hover:underline inline-block"
            >
              {isBn ? "অন্যান্য ব্র্যান্ড ব্রাউজ করুন →" : "Browse Other Brands →"}
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
