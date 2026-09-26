"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight, ChevronRight, Check } from "lucide-react";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";
import { useState } from "react";

export default function WishlistPage() {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem, openCart } = useCart();
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const handleAddToCart = (item: any) => {
    addItem(
      {
        id: item.id,
        product_id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.sale_price ?? item.regular_price,
        regular_price: item.regular_price,
        image_url: item.image_url || "",
        brand_name: item.brand_name || "",
      },
      1
    );
    setAddedIds((prev) => [...prev, item.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== item.id));
    }, 1800);
  };

  const handleOrderNow = (item: any) => {
    handleAddToCart(item);
    openCart();
  };

  return (
    <div className="container-main py-6 sm:py-8 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          {t("mobileNav", "home")}
        </Link>
        <ChevronRight className="h-3 w-3 text-gray-400" />
        <span className="text-gray-900 font-bold">{t("wishlist", "title")}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#1D6474] fill-[#1D6474]" />
            {t("wishlist", "title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === "bn"
              ? `${toBn(wishlist.length)} items Products your desired   ।`
              : `${wishlist.length} item${wishlist.length === 1 ? "" : "s"} saved for your beauty routine.`}
          </p>
        </div>

        {wishlist.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearWishlist}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 self-start sm:self-auto rounded-xl font-bold"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {language === "bn" ? " Delete" : "Clear All Wishlist"}
          </Button>
        )}
      </div>

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 sm:p-16 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50/60 text-[#1D6474]">
            <Heart className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-gray-900">{t("wishlist", "emptyTitle")}</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              {t("wishlist", "emptySubtitle")}
            </p>
          </div>
          <Link href="/products" className="inline-block pt-2">
            <Button className="rounded-xl text-xs font-black px-6 h-11 bg-[#1D6474] hover:bg-[#164E63] text-white shadow-md">
              {t("wishlist", "exploreProducts")}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wishlist.map((item) => {
            const isAdded = addedIds.includes(item.id);
            const discountPercent = item.regular_price && item.sale_price && item.regular_price > item.sale_price
              ? Math.round(((item.regular_price - item.sale_price) / item.regular_price) * 100)
              : null;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all duration-200 hover:shadow-lg hover:border-teal-300"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow text-gray-400 hover:text-red-600 hover:bg-red-50 hover:scale-110 transition-all"
                  title={t("wishlist", "remove")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Discount Badge */}
                {discountPercent && (
                  <div className="absolute left-2 top-2 z-10 rounded-md bg-[#1D6474] px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                    -{toBn(discountPercent)}% {t("product", "off")}
                  </div>
                )}

                {/* Product Image */}
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center p-3"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-gray-300" />
                  )}
                </Link>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                  {item.brand_name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D6474]">
                      {item.brand_name}
                    </span>
                  )}
                  <Link
                    href={`/products/${item.slug}`}
                    className="mt-0.5 block text-[11.5px] sm:text-[13px] md:text-sm font-semibold text-gray-900 hover:text-[#1D6474] transition-colors leading-snug"
                  >
                    {item.name}
                  </Link>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-gray-900">
                      {formatPriceBn(item.sale_price ?? item.regular_price)}
                    </span>
                    {item.sale_price && (
                      <span className="text-[11px] text-gray-400 line-through">
                        {formatPriceBn(item.regular_price)}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Add to Cart + Order Now */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                    >
                      {isAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                      <span>{isAdded ? t("product", "addedToCart") : t("product", "addToCart")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOrderNow(item)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-black bg-[#1D6474] hover:bg-[#164E63] text-white transition-all shadow-xs active:scale-98"
                    >
                      {t("product", "orderNow")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

