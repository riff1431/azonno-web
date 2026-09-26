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
          {isBn ? "Please    " : "Please Sign In"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          {isBn
            ? "your Dashboard, Order  and  Address         ।"
            : "Sign in or create an account to view your dashboard, order history, and saved addresses."}
        </p>
        <Link href="/login" className="inline-block pt-2">
          <Button className="bg-[#1D6474] hover:bg-[#d81557] text-white font-bold px-6 py-2.5 rounded-2xl shadow-sm">
            {isBn ? "   " : "Sign In to Account"}
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
      setPwdError(isBn ? "Password items ।" : "Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError(isBn ? "Password  8   ।" : "Password must be at least 8 characters.");
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
      setPwdError(isBn ? "Password   Failed successfully।" : "Failed to set password. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  const stats = [
    {
      label: isBn ? "Total Order" : "Total Orders",
      value: isBn ? toBn(totalOrders) : String(totalOrders),
      icon: ShoppingBag,
      color: "bg-teal-50/60 text-[#1D6474]",
    },
    {
      label: isBn ? "Pending Order" : "Pending",
      value: isBn ? toBn(pendingOrders) : String(pendingOrders),
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: isBn ? "Delivered" : "Delivered",
      value: isBn ? toBn(deliveredOrders) : String(deliveredOrders),
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: isBn ? "items " : "Points Earned",
      value: isBn ? toBn(250) : "250",
      icon: Award,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const getStatusText = (status: string) => {
    if (!isBn) return status;
    const statusMap: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancel",
      returned: "",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <div className="space-y-6">
      {/* Auto-Created Account: Set Password Prompt Banner */}
      {needsPassword && !dismissBanner && (
        <div className="rounded-3xl border border-teal-200 bg-linear-to-r from-pink-50 via-rose-50/70 to-amber-50/50 p-5 sm:p-6 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1D6474] text-white shadow-xs">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {isBn ? "your  for Password  " : "Set a Password for Your Account"}
                </h3>
                <p className="text-xs text-gray-600 max-w-xl">
                  {isBn
                    ? "your Order    items permanently  successfully।   Login  and Order   items  Password  ।"
                    : "Your account was automatically created when you placed your order. Set a permanent password now to easily log in and manage your orders anytime."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                onClick={() => setShowPasswordModal(true)}
                className="bg-[#1D6474] hover:bg-[#d81557] text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-xs"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {isBn ? "Password  " : "Set Password"}
              </Button>
              <button
                type="button"
                onClick={() => setDismissBanner(true)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/60 transition-colors"
                title={isBn ? " " : "Dismiss"}
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
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100/70 text-[#1D6474]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {isBn ? " Password  " : "Set Permanent Password"}
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
                  {isBn ? "Password permanently   successfully!" : "Password has been set successfully!"}
                </p>
                <p className="text-xs text-emerald-700">
                  {isBn
                    ? " from  your Phone Number / Email   Password  Login  ।"
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
                    {isBn ? " Password ( 8 )" : "New Password (min. 8 characters)"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isBn ? "Password Enter" : "Enter new password"}
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
                    {isBn ? "Password Confirmed " : "Confirm Password"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isBn ? " Password Enter" : "Re-enter password"}
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
                    {isBn ? " " : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={pwdLoading}
                    className="bg-[#1D6474] hover:bg-[#d81557] text-white font-bold rounded-xl"
                  >
                    {pwdLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      isBn ? "Save" : "Save Password"
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
        <div className="rounded-3xl border border-teal-300 bg-teal-50/60/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1D6474] px-3 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
              <Sparkles className="h-3 w-3" />
              {isBn ? " " : "Administrator Access"}
            </span>
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              {isBn ? "    :00" : "Admin & Store Management Portal"}
            </h2>
            <p className="text-xs text-gray-600">
              {isBn
                ? "    Login । Order, Products,  and Settings  ।"
                : "You are logged in with full administrative privileges. Manage orders, products, inventory, invoices, and site settings."}
            </p>
          </div>
          <Link href="/admin">
            <Button className="bg-[#1D6474] hover:bg-[#d81557] text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-md shrink-0">
              {isBn ? " Dashboard " : "Open Admin Dashboard"}
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
            ? (isBn ? "Super Admin" : "Super Administrator")
            : (isBn ? " " : "Verified Member")}
        </span>
        <h1 className="mt-2 text-xl sm:text-2xl font-black">
          {isBn ? "," : "Welcome back,"}{" "}
          {user.user_metadata?.full_name || user.email?.split("@")[0]}!
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-pink-100/80">
          {isBn
            ? "your Active Delivery  , Address   and items items   ।"
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
            <Truck className="h-4 w-4 text-[#1D6474]" />
            {isBn ? " Order " : "Latest Order Status"}
          </h2>
          <Link href="/account/orders" className="text-xs font-bold text-[#1D6474] hover:underline">
            {isBn ? " Order View →" : "View All Orders →"}
          </Link>
        </div>

        {latestOrder ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/70 rounded-2xl p-4 border border-gray-100">
            <div className="space-y-1 text-xs">
              <span className="font-mono font-black text-[#1D6474] text-sm block">
                {latestOrder.order_number}
              </span>
              <p className="text-gray-500">
                {isBn
                  ? `Order Date: ${toBn(new Date(latestOrder.created_at).toLocaleDateString("en-GB"))}`
                  : `Placed on ${new Date(latestOrder.created_at).toLocaleDateString("en-GB")}`}
              </p>
              <span className="text-sm font-black text-gray-900 block">
                {isBn ? `Total: ${formatPriceBn(latestOrder.total)}` : `Total: ${formatPrice(latestOrder.total)}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal-50/60 text-[#1D6474] border border-teal-200 px-3 py-1 text-xs font-black capitalize">
                {isBn ? `: ${getStatusText(latestOrder.status)}` : `Status: ${latestOrder.status}`}
              </span>
              <Link href="/account/track">
                <Button size="sm" className="bg-[#1D6474] hover:bg-[#d81557] text-white text-xs font-black rounded-xl">
                  {isBn ? " " : "Track Consignment"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400 space-y-2">
            <p>{isBn ? "   Order ।" : "You haven't placed any orders yet."}</p>
            <Link href="/products" className="inline-block">
              <Button size="sm" className="bg-[#1D6474] text-white text-xs font-bold rounded-xl">
                {isBn ? "  " : "Start Shopping"}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#1D6474] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50/60 text-[#1D6474] shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#1D6474] transition-colors">
                {isBn ? "Order " : "Order History"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isBn ? " :00 View   Order " : "View and re-order past purchases"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        <Link
          href="/account/addresses"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#1D6474] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#1D6474] transition-colors">
                {isBn ? " Delivery Address" : "Saved Delivery Addresses"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isBn ? "   Address   " : "Manage home and office addresses"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        <Link
          href="/account/vouchers"
          className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#1D6474] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#1D6474] transition-colors">
                {isBn ? "   Discount" : "Promo Vouchers"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isBn ? "Coupon     " : "Claim discounts & coupons"}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      </div>
    </div>
  );
}
