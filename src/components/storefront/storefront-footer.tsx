"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Mail,
  Phone,
  MapPin,
  Banknote,
  Send,
  Loader2,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import {
  type HomepageFullConfig,
  DEFAULT_HOMEPAGE_CONFIG,
} from "@/features/marketing/homepage-types";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";
import { subscribeNewsletter } from "@/features/marketing/newsletter-actions";
import { trackSubscribe, trackContact } from "@/lib/analytics/datalayer";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

export function StorefrontFooter({ config: initialConfig }: { config?: HomepageFullConfig }) {
  const { language, t } = useLanguage();
  const [config, setConfig] = useState<HomepageFullConfig>(initialConfig || DEFAULT_HOMEPAGE_CONFIG);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [isStoreLoading, setIsStoreLoading] = useState(false);

  useEffect(() => {
    if (!initialConfig) {
      getHomepageConfig().then((data) => {
        if (data) setConfig(data);
      });
    }

    // Automatically check if storefront skeleton loader is currently running
    const checkLoading = () => {
      const isLd = !!document.querySelector('[data-storefront-loading="true"]');
      setIsStoreLoading(isLd);
    };

    checkLoading();

    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const observer = new MutationObserver(checkLoading);
    observer.observe(mainEl, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [initialConfig]);

  const fc = config.footerConfig || DEFAULT_HOMEPAGE_CONFIG.footerConfig!;

  const footerLogo =
    fc.logoImageUrl ||
    config.footerLogoImageUrl ||
    config.headerConfig?.logoImageUrl;

  const brandName =
    fc.brandText ||
    config.footerBrandText ||
    config.headerConfig?.logoText ||
    "Blush & Budget";

  const aboutText =
    language === "bn"
      ? fc.aboutTextBn ||
        config.footerAboutText ||
        "বাংলাদেশের নির্ভরযোগ্য বিউটি শপ। ১০০% আসল আন্তর্জাতিক স্কিনকেয়ার, মেকআপ ও হেয়ার কেয়ার সামগ্রী সারা দেশে ক্যাশ অন ডেলিভারিতে দ্রুত পৌঁছে দেওয়া হয়।"
      : fc.aboutText ||
        config.footerAboutText ||
        "Your trusted beauty store in Bangladesh for 100% authentic international skincare, hair care, and cosmetics with nationwide Cash on Delivery.";

  const copyrightText =
    fc.copyrightText ||
    config.footerCopyright ||
    `© ${new Date().getFullYear()} ${brandName}. All rights reserved. 100% Authentic Products.`;

  const supportPhone = fc.supportPhone || config.supportPhone || "+880 1700-000000";
  const supportEmail = fc.supportEmail || config.supportEmail || "support@example.com";
  const supportAddress =
    language === "bn"
      ? fc.supportAddressBn || "গুলশান, ঢাকা, বাংলাদেশ"
      : fc.supportAddress || "Gulshan, Dhaka, Bangladesh";
  const supportWhatsapp = fc.supportWhatsapp || "+880 1700-000000";

  const newsletterTitle =
    language === "bn"
      ? fc.newsletterTitleBn || "বিশেষ অফার ও বিউটি টিপস পান"
      : fc.newsletterTitle || "Get Special Offers & Beauty Tips";

  const newsletterSubtitle =
    language === "bn"
      ? fc.newsletterSubtitleBn || "নতুন পণ্য, ডিসকাউন্ট ও সহজ স্কিনকেয়ার গাইডের আপডেট পেতে সাবস্ক্রাইব করুন।"
      : fc.newsletterSubtitle || "Subscribe for new arrivals, discounts, and simple skincare guides.";

  const showTrustPillars = fc.showTrustPillars !== false;
  const showNewsletter = fc.showNewsletter !== false;
  const showPaymentBadges = fc.showPaymentBadges !== false;
  const showSocialLinks = fc.showSocialLinks !== false;
  const paymentBadgeStyle = fc.paymentBadgeStyle || "icons_only";
  const acceptedPayments = fc.acceptedPaymentMethods || {
    bkash: true,
    nagad: true,
    visa: true,
    mastercard: true,
    cod: true,
    amex: true,
  };
  const paymentBadgeImages = fc.paymentBadgeImages || {};
  const customPaymentBadges = (fc.customPaymentBadges || []).filter((b) => b.enabled !== false && b.imageUrl);

  const categoryLinks =
    fc.categoryLinks && fc.categoryLinks.length > 0
      ? fc.categoryLinks
      : DEFAULT_HOMEPAGE_CONFIG.footerConfig!.categoryLinks!;

  const customerCareLinks =
    fc.customerCareLinks && fc.customerCareLinks.length > 0
      ? fc.customerCareLinks
      : DEFAULT_HOMEPAGE_CONFIG.footerConfig!.customerCareLinks!;

  // Handle Newsletter Submission
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setSubscribing(true);
    setSubscribeStatus(null);

    try {
      trackSubscribe("newsletter", newsletterEmail);
      const res = await subscribeNewsletter(newsletterEmail, language === "bn" ? "bn" : "en");
      setSubscribeStatus(res);
      if (res.success) {
        setNewsletterEmail("");
      }
    } catch {
      setSubscribeStatus({
        success: false,
        message:
          language === "bn"
            ? "সাবস্ক্রিপশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
            : "Subscription failed. Please try again.",
      });
    } finally {
      setSubscribing(false);
      setTimeout(() => {
        setSubscribeStatus(null);
      }, 5000);
    }
  };

  if (isStoreLoading) {
    return null;
  }

  return (
    <footer className="storefront-footer border-t border-zinc-800 bg-[#0d131f] text-zinc-300 pb-24 lg:pb-0">
      {/* ============================================================ */}
      {/* 1. Value Props / Trust Pillars Strip (100% Admin Dynamic & Radiant Contrast) */}
      {/* ============================================================ */}
      {showTrustPillars && (
        <div className="border-b border-zinc-800/80 bg-black/60 py-6 sm:py-8 lg:py-10">
          <div className="container-main px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {(() => {
                const pillars =
                  config.trustPillars && config.trustPillars.length > 0
                    ? config.trustPillars
                    : DEFAULT_HOMEPAGE_CONFIG.trustPillars;

                const getPillarIcon = (name?: string, img?: string) => {
                  if (img) return <img src={img} alt="icon" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />;
                  switch (name) {
                    case "truck":
                      return <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-2" />;
                    case "rotate":
                      return <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-2" />;
                    case "clock":
                      return <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-2" />;
                    case "zap":
                      return <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-2" />;
                    case "shield":
                    default:
                      return <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-2" />;
                  }
                };

                return pillars.map((tp, idx) => (
                  <div
                    key={tp.id || idx}
                    className="group flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-pink-500/50 transition-all shadow-xs"
                  >
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30 group-hover:scale-105 transition-transform">
                      {getPillarIcon(tp.iconName, tp.imageUrl)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm lg:text-base font-black text-white truncate group-hover:text-pink-300 transition-colors">
                        {tp.title}
                      </p>
                      <p className="text-[10px] sm:text-xs text-zinc-300 mt-0.5 line-clamp-1 sm:line-clamp-2">
                        {tp.subtitle}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. Main Footer Grid (Mobile, Tablet, Laptop, Desktop) */}
      {/* ============================================================ */}
      <div className="container-main px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand Info & Newsletter (Tablet: col-span-2, Laptop/PC: col-span-4) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block">
              {footerLogo ? (
                <img
                  src={footerLogo}
                  alt={brandName}
                  className="h-10 sm:h-12 max-h-12 w-auto max-w-50 sm:max-w-60 object-contain shrink-0"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-white tracking-[0.15em] uppercase font-sans">
                  {brandName}
                </span>
              )}
            </Link>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
              {aboutText}
            </p>

            {/* Newsletter Subscription Box */}
            {showNewsletter && (
              <div className="space-y-2 pt-2 max-w-md">
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {newsletterTitle}
                </span>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  {newsletterSubtitle}
                </p>

                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={t("footer", "emailPlaceholder")}
                    disabled={subscribing}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="rounded-xl bg-[#e91e63] px-5 py-2.5 text-xs sm:text-sm font-black text-white hover:bg-sg-pink-hover active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {subscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t("footer", "subscribe")}</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {subscribeStatus && (
                  <div
                    className={cn(
                      "text-xs px-3 py-2 rounded-xl border animate-in fade-in-0 duration-200 mt-2",
                      subscribeStatus.success
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/60 border-red-500/40 text-red-300"
                    )}
                  >
                    {subscribeStatus.message}
                  </div>
                )}
              </div>
            )}

            {/* Social Media Links */}
            {showSocialLinks && fc.socialLinks && (
              <div className="pt-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 block mb-2.5">
                  {language === "bn" ? "আমাদের সাথে যুক্ত থাকুন" : "Follow Us"}
                </span>
                <div className="flex items-center gap-2.5">
                  {fc.socialLinks.facebook && (
                    <a
                      href={fc.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      title="Facebook"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-md shadow-blue-600/30 hover:scale-110 active:scale-95 transition-all duration-200 border border-blue-400/30"
                    >
                      <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {fc.socialLinks.instagram && (
                    <a
                      href={fc.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      title="Instagram"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-pink-600/30 hover:scale-110 active:scale-95 transition-all duration-200 border border-pink-400/30"
                    >
                      <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  )}
                  {fc.socialLinks.youtube && (
                    <a
                      href={fc.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      title="YouTube"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0000] text-white shadow-md shadow-red-600/30 hover:scale-110 active:scale-95 transition-all duration-200 border border-red-400/30"
                    >
                      <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  )}
                  {fc.socialLinks.whatsapp && (
                    <a
                      href={
                        fc.socialLinks.whatsapp.startsWith("http")
                          ? fc.socialLinks.whatsapp
                          : `https://wa.me/${fc.socialLinks.whatsapp.replace(/[^0-9]/g, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      title="WhatsApp"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25d366] text-white shadow-md shadow-emerald-600/30 hover:scale-110 active:scale-95 transition-all duration-200 border border-emerald-400/30"
                    >
                      <MessageCircle className="h-5 w-5 text-white" />
                    </a>
                  )}
                  {fc.socialLinks.tiktok && (
                    <a
                      href={fc.socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      title="TikTok"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-black border-2 border-cyan-400 text-white shadow-md shadow-cyan-500/30 hover:scale-110 active:scale-95 transition-all duration-200"
                    >
                      <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46V10.7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.13z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Categories (Tablet: col-span-1, Laptop/PC: col-span-2) */}
          <div className="sm:col-span-1 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-white">
                {t("header", "categories")}
              </h3>
              <div className="mt-2 h-0.75 w-8 rounded-full bg-[#e91e63]" />
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300 font-medium">
              {categoryLinks.map((cat, idx) => (
                <li key={cat.href || idx}>
                  <Link
                    href={cat.href}
                    className={cn(
                      "hover:text-[#e91e63] transition-colors block py-0.5",
                      cat.isHighlight && "text-pink-400 font-bold"
                    )}
                  >
                    {language === "bn" && cat.labelBn ? cat.labelBn : cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies (Tablet: col-span-1, Laptop/PC: col-span-3) */}
          <div className="sm:col-span-1 lg:col-span-3">
            <div className="mb-4">
              <h3 className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-white">
                {t("footer", "customerCare")}
              </h3>
              <div className="mt-2 h-0.75 w-8 rounded-full bg-[#e91e63]" />
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300 font-medium">
              {customerCareLinks.map((link, idx) => (
                <li key={link.href || idx}>
                  <Link
                    href={link.href}
                    className={cn(
                      "hover:text-[#e91e63] transition-colors block py-0.5",
                      link.isHighlight && "text-pink-400 font-bold"
                    )}
                  >
                    {language === "bn" && link.labelBn ? link.labelBn : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info & Payment Methods (Tablet: col-span-2, Laptop/PC: col-span-3) */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-6">
            <div>
              <div className="mb-4">
                <h3 className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-white">
                  {language === "bn" ? "যোগাযোগ করুন" : "Contact Us"}
                </h3>
                <div className="mt-2 h-0.75 w-8 rounded-full bg-[#e91e63]" />
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-zinc-300 font-medium">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/30 mt-0.5">
                    <MapPin className="h-4 w-4 stroke-2" />
                  </div>
                  <span className="text-zinc-200 font-medium leading-relaxed">{supportAddress}</span>
                </div>
                <a
                  href={`tel:${supportPhone}`}
                  onClick={() => trackContact("phone", supportPhone)}
                  className="flex items-center gap-3 hover:text-white transition-colors group"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/30 group-hover:scale-105 transition-transform">
                    <Phone className="h-4 w-4 stroke-2" />
                  </div>
                  <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">{supportPhone}</span>
                </a>
                <a
                  href={`mailto:${supportEmail}`}
                  onClick={() => trackContact("email", supportEmail)}
                  className="flex items-center gap-3 hover:text-white transition-colors group"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/30 group-hover:scale-105 transition-transform">
                    <Mail className="h-4 w-4 stroke-2" />
                  </div>
                  <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">{supportEmail}</span>
                </a>
                {supportWhatsapp && (
                  <a
                    href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-emerald-400 hover:text-emerald-300 transition-colors group"
                  >
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#25d366] text-white shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                      <MessageCircle className="h-5 w-5 stroke-2 text-white" />
                    </div>
                    <span className="font-bold">WhatsApp: {supportWhatsapp}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Payment Method Badges */}
            {showPaymentBadges && (
              <div className="pt-4 border-t border-zinc-800">
                <span className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 block mb-3">
                  {language === "bn" ? "আমরা গ্রহণ করি" : "We Accept"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Standard Payment Badges (Clean Uniform Same-Size Cards with Custom Image Support) */}
                  {acceptedPayments.bkash && (
                    <div
                      className="flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-xs border border-white/20 hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden"
                      title="bKash"
                    >
                      {paymentBadgeImages.bkash ? (
                        <img
                          src={paymentBadgeImages.bkash}
                          alt="bKash"
                          className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                        />
                      ) : (
                        <svg viewBox="0 0 100 80" className="h-4.5 sm:h-5 w-auto fill-[#e2136e] shrink-0">
                          <polygon points="50,5 95,50 50,40 5,50" />
                          <polygon points="50,45 80,75 50,65 20,75" opacity="0.9" />
                        </svg>
                      )}
                    </div>
                  )}

                  {acceptedPayments.nagad && (
                    <div
                      className="flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-xs border border-white/20 hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden"
                      title="Nagad"
                    >
                      {paymentBadgeImages.nagad ? (
                        <img
                          src={paymentBadgeImages.nagad}
                          alt="Nagad"
                          className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                        />
                      ) : (
                        <svg viewBox="0 0 100 100" className="h-5 sm:h-5.5 w-auto shrink-0">
                          <path d="M50 10 C30 35 15 50 15 70 C15 85 30 95 50 95 C70 95 85 85 85 70 C85 50 70 35 50 10 Z" fill="#e82429" />
                          <circle cx="50" cy="65" r="14" fill="#f7941d" />
                        </svg>
                      )}
                    </div>
                  )}

                  {acceptedPayments.visa && (
                    <div
                      className="flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-xs border border-white/20 hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden"
                      title="Visa"
                    >
                      {paymentBadgeImages.visa ? (
                        <img
                          src={paymentBadgeImages.visa}
                          alt="VISA"
                          className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm font-black italic tracking-wider text-[#1a1f71] leading-none select-none">
                          VISA
                        </span>
                      )}
                    </div>
                  )}

                  {acceptedPayments.mastercard && (
                    <div
                      className="flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-xs border border-white/20 hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden"
                      title="Mastercard"
                    >
                      {paymentBadgeImages.mastercard ? (
                        <img
                          src={paymentBadgeImages.mastercard}
                          alt="Mastercard"
                          className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                        />
                      ) : (
                        <div className="relative flex items-center justify-center h-4 w-6 shrink-0">
                          <div className="absolute left-0.5 h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
                          <div className="absolute right-0.5 h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
                        </div>
                      )}
                    </div>
                  )}

                  {acceptedPayments.amex && (
                    <div
                      className={cn(
                        "flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl px-1.5 py-1 shadow-xs hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden",
                        paymentBadgeImages.amex
                          ? "bg-white border border-white/20"
                          : "bg-[#016fd0] border border-blue-400/30"
                      )}
                      title="American Express"
                    >
                      {paymentBadgeImages.amex ? (
                        <img
                          src={paymentBadgeImages.amex}
                          alt="AMEX"
                          className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                        />
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-white tracking-tighter leading-none select-none">
                          AMEX
                        </span>
                      )}
                    </div>
                  )}

                  {acceptedPayments.cod && (
                    <div
                      className="flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-xs border border-white/20 hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden"
                      title={t("footer", "codTitle")}
                    >
                      {paymentBadgeImages.cod ? (
                        <img
                          src={paymentBadgeImages.cod}
                          alt="Cash on Delivery"
                          className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center leading-none select-none">
                          <span className="text-[7px] font-bold text-zinc-500 tracking-tight">PAY ON</span>
                          <span className="text-[8px] font-black text-emerald-700 tracking-tight uppercase">DELIVERY</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Uploaded Payment Badges (e.g. Rocket, Upay, SSLCommerz, etc.) */}
                  {customPaymentBadges.map((badge, idx) => (
                    <div
                      key={badge.id || `custom-badge-${idx}`}
                      className="flex h-8 w-14 sm:h-9 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white px-1.5 py-1 shadow-xs border border-white/20 hover:scale-105 hover:shadow-md transition-all select-none overflow-hidden"
                      title={badge.name}
                    >
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="h-full w-full max-h-6 sm:max-h-7 object-contain mx-auto select-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. Copyright Bottom Bar */}
        {/* ============================================================ */}
        <div className="mt-12 border-t border-zinc-900 pt-6 text-center text-xs sm:text-sm text-zinc-500 font-medium">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
