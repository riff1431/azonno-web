"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AzonnoProductCard } from "@/components/storefront/azonno-product-card";
import { ClothingListingToolbar, FilterState } from "@/components/storefront/clothing-listing-toolbar";
import { QuickViewModal } from "@/components/storefront/quick-view-modal";
import { AZONNO_PRODUCTS, ClothingProduct } from "@/data/clothing-catalog";

export default function ShopPage() {
  const [columns, setColumns] = useState<3 | 4 | 5>(4);
  const [quickViewProduct, setQuickViewProduct] = useState<ClothingProduct | null>(null);

  const initialFilters: FilterState = {
    category: "all",
    minPrice: 500,
    maxPrice: 5000,
    sizes: [],
    colors: [],
    fabric: [],
    inStockOnly: false,
    sortBy: "default",
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const filteredProducts = useMemo(() => {
    return AZONNO_PRODUCTS.filter((product) => {
      // Category filter
      if (filters.category && filters.category !== "all") {
        const productCatSlug = product.subCategory.toLowerCase().replace(/\s+/g, "-");
        if (!productCatSlug.includes(filters.category) && !filters.category.includes(productCatSlug)) {
          return false;
        }
      }

      // Price filter
      if (product.price > filters.maxPrice) return false;

      // In-stock
      if (filters.inStockOnly && !product.inStock) return false;

      // Sizes
      if (filters.sizes.length > 0) {
        const hasSize = product.sizes.some((s) => filters.sizes.includes(s));
        if (!hasSize) return false;
      }

      // Colors
      if (filters.colors.length > 0) {
        const hasColor = product.colors.some((c) => filters.colors.includes(c.name));
        if (!hasColor) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === "price-asc") return a.price - b.price;
      if (filters.sortBy === "price-desc") return b.price - a.price;
      if (filters.sortBy === "latest") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (filters.sortBy === "popularity") return b.reviewsCount - a.reviewsCount;
      return 0;
    });
  }, [filters]);

  const gridClass = {
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[columns];

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-16">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b border-slate-200/80 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#1D6474]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#1D6474] font-bold uppercase tracking-wider">
              All Collections
            </span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#164E63] via-[#1D6474] to-[#0E7490] text-white py-10 px-4 sm:px-6 mb-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-[11px] font-bold tracking-widest uppercase text-teal-200 mb-1 block">
            Azonno Bangladeshi Clothing Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-2">
            Explore All Apparel
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl mx-auto">
            From modern oxford casual shirts to festive jacquard panjabis, discover high-grade apparel designed for Bangladeshi weather.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ClothingListingToolbar
          totalCount={filteredProducts.length}
          currentCategory={filters.category}
          columns={columns}
          onColumnsChange={setColumns}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() => setFilters(initialFilters)}
        />

        {filteredProducts.length > 0 ? (
          <div className={`grid ${gridClass} gap-3 sm:gap-5`}>
            {filteredProducts.map((product) => (
              <AzonnoProductCard
                key={product.id}
                product={product}
                columns={columns}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 p-8">
            <p className="text-base font-bold text-slate-700 mb-2">No products found</p>
            <p className="text-xs text-slate-500 mb-4">Try adjusting your filters to see more results.</p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="px-4 py-2 bg-[#1D6474] text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </main>
  );
}
