"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, MessageSquare, ThumbsUp, ShoppingBag, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/shared/ui/button";

export default function AccountReviewsPage() {
  const [activeTab, setActiveTab] = useState<"history" | "to_review">("history");

  const mockReviews = [
    {
      id: "rev-1",
      productName: "COSRX Advanced Snail 96 Mucin Power Essence (100ml)",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80",
      rating: 5,
      date: "14 Feb 2026",
      title: "Best hydration essence ever!",
      comment: "100% authentic product! Leaves my skin feeling deeply hydrated, soft, and comfortable. Fast delivery inside Dhaka within 24 hours.",
      verified: true,
      helpful: 12,
    },
    {
      id: "rev-2",
      productName: "Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+ (50ml)",
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&q=80",
      rating: 5,
      date: "02 Jan 2026",
      title: "No white cast, leaves zero grease",
      comment: "Super lightweight sun cream, perfect under makeup. Blush & Budget never disappoints with authenticity.",
      verified: true,
      helpful: 8,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> My Reviews & Ratings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Share your feedback on verified purchases and help the beauty community.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "history" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Reviewed ({mockReviews.length})
          </button>
          <button
            onClick={() => setActiveTab("to_review")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "to_review" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            To Review (0)
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <div className="space-y-4">
          {mockReviews.map((rev) => (
            <div key={rev.id} className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.image}
                    alt={rev.productName}
                    className="h-14 w-14 rounded-2xl border border-gray-200 object-cover shrink-0"
                  />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{rev.productName}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating ? "text-amber-500 fill-amber-500" : "text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] text-gray-400 ml-2">{rev.date}</span>
                    </div>
                  </div>
                </div>

                {rev.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Buyer
                  </span>
                )}
              </div>

              <div className="rounded-2xl bg-gray-50/70 p-4 border border-gray-100 space-y-1">
                <p className="text-xs font-bold text-gray-900">{rev.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                <span className="flex items-center gap-1 text-gray-500">
                  <ThumbsUp className="h-3.5 w-3.5 text-[#e91e63]" /> {rev.helpful} people found this helpful
                </span>
                <span className="text-[#e91e63] font-bold">Public Review</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-[#e91e63]">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-gray-900">No items pending review</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Once your latest orders are delivered, you can write reviews and earn bonus loyalty points.
          </p>
          <Link href="/products" className="inline-block">
            <Button className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs">Explore New Arrivals</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
