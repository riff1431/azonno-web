"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, Copy, Check, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";

export default function AccountVouchersPage() {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const vouchers = [
    {
      code: "GLAM10",
      title: isBn ? "10%   " : "10% OFF Sitewide",
      desc: isBn
        ? "All Premium Casual Wear  Apparel 10%    ।"
        : "Enjoy 10% instant discount on all international skincare & makeup.",
      minSpend: isBn ? "৳1,500" : "৳1,500",
      expiry: isBn ? ": 30  2026" : "Expires 30 Sep 2026",
      badge: isBn ? "" : "Popular",
      badgeColor: "bg-teal-50/60 text-[#1D6474]",
    },
    {
      code: "FREESHIPBD",
      title: isBn ? "All Order Free Delivery" : "Free Delivery on All Orders",
      desc: isBn
        ? "  English All 64  for ।"
        : "Valid for Dhaka & all 64 districts across Bangladesh.",
      minSpend: isBn ? "৳2,500" : "৳2,500",
      expiry: isBn ? ": 15  2026" : "Expires 15 Oct 2026",
      badge: isBn ? " Shipping" : "Free Shipping",
      badgeColor: "bg-emerald-50 text-emerald-700",
    },
    {
      code: "BLUSH500",
      title: isBn ? "৳500  Discount" : "৳500 Flat Cashback",
      desc: isBn
        ? "    Brand   ।"
        : "Instant discount on luxury Korean & Japanese beauty brands.",
      minSpend: isBn ? "৳4,000" : "৳4,000",
      expiry: isBn ? ": 31  2026" : "Expires 31 Dec 2026",
      badge: isBn ? " " : "VIP Voucher",
      badgeColor: "bg-purple-50 text-purple-700",
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#1D6474]" />
            {isBn ? "    Coupon" : "My Vouchers & Promo Coupons"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn
              ? "Discount   and   Code  ।"
              : "Claim discounts and copy codes to apply at checkout."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.map((v) => (
          <div
            key={v.code}
            className="rounded-3xl border-2 border-dashed border-teal-200 bg-white p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top Tag */}
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${v.badgeColor}`}>
                {v.badge}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {v.expiry}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-sm text-gray-900">{v.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              <p className="text-[11px] font-bold text-gray-700 mt-1">
                {isBn ? ` : ${v.minSpend}` : `Min. spend: ${v.minSpend}`}
              </p>
            </div>

            {/* Code Box & Copy Button */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2 border border-gray-200">
              <span className="font-mono font-black text-xs text-[#1D6474] px-2">{v.code}</span>
              <button
                onClick={() => handleCopy(v.code)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#1D6474] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#d81557] transition-colors"
              >
                {copiedCode === v.code ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" />
                    {isBn ? "!" : "Copied!"}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {isBn ? " Code" : "Copy Code"}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <p className="font-bold text-gray-900">
            {isBn ? "permanently  use ?" : "How to use vouchers?"}
          </p>
          <p className="text-gray-500">
            {isBn
              ? "  Coupon Code     Coupon box  ।"
              : "Copy any coupon code above and paste it in the Coupon box at checkout."}
          </p>
        </div>
        <Link href="/products">
          <Button size="sm" className="bg-[#1D6474] hover:bg-[#d81557] text-white text-xs font-bold rounded-xl px-5">
            {isBn ? " " : "Go Shopping"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

