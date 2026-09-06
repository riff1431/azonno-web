"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Award,
  ArrowRight,
  Truck,
  MapPin,
  ShieldCheck,
  Ticket,
  Sparkles,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/language-context";

interface AccountOverviewClientProps {
  data: {
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    latestOrder: any;
    user: any;
    role: string;
  } | null;
}

export function AccountOverviewClient({ data }: AccountOverviewClientProps) {
  const { language, toBn, formatPriceBn } = useLanguage();
  const isBn = language === "bn";

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [passwordAlreadySet, setPasswordAlreadySet] = useState(false);

  if (!data) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-black text-gray-900">
          {isBn ? "অনুগ্রহ করে সাইন ইন করুন" : "Please Sign In"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          {isBn
            ? "আপনার ড্যাশবোর্ড, অর্ডার হিস্টোরি এবং সংরক্ষিত ঠিকানা দেখতে সাইন ইন করুন বা নতুন অ্যাকাউন্ট তৈরি করুন।"
            : "Sign in or create an account to view your dashboard, order history, and saved addresses."}
        </p>
        <Link href="/login" className="inline-block pt-2">
          <Button className="bg-[#e91e63] hover:bg-[#d81557] text-white font-bold px-6 py-2.5 rounded-2xl shadow-sm">
            {isBn ? "অ্যাকাউন্টে সাইন ইন করুন" : "Sign In to Account"}
          </Button>
        </Link>
      </div>
    );
  }

  const { totalOrders, pendingOrders, deliveredOrders, latestOrder, user, role } = data;
  const isAdmin = role === "admin" || role === "moderator";

  const needsPassword =
    !passwordAlreadySet &&
    (user?.user_metadata?.has_custom_password === false ||
      user?.user_metadata?.auto_created === true);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwdError(isBn ? "পাসওয়ার্ড দুটি মেলেনি।" : "Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError(isBn ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" : "Password must be at least 8 characters.");
      return;
    }

    setPwdLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          has_custom_password: true,
          auto_created: false,
        },
      });

      if (updateError) {
        setPwdError(updateError.message);
        return;
      }

      setPwdSuccess(true);
      setPasswordAlreadySet(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess(false);
      }, 2500);
    } catch {
      setPwdError(isBn ? "পাসওয়ার্ড সেট করতে ব্যর্থ হয়েছে।" : "Failed to set password. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  const stats = [
    {
      label: isBn ? "মোট অর্ডার" : "Total Orders",
      value: isBn ? toBn(totalOrders) : String(totalOrders),
      icon: ShoppingBag,
      color: "bg-pink-50 text-[#e91e63]",
    },
    {
      label: isBn ? "পেন্ডিং অর্ডার" : "Pending",
      value: isBn ? toBn(pendingOrders) : String(pendingOrders),
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: isBn ? "ডেলিভার্ড" : "Delivered",
      value: isBn ? toBn(deliveredOrders) : String(deliveredOrders),
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: isBn ? "লয়ালটি পয়েন্টস" : "Points Earned",
      value: isBn ? toBn(250) : "250",
      icon: Award,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const getStatusText = (status: string) => {
    if (!isBn) return status;
    const statusMap: Record<string, string> = {
      pending: "পেন্ডিং",
      processing: "প্রসেসিং",
      shipped: "শিপড",
      delivered: "ডেলিভার্ড",
      cancelled: "বাতিল",
      returned: "ফেরত",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <div className="space-y-6">
      {/* Auto-Created Account: Set Password Prompt Banner */}
      {needsPassword && !dismissBanner && (
        <div className="rounded-3xl border border-pink-200 bg-linear-to-r from-pink-50 via-rose-50/70 to-amber-50/50 p-5 sm:p-6 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e91e63] text-white shadow-xs">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {isBn ? "আপনার অ্যাকাউন্টের জন্য পাসওয়ার্ড সেট করুন" : "Set a Password for Your Account"}
                </h3>
                <p className="text-xs text-gray-600 max-w-xl">
                  {isBn
                    ? "আপনার অর্ডার করার সময় এই অ্যাকাউন্টটি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে। ভবিষ্যতে সরাসরি লগইন করতে এবং অর্ডার ট্র্যাক করতে একটি স্থায়ী পাসওয়ার্ড সেট করুন।"
                    : "Your account was automatically created when you placed your order. Set a permanent password now to easily log in and manage your orders anytime."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                onClick={() => setShowPasswordModal(true)}
                className="bg-[#e91e63] hover:bg-[#d81557] text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-xs"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {isBn ? "পাসওয়ার্ড সেট করুন" : "Set Password"}
              </Button>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/60 transition-colors"
                title={isBn ? "বন্ধ করুন" : "Dismiss"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#e91e63]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {isBn ? "স্থায়ী পাসওয়ার্ড সেট করুন" : "Set Permanent Password"}
                </h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {pwdSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">
                  {isBn ? "পাসওয়ার্ড সফলভাবে সেট করা হয়েছে!" : "Password has been set successfully!"}
                </p>
                <p className="text-xs text-emerald-700">
                  {isBn
                    ? "এখন থেকে আপনি আপনার ফোন নম্বর / ইমেইল ও এই পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।"
                    : "You can now log in anytime using your mobile number or email and this password."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4 text-xs">
                {pwdError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 font-medium">
                    {pwdError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="font-bold text-gray-800">
                    {isBn ? "নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" : "New Password (min. 8 characters)"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isBn ? "পাসওয়ার্ড দিন" : "Enter new password"}
                      required
                      minLength={8}
                      className="pl-10 pr-10 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-gray-800">
                    {isBn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isBn ? "আবার পাসওয়ার্ড দিন" : "Re-enter password"}
                      required
                      minLength={8}
                      className="pl-10 pr-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordModal(false)}
                    className="rounded-xl"
                  >
                    {isBn ? "পরে করুন" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={pwdLoading}
                    className="bg-[#e91e63] hover:bg-[#d81557] text-white font-bold rounded-xl"
                  >
                    {pwdLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      isBn ? "সংরক্ষণ করুন" : "Save Password"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Quick Launch Banner */}
      {isAdmin && (
        <div className="rounded-3xl border border-pink-300 bg-pink-50/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e91e63] px-3 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
              <Sparkles className="h-3 w-3" />
              {isBn ? "অ্যাডমিনিস্ট্রেটর অ্যাক্সেস" : "Administrator Access"}
            </span>
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              {isBn ? "অ্যাডমিন ও স্টোর ম্যানেজমেন্ট পোর্টাল" : "Admin & Store Management Portal"}
            </h2>
            <p className="text-xs text-gray-600">
              {isBn
                ? "আপনি পূর্ণ প্রশাসনিক সুবিধাসহ লগইন করেছেন। অর্ডার, প্রোডাক্ট, ইনভেন্টরি এবং সেটিংস পরিচালনা করুন।"
                : "You are logged in with full administrative privileges. Manage orders, products, inventory, invoices, and site settings."}
            </p>
          </div>
          <Link href="/admin">
            <Button className="bg-[#e91e63] hover:bg-[#d81557] text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-md shrink-0">
              {isBn ? "অ্যাডমিন ড্যাশবোর্ড খুলুন" : "Open Admin Dashboard"}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Welcome banner */}
      <div className="rounded-3xl border border-gray-200 bg-linear-to-r from-gray-950 via-zinc-900 to-pink-950 p-6 sm:p-8 text-white shadow-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          {isAdmin
            ? (isBn ? "সুপার অ্যাডমিনিস্ট্রেটর" : "Super Administrator")
            : (isBn ? "ভেরিফায়েড মেম্বার" : "Verified Member")}
        </span>
        <h1 className="mt-2 text-xl sm:text-2xl font-black">
          {isBn ? "স্বাগতম," : "Welcome back,"}{" "}
          {user.user_metadata?.full_name || user.email?.split("@")[0]}!
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-pink-100/80">
          {isBn
            ? "আপনার সক্রিয় ডেলিভারি ট্র্যাক করুন, ঠিকানা পরিচালনা করুন এবং বিউটি লয়ালটি পয়েন্ট অর্জন করুন।"
            : "Track your active deliveries, manage your address book, and earn beauty loyalty points."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
            >
              <div className={`mb-3 inline-flex rounded-2xl p-2.5 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-bold">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Latest Order Card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#e91e63]" />
            {isBn ? "সর্বশেষ অর্ডারের অবস্থা" : "Latest Order Status"}
          </h2>
          <Link href="/account/orders" className="text-xs font-bold text-[#e91e63] hover:underline">
            {isBn ? "সব অর্ডার দেখুন →" : "View All Orders →"}
          </Link>
        </div>

        {latestOrder ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/70 rounded-2xl p-4 border border-gray-100">
            <div className="space-y-1 text-xs">
              <span className="font-mono font-black text-[#e91e63] text-sm block">
                {latestOrder.order_number}
              </span>
              <p className="text-gray-500">
                {isBn
                  ? `অর্ডারের তারিখ: ${toBn(new Date(latestOrder.created_at).toLocaleDateString("en-GB"))}`
                  : `Placed on ${new Date(latestOrder.created_at).toLocaleDateString("en-GB")}`}
              </p>
              <span className="text-sm font-black text-gray-900 block">
                {isBn ? `মোট: ${formatPriceBn(latestOrder.total)}` : `Total: ${formatPrice(latestOrder.total)}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-pink-50 text-[#e91e63] border border-pink-200 px-3 py-1 text-xs font-black capitalize">
                {isBn ? `অবস্থা: ${getStatusText(latestOrder.status)}` : `Status: ${latestOrder.status}`}
              </span>
              <Link href="/account/track">
                <Button size="sm" className="bg-[#e91e63] hover:bg-[#d81557] text-white text-xs font-black rounded-xl">
                  {isBn ? "ট্র্যাক করুন" : "Track Consignment"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400 space-y-2">
            <p>{isBn ? "আপনি এখনও কোনো অর্ডার করেননি।" : "You haven't placed any orders yet."}</p>
            <Link href="/products" className="inline-block">
              <Button size="sm" className="bg-[#e91e63] text-white text-xs font-bold rounded-xl">
                {isBn ? "শপিং শুরু করুন" : "Start Shopping"}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#e91e63] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-[#e91e63] shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#e91e63] transition-colors">
                {isBn ? "অর্ডার হিস্টোরি" : "Order History"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isBn ? "পূর্ববর্তী কেনাকাটা দেখুন ও পুনরায় অর্ডার করুন" : "View and re-order past purchases"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        <Link
          href="/account/addresses"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#e91e63] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#e91e63] transition-colors">
                {isBn ? "সংরক্ষিত ডেলিভারি ঠিকানা" : "Saved Delivery Addresses"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isBn ? "বাসা ও অফিসের ঠিকানা সহজে ম্যানেজ করুন" : "Manage home and office addresses"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        <Link
          href="/account/vouchers"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#e91e63] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#e91e63] transition-colors">
                {isBn ? "প্রমো ভাউচার ও ডিসকাউন্ট" : "Promo Vouchers"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isBn ? "কুপন ও বিশেষ ছাড় সংগ্রহ করুন" : "Claim discounts & coupons"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      </div>
    </div>
  );
}
