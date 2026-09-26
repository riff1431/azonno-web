"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

interface CmsPageClientProps {
  slug: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const POLICY_NAV_LINKS = [
  {
    slug: "returns",
    href: "/page/returns",
    labelEn: "Return Policy",
    labelBn: ":00 Policy",
    icon: RotateCcw,
    badge: "7 Days",
    badgeBn: "7 Enter",
  },
  {
    slug: "terms",
    href: "/page/terms",
    labelEn: "Terms & Conditions",
    labelBn: "  Rules",
    icon: ShieldCheck,
    badge: "Official",
    badgeBn: "",
  },
  {
    slug: "privacy",
    href: "/page/privacy",
    labelEn: "Privacy Policy",
    labelBn: " ",
    icon: ShieldCheck,
    badge: "100% Safe",
    badgeBn: "100% ",
  },
  {
    slug: "faq",
    href: "/page/faq",
    labelEn: "FAQ & Help",
    labelBn: "Q&A  ",
    icon: MessageCircle,
    badge: "24/7 Support",
    badgeBn: "",
  },
  {
    slug: "about",
    href: "/page/about",
    labelEn: "About Us",
    labelBn: " ",
    icon: Sparkles,
    badge: "Authentic",
    badgeBn: " ",
  },
];

export function CmsPageClient({
  slug,
  title,
  subtitle,
  lastUpdated,
  children,
}: CmsPageClientProps) {
  const { language } = useLanguage();
  const currentSlug = (slug || "").toLowerCase().trim();

  return (
    <div className="min-h-[75vh] bg-[#f8f9fb] py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Top Header & Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 -ml-2 rounded-xl transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {language === "bn" ? "  " : "Back to Home"}
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{language === "bn" ? "  Policy" : "Verified Official Policy"}</span>
          </div>
        </div>

        {/* Quick Policy Switcher Tabs */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-1.5 sm:p-2 shadow-2xs overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">
            {POLICY_NAV_LINKS.map((item) => {
              const isActive =
                currentSlug === item.slug ||
                (currentSlug === "privacy-policy" && item.slug === "privacy") ||
                (currentSlug === "terms-of-service" && item.slug === "terms") ||
                (currentSlug === "return-policy" && item.slug === "returns");
              const Icon = item.icon;

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-linear-to-r from-pink-600 to-rose-600 text-white shadow-sm shadow-pink-600/30 font-extrabold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-zinc-400")} />
                  <span>{language === "bn" ? item.labelBn : item.labelEn}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-card space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50/60 text-[#164E63] px-3 py-1 text-xs font-bold uppercase border border-teal-200">
              <Sparkles className="h-3 w-3 text-[#1D6474]" />
              {language === "bn" ? "Azonno  Policy" : "Azonno Policy"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-tight sm:leading-snug">
            {title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 leading-relaxed max-w-3xl">
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-500 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span>{language === "bn" ? " : " : "Last reviewed: "}{lastUpdated}</span>
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-zinc-200" />
            <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{language === "bn" ? "100% Authentic Products " : "100% Genuine Guaranteed"}</span>
            </div>
          </div>
        </div>

        {/* Trust Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-center space-y-1 shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-[#1D6474] mx-auto" />
            <div className="text-xs font-bold text-zinc-900">
              {language === "bn" ? "100% Authentic Products" : "100% Authentic"}
            </div>
            <div className="text-[11px] text-zinc-500">
              {language === "bn" ? " " : "Direct Import"}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-center space-y-1 shadow-2xs">
            <Truck className="h-5 w-5 text-blue-600 mx-auto" />
            <div className="text-xs font-bold text-zinc-900">
              {language === "bn" ? "Cash  Delivery" : "Cash on Delivery"}
            </div>
            <div className="text-[11px] text-zinc-500">
              {language === "bn" ? "   Delivery" : "Nationwide Delivery"}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-center space-y-1 shadow-2xs">
            <RotateCcw className="h-5 w-5 text-purple-600 mx-auto" />
            <div className="text-xs font-bold text-zinc-900">
              {language === "bn" ? "7 Enter :00" : "7 Days Return"}
            </div>
            <div className="text-[11px] text-zinc-500">
              {language === "bn" ? " " : "Hassle-free Pickup"}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-center space-y-1 shadow-2xs">
            <MessageCircle className="h-5 w-5 text-emerald-600 mx-auto" />
            <div className="text-xs font-bold text-zinc-900">
              {language === "bn" ? " " : "Friendly Support"}
            </div>
            <div className="text-[11px] text-zinc-500">
              {language === "bn" ? "Enter 10:00 - 10:00" : "10 AM - 10 PM"}
            </div>
          </div>
        </div>

        {/* Content Body Card */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}
