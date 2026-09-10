"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Phone,
  ArrowRight,
  Printer,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";
import { useCart } from "@/context/cart-context";

interface OrderConfirmationClientProps {
  order: any;
}

export function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const { clearCart } = useCart();
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  const address = order.shipping_address_snapshot || {};
  const items = order.order_items || [];

  const getStatusStepTitle = (step: string) => {
    switch (step) {
      case "placed":
        return language === "bn" ? "অর্ডার হয়েছে" : "Placed";
      case "confirmed":
        return language === "bn" ? "নিশ্চিত হয়েছে" : "Confirmed";
      case "shipped":
        return language === "bn" ? "শিপড হয়েছে" : "Shipped";
      case "delivered":
        return language === "bn" ? "ডেলিভারি হয়েছে" : "Delivered";
      default:
        return step;
    }
  };

  const isPaid = order.payment_status === "paid";
  const isBkash = order.payment_method === "bkash";
  
  // Extract TrxID from public_note or order_status_history if available
  const trxMatch =
    order.public_note?.match(/TrxID:\s*([A-Za-z0-9]+)/i) ||
    (order.order_status_history || [])
      .map((h: any) => h.note?.match(/TrxID:\s*([A-Za-z0-9]+)/i))
      .find(Boolean);
  const trxId = trxMatch ? trxMatch[1] : null;

  const getPaymentMethodLabel = (method: string) => {
    if (isPaid) {
      if (method === "bkash" || isBkash) {
        return language === "bn" ? "বিকাশ ইনস্ট্যান্ট পেমেন্ট (পরিশোধিত)" : "bKash Online Payment (PAID)";
      }
      if (method === "sslcommerz") {
        return language === "bn" ? "অনলাইন কার্ড ও নেট ব্যাংকিং (পরিশোধিত)" : "Online Payment (PAID)";
      }
      return language === "bn" ? "অনলাইন পেমেন্ট (পরিশোধিত)" : "Paid Online";
    }

    if (method === "cod") {
      return language === "bn" ? "ক্যাশ অন ডেলিভারি (বকেয়া)" : "Cash on Delivery (Pay on Delivery)";
    }
    if (method === "bkash") {
      return language === "bn" ? "বিকাশ অনলাইন পেমেন্ট" : "bKash Online Payment";
    }
    if (method === "sslcommerz") {
      return language === "bn" ? "অনলাইন কার্ড ও নেট ব্যাংকিং" : "Online Cards & Net Banking";
    }
    return method || (language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery");
  };

  return (
    <div className="space-y-8">
      {/* Celebratory Banner */}
      <div className="rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-500/10 via-emerald-50 to-white p-8 text-center shadow-card space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {t("orders", "confirmationTitle")}
            </span>
            {isPaid && (
              <span className="rounded-full bg-pink-100 text-[#e91e63] border border-pink-200 px-3 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {language === "bn" ? "বিকাশ পেমেন্ট সম্পন্ন" : "bKash Paid Online"}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-text">
            {t("orders", "thankYou")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
            {isPaid
              ? (language === "bn"
                  ? "আপনার পেমেন্ট সফলভাবে গৃহীত হয়েছে। পার্সেল ডেলিভারির সময় আপনাকে কোন অতিরিক্ত টাকা দিতে হবে না।"
                  : "Your payment has been successfully confirmed. You do NOT need to pay any amount upon delivery.")
              : t("orders", "receivedMsg")}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-border px-4 py-2 shadow-xs text-xs font-bold text-text">
            <span>{t("orders", "orderNumber")}:</span>
            <span className="text-[#e91e63] text-sm font-extrabold font-mono">
              {order.order_number}
            </span>
          </div>

          {trxId && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 border border-pink-200 px-3 py-2 text-xs font-bold text-pink-700">
              <span>TrxID:</span>
              <span className="font-mono font-black">{trxId}</span>
            </div>
          )}

          <Link href={`/orders/${order.id}/invoice`} target="_blank">
            <Button className="bg-[#e91e63] hover:bg-pink-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer">
              <Printer className="h-4 w-4 mr-1.5" />
              {t("orders", "downloadInvoice")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Order Status Tracker */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-text flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary-600" />
          {language === "bn" ? "ডেলিভারি ট্র্যাকার" : "Delivery Status Tracker"}
        </h2>

        <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-emerald-500" />
            <span className="font-bold text-emerald-700">{getStatusStepTitle("placed")}</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-primary-200" />
            <span className="font-medium text-text-muted">{getStatusStepTitle("confirmed")}</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-zinc-200" />
            <span className="font-medium text-text-muted">{getStatusStepTitle("shipped")}</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-zinc-200" />
            <span className="font-medium text-text-muted">{getStatusStepTitle("delivered")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Delivery Address */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-3 text-xs">
          <h3 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <MapPin className="h-4 w-4 text-primary-600" />
            {t("orders", "shippingAddress")}
          </h3>

          <div className="space-y-1 text-text-secondary leading-relaxed">
            <p className="font-bold text-text text-sm">{address.name}</p>
            <p className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-text-muted" />
              {toBn(address.phone)}
            </p>
            <p>{address.address}</p>
            <p>{address.thana}, {address.district}</p>
          </div>

          <div className="pt-2 border-t border-dashed border-border flex items-center justify-between text-[11px] font-semibold text-text">
            <span>{t("checkout", "paymentMethod")}:</span>
            <span
              className={`px-2.5 py-1 rounded-lg uppercase font-bold text-xs flex items-center gap-1.5 ${
                isPaid
                  ? "text-emerald-800 bg-emerald-100 border border-emerald-300"
                  : "text-amber-800 bg-amber-50 border border-amber-200"
              }`}
            >
              {isPaid && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
              {getPaymentMethodLabel(order.payment_method)}
            </span>
          </div>

          {trxId && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-text-secondary font-mono">
              <span>TrxID:</span>
              <span className="font-bold text-gray-800">{trxId}</span>
            </div>
          )}
        </div>

        {/* Order Summary & Totals */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-3 text-xs">
          <h3 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
            <Package className="h-4 w-4 text-primary-600" />
            {t("orders", "paymentSummary")}
          </h3>

          <div className="space-y-2 text-text-secondary">
            <div className="flex justify-between">
              <span>{t("checkout", "subtotal")}</span>
              <span className="font-semibold text-text">{formatPriceBn(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>{t("checkout", "discount")}</span>
                <span>-{formatPriceBn(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t("checkout", "deliveryFee")} ({order.shipping_method})</span>
              <span className="font-semibold text-text">
                {order.shipping_amount === 0 ? (language === "bn" ? "ফ্রি" : "FREE") : formatPriceBn(order.shipping_amount)}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-baseline text-xs font-bold text-text">
              <span>{language === "bn" ? "মোট অর্ডার মূল্য" : "Total Order Amount"}</span>
              <span className="text-gray-800 font-mono text-sm">{formatPriceBn(order.total)}</span>
            </div>

            {isPaid ? (
              <>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {language === "bn" ? "অনলাইনে পরিশোধিত" : "Paid Online (bKash)"}
                  </span>
                  <span className="font-mono">-{formatPriceBn(order.total)}</span>
                </div>
                <div className="border-t-2 border-emerald-400 pt-2 flex justify-between items-baseline text-sm font-extrabold text-emerald-800">
                  <span>{language === "bn" ? "ডেলিভারিতে প্রদেয় (Due)" : "Payable on Delivery"}</span>
                  <span className="text-base text-emerald-700 font-black">
                    {language === "bn" ? "৳০ (পরিশোধিত)" : "৳0 (PAID)"}
                  </span>
                </div>
              </>
            ) : (
              <div className="border-t border-border pt-2 flex justify-between items-baseline text-sm font-extrabold text-text">
                <span>{t("checkout", "totalPayable")}</span>
                <span className="text-[#e91e63] text-base">{formatPriceBn(order.total)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Products Table */}
      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <h3 className="text-sm font-bold text-text">
            {t("orders", "itemDetails")} ({toBn(items.length)})
          </h3>
        </div>

        <div className="divide-y divide-border">
          {items.map((item: any) => (
            <div key={item.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-text">{item.product_name_snapshot}</p>
                <p className="text-text-muted mt-0.5">
                  {language === "bn" ? "পরিমাণ: " : "Qty: "}
                  {toBn(item.quantity)} × {formatPriceBn(item.unit_price)}
                </p>
              </div>
              <span className="font-bold text-text">
                {formatPriceBn(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href={`/orders/${order.id}/invoice`} target="_blank">
          <Button variant="outline" size="lg" className="px-6 font-bold text-xs border-gray-300 hover:bg-gray-50">
            <Printer className="h-4 w-4 mr-2 text-[#e91e63]" />
            {t("orders", "downloadInvoice")}
          </Button>
        </Link>
        <Link href="/account">
          <Button variant="outline" size="lg" className="px-6 font-bold text-xs border-pink-200 bg-pink-50 hover:bg-pink-100 text-[#e91e63]">
            {language === "bn" ? "আমার অ্যাকাউন্ট ও অর্ডারসমূহ" : "My Account & Orders"}
          </Button>
        </Link>
        <Link href="/products">
          <Button size="lg" className="px-8 shadow-md bg-[#e91e63] hover:bg-pink-600 text-white font-bold">
            {t("cartPage", "continueShopping")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
