"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  Truck,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useCart, CartItem } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { formatPrice, cn, getShortProductId } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import {
  trackViewCart,
  trackRemoveFromCart as trackGA4RemoveFromCart,
  trackBeginCheckout,
} from "@/lib/analytics/datalayer";

const FREE_SHIPPING_THRESHOLD = 2500;

export function CartDrawer() {
  const { language, toBn, formatPriceBn, t } = useLanguage();
  const {
    items,
    itemCount,
    subtotal,
    discount,
    coupon,
    isCartOpen,
    openCart,
    closeCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const total = Math.max(0, subtotal - discount);

  // Trigger view_cart event when drawer opens
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
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
  }, [isCartOpen]);

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

  const handleProceedToCheckout = () => {
    trackBeginCheckout(
      items.map((it) => ({
        item_id: getShortProductId(it),
        item_name: it.name,
        item_brand: it.brand_name || undefined,
        item_variant: it.variant_label || undefined,
        price: it.price,
        quantity: it.quantity,
      })),
      total,
      coupon?.code
    );
    closeCart();
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
    <>
      {/* 1. Shajgoj Signature Floating Desktop Side-Cart Tab Button */}
      <button
        onClick={openCart}
        className="hidden md:flex flex-col fixed right-0 top-[38%] z-30 border-t border-l border-b border-[#e91e63] rounded-tl-xl rounded-bl-xl text-white text-xs cursor-pointer shadow-xl transition-transform hover:scale-105"
        aria-label="Open mini cart"
      >
        <div className="bg-sg-black rounded-tl-xl flex flex-col text-center px-2 pt-2.5 pb-1.5 items-center w-full min-w-17.5">
          <ShoppingBag className="h-5 w-5 text-white stroke-2" />
          <div className="flex flex-col text-xs font-bold items-center leading-none mt-1">
            <span>{toBn(itemCount)}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
              {language === "bn" ? "টি আইটেম" : "ITEMS"}
            </span>
          </div>
        </div>
        <div className="bg-[#e91e63] rounded-bl-xl text-center text-xs font-black px-1.5 py-1.5 w-full">
          <span>{formatPriceBn(subtotal)}</span>
        </div>
      </button>

      {/* 2. Slide-Over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0"
            onClick={closeCart}
          />

          {/* Drawer Body */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="relative flex items-center justify-between border-b border-gray-200 p-4">
                <button
                  type="button"
                  onClick={closeCart}
                  className="p-1 text-[#e91e63] hover:text-sg-pink-hover transition-colors"
                  aria-label="Close Cart"
                >
                  <X className="h-5 w-5 stroke-2" />
                </button>
                <h2 className="text-base font-bold text-gray-900">
                  {language === "bn" ? "আপনার কার্ট" : "Your Shopping Bag"}
                </h2>
                <div className="w-5" /> {/* balance spacing */}
              </div>

              {/* Free Delivery Banner */}
              <div className="bg-pink-50/70 border-b border-pink-100 p-3 text-xs">
                <div className="flex items-center justify-between text-gray-800 font-bold mb-1.5 text-[11px] sm:text-xs">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-[#e91e63]" />
                    {amountNeeded > 0 ? (
                      <span>
                        {language === "bn" ? (
                          <>
                            ফ্রি ডেলিভারির জন্য আরও <strong className="text-[#e91e63]">{formatPriceBn(amountNeeded)}</strong> যোগ করুন!
                          </>
                        ) : (
                          <>
                            Add <strong className="text-[#e91e63]">{formatPrice(amountNeeded)}</strong> more for <strong>FREE Delivery</strong>!
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {language === "bn" ? (
                          <>অভিনন্দন! আপনি সারা দেশে <strong>ফ্রি ডেলিভারি</strong> পেয়েছেন!</>
                        ) : (
                          <>You unlocked <strong>FREE Delivery</strong> nationwide!</>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#e91e63] to-emerald-500 transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto text-gray-400">
                      <ShoppingBag className="h-10 w-10 stroke-1" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      {language === "bn" ? "আপনার কার্ট খালি" : "Your Shopping Bag is Empty"}
                    </p>
                    <Link href="/products" onClick={closeCart} className="inline-block mt-2">
                      <Button className="px-8 py-2.5 bg-black text-white rounded-xl text-xs font-bold tracking-widest hover:bg-[#e91e63] transition-colors uppercase">
                        {language === "bn" ? "কেনাকাটা শুরু করুন" : "START SHOPPING"}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-xs hover:border-pink-200 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-1 flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          {item.brand_name && (
                            <span className="text-[10px] font-bold uppercase text-[#e91e63] tracking-wider">
                              {item.brand_name}
                            </span>
                          )}
                          <p className="line-clamp-1 text-xs font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs font-black text-gray-900 mt-0.5">
                            {formatPriceBn(item.price)}
                          </p>
                        </div>

                        {/* Stepper & Remove */}
                        <div className="flex items-center justify-between pt-1.5">
                          <div className="flex items-center h-7 rounded-lg border border-gray-200 bg-gray-50">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 text-gray-700 hover:bg-white rounded-l-lg transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-gray-900">
                              {toBn(item.quantity)}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 text-gray-700 hover:bg-white rounded-r-lg transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Footer */}
              {items.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50/70 p-4 space-y-3.5">
                  {/* Coupon */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={language === "bn" ? "কুপন কোড" : "Coupon Code"}
                      className="flex-1 rounded-xl border px-3 py-1.5 text-xs uppercase font-mono focus:outline-none"
                    />
                    <Button type="submit" size="sm" disabled={isApplying} className="rounded-xl text-xs font-bold bg-black text-white hover:bg-[#e91e63]">
                      {language === "bn" ? "প্রয়োগ" : "Apply"}
                    </Button>
                  </form>

                  {couponMsg && (
                    <p className={cn("text-xs font-semibold", couponMsg.isError ? "text-red-600" : "text-emerald-600")}>
                      {couponMsg.text}
                    </p>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>{language === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
                      <span className="font-bold text-gray-900">{formatPriceBn(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>{language === "bn" ? "ছাড়" : "Discount"}</span>
                        <span>-{formatPriceBn(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-900">
                      <span>{language === "bn" ? "সর্বমোট" : "Total"}</span>
                      <span className="text-base text-[#e91e63]">{formatPriceBn(total)}</span>
                    </div>
                  </div>

                  <Link href="/checkout" onClick={handleProceedToCheckout} className="block">
                    <Button className="w-full h-11 rounded-xl bg-[#e91e63] hover:bg-sg-pink-hover text-white font-extrabold text-sm shadow-md transition-all active:scale-95">
                      <span>{language === "bn" ? "অর্ডার কনফার্ম করুন" : "PROCEED TO CHECKOUT"}</span>
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
