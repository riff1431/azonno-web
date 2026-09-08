"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  Tag,
  AlertCircle,
  UserCheck,
  Phone,
  Smartphone,
  MapPin,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Clock,
  Check,
  X,
} from "lucide-react";
import { validateBdPhoneNumber, cleanBdPhoneNumber } from "@/lib/validation/bangladesh-phone";
import { useCart } from "@/context/cart-context";
import { formatPrice, cn, getShortProductId } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { createOrder } from "@/features/orders/actions";
import { createClient } from "@/lib/supabase/client";
import { getCheckoutAndFraudSettings, type CheckoutAndFraudSettings } from "@/features/settings/checkout-settings-actions";
import {
  evaluateCheckoutFraudRisk,
  generateCheckoutOtp,
  verifyCheckoutOtp,
} from "@/features/fraud/anti-fraud-service";
import { captureAbandonedCart } from "@/features/automation/abandoned-cart-service";
import {
  BD_GEO_HIERARCHY,
  getShippingZoneByDistrict,
} from "@/config/bangladesh-geo";
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  trackLead,
} from "@/lib/analytics/datalayer";
import { useLanguage } from "@/context/language-context";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const { items, subtotal, discount, coupon, applyCoupon, removeCoupon, clearCart } = useCart();

  const urlError = searchParams?.get("error");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(urlError || null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Coupon Code State & Handler
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMsg(null);
    try {
      const res = await applyCoupon(couponCode.trim());
      setCouponMsg({ text: res.message, isError: !res.success });
      if (res.success) {
        setCouponCode("");
      }
    } catch {
      setCouponMsg({
        text: language === "bn" ? "কুপন প্রয়োগ করতে সমস্যা হয়েছে" : "Failed to apply coupon",
        isError: true,
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Admin Configured Rules & Rates
  const [settings, setSettings] = useState<CheckoutAndFraudSettings>({
    inside_dhaka_rate: 70,
    sub_dhaka_rate: 100,
    outside_dhaka_rate: 130,
    free_shipping_threshold: 2500,
    enable_free_shipping_meter: true,
    require_otp_all_orders: false,
    enable_courier_ratio_otp: true,
    courier_ratio_otp_threshold: 60,
    enable_cod_otp: true,
    cod_otp_threshold: 3000,
    enable_duplicate_blocker: true,
    duplicate_window_minutes: 5,
    enable_abandoned_cart_capture: true,
    abandoned_cart_recovery_hours: 2,
    abandoned_cart_discount_code: "SAVE5",
    show_location_hierarchy: true,
  });

  // Customer 3-Tier Address & Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    division: "Dhaka",
    district: "Dhaka City",
    thana: "Gulshan",
    address: "",
    notes: "",
  });

  // Track user's outside-dhaka location preference so toggling between zones never loses user choices
  const lastOutsideLocationRef = useRef<{
    division: string;
    district: string;
    thana: string;
  }>({
    division: "Chattogram",
    district: "Chattogram",
    thana: "Kotwali",
  });

  // Real-Time Live Bangladeshi Phone Number Validation & Fake Detection
  const phoneValidation = useMemo(() => {
    return validateBdPhoneNumber(formData.phone, (language === "bn" ? "bn" : "en"));
  }, [formData.phone, language]);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null);

  // Calculate Shipping Zone & Dynamic Charge
  const currentZone = getShippingZoneByDistrict(formData.district);
  const isFreeShipping =
    coupon?.type === "free_shipping" ||
    (settings.free_shipping_threshold > 0 && subtotal >= settings.free_shipping_threshold);

  const baseDeliveryFee =
    currentZone === "inside_dhaka"
      ? settings.inside_dhaka_rate
      : settings.outside_dhaka_rate;

  const shippingFee = isFreeShipping ? 0 : baseDeliveryFee;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);
  const amountToFreeShipping = Math.max(0, settings.free_shipping_threshold - subtotal);

  // Available Districts based on selected Division
  const currentDivisionObj = BD_GEO_HIERARCHY.find((d) => d.name === formData.division) || BD_GEO_HIERARCHY[0];
  const availableDistricts = currentDivisionObj.districts;

  // Available Thanas based on selected District
  const currentDistrictObj = availableDistricts.find((d) => d.name === formData.district) || availableDistricts[0];
  const availableThanas = currentDistrictObj?.thanas || [];

  // Load Settings & Authenticated User Auto-fill
  useEffect(() => {
    getCheckoutAndFraudSettings().then((res) => {
      setSettings(res);
    });

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        setFormData((prev) => ({
          ...prev,
          name: data.user.user_metadata?.full_name || prev.name,
          email: data.user.email || prev.email,
          phone: data.user.phone || prev.phone,
        }));
      }
    });
  }, []);

  const hasTrackedBeginCheckout = useRef(false);
  const lastTrackedShippingTier = useRef<string | null>(null);
  const lastTrackedPayment = useRef<string | null>(null);

  // 1. Track begin_checkout / InitiateCheckout once cart items load
  useEffect(() => {
    if (items.length > 0 && !hasTrackedBeginCheckout.current) {
      hasTrackedBeginCheckout.current = true;
      trackBeginCheckout({
        items: items.map((it) => ({
          item_id: getShortProductId(it),
          item_name: it.name,
          item_brand: it.brand_name || undefined,
          item_variant: it.variant_label || undefined,
          price: it.price,
          quantity: it.quantity,
        })),
        value: finalTotal,
        coupon: coupon?.code,
        discount,
        customer: {
          name: formData.name || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          city: formData.district || undefined,
          state: formData.division || undefined,
          country: "BD",
        },
      });
    }
  }, [items, finalTotal, coupon, discount, formData]);

  // 2. Track add_shipping_info when delivery location/zone is determined
  useEffect(() => {
    if (items.length > 0 && currentZone) {
      const tier =
        currentZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka";

      if (lastTrackedShippingTier.current !== tier) {
        lastTrackedShippingTier.current = tier;
        trackAddShippingInfo({
          items: items.map((it) => ({
            item_id: getShortProductId(it),
            item_name: it.name,
            item_brand: it.brand_name || undefined,
            item_variant: it.variant_label || undefined,
            price: it.price,
            quantity: it.quantity,
          })),
          value: finalTotal,
          shipping: shippingFee,
          shipping_tier: tier,
          coupon: coupon?.code,
          discount,
          customer: {
            name: formData.name || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            city: formData.district || undefined,
            state: formData.division || undefined,
            country: "BD",
          },
        });
      }
    }
  }, [items, currentZone, finalTotal, shippingFee, coupon, discount, formData]);

  // 3. Track add_payment_info when payment method is chosen
  useEffect(() => {
    if (items.length > 0 && selectedPaymentMethod) {
      if (lastTrackedPayment.current !== selectedPaymentMethod) {
        lastTrackedPayment.current = selectedPaymentMethod;
        const paymentLabel =
          selectedPaymentMethod === "bkash"
            ? "bKash"
            : selectedPaymentMethod === "nagad"
            ? "Nagad"
            : "Cash on Delivery";

        trackAddPaymentInfo({
          items: items.map((it) => ({
            item_id: getShortProductId(it),
            item_name: it.name,
            item_brand: it.brand_name || undefined,
            item_variant: it.variant_label || undefined,
            price: it.price,
            quantity: it.quantity,
          })),
          value: finalTotal,
          payment_type: paymentLabel,
          coupon: coupon?.code,
          discount,
          customer: {
            name: formData.name || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            city: formData.district || undefined,
            state: formData.division || undefined,
            country: "BD",
          },
        });
      }
    }
  }, [items, selectedPaymentMethod, finalTotal, coupon, discount, formData]);

  // Real-time Abandoned Cart Capture (captures as customer types)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.phone.length >= 6 && items.length > 0) {
        captureAbandonedCart({
          customer_name: formData.name,
          phone: formData.phone,
          email: formData.email,
          division: formData.division,
          district: formData.district,
          thana: formData.thana,
          address: formData.address,
          cart_items: items.map((i) => ({
            product_id: i.product_id,
            product_name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          subtotal,
        });
        trackLead("checkout_form_fill", finalTotal);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData, items, subtotal, finalTotal]);

  // Handle Division Change -> Auto update District & Thana
  const handleDivisionChange = (newDiv: string) => {
    const divObj = BD_GEO_HIERARCHY.find((d) => d.name === newDiv) || BD_GEO_HIERARCHY[0];
    const firstDist = divObj.districts[0];
    const firstThana = firstDist.thanas[0] || "";
    setFormData((prev) => ({
      ...prev,
      division: newDiv,
      district: firstDist.name,
      thana: firstThana,
    }));
    if (firstDist.zone !== "inside_dhaka") {
      lastOutsideLocationRef.current = {
        division: newDiv,
        district: firstDist.name,
        thana: firstThana,
      };
    }
  };

  // Handle District Change -> Auto update Thana
  const handleDistrictChange = (newDist: string) => {
    setFormData((prev) => {
      const divObj = BD_GEO_HIERARCHY.find((d) => d.name === prev.division) || BD_GEO_HIERARCHY[0];
      const distObj = divObj.districts.find((d) => d.name === newDist) || divObj.districts[0];
      const firstThana = distObj?.thanas[0] || "";
      if (distObj?.zone !== "inside_dhaka") {
        lastOutsideLocationRef.current = {
          division: prev.division,
          district: newDist,
          thana: firstThana,
        };
      }
      return {
        ...prev,
        district: newDist,
        thana: firstThana,
      };
    });
  };

  // Switch to Inside Dhaka
  const handleSelectInsideDhaka = () => {
    const dhakaDiv = BD_GEO_HIERARCHY.find((d) => d.name === "Dhaka") || BD_GEO_HIERARCHY[0];
    const dhakaCityDist = dhakaDiv.districts.find((d) => d.name === "Dhaka City") || dhakaDiv.districts[0];
    const firstThana = dhakaCityDist.thanas[0] || "Gulshan";

    setFormData((prev) => {
      if (getShippingZoneByDistrict(prev.district) !== "inside_dhaka") {
        lastOutsideLocationRef.current = {
          division: prev.division,
          district: prev.district,
          thana: prev.thana,
        };
      }
      return {
        ...prev,
        division: "Dhaka",
        district: dhakaCityDist.name,
        thana: firstThana,
      };
    });
  };

  // Switch to Outside Dhaka
  const handleSelectOutsideDhaka = () => {
    setFormData((prev) => {
      if (getShippingZoneByDistrict(prev.district) !== "inside_dhaka") {
        return prev;
      }

      const fallback = lastOutsideLocationRef.current || {
        division: "Chattogram",
        district: "Chattogram",
        thana: "Kotwali",
      };

      const divObj = BD_GEO_HIERARCHY.find((d) => d.name === fallback.division) || BD_GEO_HIERARCHY[1];
      const distObj = divObj.districts.find((d) => d.name === fallback.district) || divObj.districts[0];
      const thana = distObj.thanas.includes(fallback.thana) ? fallback.thana : (distObj.thanas[0] || "");

      return {
        ...prev,
        division: divObj.name,
        district: distObj.name,
        thana,
      };
    });
  };

  // Execute Order Creation (Invoked directly or after OTP verification)
  const processOrderSubmission = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      trackAddPaymentInfo({
        items: items.map((it) => ({
          item_id: getShortProductId(it),
          item_name: it.name,
          item_brand: it.brand_name || undefined,
          item_variant: it.variant_label || undefined,
          price: it.price,
          quantity: it.quantity,
        })),
        value: finalTotal,
        payment_type:
          selectedPaymentMethod === "cod"
            ? "Cash on Delivery"
            : selectedPaymentMethod === "bkash"
            ? "bKash MFS"
            : "SSLCommerz Gateway",
        coupon: coupon?.code,
        discount,
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          city: formData.district,
          state: formData.division,
          country: "BD",
        },
      });

      const res = await createOrder({
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          district: formData.district,
          thana: formData.thana.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim() || undefined,
        },
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id || null,
          quantity: i.quantity,
          name: i.name,
          price: i.price,
        })),
        shipping: {
          method:
            currentZone === "inside_dhaka"
              ? "Inside Dhaka Express (24-48h)"
              : "Outside Dhaka Courier (3-5d)",
          amount: shippingFee,
        },
        couponCode: coupon?.code || null,
        paymentMethod: selectedPaymentMethod,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      // If account was automatically created, sign in seamlessly on client
      if (res.autoCreatedAccount?.email && res.autoCreatedAccount?.tempPassword) {
        try {
          const supabase = createClient();
          await supabase.auth.signInWithPassword({
            email: res.autoCreatedAccount.email,
            password: res.autoCreatedAccount.tempPassword,
          });
        } catch (signInErr) {
          console.warn("Auto sign-in notice:", signInErr);
        }
      }

      // If bKash Online Payment is selected, initiate bKash PGW session
      if (selectedPaymentMethod === "bkash") {
        try {
          const bkashRes = await fetch("/api/payments/bkash/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: res.orderId }),
          });
          const bkashData = await bkashRes.json().catch(() => ({}));
          if (bkashData.success && bkashData.bkashURL) {
            clearCart();
            window.location.href = bkashData.bkashURL;
            return;
          } else {
            // Keep cart intact so customer does not see an empty cart screen
            setErrorMsg(
              bkashData.error ||
                (language === "bn"
                  ? "বিকাশ পেমেন্ট গেটওয়ে চালু করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন অথবা ক্যাশ অন ডেলিভারি বেছে নিন।"
                  : "Could not initiate bKash payment session. You can retry or complete using Cash on Delivery.")
            );
            setLoading(false);
            return;
          }
        } catch (bkashErr: any) {
          setErrorMsg(
            bkashErr.message ||
              (language === "bn"
                ? "বিকাশ পেমেন্ট সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে।"
                : "Failed to connect to bKash gateway. Please retry or choose Cash on Delivery.")
          );
          setLoading(false);
          return;
        }
      }

      // Default (Cash on Delivery or other offline methods)
      clearCart();
      router.push(`/orders/${res.orderId}/confirmation`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to place order.");
      setLoading(false);
    }
  };

  // Form Submit Handler with Anti-Fraud & OTP Verification Evaluation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg(language === "bn" ? "অনুগ্রহ করে আপনার পুরো নাম লিখুন।" : "Please enter your Full Name.");
      return;
    }
    if (!phoneValidation.isValid) {
      setErrorMsg(
        phoneValidation.errorMessage ||
          (language === "bn"
            ? "অর্ডার সম্পন্ন করতে অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।"
            : "Please enter a valid 11-digit Bangladeshi mobile number before placing your order.")
      );
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg(language === "bn" ? "অনুগ্রহ করে আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।" : "Please enter your detailed delivery street address.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg(language === "bn" ? "আপনার শপিং কার্ট খালি।" : "Your bag is empty.");
      return;
    }

    setLoading(true);

    // Evaluate Anti-Fraud & Risk Score
    const fraudResult = await evaluateCheckoutFraudRisk({
      phone: formData.phone,
      email: formData.email,
      orderTotal: finalTotal,
      paymentMethod: selectedPaymentMethod,
    });

    if (!fraudResult.allowed) {
      setErrorMsg(fraudResult.riskReasons[0] || (language === "bn" ? "এই মুহূর্তে অর্ডার সম্পন্ন করা সম্ভব হচ্ছে না।" : "Order cannot be placed at this time."));
      setLoading(false);
      return;
    }

    // If High-Value COD Order Requires OTP Verification
    if (fraudResult.requiresOtp) {
      const otpRes = await generateCheckoutOtp(formData.phone);
      setDebugOtpCode(otpRes.debugOtp || null);
      setShowOtpModal(true);
      setLoading(false);
      return;
    }

    // Direct submission if risk is normal
    await processOrderSubmission();
  };

  // OTP Verification Submit Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpLoading(true);

    const res = await verifyCheckoutOtp(formData.phone, otpCode);
    if (!res.valid) {
      setOtpError(res.error || (language === "bn" ? "ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোড দিন।" : "Invalid OTP code."));
      setOtpLoading(false);
      return;
    }

    setShowOtpModal(false);
    await processOrderSubmission();
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-[#e91e63]">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{t("cartPage", "emptyStateTitle")}</h1>
        <p className="text-xs text-gray-500">
          {t("cartPage", "emptyStateDesc")}
        </p>
        <Link href="/products">
          <Button className="bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-bold rounded-xl mt-2">
            {t("cartPage", "continueShopping")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-6 sm:py-10 space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Link href="/cart" className="text-xs font-bold text-text-muted hover:text-text flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            {language === "bn" ? "কার্ট-এ ফিরে যান" : "Back to Cart"}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="h-4 w-4" /> {t("checkout", "secureNotice")}
        </div>
      </div>

      {/* Free Delivery Progress Meter (Controlled by Admin Settings) */}
      {settings.enable_free_shipping_meter && settings.free_shipping_threshold > 0 && (
        <div className="rounded-2xl border border-pink-200 bg-pink-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-zinc-900">
              <Truck className="h-4 w-4 text-[#e91e63]" />
              {isFreeShipping ? (
                <span className="text-emerald-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  {language === "bn"
                    ? "অভিনন্দন! আপনি সারা দেশে ফ্রি ডেলিভারি পেয়েছেন!"
                    : "Congratulations! You have unlocked Free Nationwide Delivery!"}
                </span>
              ) : (
                <span>
                  {language === "bn" ? (
                    <>সারা দেশে <strong>ফ্রি ডেলিভারি</strong> পেতে আর মাত্র <span className="text-[#e91e63]">{formatPriceBn(amountToFreeShipping)}</span> এর কেনাকাটা করুন!</>
                  ) : (
                    <>Add <span className="text-[#e91e63]">৳{amountToFreeShipping}</span> more to unlock <strong>Free Nationwide Delivery!</strong></>
                  )}
                </span>
              )}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {formatPriceBn(subtotal)} / {formatPriceBn(settings.free_shipping_threshold)}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-pink-200 overflow-hidden">
            <div
              className="h-full bg-[#e91e63] transition-all duration-500"
              style={{
                width: `${Math.min(100, (subtotal / settings.free_shipping_threshold) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-2 animate-in fade-in-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer Details & 3-Tier Address Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-3">
              <MapPin className="h-4 w-4 text-[#e91e63]" />
              {language === "bn" ? "১. ডেলিভারি তথ্য (বাংলাদেশ ঠিকানা)" : "1. Delivery Details (Bangladesh Address)"}
            </h2>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-text mb-1">
                    {t("checkout", "fullName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "bn" ? "যেমন: তানভীর আহমেদ" : "e.g. Tanvir Ahmed"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-primary-500 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-text">
                      {t("checkout", "phone")} <span className="text-red-500">*</span>
                    </label>
                    {phoneValidation.operatorName && (
                      <span className="text-[10px] font-black uppercase text-[#e91e63] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200 animate-in fade-in-0">
                        {phoneValidation.operatorName}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">
                      +88
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      maxLength={14}
                      value={formData.phone}
                      onChange={(e) => {
                        const cleaned = cleanBdPhoneNumber(e.target.value);
                        setFormData({ ...formData, phone: cleaned.slice(0, 11) });
                      }}
                      className={cn(
                        "w-full rounded-xl border pl-12 pr-10 py-2.5 text-xs font-mono text-text focus:outline-none font-bold transition-all duration-200",
                        phoneValidation.status === "valid" &&
                          "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 text-emerald-950",
                        phoneValidation.status === "invalid" &&
                          "border-red-500 bg-red-50/20 ring-2 ring-red-500/20 text-red-950",
                        phoneValidation.status === "typing" &&
                          "border-blue-400 bg-blue-50/10 ring-1 ring-blue-400/20",
                        phoneValidation.status === "empty" &&
                          "border-border focus:border-primary-500"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {phoneValidation.status === "valid" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs animate-in zoom-in-50">
                          <Check className="h-3 w-3 stroke-3" />
                        </div>
                      )}
                      {phoneValidation.status === "invalid" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-xs animate-in zoom-in-50">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {phoneValidation.status === "typing" && (
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {formData.phone.length}/11
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real-time Dynamic Feedback Banner */}
                  {phoneValidation.status === "valid" && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2.5 py-1.5 rounded-xl mt-1.5 animate-in fade-in-0 shadow-2xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{phoneValidation.successMessage}</span>
                    </div>
                  )}

                  {phoneValidation.status === "invalid" && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50/90 border border-red-200 px-2.5 py-1.5 rounded-xl mt-1.5 animate-in fade-in-0 shadow-2xs">
                      <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>{phoneValidation.errorMessage}</span>
                    </div>
                  )}

                  {phoneValidation.status === "typing" && (
                    <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 bg-blue-50/60 border border-blue-200 px-2.5 py-1 rounded-xl mt-1.5">
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {phoneValidation.errorMessage}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-text mb-1">
                  {language === "bn" ? "ইমেইল অ্যাড্রেস (ঐচ্ছিক)" : "Email Address (Optional)"}
                </label>
                <input
                  type="email"
                  placeholder={language === "bn" ? "name@example.com (ইনভয়েস ও ট্র্যাকিং আপডেটের জন্য)" : "name@example.com (For invoice & shipping tracking)"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 text-xs text-text focus:outline-none"
                />
              </div>

              {/* Delivery Zone Selection (Only Inside Dhaka & Outside Dhaka - Dynamic Admin Controlled Rates) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[#e91e63]" />
                    {t("checkout", "shippingMethod")}:
                  </span>
                  {isFreeShipping && (
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {language === "bn" ? "সারা দেশে ফ্রি ডেলিভারি প্রযোজ্য" : "Free Nationwide Delivery Applied"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Inside Dhaka */}
                  <button
                    type="button"
                    onClick={handleSelectInsideDhaka}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-2xs",
                      currentZone === "inside_dhaka"
                        ? "border-[#e91e63] bg-pink-50/70 shadow-xs ring-1 ring-[#e91e63]/20"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div>
                      <span
                        className={cn(
                          "text-xs font-black uppercase tracking-wider block",
                          currentZone === "inside_dhaka" ? "text-[#e91e63]" : "text-gray-800"
                        )}
                      >
                        {t("checkout", "insideDhaka")}
                      </span>
                      <span className="text-[11px] font-extrabold text-gray-900 mt-0.5 block">
                        {isFreeShipping ? (
                          <span className="text-emerald-700 font-bold">
                            {language === "bn" ? "ফ্রি" : "FREE"} <span className="line-through text-gray-400 font-normal text-[10px]">{formatPriceBn(settings.inside_dhaka_rate)}</span>
                          </span>
                        ) : (
                          formatPriceBn(settings.inside_dhaka_rate)
                        )}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        currentZone === "inside_dhaka"
                          ? "border-[#e91e63] bg-[#e91e63] text-white"
                          : "border-gray-300 bg-white"
                      )}
                    >
                      {currentZone === "inside_dhaka" && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  </button>

                  {/* Outside Dhaka */}
                  <button
                    type="button"
                    onClick={handleSelectOutsideDhaka}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-2xs",
                      currentZone !== "inside_dhaka"
                        ? "border-[#e91e63] bg-pink-50/70 shadow-xs ring-1 ring-[#e91e63]/20"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div>
                      <span
                        className={cn(
                          "text-xs font-black uppercase tracking-wider block",
                          currentZone !== "inside_dhaka" ? "text-[#e91e63]" : "text-gray-800"
                        )}
                      >
                        {t("checkout", "outsideDhaka")}
                      </span>
                      <span className="text-[11px] font-extrabold text-gray-900 mt-0.5 block">
                        {isFreeShipping ? (
                          <span className="text-emerald-700 font-bold">
                            {language === "bn" ? "ফ্রি" : "FREE"} <span className="line-through text-gray-400 font-normal text-[10px]">{formatPriceBn(settings.outside_dhaka_rate)}</span>
                          </span>
                        ) : (
                          formatPriceBn(settings.outside_dhaka_rate)
                        )}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        currentZone !== "inside_dhaka"
                          ? "border-[#e91e63] bg-[#e91e63] text-white"
                          : "border-gray-300 bg-white"
                      )}
                    >
                      {currentZone !== "inside_dhaka" && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* 3-Tier Dynamic Location Hierarchy (Admin Controllable) */}
              {settings.show_location_hierarchy !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div>
                    <label className="block font-bold text-text mb-1">{t("checkout", "division")}</label>
                    <select
                      value={formData.division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text focus:outline-none"
                    >
                      {BD_GEO_HIERARCHY.map((div) => (
                        <option key={div.name} value={div.name}>
                          {div.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">{t("checkout", "district")}</label>
                    <select
                      value={formData.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-text focus:outline-none"
                    >
                      {availableDistricts.map((dist) => (
                        <option key={dist.name} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">{t("checkout", "thana")}</label>
                    {availableThanas.length > 0 ? (
                      <select
                        value={formData.thana}
                        onChange={(e) => {
                          const newThana = e.target.value;
                          setFormData((prev) => ({ ...prev, thana: newThana }));
                          if (currentZone !== "inside_dhaka") {
                            lastOutsideLocationRef.current = {
                              division: formData.division,
                              district: formData.district,
                              thana: newThana,
                            };
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text focus:outline-none"
                      >
                        {availableThanas.map((th) => (
                          <option key={th} value={th}>
                            {th}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={language === "bn" ? "যেমন: সদর" : "e.g. Sadar"}
                        value={formData.thana}
                        onChange={(e) => setFormData({ ...formData, thana: e.target.value })}
                        className="w-full rounded-xl border border-border px-3 py-2 text-xs text-text focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-text mb-1">
                  {t("checkout", "streetAddress")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={t("checkout", "streetAddressPlaceholder")}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 text-xs text-text focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-text mb-1">
                  {t("checkout", "notes")}
                </label>
                <input
                  type="text"
                  placeholder={t("checkout", "notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-border px-3.5 py-2 text-xs text-text focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-3">
              <Lock className="h-4 w-4 text-[#e91e63]" />
              {language === "bn" ? "২. পেমেন্ট পদ্ধতি" : "2. Payment Method"}
            </h2>

            <div className="space-y-3">
              {/* Cash on Delivery Option */}
              {settings.is_cod_enabled !== false && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPaymentMethod("cod")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPaymentMethod("cod");
                    }
                  }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                    selectedPaymentMethod === "cod"
                      ? "border-[#e91e63] bg-pink-50/50 ring-2 ring-[#e91e63]/30 shadow-xs"
                      : "border-border hover:bg-surface-secondary/50 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    id="payment_method_cod"
                    name="payment_method"
                    value="cod"
                    checked={selectedPaymentMethod === "cod"}
                    onChange={() => setSelectedPaymentMethod("cod")}
                    className="mt-1 h-4 w-4 text-[#e91e63] focus:ring-[#e91e63] accent-[#e91e63] shrink-0"
                  />
                  <label htmlFor="payment_method_cod" className="flex-1 text-xs cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text text-sm block">{t("checkout", "cod")}</span>
                      {selectedPaymentMethod === "cod" && (
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {language === "bn" ? "সিলেক্টেড" : "Selected"}
                        </span>
                      )}
                    </div>
                    <span className="text-text-secondary mt-0.5 block leading-relaxed">
                      {t("checkout", "codDesc")}
                    </span>
                  </label>
                </div>
              )}

              {/* bKash Payment Option */}
              {settings.is_bkash_enabled !== false && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPaymentMethod("bkash")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPaymentMethod("bkash");
                    }
                  }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                    selectedPaymentMethod === "bkash"
                      ? "border-[#e91e63] bg-pink-50/60 ring-2 ring-[#e91e63]/40 shadow-xs"
                      : "border-border hover:bg-surface-secondary/50 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    id="payment_method_bkash"
                    name="payment_method"
                    value="bkash"
                    checked={selectedPaymentMethod === "bkash"}
                    onChange={() => setSelectedPaymentMethod("bkash")}
                    className="mt-1 h-4 w-4 text-[#e91e63] focus:ring-[#e91e63] accent-[#e91e63] shrink-0"
                  />
                  <label htmlFor="payment_method_bkash" className="flex-1 text-xs cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#e91e63] text-sm">{t("checkout", "bkash")}</span>
                        <span className="text-[10px] font-bold text-white bg-[#e91e63] px-2 py-0.5 rounded-full shadow-2xs">
                          {language === "bn" ? "ইনস্ট্যান্ট পেমেন্ট" : "Instant Pay"}
                        </span>
                      </div>
                      {selectedPaymentMethod === "bkash" && (
                        <span className="text-[10px] font-black uppercase text-[#e91e63] bg-pink-100 px-2 py-0.5 rounded-full border border-pink-300">
                          {language === "bn" ? "সিলেক্টেড" : "Selected"}
                        </span>
                      )}
                    </div>
                    <span className="text-text-secondary mt-0.5 block leading-relaxed">
                      {t("checkout", "bkashDesc")}
                    </span>
                  </label>
                </div>
              )}

              {/* SSLCommerz Payment Option */}
              {settings.is_sslcommerz_enabled !== false && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPaymentMethod("sslcommerz")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPaymentMethod("sslcommerz");
                    }
                  }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                    selectedPaymentMethod === "sslcommerz"
                      ? "border-[#e91e63] bg-pink-50/50 ring-2 ring-[#e91e63]/30 shadow-xs"
                      : "border-border hover:bg-surface-secondary/50 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    id="payment_method_sslcommerz"
                    name="payment_method"
                    value="sslcommerz"
                    checked={selectedPaymentMethod === "sslcommerz"}
                    onChange={() => setSelectedPaymentMethod("sslcommerz")}
                    className="mt-1 h-4 w-4 text-[#e91e63] focus:ring-[#e91e63] accent-[#e91e63] shrink-0"
                  />
                  <label htmlFor="payment_method_sslcommerz" className="flex-1 text-xs cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text text-sm">
                        {language === "bn" ? "অনলাইন পেমেন্ট (কার্ড ও নেট ব্যাংকিং)" : "SSLCommerz (Cards & Net Banking)"}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Visa / MC / Amex
                      </span>
                    </div>
                    <span className="text-text-secondary mt-0.5 block leading-relaxed">
                      {language === "bn"
                        ? "ভিসা, মাস্টারকার্ড, অ্যামেক্স, ব্র্যাক, সিটিটাস, ডাচ-বাংলা অথবা যেকোনো ব্যাংক কার্ড দিয়ে অনলাইনে নিরাপদে পেমেন্ট করুন।"
                        : "Pay securely with Visa, MasterCard, Amex, Internet Banking, or Mobile Wallet via SSLCommerz."}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5 sticky top-24">
            <h2 className="text-sm font-bold text-text flex items-center justify-between border-b border-border pb-3">
              <span>{t("checkout", "orderSummary")}</span>
              <span className="text-xs text-text-muted font-normal">
                {toBn(items.length)} {language === "bn" ? "টি পণ্য" : "items"}
              </span>
            </h2>

            {/* Cart Items Preview */}
            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pt-2">
                  <img
                    src={(item as any).image_url || "/images/product-placeholder.png"}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-text truncate">{item.name}</h4>
                    <span className="text-[11px] text-text-muted">
                      {language === "bn" ? "পরিমাণ:" : "Qty:"} {toBn(item.quantity)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-text font-mono shrink-0">
                    {formatPriceBn(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon / Promo Code */}
            <div className="pt-3 border-t border-border">
              {coupon ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 animate-in fade-in-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-emerald-950 tracking-wider">
                          {coupon.code}
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          {coupon.type === "percentage"
                            ? `${coupon.value}% OFF`
                            : coupon.type === "free_shipping"
                            ? (language === "bn" ? "ফ্রি ডেলিভারি" : "FREE SHIPPING")
                            : `৳${coupon.value} OFF`}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5 flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" />
                        {language === "bn" ? "কুপন কার্যকর হয়েছে" : "Coupon code applied"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setCouponMsg(null);
                    }}
                    className="p-1.5 rounded-lg text-emerald-800 hover:text-red-600 hover:bg-emerald-100/80 transition-colors shrink-0 cursor-pointer"
                    title={language === "bn" ? "কুপন বাতিল করুন" : "Remove coupon"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#e91e63]" />
                    <span>{language === "bn" ? "ডিসকাউন্ট কুপন" : "Promo / Coupon Code"}</span>
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === "bn" ? "কুপন কোড লিখুন" : "Enter coupon code"}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="flex-1 pl-3 pr-3 py-2 rounded-xl border border-border text-xs font-mono uppercase text-text placeholder:normal-case placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#e91e63]/20 focus:border-[#e91e63] bg-surface-secondary/30 font-bold"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className={cn(
                        "rounded-xl text-xs font-bold px-4 h-9 shrink-0 transition-all",
                        couponCode.trim()
                          ? "bg-[#e91e63] hover:bg-sg-pink-hover text-white cursor-pointer shadow-xs"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        language === "bn" ? "প্রয়োগ" : "Apply"
                      )}
                    </Button>
                  </div>

                  {couponMsg && (
                    <p
                      className={cn(
                        "text-[11px] font-semibold flex items-center gap-1 mt-1 animate-in fade-in-0",
                        couponMsg.isError ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {couponMsg.isError ? (
                        <AlertCircle className="h-3 w-3 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                      )}
                      <span>{couponMsg.text}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-border text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>{t("checkout", "subtotal")}</span>
                <span className="font-mono font-bold text-text">{formatPriceBn(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t("checkout", "discount")} ({coupon?.code})</span>
                  <span className="font-mono">-{formatPriceBn(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-text-secondary">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-text-muted" />
                  {t("checkout", "deliveryFee")} ({currentZone === "inside_dhaka" ? t("checkout", "insideDhaka") : t("checkout", "outsideDhaka")})
                </span>
                <span className="font-mono font-bold">
                  {isFreeShipping ? (
                    <span className="text-emerald-700">{language === "bn" ? "ফ্রি" : "FREE"}</span>
                  ) : (
                    formatPriceBn(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black text-text pt-2 border-t border-border">
                <span>{t("checkout", "totalPayable")}</span>
                <span className="font-mono text-base text-[#e91e63]">{formatPriceBn(finalTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <Button
              type="submit"
              disabled={loading || !phoneValidation.isValid}
              className={cn(
                "w-full h-12 rounded-2xl text-white font-black text-sm shadow-md transition-all active:scale-98",
                phoneValidation.isValid && !loading
                  ? "bg-[#e91e63] hover:bg-sg-pink-hover cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed opacity-75"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("checkout", "placingOrder")}
                </>
              ) : !phoneValidation.isValid ? (
                language === "bn" ? "সঠিক মোবাইল নম্বর দিন" : "Enter Valid Phone Number"
              ) : selectedPaymentMethod === "bkash" ? (
                language === "bn"
                  ? `বিকাশে পেমেন্ট করুন — ${formatPriceBn(finalTotal)}`
                  : `Pay with bKash — ${formatPriceBn(finalTotal)}`
              ) : selectedPaymentMethod === "sslcommerz" ? (
                language === "bn"
                  ? `অনলাইনে পেমেন্ট করুন — ${formatPriceBn(finalTotal)}`
                  : `Pay Online — ${formatPriceBn(finalTotal)}`
              ) : (
                language === "bn"
                  ? `অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি) — ${formatPriceBn(finalTotal)}`
                  : `Place Order (Cash on Delivery) — ${formatPriceBn(finalTotal)}`
              )}
            </Button>

            {!phoneValidation.isValid && formData.phone.length > 0 && (
              <p className="text-[11px] font-bold text-red-600 text-center animate-in fade-in-0 flex items-center justify-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {language === "bn"
                    ? "সঠিক ১১ ডিজিটের সচল মোবাইল নম্বর ছাড়া অর্ডার সম্পন্ন করা যাবে না।"
                    : "Order cannot be placed without a valid 11-digit mobile number."}
                </span>
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-[11px] text-text-muted pt-2 text-center">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t("footer", "authenticTitle")}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-primary-600" /> {t("footer", "deliveryTitle")}
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* High-Risk COD SMS OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-border space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-[#e91e63] border border-pink-200">
                <KeyRound className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-black text-text">{t("checkout", "otpTitle")}</h3>
              <p className="text-xs text-text-secondary">
                {language === "bn" ? (
                  <>অর্ডার নিশ্চিত করতে আপনার নম্বরে পাঠানো ৪ সংখ্যার এসএমএস ভেরিফিকেশন কোডটি লিখুন: <strong className="text-text font-mono">+88 {formData.phone}</strong></>
                ) : (
                  <>To prevent spam orders, we sent a 4-digit SMS verification code to <strong className="text-text font-mono">+88 {formData.phone}</strong>.</>
                )}
              </p>
            </div>

            {debugOtpCode && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs font-mono font-bold text-amber-900">
                [Testing OTP Code]: {debugOtpCode}
              </div>
            )}

            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1 text-center">
                  {t("checkout", "enterOtp")}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  placeholder="• • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-mono tracking-widest font-black py-3 rounded-xl border border-border focus:outline-none focus:border-[#e91e63]"
                />
              </div>

              <Button
                type="submit"
                disabled={otpLoading || otpCode.length < 4}
                className="w-full h-11 rounded-xl bg-[#e91e63] hover:bg-sg-pink-hover text-white font-bold text-xs shadow-md"
              >
                {otpLoading ? t("checkout", "otpVerifying") : t("checkout", "verifyOtp")}
              </Button>

              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-full text-center text-xs text-text-muted hover:text-text font-bold"
              >
                {language === "bn" ? "বাতিল ও তথ্য সংশোধন করুন" : "Cancel & Edit Details"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
