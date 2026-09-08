"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Droplets,
  Scale,
  Sun,
  Hourglass,
  Wind,
  CloudSun,
  CheckCircle2,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/shared/ui/button";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import {
  trackStartTrial,
  trackSchedule,
  trackSubmitApplication,
} from "@/lib/analytics/datalayer";
import { getMatchedQuizRoutine, type MatchedProduct } from "@/features/quiz/actions";

export function SkincareQuizClient() {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [routineAdded, setRoutineAdded] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [matchedData, setMatchedData] = useState<{
    routineTitle: string;
    routineSubtitle: string;
    products: MatchedProduct[];
  } | null>(null);

  const { addItem, openCart } = useCart();

  const questions = [
    {
      id: 1,
      title: language === "bn" ? "আপনার স্কিনের ধরণ কোনটি?" : "What is your skin type?",
      subtitle: language === "bn"
        ? "প্রতিদিনের রুটিনে আপনার ত্বক সাধারণত কেমন অনুভব হয়?"
        : "How does your skin usually feel during the day?",
      options: [
        {
          label: language === "bn" ? "শুষ্ক ত্বক" : "Dry Skin",
          desc: language === "bn" ? "মুখ ধোয়ার পর কিছুটা টানটান বা খসখসে লাগে" : "Feels tight or slightly dry after cleansing",
          icon: Droplets,
          value: "dry",
        },
        {
          label: language === "bn" ? "তৈলাক্ত ত্বক" : "Oily Skin",
          desc: language === "bn" ? "মুখে তেলতেলে ভাব বা অতিরিক্ত শাইন থাকে" : "Feels shiny with excess oil, especially on T-zone",
          icon: Sparkles,
          value: "oily",
        },
        {
          label: language === "bn" ? "মিশ্র ত্বক" : "Combination Skin",
          desc: language === "bn" ? "কপাল ও নাকে তেলতেলে, কিন্তু গাল স্বাভাবিক বা শুষ্ক" : "Oily on forehead and nose, normal or dry on cheeks",
          icon: Scale,
          value: "combo",
        },
        {
          label: language === "bn" ? "সংবেদনশীল ত্বক" : "Sensitive Skin",
          desc: language === "bn" ? "নতুন কোনো পণ্য ব্যবহারে সহজেই অস্বস্তি বা লালচে ভাব হয়" : "Easily feels delicate or uncomfortable with new products",
          icon: ShieldCheck,
          value: "sensitive",
        },
      ],
    },
    {
      id: 2,
      title: language === "bn" ? "আপনার প্রধান স্কিনকেয়ার লক্ষ্য কি?" : "What is your main skincare goal?",
      subtitle: language === "bn"
        ? "যে বিষয়ে আপনি সবচেয়ে বেশি ফোকাস করতে চান তা বেছে নিন।"
        : "Choose what you would like to focus on for your daily routine.",
      options: [
        {
          label: language === "bn" ? "হাইড্রেশন ও ফ্রেশ লুক" : "Hydration & Fresh Glow",
          desc: language === "bn" ? "ত্বকে আর্দ্রতা বজায় রাখা ও ফ্রেশ, কোমল অনুভূতি" : "Keep skin soft, comfortable, and hydrated throughout the day",
          icon: Droplets,
          value: "hydration",
        },
        {
          label: language === "bn" ? "অয়েল কন্ট্রোল ও স্মুথ ফিল" : "Oil Control & Smooth Feel",
          desc: language === "bn" ? "অতিরিক্ত তেল নিয়ন্ত্রণ এবং ত্বককে মসৃণ ও পরিষ্কার রাখা" : "Keep excess oil balanced and skin feeling clean and smooth",
          icon: Sparkles,
          value: "acne",
        },
        {
          label: language === "bn" ? "উজ্জ্বলতা ও সমান স্কিন টোন" : "Brightening & Even Tone",
          desc: language === "bn" ? "রোদে পোড়া ভাব দূর করে স্কিন টোন সমান ও ফ্রেশ রাখা" : "Help create a more even-looking and fresh complexion",
          icon: Sun,
          value: "brightening",
        },
        {
          label: language === "bn" ? "কোমল ও টানটান অনুভূতি" : "Firmness & Smooth Feel",
          desc: language === "bn" ? "ত্বকের নমনীয়তা ও মসৃণ টেক্সচার ধরে রাখা" : "Support skin elasticity and a smooth, youthful look",
          icon: Hourglass,
          value: "aging",
        },
      ],
    },
    {
      id: 3,
      title: language === "bn" ? "আপনার দৈনন্দিন পরিবেশ কেমন?" : "What is your daily environment?",
      subtitle: language === "bn"
        ? "প্রতিদিনের রুটিনের জন্য উপযুক্ত পণ্য বাছাই করতে সাহায্য করে।"
        : "Helps us choose products that fit your day-to-day routine.",
      options: [
        {
          label: language === "bn" ? "বেশি সময় বাইরে থাকা" : "Mostly Outdoors",
          desc: language === "bn" ? "বাইরে যাতায়াত, রোদ ও ধুলোবালির মধ্যে বেশি থাকা" : "Regular commute, outdoors and sun exposure",
          icon: Sun,
          value: "outdoor",
        },
        {
          label: language === "bn" ? "বেশিরভাগ সময় এসিতে থাকা" : "Mostly Indoors (AC)",
          desc: language === "bn" ? "অফিস বা পড়ার রুমে দীর্ঘ সময় এসির বাতাসে থাকা" : "Long hours in air-conditioned rooms",
          icon: Wind,
          value: "indoor",
        },
        {
          label: language === "bn" ? "ইনডোর ও আউটডোরের মিশ্রণ" : "Balanced Indoor & Outdoor",
          desc: language === "bn" ? "সাধারণ ঘরোয়া বা অফিস কাজের সাথে সাধারণ যাতায়াত" : "Mix of desk work and everyday errands",
          icon: CloudSun,
          value: "mixed",
        },
      ],
    },
  ];

  const handleSelectOption = async (value: string) => {
    if (currentStep === 0) {
      trackStartTrial("skincare_routine_quiz", "routine_match");
    }

    const updated = { ...answers, [currentStep]: value };
    setAnswers(updated);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      trackSchedule("routine_finder_results");
      trackSubmitApplication("routine_match_completed");
      setCurrentStep(questions.length); // Results screen

      setLoadingResults(true);
      try {
        const result = await getMatchedQuizRoutine(updated[0] || "combo", updated[1] || "hydration");
        setMatchedData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingResults(false);
      }
    }
  };

  const handleAddFullRoutine = () => {
    if (!matchedData || matchedData.products.length === 0) return;

    matchedData.products.forEach((prod) => {
      const price = prod.sale_price ?? prod.regular_price;
      addItem(
        {
          id: prod.id,
          product_id: prod.id,
          name: prod.name,
          slug: prod.slug,
          price,
          regular_price: prod.regular_price,
          image_url: prod.image_url,
          brand_name: prod.brand_name,
        },
        1
      );
    });

    setRoutineAdded(true);
    openCart();
  };

  const handleAddSingleItem = (prod: MatchedProduct) => {
    const price = prod.sale_price ?? prod.regular_price;
    addItem(
      {
        id: prod.id,
        product_id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price,
        regular_price: prod.regular_price,
        image_url: prod.image_url,
        brand_name: prod.brand_name,
      },
      1
    );
    openCart();
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setRoutineAdded(false);
    setMatchedData(null);
  };

  // Results Screen
  if (currentStep >= questions.length) {
    if (loadingResults || !matchedData) {
      return (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-pink-100 text-[#e91e63] animate-pulse">
            <Sparkles className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="text-xl font-black text-gray-900">
            {language === "bn" ? "আপনার জন্য সেরা রুটিন তৈরি হচ্ছে..." : "Finding your daily routine..."}
          </h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {language === "bn"
              ? "আপনার পছন্দের ভিত্তিতে উপযোগী স্কিনকেয়ার পণ্য খুঁজে বের করা হচ্ছে।"
              : "Matching gentle, trusted beauty products to fit your daily needs."}
          </p>
        </div>
      );
    }

    const totalRoutinePrice = matchedData.products.reduce(
      (acc, p) => acc + (p.sale_price ?? p.regular_price),
      0
    );

    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
        {/* Match Header */}
        <div className="rounded-3xl border border-pink-100 bg-linear-to-br from-pink-50/60 via-white to-pink-50/40 p-8 sm:p-10 shadow-card text-center space-y-3">
          <span className="rounded-full bg-pink-100 text-[#e91e63] px-3.5 py-1 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#e91e63]" />
            {language === "bn" ? "আপনার জন্য সাজানো স্কিনকেয়ার রুটিন" : "Personalized Skincare Routine"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {matchedData.routineTitle}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            {matchedData.routineSubtitle}
          </p>
        </div>

        {/* Matched Products Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matchedData.products.map((prod) => {
            const currentPrice = prod.sale_price ?? prod.regular_price;
            const hasDiscount = prod.sale_price && prod.sale_price < prod.regular_price;

            return (
              <div
                key={prod.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-card space-y-4 flex flex-col justify-between hover:border-[#e91e63] transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-pink-50 text-[#e91e63] px-2.5 py-0.5 text-[10px] font-black uppercase">
                      {prod.step_label}
                    </span>
                    {prod.country && (
                      <span className="text-[10px] font-bold text-gray-400">
                        {prod.country}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/products/${prod.slug}`}
                    className="block aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group"
                  >
                    <img
                      src={prod.image_url || "/product_placeholder.svg"}
                      alt={prod.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div>
                    {prod.brand_name && (
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        {prod.brand_name}
                      </span>
                    )}
                    <Link
                      href={`/products/${prod.slug}`}
                      className="font-bold text-gray-900 text-sm hover:text-[#e91e63] line-clamp-2 transition-colors"
                    >
                      {prod.name}
                    </Link>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {prod.step_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-gray-900 text-base">
                        {formatPriceBn(currentPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPriceBn(prod.regular_price)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> {language === "bn" ? "১০০% খাঁটি" : "100% Genuine"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSingleItem(prod)}
                    className="w-full text-xs font-bold rounded-xl h-8 border-gray-200 hover:border-[#e91e63] hover:text-[#e91e63]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                    {language === "bn" ? "শুধুমাত্র এই ধাপটি যোগ করুন" : "Add this Step Only"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total & 1-Click Buy Strip */}
        <div className="rounded-3xl border border-pink-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs text-gray-500 font-bold">
              {language === "bn"
                ? `সম্পূর্ণ রুটিনের মূল্য (${toBn(matchedData.products.length)} টি প্রোডাক্ট):`
                : `Complete Routine Price (${matchedData.products.length} Products):`}
            </span>
            <div className="text-2xl font-black text-[#e91e63]">
              {formatPriceBn(totalRoutinePrice)}
            </div>
            {totalRoutinePrice >= 2000 ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {language === "bn"
                  ? "সারা দেশে ফ্রি এক্সপ্রেস হোম ডেলিভারির জন্য প্রযোজ্য!"
                  : "Eligible for FREE Express Nationwide Delivery!"}
              </span>
            ) : (
              <span className="text-xs text-gray-500 block">
                {language === "bn"
                  ? "ডেলিভারি চার্জ: ঢাকায় ৳৭০ / ঢাকার বাইরে ৳১৩০"
                  : "Standard delivery: ৳70 Inside Dhaka / ৳130 Outside"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-10 px-4"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {t("quiz", "restartQuiz")}
            </Button>

            <Button
              onClick={handleAddFullRoutine}
              className="flex-1 sm:flex-none text-xs font-black rounded-xl h-10 px-6 bg-[#e91e63] hover:bg-pink-600 text-white shadow-md"
            >
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              {routineAdded
                ? (language === "bn" ? "রুটিন কার্টে যুক্ত হয়েছে!" : "Routine Added to Bag!")
                : t("quiz", "addFullRoutine")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 px-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600 font-bold">
          <span>
            {language === "bn"
              ? `প্রশ্ন ${toBn(currentStep + 1)} / ${toBn(questions.length)}`
              : `Question ${currentStep + 1} of ${questions.length}`}
          </span>
          <span>
            {toBn(Math.round(((currentStep + 1) / questions.length) * 100))}% {language === "bn" ? "সম্পন্ন" : "Complete"}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-[#e91e63] rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-card space-y-6">
        <div>
          <span className="rounded-full bg-pink-50 text-[#e91e63] px-3 py-1 text-[11px] font-black uppercase">
            {language === "bn" ? `ধাপ ${toBn(currentStep + 1)}` : `Step ${currentStep + 1}`}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
            {q.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {q.subtitle}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt) => {
            const isSelected = answers[currentStep] === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectOption(opt.value)}
                className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-[#e91e63] bg-pink-50/50 ring-2 ring-[#e91e63]/20 shadow-xs"
                    : "border-gray-200 bg-white hover:border-[#e91e63]/40 hover:bg-gray-50"
                }`}
              >
                <span className="shrink-0 p-2 rounded-xl bg-pink-50 text-[#e91e63]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold text-gray-900 text-sm">
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Back Button */}
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-bold pt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {language === "bn" ? "পূর্ববর্তী প্রশ্নে ফিরুন" : "Back to Previous Question"}
          </button>
        )}
      </div>
    </div>
  );
}

