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
  CheckCircle2,
  HeartHandshake,
  Layers,
  SlidersHorizontal,
  Flame,
  Globe2,
  Leaf,
  Tag,
  Repeat,
  Plus,
  Trash2,
  Star,
  Zap,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/shared/ui/button";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import {
  trackViewItemList,
  pushToDataLayer,
} from "@/lib/analytics/datalayer";
import {
  getMatchedQuizRoutine,
  type MatchedProduct,
  type QuizRoutineResult,
} from "@/features/quiz/actions";

export function SkincareQuizClient() {
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  // Quiz state
  const [skinType, setSkinType] = useState<string>("combo");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(["hydration", "brightening"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "cleanser",
    "serum",
    "moisturizer",
    "sunscreen",
  ]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(["k_beauty"]);
  const [budgetRange, setBudgetRange] = useState<string>("mid");

  const [loadingResults, setLoadingResults] = useState(false);
  const [routineResult, setRoutineResult] = useState<QuizRoutineResult | null>(null);
  const [activeProducts, setActiveProducts] = useState<MatchedProduct[]>([]);
  const [routineAdded, setRoutineAdded] = useState(false);
  const [swapModalStep, setSwapModalStep] = useState<string | null>(null);

  const { addItem, openCart } = useCart();

  // Helper toggle multi-select
  const toggleMultiSelect = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    minCount = 1
  ) => {
    if (currentList.includes(val)) {
      if (currentList.length > minCount) {
        setList(currentList.filter((item) => item !== val));
      }
    } else {
      setList([...currentList, val]);
    }
  };

  const handleStartAnalysis = async () => {
    setLoadingResults(true);
    setCurrentStep(5); // results page

    // Clean, ad-policy-safe payload without sensitive medical terms
    pushToDataLayer({
      event: "quiz_complete",
      category: "beauty_quiz",
      label: `${skinType}_beauty_regimen`,
    });

    try {
      const res = await getMatchedQuizRoutine(
        skinType,
        selectedConcerns,
        selectedCategories,
        selectedSpecs,
        budgetRange
      );
      setRoutineResult(res);
      setActiveProducts(res.products);

      if (res.products && res.products.length > 0) {
        trackViewItemList(
          res.products.map((p, idx) => ({
            item_id: p.id,
            item_name: p.name,
            price: p.sale_price || p.regular_price,
            item_brand: p.brand_name || "Authentic Brand",
            item_category: p.step_label,
            index: idx + 1,
          })),
          "Quiz Recommended Routine"
        );
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleAddAllToCart = () => {
    if (!activeProducts || activeProducts.length === 0) return;
    activeProducts.forEach((prod) => {
      addItem(
        {
          id: prod.id,
          product_id: prod.id,
          name: prod.name,
          price: prod.sale_price || prod.regular_price,
          regular_price: prod.regular_price,
          image_url: prod.image_url || "/product_placeholder.svg",
          slug: prod.slug,
          brand_name: prod.brand_name || null,
        },
        1
      );
    });
    setRoutineAdded(true);
    openCart();

    pushToDataLayer({
      event: "add_full_routine",
      category: "ecommerce",
      label: routineResult?.routineTitle || "Full Skincare Routine",
      value: activeProducts.reduce((acc, p) => acc + (p.sale_price || p.regular_price), 0),
    });

    setTimeout(() => setRoutineAdded(false), 3000);
  };

  const handleAddSingleToCart = (prod: MatchedProduct) => {
    addItem(
      {
        id: prod.id,
        product_id: prod.id,
        name: prod.name,
        price: prod.sale_price || prod.regular_price,
        regular_price: prod.regular_price,
        image_url: prod.image_url || "/product_placeholder.svg",
        slug: prod.slug,
        brand_name: prod.brand_name || null,
      },
      1
    );
    openCart();
  };

  const handleSwapProduct = (stepKey: string, newProduct: MatchedProduct) => {
    setActiveProducts((prev) =>
      prev.map((item) => (item.step_key === stepKey ? { ...newProduct, alternatives: item.alternatives } : item))
    );
    setSwapModalStep(null);
  };

  const handleRemoveStep = (stepKey: string) => {
    setActiveProducts((prev) => prev.filter((item) => item.step_key !== stepKey));
  };

  const calculateTotalPrice = () => {
    return activeProducts.reduce((acc, p) => acc + (p.sale_price || p.regular_price), 0);
  };

  const calculateRegularTotal = () => {
    return activeProducts.reduce((acc, p) => acc + p.regular_price, 0);
  };

  // Step 0 to 4 questions definition
  const totalQuizSteps = 5;

  return (
    <div className="min-h-screen bg-linear-to-b from-rose-50/50 via-white to-pink-50/30 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Intro Header */}
        {currentStep < 5 && (
          <div className="text-center mb-8 sm:mb-10 space-y-2.5 animate-in fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/70 border border-rose-200 text-rose-800 text-xs font-bold tracking-wide shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
              {language === "bn" ? " Casual Wear items " : "Personalized Skincare Routine Matcher"}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {language === "bn" ? "your desired Casual Wear  items items Search" : "Build Your Tailored Beauty Routine"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto font-medium">
              {language === "bn"
                ? "your Cotton ,  items  and desired   with   items ।"
                : "Select your skin type, beauty goals, and preferred formulas to unlock customized product recommendations."}
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto pt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>
                  {language === "bn" ? ` ${toBn(currentStep + 1)}` : `Step ${currentStep + 1}`} {language === "bn" ? "" : "of"} {language === "bn" ? toBn(totalQuizSteps) : totalQuizSteps}
                </span>
                <span className="text-rose-600 font-extrabold">
                  {Math.round(((currentStep + 1) / totalQuizSteps) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/60 shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / totalQuizSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 0: SKIN TYPE */}
        {currentStep === 0 && (
          <div className="space-y-6 bg-white/90 backdrop-blur-md border border-rose-100 p-6 sm:p-9 rounded-3xl shadow-xl shadow-rose-100/30 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {language === "bn" ? "Step 1 •  Profile" : "Step 1 • Skin Profile"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {language === "bn" ? "your Cotton   items?" : "What is your natural skin profile?"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {language === "bn"
                  ? "Enter   your Cotton   ?"
                  : "How does your face naturally feel throughout the day?"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                {
                  id: "dry",
                  labelBn: "Linen Blend (Dry Skin)",
                  labelEn: "Dry Skin",
                  descBn: "   :00 :00:00      ",
                  descEn: "Needs rich nourishment and moisture to stay comfortable and soft",
                  icon: Droplets,
                },
                {
                  id: "oily",
                  labelBn: "Cotton Twill (Oily Skin)",
                  labelEn: "Oily Skin",
                  descBn: "     items-Zone   ",
                  descEn: "Feels naturally shiny, benefiting from lightweight water-based care",
                  icon: Sparkles,
                },
                {
                  id: "combo",
                  labelBn: " Cotton (Combination Skin)",
                  labelEn: "Combination Skin",
                  descBn: "   ,     :00  ",
                  descEn: "Slightly oily in T-zone while cheeks are comfortable or normal",
                  icon: Scale,
                },
                {
                  id: "sensitive",
                  labelBn: "    (Sensitive Skin)",
                  labelEn: "Delicate & Sensitive Skin",
                  descBn: "    weave    ",
                  descEn: "Prefers ultra-gentle, mild, and fragrance-free soothing formulas",
                  icon: ShieldCheck,
                },
                {
                  id: "normal",
                  labelBn: " Cotton (Normal Skin)",
                  labelEn: "Balanced / Normal Skin",
                  descBn: "    ,    ",
                  descEn: "Naturally balanced, smooth texture and comfortable feel",
                  icon: CheckCircle2,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = skinType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSkinType(opt.id)}
                    className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 shadow-md shadow-rose-100"
                        : "border-gray-200/80 bg-white hover:border-rose-200 hover:bg-rose-50/20"
                    }`}
                  >
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-rose-500 text-white shadow-xs" : "bg-gray-100 text-gray-600 group-hover:bg-rose-100 group-hover:text-rose-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm sm:text-base text-gray-900">
                          {language === "bn" ? opt.labelBn : opt.labelEn}
                        </span>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                        {language === "bn" ? opt.descBn : opt.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                onClick={() => setCurrentStep(1)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-md shadow-rose-200 flex items-center gap-2"
              >
                <span>{language === "bn" ? " " : "Next Step"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: BEAUTY GOALS (MULTI-SELECT) - 100% AD COMPLIANT */}
        {currentStep === 1 && (
          <div className="space-y-6 bg-white/90 backdrop-blur-md border border-rose-100 p-6 sm:p-9 rounded-3xl shadow-xl shadow-rose-100/30 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {language === "bn" ? " 2 • items   Cotton " : "Step 2 • Beauty & Skincare Goals"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {language === "bn" ? "your Casual Wear items      ?" : "What are your primary skincare priorities?"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {language === "bn"
                  ? "         (   )।"
                  : "Choose your focus areas. We'll prioritize formulas that promote fresh, radiant, and balanced skin."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                {
                  id: "acne",
                  labelBn: "🌿  Cotton    (Clarifying)",
                  labelEn: "Clarifying & Fresh Complexion",
                  descBn: "      Cotton   Clean ",
                  descEn: "Balances excess oil to keep skin feeling clean, clear, and fresh",
                },
                {
                  id: "brightening",
                  labelBn: "🌸      (Radiant Glow)",
                  labelEn: "Radiant Glass Skin Glow",
                  descBn: "     ,     ",
                  descEn: "Restores sun-kissed brightness and an even, radiant complexion",
                },
                {
                  id: "pigmentation",
                  labelBn: "✨       (Even Tone)",
                  labelEn: "Even Tone & Spot Clarifying",
                  descBn: "          ",
                  descEn: "Helps promote a smooth, uniform tone and clear appearance",
                },
                {
                  id: "hydration",
                  labelBn: "💧      (Hydration Boost)",
                  labelEn: "Deep Hydration & Barrier Comfort",
                  descBn: "   Cotton ,    ",
                  descEn: "Delivers deep moisture to keep skin soft, supple, and hydrated",
                },
                {
                  id: "pores",
                  labelBn: "🕳️  Texture    (Pore Refining)",
                  labelEn: "Pore Refining & Smooth Feel",
                  descBn: " Clean  Cotton    ",
                  descEn: "Smooths surface texture and minimizes the look of shiny pores",
                },
                {
                  id: "aging",
                  labelBn: "⏳     (Youthful Elasticity)",
                  labelEn: "Youthful Elasticity & Firmness",
                  descBn: "Cotton     :00:00   ",
                  descEn: "Maintains skin firmness, natural bounce, and smooth texture",
                },
                {
                  id: "soothing",
                  labelBn: "🛡️     (Calming Comfort)",
                  labelEn: "Soothing & Calming Comfort",
                  descBn: "Enter    Cotton     (Cica/Centella)",
                  descEn: "Gently soothes and comforts skin with calming botanical extracts",
                },
              ].map((opt) => {
                const isSelected = selectedConcerns.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMultiSelect(selectedConcerns, setSelectedConcerns, opt.id, 1)}
                    className={`text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-start gap-3 group cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 shadow-sm"
                        : "border-gray-200/80 bg-white hover:border-rose-200 hover:bg-rose-50/20"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 block">
                        {language === "bn" ? opt.labelBn : opt.labelEn}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        {language === "bn" ? opt.descBn : opt.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(0)}
                className="rounded-xl border-gray-300 text-gray-700 font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === "bn" ? "" : "Back"}</span>
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-md shadow-rose-200 flex items-center gap-2"
              >
                <span>{language === "bn" ? " " : "Next Step"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORIES & ROUTINE STEPS */}
        {currentStep === 2 && (
          <div className="space-y-6 bg-white/90 backdrop-blur-md border border-rose-100 p-6 sm:p-9 rounded-3xl shadow-xl shadow-rose-100/30 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {language === "bn" ? " 3 • Category  items " : "Step 3 • Custom Routine Steps"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {language === "bn" ? "  Category Products items ?" : "Which product steps would you like to include?"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {language === "bn"
                  ? " Category   items Enter। your desired      ।"
                  : "Select the steps you need in your daily regimen. You can add or omit any step."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                {
                  id: "cleanser",
                  labelBn: "1.  /   (Cleanser)",
                  labelEn: "1. Gentle Face Wash & Cleanser",
                  descBn: "Enter Cotton Clean  for",
                  descEn: "Daily gentle cleansing without stripping barrier",
                },
                {
                  id: "toner",
                  labelBn: "2. items  /  (Toner)",
                  labelEn: "2. Hydrating Toner / Mist",
                  descBn: "      for",
                  descEn: "Rebalance pH and prep skin for deep hydration",
                },
                {
                  id: "serum",
                  labelBn: "3.  items Oxford Shirt   (Serum)",
                  labelEn: "3. Nourishing Beauty Serum / Essence",
                  descBn: "  items   weave",
                  descEn: "Potent nutrient actives for healthy radiance",
                },
                {
                  id: "moisturizer",
                  labelBn: "4.  /  (Moisturizer)",
                  labelEn: "4. Barrier Moisturizer / Gel",
                  descBn: "Cotton      ",
                  descEn: "Lock in hydration and strengthen moisture barrier",
                },
                {
                  id: "sunscreen",
                  labelBn: "5. Panjabi (SPF Sun Protection)",
                  labelEn: "5. Daily Sunscreen (SPF50+ PA++++)",
                  descBn: "       ",
                  descEn: "Broad-spectrum UV shield against sun damage & spots",
                },
                {
                  id: "eye_care",
                  labelBn: "6.   (Eye Cream / Serum)",
                  labelEn: "6. Eye Cream & Delicate Eye Care",
                  descBn: "  Cotton    ",
                  descEn: "Nourishes the delicate eye contour for refreshed eyes",
                },
                {
                  id: "lip_care",
                  labelBn: "7.   /   (Lip Care)",
                  labelEn: "7. Lip Mask / Nourishing Balm",
                  descBn: "       ",
                  descEn: "Restores soft, supple moisture for smooth lips",
                },
                {
                  id: "exfoliator",
                  labelBn: "8.    (Exfoliator)",
                  labelEn: "8. Gentle Skin Refresher (1-2x/week)",
                  descBn: "    Cotton    ",
                  descEn: "Gently polishes away dull surface cells",
                },
              ].map((opt) => {
                const isSelected = selectedCategories.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMultiSelect(selectedCategories, setSelectedCategories, opt.id, 1)}
                    className={`text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-start gap-3 group cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 shadow-sm"
                        : "border-gray-200/80 bg-white hover:border-rose-200 hover:bg-rose-50/20"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 block">
                        {language === "bn" ? opt.labelBn : opt.labelEn}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        {language === "bn" ? opt.descBn : opt.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="rounded-xl border-gray-300 text-gray-700 font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === "bn" ? "" : "Back"}</span>
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-md shadow-rose-200 flex items-center gap-2"
              >
                <span>{language === "bn" ? " " : "Next Step"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SPECIFICATIONS & FORMULATIONS */}
        {currentStep === 3 && (
          <div className="space-y-6 bg-white/90 backdrop-blur-md border border-rose-100 p-6 sm:p-9 rounded-3xl shadow-xl shadow-rose-100/30 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {language === "bn" ? " 4 •    " : "Step 4 • Formulation Preferences"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {language === "bn" ? "    Brand   ?" : "Any specific formula or origin preferences?"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {language === "bn"
                  ? " weave :00   ()।"
                  : "Choose your preferred origins and characteristics (Optional)."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                {
                  id: "k_beauty",
                  labelBn: "🇰🇷 items K-Beauty (Korean Skincare)",
                  labelEn: "Authentic Korean Skincare (K-Beauty)",
                  descBn: "Beauty of Joseon, COSRX, Anua, Skin1004, Laneige ",
                  descEn: "Gentle layering formulas focusing on natural glow and moisture",
                },
                {
                  id: "uk_eu",
                  labelBn: "🇬🇧 UK & European Formulations",
                  labelEn: "UK & EU Tested Beauty Brands",
                  descBn: "CeraVe, The Ordinary, Simple, Neutrogena, La Roche-Posay ",
                  descEn: "Trusted European and British beauty formulas",
                },
                {
                  id: "fragrance_free",
                  labelBn: "🍃    (Fragrance-Free)",
                  labelEn: "Fragrance-Free & Mild",
                  descBn: " items  OFF  weave",
                  descEn: "0% artificial fragrance for clean, comfortable skincare",
                },
                {
                  id: "vegan_cruelty_free",
                  labelBn: "🐰 items-   items (Clean Beauty)",
                  labelEn: "Clean & Cruelty-Free",
                  descBn: "  -  weave",
                  descEn: "Ethical, animal-friendly formulations with clean ingredients",
                },
              ].map((opt) => {
                const isSelected = selectedSpecs.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMultiSelect(selectedSpecs, setSelectedSpecs, opt.id, 0)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 group cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 shadow-sm"
                        : "border-gray-200/80 bg-white hover:border-rose-200 hover:bg-rose-50/20"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 block">
                        {language === "bn" ? opt.labelBn : opt.labelEn}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        {language === "bn" ? opt.descBn : opt.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="rounded-xl border-gray-300 text-gray-700 font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === "bn" ? "" : "Back"}</span>
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-md shadow-rose-200 flex items-center gap-2"
              >
                <span>{language === "bn" ? " " : "Next Step"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET RANGE & GENERATION */}
        {currentStep === 4 && (
          <div className="space-y-6 bg-white/90 backdrop-blur-md border border-rose-100 p-6 sm:p-9 rounded-3xl shadow-xl shadow-rose-100/30 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                {language === "bn" ? " 5 •    " : "Step 5 • Budget & Pricing Preference"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {language === "bn" ? "your   ?" : "What is your preferred budget range?"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {language === "bn"
                  ? "We your         ।"
                  : "We'll prioritize the best performing authentic products matching your preferred budget."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {[
                {
                  id: "budget",
                  labelBn: "💚   -",
                  labelEn: "Essential & Budget Care",
                  priceRange: "৳1,200 – ৳2,000 / Products",
                  descBn: "   items Casual Wear",
                  descEn: "High-value daily essentials",
                },
                {
                  id: "mid",
                  labelBn: "💎    ",
                  labelEn: "Standard & Popular Care",
                  priceRange: "৳1,500 – ৳3,500 / Products",
                  descBn: "Popular    Brand",
                  descEn: "Top-selling Korean & UK products",
                },
                {
                  id: "luxury",
                  labelBn: "👑    ",
                  labelEn: "Premium & Luxury Routine",
                  priceRange: "৳2,500+ / Products",
                  descBn: "      ",
                  descEn: "Luxury textures and concentrated formulas",
                },
              ].map((opt) => {
                const isSelected = budgetRange === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBudgetRange(opt.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 shadow-md shadow-rose-100"
                        : "border-gray-200/80 bg-white hover:border-rose-200 hover:bg-rose-50/20"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                          {language === "bn" ? opt.labelBn : opt.labelEn}
                        </span>
                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="inline-block font-black text-rose-600 text-xs">
                        {opt.priceRange}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        {language === "bn" ? opt.descBn : opt.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="rounded-xl border-gray-300 text-gray-700 font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === "bn" ? "" : "Back"}</span>
              </Button>
              <Button
                onClick={handleStartAnalysis}
                className="bg-linear-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black rounded-xl px-7 py-3 shadow-lg shadow-rose-200 flex items-center gap-2.5 text-sm sm:text-base animate-pulse"
              >
                <Sparkles className="h-4 w-4" />
                <span>{language === "bn" ? "items  Products   " : "Match My Beauty Routine"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: RESULTS VIEW */}
        {currentStep === 5 && (
          <div>
            {loadingResults ? (
              <div className="bg-white/90 backdrop-blur-md border border-rose-100 rounded-3xl p-12 text-center space-y-4 shadow-xl shadow-rose-100/30">
                <Loader2 className="h-12 w-12 text-rose-500 animate-spin mx-auto" />
                <h3 className="text-xl font-black text-gray-900">
                  {language === "bn" ? "your items items  ..." : "Curating Your Beauty Routine..."}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                  {language === "bn"
                    ? "your Cotton  and desired Category   Authentic   ।"
                    : "Matching authentic formulas and verified products from our catalog."}
                </p>
              </div>
            ) : routineResult ? (
              <div className="space-y-8 animate-in fade-in">
                {/* Result Header Hero Banner */}
                <div className="bg-linear-to-br from-slate-900 via-rose-950 to-slate-900 text-white p-6 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
                  <div className="relative z-10 space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      {language === "bn" ? " items items" : "Personalized Beauty Regimen"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {routineResult.routineTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {routineResult.routineSubtitle}
                    </p>

                    {/* Summary Chips */}
                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-gray-200 font-medium">
                        <strong>{language === "bn" ? " :00:" : "Skin Type:"}</strong> {routineResult.skinType}
                      </span>
                      {routineResult.concernsSummary && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-gray-200 font-medium">
                          <strong>{language === "bn" ? ":00:" : "Focus:"}</strong> {routineResult.concernsSummary}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/30 text-rose-200 font-bold">
                        {language === "bn" ? `${toBn(activeProducts.length)} items Products ` : `${activeProducts.length} Product Steps`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Routine Product Cards List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-rose-600" />
                      {language === "bn" ? "   Products" : "Your Step-by-Step Regimen"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {language === "bn" ? "  Enter" : "Retake Quiz"}
                    </button>
                  </div>

                  {activeProducts.map((prod, idx) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-4 sm:p-6 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
                    >
                      {/* Left info */}
                      <div className="flex items-start gap-4 flex-1">
                        <Link href={`/products/${prod.slug}`} className="shrink-0 group">
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-2 relative">
                            <img
                              src={prod.image_url || "/product_placeholder.svg"}
                              alt={prod.name}
                              className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 left-1 bg-slate-900 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center shadow-xs">
                              {idx + 1}
                            </div>
                          </div>
                        </Link>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] sm:text-xs font-bold border border-rose-100">
                              {prod.step_label}
                            </span>
                            {prod.brand_name && (
                              <span className="text-[11px] font-bold text-gray-500">
                                {prod.brand_name}
                              </span>
                            )}
                            {prod.country && (
                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                <Globe2 className="h-3 w-3" />
                                {prod.country}
                              </span>
                            )}
                          </div>

                          <Link href={`/products/${prod.slug}`}>
                            <h4 className="font-extrabold text-sm sm:text-base text-gray-900 hover:text-rose-600 transition-colors line-clamp-1">
                              {prod.name}
                            </h4>
                          </Link>

                          <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {prod.step_description}
                          </p>

                          {/* Match reasons pills */}
                          {prod.match_reasons && prod.match_reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {prod.match_reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                                >
                                  ✓ {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                        <div className="text-left sm:text-right">
                          <div className="text-base sm:text-lg font-black text-gray-900">
                            {formatPriceBn(prod.sale_price || prod.regular_price)}
                          </div>
                          {prod.sale_price && prod.sale_price < prod.regular_price && (
                            <div className="text-xs text-gray-400 line-through">
                              {formatPriceBn(prod.regular_price)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Swap button if alternatives exist */}
                          {prod.alternatives && prod.alternatives.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSwapModalStep(prod.step_key)}
                              className="rounded-xl text-[11px] font-bold border-gray-200 text-gray-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5 h-9"
                            >
                              <Repeat className="h-3 w-3" />
                              <span>{language === "bn" ? " View" : "Swap"}</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleAddSingleToCart(prod)}
                            className="rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 h-9 shadow-xs"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>{language === "bn" ? "" : "Add"}</span>
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleRemoveStep(prod.step_key)}
                            title={language === "bn" ? " items items from  Enter" : "Remove step"}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Checkout & Full Routine Card */}
                {activeProducts.length > 0 && (
                  <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-xl shadow-rose-100/50 space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                          {language === "bn" ? " items Total Price" : "Total Routine Investment"}
                        </span>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-2xl sm:text-3xl font-black text-gray-900">
                            {formatPriceBn(calculateTotalPrice())}
                          </span>
                          {calculateRegularTotal() > calculateTotalPrice() && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPriceBn(calculateRegularTotal())}
                            </span>
                          )}
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {language === "bn" ? "100% items Products" : "100% Guaranteed Authentic"}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-500 pt-1">
                          {language === "bn"
                            ? `${toBn(activeProducts.length)} items  Products  Complete  `
                            : `Complete daily regimen covering all ${activeProducts.length} customized steps`}
                        </p>
                      </div>

                      <Button
                        onClick={handleAddAllToCart}
                        disabled={routineAdded}
                        className="w-full sm:w-auto bg-linear-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black rounded-2xl px-8 py-3.5 shadow-xl shadow-rose-200 text-sm sm:text-base flex items-center justify-center gap-2.5"
                      >
                        {routineAdded ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-white" />
                            <span>{language === "bn" ? " Products  added successfully!" : "Added to Cart!"}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-5 w-5" />
                            <span>
                              {language === "bn" ? "Complete items  Add to Cart" : "Add Full Routine to Cart"}
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* SWAP ALTERNATIVE PRODUCT MODAL */}
      {swapModalStep && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-rose-600" />
                {language === "bn" ? " Products  " : "Choose Alternative Formula"}
              </h4>
              <button
                type="button"
                onClick={() => setSwapModalStep(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activeProducts
                .find((p) => p.step_key === swapModalStep)
                ?.alternatives?.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3.5 rounded-2xl border border-gray-200 hover:border-rose-400 hover:bg-rose-50/20 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={alt.image_url || "/product_placeholder.svg"}
                        alt={alt.name}
                        className="h-14 w-14 object-contain rounded-xl bg-gray-50 border p-1"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 block">
                          {alt.brand_name || "Authentic Brand"}
                        </span>
                        <h5 className="text-xs font-bold text-gray-900 line-clamp-1">{alt.name}</h5>
                        <div className="text-xs font-black text-rose-600">
                          {formatPriceBn(alt.sale_price || alt.regular_price)}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSwapProduct(swapModalStep, alt)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-8 px-3.5"
                    >
                      {language === "bn" ? " " : "Select"}
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
