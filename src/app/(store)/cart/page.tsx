"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  CheckCircle2,
  Tag,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useCart, CartItem } from "@/context/cart-context";
import { formatPrice, getShortProductId } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import {
  trackViewCart,
  trackRemoveFromCart as trackGA4RemoveFromCart,
} from "@/lib/analytics/datalayer";
import { useLanguage } from "@/context/language-context";

const FREE_SHIPPING_THRESHOLD = 2500;

export default function CartPage() {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const {
    items,
    itemCount,
    subtotal,
    discount,
    coupon,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const total = Math.max(0, subtotal - discount);

  // Track view_cart event on mount or when items update
  useEffect(() => {
    if (items.length > 0) {
      trackViewCart(
        items.map((it) => ({
          item_id: getShortProductId(it),
          item_name: it.name,
          item_brand: it.brand_name || undefined,
          item_variant: it.variant_label || undefined,
          price: it.price,
          quantity: it.quantity,
        })),
        total
      );
    }
  }, []);

  const handleRemoveItem = (item: CartItem) => {
    trackGA4RemoveFromCart(
      [
        {
          item_id: getShortProductId(item),
          item_name: item.name,
          item_brand: item.brand_name || undefined,
          item_variant: item.variant_label || undefined,
          price: item.price,
          quantity: item.quantity,
        },
      ],
      item.price * item.quantity
    );
    removeItem(item.id);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    setCouponMsg(null);
    const res = await applyCoupon(couponCode);
    setCouponMsg({ text: res.message, isError: !res.success });
    setIsApplying(false);
    if (res.success) setCouponCode("");
  };

  return (
    <div className="container-main py-4 sm:py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          {t("mobileNav", "home")}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <span className="text-text font-bold">{t("cartPage", "pageTitle")}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-primary-600" />
            {t("cartPage", "pageTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {language === "bn"
              ? `${toBn(itemCount)} টি পণ্য সিলেক্ট করা হয়েছে`
              : `${itemCount} genuine item${itemCount === 1 ? "" : "s"} selected for checkout.`}
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {t("cartPage", "clearCart")}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white p-16 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <ShoppingBag className="h-8 w-8 stroke-[1.2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-text">{t("cartPage", "emptyStateTitle")}</h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
              {t("cartPage", "emptyStateDesc")}
            </p>
          </div>
          <Link href="/products" className="inline-block pt-2">
            <Button className="rounded-xl text-xs font-bold px-6 h-11">
              {t("cartPage", "continueShopping")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left 8 Cols: Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Meter Card */}
            <div className="rounded-2xl border border-primary-200/80 bg-primary-50/50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-primary-900">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary-600" />
                  {amountNeeded > 0 ? (
                    <span>
                      {language === "bn" ? (
                        <>ফ্রি ডেলিভারির জন্য আরও <strong>{formatPriceBn(amountNeeded)}</strong> এর পণ্য যোগ করুন!</>
                      ) : (
                        <>Add <strong>{formatPrice(amountNeeded)}</strong> more to get <strong>FREE Delivery</strong> inside Dhaka!</>
                      )}
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {language === "bn"
                        ? "অভিনন্দন! আপনি ফ্রি ডেলিভারি আনলক করেছেন!"
                        : "Congratulations! You unlocked FREE Delivery inside Dhaka!"}
                    </span>
                  )}
                </span>
                <span className="font-extrabold">{toBn(freeShippingProgress)}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary-600 to-emerald-500 transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items Cards */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-card hover:border-primary-300 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-secondary p-1 flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-text-muted stroke-1" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      {item.brand_name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                          {item.brand_name}
                        </span>
                      )}
                      <Link
                        href={`/products/${item.slug}`}
                        className="block font-bold text-xs sm:text-sm text-text hover:text-primary-600 truncate max-w-sm sm:max-w-md transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs font-black text-text">
                        {formatPriceBn(item.price)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity and Row Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {/* Stepper */}
                    <div className="flex items-center h-9 rounded-xl border border-border bg-surface-secondary">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 text-text hover:bg-white rounded-l-xl transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-text">
                        {toBn(item.quantity)}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 text-text hover:bg-white rounded-r-xl transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-18.75">
                      <span className="text-xs sm:text-sm font-black text-text">
                        {formatPriceBn(item.price * item.quantity)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-text-muted hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title={t("wishlist", "remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 4 Cols: Order Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5 sticky top-24">
              <h2 className="text-base font-black text-text border-b border-border pb-3">
                {t("cartPage", "orderSummary")}
              </h2>

              {/* Coupon Form */}
              <div className="space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={t("cartPage", "promoCode")}
                    className="flex-1 rounded-xl border px-3.5 py-2 text-xs font-mono uppercase focus:outline-none"
                  />
                  <Button type="submit" size="sm" disabled={isApplying} className="rounded-xl text-xs font-bold h-9">
                    {t("cartPage", "applyPromo")}
                  </Button>
                </form>

                {couponMsg && (
                  <p className={`text-xs font-semibold ${couponMsg.isError ? "text-red-600" : "text-emerald-600"}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5 text-xs text-text-secondary border-t border-border pt-4">
                <div className="flex justify-between">
                  <span>
                    {t("cart", "subtotal")} ({toBn(itemCount)} {language === "bn" ? "টি পণ্য" : "items"})
                  </span>
                  <span className="font-bold text-text">{formatPriceBn(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>{t("cart", "discount")}</span>
                    <span>-{formatPriceBn(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t("cartPage", "estimatedDelivery")}</span>
                  <span>
                    {amountNeeded === 0
                      ? (language === "bn" ? "ফ্রি" : "FREE")
                      : (language === "bn" ? "চেকআউটে নির্ধারিত হবে" : "Calculated at checkout")}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border pt-3 text-base font-black text-text">
                  <span>{t("cart", "total")}</span>
                  <span className="text-lg text-primary-700">{formatPriceBn(total)}</span>
                </div>
              </div>

              {/* Proceed to Checkout CTA */}
              <Link href="/checkout" className="block">
                <Button className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-95">
                  <span>{t("cartPage", "proceedToCheckout")}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              {/* Trust Indicators */}
              <div className="pt-2 border-t border-border space-y-2 text-[11px] text-text-muted font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t("footer", "authenticTitle")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>{t("footer", "codTitle")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>{t("footer", "returnTitle")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
