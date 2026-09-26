"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Eye,
  RotateCcw,
  Search,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import {
  type HomepageFullConfig,
  type HomepageFaqItem,
  type HomepageFaqSectionConfig,
  DEFAULT_HOMEPAGE_CONFIG,
} from "@/features/marketing/homepage-types";

interface HomepageSeoFaqEditorProps {
  config: HomepageFullConfig;
  onChange: (updated: HomepageFullConfig) => void;
}

export function formatWhatsAppUrl(input?: string): string {
  if (!input) return "https://wa.me/8801700000000";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (!digits) return "https://wa.me/8801700000000";
  if (digits.startsWith("880")) return `https://wa.me/${digits}`;
  if (digits.startsWith("0")) return `https://wa.me/88${digits}`;
  return `https://wa.me/${digits}`;
}

export function HomepageSeoFaqEditor({ config, onChange }: HomepageSeoFaqEditorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewLang, setPreviewLang] = useState<"en" | "bn">("bn");

  const defaultConfig = DEFAULT_HOMEPAGE_CONFIG.faqSection!;
  const rawSection = config.faqSection;

  const faqSection: HomepageFaqSectionConfig = {
    enabled: rawSection?.enabled ?? defaultConfig.enabled,
    heading: rawSection?.heading ?? defaultConfig.heading,
    headingBn: rawSection?.headingBn ?? defaultConfig.headingBn,
    subtitle: rawSection?.subtitle ?? defaultConfig.subtitle,
    subtitleBn: rawSection?.subtitleBn ?? defaultConfig.subtitleBn,
    seoDescriptionHtml: rawSection?.seoDescriptionHtml ?? defaultConfig.seoDescriptionHtml,
    seoDescriptionHtmlBn: rawSection?.seoDescriptionHtmlBn ?? defaultConfig.seoDescriptionHtmlBn,
    faqs: rawSection?.faqs?.length ? rawSection.faqs : defaultConfig.faqs,
    showWhatsappCard: rawSection?.showWhatsappCard ?? defaultConfig.showWhatsappCard ?? true,
    whatsappTitle: rawSection?.whatsappTitle ?? defaultConfig.whatsappTitle ?? "Need help choosing the right beauty products?",
    whatsappTitleBn: rawSection?.whatsappTitleBn ?? defaultConfig.whatsappTitleBn ?? "Need help finding the right fit or size??",
    whatsappSubtitle: rawSection?.whatsappSubtitle ?? defaultConfig.whatsappSubtitle ?? "Chat directly with our certified beauty advisors on WhatsApp daily 10 AM to 10 PM.",
    whatsappSubtitleBn: rawSection?.whatsappSubtitleBn ?? defaultConfig.whatsappSubtitleBn ?? "Our customer support team is available every day 10:00 from PM 10:00 till  Active ।",
    whatsappButtonText: rawSection?.whatsappButtonText ?? defaultConfig.whatsappButtonText ?? "Chat on WhatsApp",
    whatsappButtonTextBn: rawSection?.whatsappButtonTextBn ?? defaultConfig.whatsappButtonTextBn ?? "   ",
    whatsappNumber: rawSection?.whatsappNumber ?? defaultConfig.whatsappNumber ?? "+880 1700-000000",
  };

  const updateSection = (field: keyof HomepageFaqSectionConfig, value: any) => {
    onChange({
      ...config,
      faqSection: {
        ...faqSection,
        [field]: value,
      },
    });
  };

  const updateFaq = (index: number, field: keyof HomepageFaqItem, value: string) => {
    const list = [...(faqSection.faqs || [])];
    list[index] = { ...list[index], [field]: value };
    updateSection("faqs", list);
  };

  const addFaq = () => {
    const newItem: HomepageFaqItem = {
      id: `faq-${Date.now()}`,
      category: "Authenticity & Quality",
      question: "New Frequently Asked Question",
      questionBn: "  ",
      answer: "Provide a helpful, humanized, and transparent answer here.",
      answerBn: "    Language Answeritems ।",
    };
    updateSection("faqs", [...(faqSection.faqs || []), newItem]);
  };

  const removeFaq = (index: number) => {
    const list = (faqSection.faqs || []).filter((_, i) => i !== index);
    updateSection("faqs", list);
  };

  const moveFaq = (index: number, direction: "up" | "down") => {
    const list = [...(faqSection.faqs || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateSection("faqs", list);
  };

  const resetToDefaultFaqs = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the FAQ list to the 8 default SEO-optimized beauty questions? Any custom modifications to questions will be replaced."
      )
    ) {
      updateSection("faqs", defaultConfig.faqs);
    }
  };

  const filteredFaqs = (faqSection.faqs || []).filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.question?.toLowerCase().includes(q) ||
      f.questionBn?.toLowerCase().includes(q) ||
      f.category?.toLowerCase().includes(q) ||
      f.answer?.toLowerCase().includes(q) ||
      f.answerBn?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Enable Toggle */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#1D6474]" />
              SEO & Humanized FAQ Section (Beauty Booth / Ogerio Style)
            </h2>
            <span className="rounded-full bg-teal-100/70 text-[#164E63] text-[10px] font-bold px-2 py-0.5">
              Google Schema.org Ready
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Meta Ads Safe
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Build buyer trust and boost SEO with expandable FAQ accordions, certified beauty guides, and interactive WhatsApp assistance.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={faqSection.enabled !== false}
            onChange={(e) => updateSection("enabled", e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D6474]"></div>
          <span className="ml-3 text-xs font-bold text-gray-800">
            {faqSection.enabled !== false ? "Section Active" : "Section Disabled"}
          </span>
        </label>
      </div>

      {/* 2. Section Titles & Bilingual Headings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center justify-between">
          <span>Section Titles & Bilingual Headings</span>
          <span className="text-[11px] font-normal text-gray-400">Controls top header on storefront</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Heading (English)
            </label>
            <input
              type="text"
              value={faqSection.heading}
              onChange={(e) => updateSection("heading", e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Heading (English)
            </label>
            <input
              type="text"
              value={faqSection.headingBn || ""}
              onChange={(e) => updateSection("headingBn", e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Subtitle (English)
            </label>
            <input
              type="text"
              value={faqSection.subtitle}
              onChange={(e) => updateSection("subtitle", e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Subtitle (English)
            </label>
            <input
              type="text"
              value={faqSection.subtitleBn || ""}
              onChange={(e) => updateSection("subtitleBn", e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
            />
          </div>
        </div>
      </div>

      {/* 3. WhatsApp Advisory Banner & Quick Contact Card (100% Controllable) */}
      <div className="rounded-2xl border-2 border-teal-200/80 bg-linear-to-br from-pink-50/40 via-white to-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-gray-900">
                  WhatsApp Advisory & Quick Contact Banner
                </h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  Direct WhatsApp CTA
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure the dedicated assistance banner shown directly below the FAQs on both mobile and desktop.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={faqSection.showWhatsappCard !== false}
              onChange={(e) => updateSection("showWhatsappCard", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-bold text-gray-800">
              {faqSection.showWhatsappCard !== false ? "Banner Visible" : "Banner Hidden"}
            </span>
          </label>
        </div>

        {faqSection.showWhatsappCard !== false && (
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            {/* WhatsApp Number / Link Input with Test Button */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-gray-800">
                  WhatsApp Phone Number or Direct Link
                </label>
                <a
                  href={formatWhatsAppUrl(faqSection.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                  Test WhatsApp Link
                </a>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <PhoneCall className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={faqSection.whatsappNumber || ""}
                    onChange={(e) => updateSection("whatsappNumber", e.target.value)}
                    placeholder="+880 1700-000000 or 01700000000 or https://wa.me/..."
                    className="w-full rounded-xl border pl-10 pr-4 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                You can enter a Bangladeshi phone number (e.g. <span className="font-mono text-gray-700 font-bold">+880 1700-000000</span> or <span className="font-mono text-gray-700 font-bold">01712-345678</span>) or a direct custom WhatsApp link (<span className="font-mono text-gray-700 font-bold">https://wa.me/8801700000000</span>).
              </p>
            </div>

            {/* Bilingual Titles & Subtitles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Card Title (English)
                </label>
                <input
                  type="text"
                  value={faqSection.whatsappTitle || ""}
                  onChange={(e) => updateSection("whatsappTitle", e.target.value)}
                  placeholder="Need help choosing the right beauty products?"
                  className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Card Title (English)
                </label>
                <input
                  type="text"
                  value={faqSection.whatsappTitleBn || ""}
                  onChange={(e) => updateSection("whatsappTitleBn", e.target.value)}
                  placeholder="Need help finding the right fit or size??"
                  className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Subtitle / Advisor Availability (English)
                </label>
                <textarea
                  rows={2}
                  value={faqSection.whatsappSubtitle || ""}
                  onChange={(e) => updateSection("whatsappSubtitle", e.target.value)}
                  placeholder="Chat directly with our certified beauty advisors on WhatsApp daily 10 AM to 10 PM."
                  className="w-full rounded-xl border px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Subtitle / Advisor Availability (English)
                </label>
                <textarea
                  rows={2}
                  value={faqSection.whatsappSubtitleBn || ""}
                  onChange={(e) => updateSection("whatsappSubtitleBn", e.target.value)}
                  placeholder="Our customer support team is available every day 10:00 from PM 10:00 till  Active ।"
                  className="w-full rounded-xl border px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Button Text (English)
                </label>
                <input
                  type="text"
                  value={faqSection.whatsappButtonText || ""}
                  onChange={(e) => updateSection("whatsappButtonText", e.target.value)}
                  placeholder="Chat on WhatsApp"
                  className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Button Text (English)
                </label>
                <input
                  type="text"
                  value={faqSection.whatsappButtonTextBn || ""}
                  onChange={(e) => updateSection("whatsappButtonTextBn", e.target.value)}
                  placeholder="   "
                  className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
                />
              </div>
            </div>

            {/* Live Visual Preview of Storefront Card */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <Eye className="h-3.5 w-3.5 text-[#1D6474]" />
                  <span>Live Storefront Preview</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setPreviewLang("bn")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      previewLang === "bn" ? "bg-[#1D6474] text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang("en")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      previewLang === "en" ? "bg-[#1D6474] text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Dark Card Preview Replicating Mobile/Desktop Storefront */}
              <div className="rounded-2xl bg-zinc-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D6474] text-white shadow-xs">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black leading-snug">
                      {previewLang === "bn"
                        ? faqSection.whatsappTitleBn || faqSection.whatsappTitle
                        : faqSection.whatsappTitle}
                    </p>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      {previewLang === "bn"
                        ? faqSection.whatsappSubtitleBn || faqSection.whatsappSubtitle
                        : faqSection.whatsappSubtitle}
                    </p>
                  </div>
                </div>

                <a
                  href={formatWhatsAppUrl(faqSection.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 justify-center rounded-xl bg-[#1D6474] px-5 py-2.5 text-xs font-black text-white hover:bg-[#164E63] transition-colors shadow-md flex items-center gap-2 text-center"
                >
                  <span>
                    {previewLang === "bn"
                      ? faqSection.whatsappButtonTextBn || faqSection.whatsappButtonText
                      : faqSection.whatsappButtonText}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Humanized SEO Introduction Box */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Humanized SEO Editorial Guide & Buying Journey
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-chapter content explaining authenticity, tropical climate skincare, and nationwide delivery (similar to Beauty Booth / Ogerio). Standard HTML tags supported: &lt;p&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;a href="..."&gt;.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-700">
                SEO Editorial Guide (English HTML)
              </label>
              <span className="text-[10px] text-gray-400 font-mono">HTML Supported</span>
            </div>
            <textarea
              rows={12}
              value={faqSection.seoDescriptionHtml || ""}
              onChange={(e) => updateSection("seoDescriptionHtml", e.target.value)}
              className="w-full rounded-xl border p-3 text-xs text-gray-800 focus:outline-none focus:border-[#1D6474] font-mono leading-relaxed"
              placeholder="<p>Finding a trustworthy cosmetics shop...</p>"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-700">
                SEO Editorial Guide (English HTML)
              </label>
              <span className="text-[10px] text-gray-400 font-mono">HTML Supported</span>
            </div>
            <textarea
              rows={12}
              value={faqSection.seoDescriptionHtmlBn || ""}
              onChange={(e) => updateSection("seoDescriptionHtmlBn", e.target.value)}
              className="w-full rounded-xl border p-3 text-xs text-gray-800 focus:outline-none focus:border-[#1D6474] font-mono leading-relaxed"
              placeholder="<p>English items Add  items ...</p>"
            />
          </div>
        </div>
      </div>

      {/* 5. Interactive FAQ Items List (Add, Delete, Reorder, Edit) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Interactive FAQ Questions ({faqSection.faqs?.length || 0})
            </h3>
            <p className="text-xs text-gray-500">
              Displayed as expandable accordions on mobile, tablet, and desktop with JSON-LD Schema.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={resetToDefaultFaqs}
              size="sm"
              variant="outline"
              className="text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-50"
              title="Reset to 8 default SEO FAQs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset 8 Defaults
            </Button>

            <Button
              type="button"
              onClick={addFaq}
              size="sm"
              className="bg-[#1D6474] hover:bg-[#164E63] text-white text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add FAQ Question
            </Button>
          </div>
        </div>

        {/* Quick Search Filter for FAQs */}
        {(faqSection.faqs?.length || 0) > 4 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search among FAQs by question, answer, or category..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1D6474]"
            />
          </div>
        )}

        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            // Find real index in parent list
            const realIdx = (faqSection.faqs || []).findIndex((f) => f.id === faq.id);
            const idx = realIdx !== -1 ? realIdx : 0;

            return (
              <div
                key={faq.id || idx}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50/60 text-xs font-bold text-[#1D6474]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-black uppercase text-gray-800">
                      Question #{idx + 1}
                    </span>
                    {faq.category && (
                      <span className="rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5">
                        {faq.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFaq(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFaq(idx, "down")}
                      disabled={idx === (faqSection.faqs?.length || 0) - 1}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 ml-1"
                      title="Delete Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Category Tag (e.g. Authenticity & Quality, Delivery, Product Safety, Returns)
                  </label>
                  <input
                    type="text"
                    value={faq.category || ""}
                    onChange={(e) => updateFaq(idx, "category", e.target.value)}
                    placeholder="e.g. Authenticity & Quality, Product Safety, Delivery, Returns"
                    className="w-full sm:w-80 rounded-xl border px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#1D6474]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Question (English)
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(idx, "question", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Question (English)
                    </label>
                    <input
                      type="text"
                      value={faq.questionBn || ""}
                      onChange={(e) => updateFaq(idx, "questionBn", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1D6474]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Answer (English)
                    </label>
                    <textarea
                      rows={4}
                      value={faq.answer}
                      onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                      className="w-full rounded-xl border p-2.5 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-[#1D6474]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Answer (English)
                    </label>
                    <textarea
                      rows={4}
                      value={faq.answerBn || ""}
                      onChange={(e) => updateFaq(idx, "answerBn", e.target.value)}
                      className="w-full rounded-xl border p-2.5 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-[#1D6474]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
