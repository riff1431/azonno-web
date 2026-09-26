"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Grid3X3, LayoutGrid, Grid2X2, X, ChevronDown, Check } from "lucide-react";

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  sizes: string[];
  colors: string[];
  fabric: string[];
  inStockOnly: boolean;
  sortBy: string;
}

interface ClothingListingToolbarProps {
  totalCount: number;
  currentCategory: string;
  columns: 3 | 4 | 5;
  onColumnsChange: (cols: 3 | 4 | 5) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export const CATEGORY_TABS = [
  { id: "all", name: "All Products" },
  { id: "casual-shirt", name: "Casual Shirts" },
  { id: "panjabi", name: "Festive Panjabi" },
  { id: "polo-t-shirts", name: "Polo Shirts" },
  { id: "women-coords", name: "Women Co-ords" },
  { id: "women-kurtis", name: "Embroidered Kurtis" },
  { id: "salwar-kameez", name: "Festive 3-Piece" },
  { id: "t-shirts", name: "T-Shirts" },
  { id: "denim-jeans", name: "Denim & Chinos" },
];

export const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "38", "40", "42", "44"];
export const AVAILABLE_FABRICS = ["Oxford Cotton", "Pure Linen", "Piqué Knit", "Jacquard", "Denim", "Slub Cotton"];
export const AVAILABLE_COLORS = [
  { name: "Teal Petrol", hex: "#1D6474" },
  { name: "Navy Blue", hex: "#1E293B" },
  { name: "Jet Black", hex: "#18181B" },
  { name: "Crisp White", hex: "#FFFFFF" },
  { name: "Terracotta", hex: "#EA580C" },
  { name: "Sage Olive", hex: "#0D9488" },
];

export function ClothingListingToolbar({
  totalCount,
  currentCategory,
  columns,
  onColumnsChange,
  filters,
  onFilterChange,
  onResetFilters,
}: ClothingListingToolbarProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleCategoryTabClick = (slug: string) => {
    onFilterChange({
      ...filters,
      category: slug,
    });
  };

  const toggleSize = (size: string) => {
    const updated = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: updated });
  };

  const toggleColor = (colorName: string) => {
    const updated = filters.colors.includes(colorName)
      ? filters.colors.filter((c) => c !== colorName)
      : [...filters.colors, colorName];
    onFilterChange({ ...filters, colors: updated });
  };

  const toggleFabric = (fabric: string) => {
    const updated = filters.fabric.includes(fabric)
      ? filters.fabric.filter((f) => f !== fabric)
      : [...filters.fabric, fabric];
    onFilterChange({ ...filters, fabric: updated });
  };

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.fabric.length > 0 ||
    filters.inStockOnly ||
    filters.maxPrice < 5000;

  return (
    <div className="w-full mb-6">
      {/* --- Horizontal Category Tabs Bar --- */}
      <div className="border-b border-slate-200 pb-3 mb-5 overflow-x-auto scrollbar-none">
        <ul className="flex items-center gap-2.5 min-w-max">
          {CATEGORY_TABS.map((tab) => {
            const isActive = filters.category === tab.id || (tab.id === "all" && !filters.category);
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => handleCategoryTabClick(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#1D6474] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {tab.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* --- Main Action Bar --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
        {/* Left: Filter Toggle & Total Count */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-bold text-slate-800 hover:border-[#1D6474] hover:text-[#1D6474] transition-colors shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#1D6474]" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#1D6474]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <div className="h-4 w-px bg-slate-300 hidden sm:block" />

          <span className="text-xs sm:text-sm text-slate-600 font-medium">
            Showing <strong className="text-slate-900 font-bold">{totalCount}</strong> items
          </span>
        </div>

        {/* Right: Grid Switcher & Sorting */}
        <div className="flex items-center gap-4">
          {/* Column Density Buttons (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => onColumnsChange(3)}
              title="3 Columns (Comfort)"
              className={`p-2 rounded transition-colors cursor-pointer ${
                columns === 3 ? "text-[#1D6474] bg-teal-50" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Grid2X2 className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onColumnsChange(4)}
              title="4 Columns (Standard)"
              className={`p-2 rounded transition-colors cursor-pointer ${
                columns === 4 ? "text-[#1D6474] bg-teal-50" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onColumnsChange(5)}
              title="5 Columns (High density)"
              className={`p-2 rounded transition-colors cursor-pointer ${
                columns === 5 ? "text-[#1D6474] bg-teal-50" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Grid3X3 className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-slate-600 font-semibold hidden sm:inline">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
              className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1D6474] shadow-2xs cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Filter Sidebar / Slide-Over Drawer --- */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in-0 duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-[#164E63] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-teal-300" />
                  <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wider">
                    Filter Products
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Category */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                    Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_TABS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryTabClick(cat.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          filters.category === cat.id || (cat.id === "all" && !filters.category)
                            ? "bg-[#1D6474] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* 2. Sizes */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                    Size
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_SIZES.map((sz) => {
                      const isChecked = filters.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`py-2 text-xs font-bold font-mono border rounded transition-all cursor-pointer ${
                            isChecked
                              ? "border-[#1D6474] bg-[#1D6474] text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* 3. Color Palettes */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                    Color
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_COLORS.map((c) => {
                      const isSelected = filters.colors.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => toggleColor(c.name)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#1D6474] bg-teal-50/50 text-[#1D6474]"
                              : "border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate">{c.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-[#1D6474]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* 4. Fabric Types */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                    Fabric & Material
                  </h4>
                  <div className="space-y-2">
                    {AVAILABLE_FABRICS.map((f) => {
                      const isChecked = filters.fabric.includes(f);
                      return (
                        <label
                          key={f}
                          className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFabric(f)}
                            className="w-4 h-4 rounded text-[#1D6474] focus:ring-[#1D6474] border-slate-300"
                          />
                          <span>{f}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* 5. Max Price Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Max Price
                    </h4>
                    <span className="text-xs sm:text-sm font-black text-[#1D6474]">
                      ৳ {filters.maxPrice.toLocaleString("en-BD")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      onFilterChange({ ...filters, maxPrice: Number(e.target.value) })
                    }
                    className="w-full accent-[#1D6474] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1">
                    <span>৳500</span>
                    <span>৳5,000</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="flex-1 py-3 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-3 bg-[#1D6474] hover:bg-[#15515E] text-white rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-colors cursor-pointer"
                >
                  Apply Filters ({totalCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
