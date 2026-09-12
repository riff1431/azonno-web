"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Search,
  Eye,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  type HomepageFaqSectionConfig,
  type HomepageFaqItem,
} from "@/features/marketing/homepage-types";

interface HomepageSeoFaqProps {
  config?: HomepageFaqSectionConfig;
}

export function HomepageSeoFaq({ config }: HomepageSeoFaqProps) {
  const { language } = useLanguage();
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");
  const [isGuideExpanded, setIsGuideExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (config && config.enabled === false) {
    return null;
  }

  const heading =
    language === "bn"
      ? config?.headingBn || config?.heading || "বাংলাদেশে আসল কসমেটিকস ও স্কিনকেয়ারের বিশ্বস্ত গন্তব্য"
      : config?.heading || "Authentic Cosmetics Shop in Bangladesh: Your Beauty Destination";

  const subtitle =
    language === "bn"
      ? config?.subtitleBn ||
        config?.subtitle ||
        "১০০% খাঁটি আন্তর্জাতিক স্কিনকেয়ার ও মেকআপ কালেকশন — সারা দেশে ক্যাশ অন ডেলিভারি ও ফ্রি বিউটি পরামর্শ।"
      : config?.subtitle ||
        "Explore 100% genuine skincare, makeup & haircare with nationwide Cash on Delivery, doorstep inspection, and expert beauty guidance.";

  const seoDescription =
    language === "bn"
      ? config?.seoDescriptionHtmlBn || config?.seoDescriptionHtml
      : config?.seoDescriptionHtml;

  const faqs = config?.faqs || [];

  // Extract unique categories for filter tabs
  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [faqs]);

  // Filtered FAQs based on selected category tab
  const filteredFaqs = useMemo(() => {
    if (selectedCategory === "all") return faqs;
    return faqs.filter((item) => item.category === selectedCategory);
  }, [faqs, selectedCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  // Structured Data (JSON-LD FAQPage) for Google Search Rich Snippets & AEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: language === "bn" && faq.questionBn ? faq.questionBn : faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: language === "bn" && faq.answerBn ? faq.answerBn : faq.answer,
      },
    })),
  };

  return (
    <section
      id="homepage-seo-faq"
      className="border-t border-zinc-200/90 bg-linear-to-b from-white via-pink-50/25 to-white pt-10 sm:pt-14 lg:pt-16 pb-6 sm:pb-8 lg:pb-10 overflow-hidden"
      aria-labelledby="seo-faq-heading"
    >
      {/* Schema.org FAQPage JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container-main max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100/80 px-3.5 py-1 text-xs font-bold text-pink-700 mb-3 border border-pink-200/70 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-pink-600 shrink-0" />
            <span>{language === "bn" ? "অফিসিয়াল বিউটি গাইড ও প্রশ্নোত্তর" : "Official Beauty Guide & FAQs"}</span>
          </div>

          <h2
            id="seo-faq-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight leading-tight sm:leading-snug"
          >
            {heading}
          </h2>

          <p className="mt-3 text-xs sm:text-sm md:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* Quick-Access Category Navigation Pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 pt-1">
            <Link
              href="/products?category=skin-care"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200 shadow-2xs hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <span>🧴</span>
              <span>{language === "bn" ? "স্কিনকেয়ার" : "Skin Care"}</span>
            </Link>
            <Link
              href="/products?category=makeup"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200 shadow-2xs hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <span>💄</span>
              <span>{language === "bn" ? "মেকআপ" : "Makeup"}</span>
            </Link>
            <Link
              href="/products?category=hair-care"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200 shadow-2xs hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <span>🌿</span>
              <span>{language === "bn" ? "হেয়ার কেয়ার" : "Hair Care"}</span>
            </Link>
            <Link
              href="/brands"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200 shadow-2xs hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <span>✨</span>
              <span>{language === "bn" ? "টপ ব্র্যান্ডস" : "Top Brands"}</span>
            </Link>
            <Link
              href="/products?discount=true"
              className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3.5 py-1.5 text-xs font-bold text-pink-700 border border-pink-200 shadow-2xs hover:bg-pink-100 transition-colors"
            >
              <span>🏷️</span>
              <span>{language === "bn" ? "স্পেশাল অফার" : "Special Offers"}</span>
            </Link>
          </div>
        </div>

        {/* Humanized SEO Editorial Guide (Similar to Beauty Booth / Ogerio) */}
        {seoDescription && (
          <article className="rounded-2xl sm:rounded-3xl border border-pink-100/90 bg-linear-to-br from-pink-50/50 via-white to-pink-50/30 p-5 sm:p-7 md:p-8 shadow-xs mb-10 text-zinc-700">
            {/* Editorial Content with Expandable Container for Clean Mobile UX & 100% SEO Crawlability */}
            <div
              className={cn(
                "relative transition-all duration-300",
                !isGuideExpanded ? "max-h-72 sm:max-h-80 overflow-hidden" : "max-h-none"
              )}
            >
              <div
                className="prose prose-base sm:prose-lg max-w-none text-base sm:text-[17px] text-zinc-700 leading-relaxed sm:leading-8"
                dangerouslySetInnerHTML={{ __html: seoDescription }}
              />

              {/* Gradient Mask when collapsed */}
              {!isGuideExpanded && (
                <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-white via-white/85 to-transparent pointer-events-none" />
              )}
            </div>

            {/* Read More / Read Less Toggle */}
            <div className="mt-4 pt-3 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#e91e63] hover:text-pink-700 bg-white px-4 py-2 rounded-xl border border-pink-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                aria-expanded={isGuideExpanded}
              >
                <span>
                  {isGuideExpanded
                    ? language === "bn"
                      ? "সংক্ষেপ করুন"
                      : "Show Less"
                    : language === "bn"
                      ? "সম্পূর্ণ বিউটি গাইড পড়ুন"
                      : "Read Full Beauty Guide"}
                </span>
                {isGuideExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <p className="text-xs sm:text-sm text-zinc-500 text-center sm:text-right font-medium">
                {language === "bn"
                  ? "১০০% সার্টিফাইড আন্তর্জাতিক কসমেটিকস ও স্কিনকেয়ার"
                  : "100% Certified Direct Imports & Verified Batch Codes"}
              </p>
            </div>

            {/* Trust Highlights Grid */}
            <div className="mt-5 pt-5 border-t border-pink-100/90 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm font-semibold text-zinc-800">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 border border-pink-50">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span className="leading-tight text-xs sm:text-sm font-bold">
                  {language === "bn" ? "আসল ব্যাচ কোড গ্যারান্টি" : "Verified Batch Codes"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 border border-pink-50">
                <Truck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span className="leading-tight text-xs sm:text-sm font-bold">
                  {language === "bn" ? "২৪-৪৮ ঘণ্টায় ডেলিভারি" : "Express 24-48h Delivery"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 border border-pink-50">
                <Eye className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span className="leading-tight text-xs sm:text-sm font-bold">
                  {language === "bn" ? "পার্সেল চেক করার সুবিধা" : "Doorstep Parcel Check"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 border border-pink-50">
                <RotateCcw className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span className="leading-tight text-xs sm:text-sm font-bold">
                  {language === "bn" ? "৭ দিনের ফ্রি রিপ্লেসমেন্ট" : "7-Day Free Replacement"}
                </span>
              </div>
            </div>
          </article>
        )}

        {/* Category Filter Tabs for FAQs */}
        {categories.length > 1 && (
          <div className="relative mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 -mx-1 sm:mx-0 sm:flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full sm:rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none",
                  selectedCategory === "all"
                    ? "bg-[#e91e63] text-white shadow-xs ring-2 ring-pink-500/20 scale-[1.02]"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-pink-300 hover:text-[#e91e63]"
                )}
              >
                {language === "bn" ? "সব প্রশ্ন" : "All Questions"} ({faqs.length})
              </button>
              {categories.map((cat) => {
                const getCategoryLabel = (name: string) => {
                  if (language !== "bn") return name;
                  const lower = name.toLowerCase();
                  if (lower.includes("sourcing") || lower.includes("authenticity")) return "আসল পণ্য ও সোর্সিং";
                  if (lower.includes("doorstep") || lower.includes("inspection")) return "পার্সেল যাচাই";
                  if (lower.includes("delivery") || lower.includes("courier") || lower.includes("shipping")) return "ডেলিভারি ও কুরিয়ার";
                  if (lower.includes("return") || lower.includes("exchange") || lower.includes("refund")) return "রিটার্ন ও রিপ্লেসমেন্ট";
                  if (lower.includes("safety") || lower.includes("toxic")) return "প্রোডাক্ট নিরাপত্তা";
                  if (lower.includes("payment") || lower.includes("pricing")) return "পেমেন্ট ও মূল্য";
                  if (lower.includes("routine")) return "স্কিনকেয়ার রুটিন";
                  if (lower.includes("advisory") || lower.includes("consult")) return "বিউটি পরামর্শ";
                  return name;
                };

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full sm:rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none",
                      selectedCategory === cat
                        ? "bg-[#e91e63] text-white shadow-xs ring-2 ring-pink-500/20 scale-[1.02]"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-pink-300 hover:text-[#e91e63]"
                    )}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqId === faq.id;
            const q = language === "bn" && faq.questionBn ? faq.questionBn : faq.question;
            const a = language === "bn" && faq.answerBn ? faq.answerBn : faq.answer;

            return (
              <div
                key={faq.id || idx}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "border-pink-300 bg-white shadow-md ring-2 ring-pink-500/10"
                    : "border-zinc-200/80 bg-white/90 hover:bg-white hover:border-zinc-300"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 text-left transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <span
                      className={cn(
                        "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-colors mt-0.5 sm:mt-0",
                        isOpen
                          ? "bg-pink-600 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-600"
                      )}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1 pr-1">
                      {faq.category && (
                        <span className="text-xs font-bold uppercase tracking-wider text-pink-600 block mb-0.5">
                          {faq.category}
                        </span>
                      )}
                      <span className="text-sm sm:text-base md:text-lg font-bold text-zinc-900 leading-snug wrap-break-word block">
                        {q}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ml-1",
                      isOpen ? "rotate-180 bg-pink-100 text-pink-700" : "bg-zinc-100 text-zinc-500"
                    )}
                  >
                    <ChevronDown className="h-4.5 w-4.5" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className="px-4 pb-5 pt-2 sm:px-6 sm:pb-6 text-sm sm:text-base text-zinc-700 leading-relaxed border-t border-pink-50 animate-in fade-in-50 duration-150"
                  >
                    <p className="whitespace-pre-line leading-relaxed sm:leading-7 wrap-break-word font-normal">{a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need More Assistance Banner (100% Admin Controllable & Mobile Responsive) */}
        {config?.showWhatsappCard !== false && (
          <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl bg-zinc-900 text-white p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xl">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 text-left">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-600 text-white shadow-xs mt-0.5 sm:mt-0">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black leading-snug">
                  {language === "bn"
                    ? config?.whatsappTitleBn || config?.whatsappTitle || "সঠিক প্রোডাক্ট নির্বাচনে সাহায্য প্রয়োজন?"
                    : config?.whatsappTitle || "Need help choosing the right beauty products?"}
                </p>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  {language === "bn"
                    ? config?.whatsappSubtitleBn ||
                      config?.whatsappSubtitle ||
                      "আমাদের বিউটি এক্সপার্টরা প্রতিদিন সকাল ১০টা থেকে রাত ১০টা পর্যন্ত হোয়াটসঅ্যাপে সক্রিয় আছেন।"
                    : config?.whatsappSubtitle ||
                      "Chat directly with our certified beauty advisors on WhatsApp daily 10 AM to 10 PM."}
                </p>
              </div>
            </div>

            {(() => {
              const rawNum = config?.whatsappNumber || "+880 1700-000000";
              const trimmed = rawNum.trim();
              let waHref = "https://wa.me/8801700000000";
              if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                waHref = trimmed;
              } else {
                const digits = trimmed.replace(/[^0-9]/g, "");
                if (digits.startsWith("880")) waHref = `https://wa.me/${digits}`;
                else if (digits.startsWith("0")) waHref = `https://wa.me/88${digits}`;
                else if (digits) waHref = `https://wa.me/${digits}`;
              }
              const btnLabel =
                language === "bn"
                  ? config?.whatsappButtonTextBn || config?.whatsappButtonText || "হোয়াটসঅ্যাপে ফ্রি পরামর্শ নিন"
                  : config?.whatsappButtonText || "Chat on WhatsApp";

              return (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 justify-center rounded-xl bg-[#e91e63] px-6 py-3.5 text-sm sm:text-base font-black text-white hover:bg-pink-700 transition-colors shadow-md flex items-center gap-2 text-center cursor-pointer"
                >
                  <span>{btnLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}

