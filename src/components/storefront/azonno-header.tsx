"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Phone, MapPin, Truck } from "lucide-react";
import { AzonnoHeaderLogo } from "@/components/ui/azonno-logo";
import { useCart } from "@/context/cart-context";
import { AZONNO_PRODUCTS, CLOTHING_CATEGORIES } from "@/data/clothing-catalog";

export function AzonnoHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { itemCount = 0, subtotal = 0, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter products for instant search preview
  const searchResults = searchQuery.trim()
    ? AZONNO_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs transition-all duration-200">
      {/* --- Top Bar (Azonno style Announcement) --- */}
      <div className="bg-[#164E63] text-white text-xs font-medium py-2 px-4 border-b border-teal-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-teal-300" />
            <span className="text-xs sm:text-sm">
              Free nationwide delivery on all orders over <strong>৳1,999</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-5 text-teal-100 text-xs sm:text-[13px] font-medium">
            <Link href="/track-order" className="hover:text-white transition-colors">
              Track Order
            </Link>
            <span>•</span>
            <Link href="/returns" className="hover:text-white transition-colors">
              Exchange & Return
            </Link>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Phone className="w-3.5 h-3.5 text-teal-300" />
              <span>+880 1800-AZONNO</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Navigation Bar --- */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 transition-all duration-200 ${isScrolled ? "py-3" : "py-4"}`}>
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-[#1D6474] lg:hidden cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Azonno Brand Logo */}
          <div className="flex-shrink-0">
            <AzonnoHeaderLogo />
          </div>

          {/* Desktop Search Bar with Instant Autocomplete */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xl hidden lg:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search casual shirts, panjabis, polos, denim, sizes..."
                className="w-full pl-5 pr-12 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#1D6474] focus:bg-white rounded-full text-sm font-medium text-slate-900 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1D6474] hover:bg-[#15515E] text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Instant Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in-50 duration-150">
                <div className="p-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Products ({searchResults.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {searchResults.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-3.5 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <img src={p.primaryImage} alt={p.name} className="w-12 h-14 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-[#1D6474] font-extrabold mt-0.5">৳ {p.price.toLocaleString("en-BD")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                  <Link
                    href={`/shop?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setIsSearchFocused(false)}
                    className="text-xs text-[#1D6474] font-bold uppercase tracking-wider hover:underline"
                  >
                    View all results for &ldquo;{searchQuery}&rdquo; →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Action Icons (Account, Wishlist, Cart) */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Account Link */}
            <Link
              href="/account"
              className="flex items-center gap-2 text-slate-700 hover:text-[#1D6474] transition-colors"
              title="My Account"
            >
              <div className="p-2 rounded-full hover:bg-slate-100">
                <User className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold hidden xl:inline">Account</span>
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-2 rounded-full text-slate-700 hover:text-[#1D6474] hover:bg-slate-100 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Button with Count & Live Total */}
            <button
              type="button"
              onClick={openCart}
              className="flex items-center gap-2.5 p-2 sm:px-4 sm:py-2.5 bg-[#1D6474] text-white hover:bg-[#15515E] rounded-full sm:rounded-lg shadow-sm transition-all cursor-pointer"
              aria-label="View shopping cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D97706] text-white text-[11px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] uppercase font-bold text-teal-200 leading-none">My Bag</span>
                <span className="text-sm font-extrabold text-white leading-tight">৳ {(subtotal || 0).toLocaleString("en-BD")}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shirts, panjabis, polos..."
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-[#1D6474]"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-[#1D6474]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* --- Desktop Main Categories Nav Bar (Azonno Style) --- */}
      <nav className="border-t border-slate-100 bg-[#F8FAFC] hidden lg:block overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ul className="flex items-center justify-center gap-3.5 xl:gap-7 py-2.5 text-xs xl:text-sm font-bold uppercase tracking-wider text-slate-700 min-w-max">
            <li>
              <Link href="/shop?filter=new" className="hover:text-[#1D6474] transition-colors">
                New In
              </Link>
            </li>
            <li>
              <Link href="/category/casual-shirt" className="hover:text-[#1D6474] transition-colors">
                Casual Shirts
              </Link>
            </li>
            <li>
              <Link href="/category/panjabi" className="hover:text-[#1D6474] transition-colors">
                Festive Panjabi
              </Link>
            </li>
            <li>
              <Link href="/category/polo-t-shirts" className="hover:text-[#1D6474] transition-colors">
                Polo Shirts
              </Link>
            </li>
            <li>
              <Link href="/category/women-coords" className="hover:text-[#1D6474] transition-colors">
                Women Co-ords
              </Link>
            </li>
            <li>
              <Link href="/category/women-kurtis" className="hover:text-[#1D6474] transition-colors">
                Kurtis & 3-Piece
              </Link>
            </li>
            <li>
              <Link href="/category/denim-jeans" className="hover:text-[#1D6474] transition-colors">
                Denim & Chinos
              </Link>
            </li>
            <li>
              <Link
                href="/shop?filter=sale"
                className="inline-flex items-center gap-1.5 text-amber-700 font-extrabold hover:text-amber-800"
              >
                <span>Special Deals</span>
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  SAVE 20%
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* --- Mobile Slide-Over Drawer --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-5 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <AzonnoHeaderLogo />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Shop Categories
                </p>
                <ul className="space-y-2 text-sm font-semibold text-slate-800">
                  <li>
                    <Link
                      href="/shop"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-1.5 hover:text-[#1D6474]"
                    >
                      All Collections
                    </Link>
                  </li>
                  {CLOTHING_CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-1.5 hover:text-[#1D6474]"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2 border-t border-slate-100">
                    <Link
                      href="/shop?filter=sale"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-1.5 text-amber-600 font-bold"
                    >
                      Special Offers & Deals 🔥
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-700 font-semibold"
              >
                My Account / Orders
              </Link>
              <Link
                href="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-700 font-semibold"
              >
                Track Your Parcel
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
