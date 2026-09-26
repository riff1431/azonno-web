"use client";

import React, { useState, useMemo, use } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AzonnoProductCard } from "@/components/storefront/azonno-product-card";
import { ClothingListingToolbar, FilterState } from "@/components/storefront/clothing-listing-toolbar";
import { QuickViewModal } from "@/components/storefront/quick-view-modal";
import { AZONNO_PRODUCTS, CLOTHING_CATEGORIES, ClothingProduct } from "@/data/clothing-catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const currentCat = useMemo(() => {
    return CLOTHING_CATEGORIES.find((c) => c.slug === slug) || {
      id: slug,
      slug: slug,
      name: slug.replace(/-/g, " ").toUpperCase(),
      description: "Explore our exclusive collection crafted with premium natural fabrics.",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80",
    };
  }, [slug]);

  const [columns, setColumns] = useState<3 | 4 | 5>(4);
  const [quickViewProduct, setQuickViewProduct] = useState<ClothingProduct | null>(null);

  const initialFilters: FilterState = {
    category: slug,
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
        const productCatSlug = product.categorySlug || product.subCategory.toLowerCase().replace(/\s+/g, "-");
        if (productCatSlug !== filters.category && !productCatSlug.includes(filters.category) && !filters.category.includes(productCatSlug)) {
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
      {/* --- Breadcrumb Navigation (Azonno style) --- */}
      <div className="bg-slate-50 border-b border-slate-200/80 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#1D6474]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/shop" className="hover:text-[#1D6474]">
              Men
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#1D6474] font-bold uppercase tracking-wider">
              {currentCat.name}
            </span>
          </nav>
        </div>
      </div>

      {/* --- Category Banner Header --- */}
      <div className="bg-gradient-to-r from-[#164E63] via-[#1D6474] to-[#0E7490] text-white py-10 px-4 sm:px-6 mb-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-[11px] font-bold tracking-widest uppercase text-teal-200 mb-1 block">
            Azonno Western & Eastern Collection
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-2">
            {currentCat.name}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl mx-auto">
            {currentCat.description}
          </p>
        </div>
      </div>

      {/* --- Category Content & Products Grid --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Azonno Toolbar & Filters */}
        <ClothingListingToolbar
          totalCount={filteredProducts.length}
          currentCategory={slug}
          columns={columns}
          onColumnsChange={setColumns}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() => setFilters(initialFilters)}
        />

        {/* Product Cards Grid */}
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
            <p className="text-base font-bold text-slate-700 mb-2">No products matched your filters</p>
            <p className="text-xs text-slate-500 mb-4">Try clearing some filters or exploring other categories.</p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="px-4 py-2 bg-[#1D6474] text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </main>
  );
}
