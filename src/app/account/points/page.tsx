"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, Sparkles, Gift, TrendingUp, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/shared/ui/button";

export default function AccountPointsPage() {
  const [points, setPoints] = useState(250);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  const history = [
    { id: "pts-1", title: "Order Purchase (ORD-2026-237693)", points: "+50 pts", type: "earned", date: "02 Sep 2026" },
    { id: "pts-2", title: "Product Review Submission", points: "+20 pts", type: "earned", date: "14 Aug 2026" },
    { id: "pts-3", title: "Welcome Sign Up Bonus", points: "+180 pts", type: "earned", date: "01 Aug 2026" },
  ];

  const handleRedeem = (cost: number, code: string) => {
    if (points < cost) {
      alert("You need more points to redeem this reward voucher!");
      return;
    }
    setPoints((prev) => prev - cost);
    setRedeemedCode(code);
    alert(`Congratulations! You unlocked Voucher code: ${code}. You can copy and use it on checkout!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" /> Beauty Loyalty & Reward Points
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Earn points on every order and review, then redeem them for exclusive cash vouchers.
          </p>
        </div>
      </div>

      {/* Points Balance Card */}
      <div className="rounded-3xl border border-purple-200 bg-linear-to-r from-purple-900 via-indigo-900 to-pink-900 p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-pink-300 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Silver Glam Tier
          </span>
          <span className="text-xs text-purple-200">100 pts = ৳50 BDT</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-black tracking-tight">{points}</span>
          <span className="text-base text-purple-200 font-bold">Total Available Points</span>
        </div>

        <p className="text-xs text-purple-200 max-w-md">
          You are <strong>250 points</strong> away from reaching <strong>Gold Glam VIP</strong> tier with free delivery perks!
        </p>
      </div>

      {/* Rewards Catalog */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
          <Gift className="h-4 w-4 text-[#1D6474]" /> Redeem Points for Cash Vouchers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#1D6474] bg-teal-50/60 px-2.5 py-1 rounded-lg">৳100 OFF</span>
              <h3 className="font-bold text-sm text-gray-900 mt-2">100 BDT Voucher</h3>
              <p className="text-[11px] text-gray-500">Min. order ৳1,200</p>
            </div>
            <Button
              onClick={() => handleRedeem(200, "GLAM100")}
              disabled={points < 200}
              className="w-full text-xs font-bold bg-[#1D6474] hover:bg-[#164E63] text-white"
            >
              Redeem (200 pts)
            </Button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">৳250 OFF</span>
              <h3 className="font-bold text-sm text-gray-900 mt-2">250 BDT Voucher</h3>
              <p className="text-[11px] text-gray-500">Min. order ৳2,500</p>
            </div>
            <Button
              onClick={() => handleRedeem(500, "GLAM250")}
              disabled={points < 500}
              className="w-full text-xs font-bold bg-[#1D6474] hover:bg-[#164E63] text-white"
            >
              Redeem (500 pts)
            </Button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">FREE SHIPPING</span>
              <h3 className="font-bold text-sm text-gray-900 mt-2">Free Delivery Pass</h3>
              <p className="text-[11px] text-gray-500">Any order anywhere in BD</p>
            </div>
            <Button
              onClick={() => handleRedeem(150, "FREESHIPPASS")}
              disabled={points < 150}
              className="w-full text-xs font-bold bg-[#1D6474] hover:bg-[#164E63] text-white"
            >
              Redeem (150 pts)
            </Button>
          </div>
        </div>
      </div>

      {/* Points History Ledger */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <TrendingUp className="h-4 w-4 text-gray-600" /> Points Activity History
        </h2>

        <div className="divide-y divide-gray-100 text-xs">
          {history.map((h) => (
            <div key={h.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{h.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{h.date}</p>
              </div>
              <span className="font-black text-sm text-emerald-600 font-mono">{h.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
