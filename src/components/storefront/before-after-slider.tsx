"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeftRight, CheckCircle2, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface BeforeAfterSliderProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  imageFit?: "cover" | "contain" | "top";
  aspectRatio?: "4/3" | "16/10" | "1/1" | "auto";
  eyebrowBadge?: string;
  title?: string;
  subtitle?: string;
  heading?: string;
  description?: string;
  metric1?: string;
  metric2?: string;
  metric3?: string;
  buttonText?: string;
  buttonHref?: string;
}

export function BeforeAfterSlider({
  beforeImage = "/banners/before_skin.jpg",
  afterImage = "/banners/after_skin.jpg",
  beforeLabel,
  afterLabel,
  imageFit = "top",
  aspectRatio = "4/3",
  eyebrowBadge,
  title,
  subtitle,
  heading,
  description,
  metric1,
  metric2,
  metric3,
  buttonText,
  buttonHref = "/products?category=skin-care",
}: BeforeAfterSliderProps) {
  const { language } = useLanguage();

  const isBn = language === "bn";

  const displayEyebrow = eyebrowBadge || (isBn ? "সহজ স্কিনকেয়ার রুটিন" : "EVERYDAY ROUTINE");
  const displayTitle = title || (isBn ? "টেক্সচার ও ফিনিশ" : "TEXTURE & FINISH");
  const displaySubtitle = subtitle || (isBn ? "সারাদিনের সতেজ ও মোলায়েম অনুভূতির জন্য প্রস্তুত" : "Designed for a fresh, comfortable feel throughout the day");
  const displayHeading = heading || (isBn ? "৩ ধাপের সহজ স্কিনকেয়ার রুটিন" : "Simple 3-Step Daily Routine");
  const displayDescription = description || (isBn ? "হালকা ও আরামদায়ক পণ্য যা ত্বককে রাখে নরম, সতেজ ও ময়েশ্চারাইজড।" : "Lightweight products designed to leave skin feeling fresh, soft, and comfortable.");
  const displayMetric1 = metric1 || (isBn ? "ত্বকে আনে সতেজ ও শান্ত অনুভূতি" : "Leaves skin feeling calm and refreshed");
  const displayMetric2 = metric2 || (isBn ? "হালকা ও তেল চিটচিটে ভাবহীন টেক্সচার" : "Lightweight, non-greasy texture");
  const displayMetric3 = metric3 || (isBn ? "১০০% আসল ও অরিজিনাল পণ্য" : "100% Authentic direct imports");
  const displayButtonText = buttonText || (isBn ? "রুটিনটি দেখুন" : "EXPLORE ROUTINE");
  const displayBeforeLabel = beforeLabel || (isBn ? "আগে • সাধারণ ত্বক" : "BEFORE • CLEANSED SKIN");
  const displayAfterLabel = afterLabel || (isBn ? "পরে • ময়েশ্চারাইজড ফিনিশ" : "AFTER • HYDRATED FINISH");

  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percent);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  // Determine aspect ratio class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case "1/1":
        return "aspect-square";
      case "16/10":
        return "aspect-[16/10] sm:aspect-[16/9]";
      case "auto":
        return "min-h-[300px] sm:min-h-[400px] aspect-auto";
      case "4/3":
      default:
        return "aspect-[4/3] sm:aspect-[4/3] md:aspect-[14/11]";
    }
  };

  // Determine image object fit and alignment class
  const getImageFitClass = () => {
    switch (imageFit) {
      case "contain":
        return "object-contain bg-zinc-950/5";
      case "cover":
        return "object-cover object-center";
      case "top":
      default:
        return "object-cover object-top";
    }
  };

  const aspectClass = getAspectClass();
  const fitClass = getImageFitClass();

  return (
    <section className="container-main space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-gray-200 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[#e91e63] text-sm font-extrabold uppercase tracking-wide mb-0.5">
            <Sparkles className="h-4 w-4" />
            <span>{isBn ? "দৈনন্দিন স্কিনকেয়ার ফিনিশ" : "Daily Skincare Finish"}</span>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wide text-gray-900">
            {displayTitle}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">{displaySubtitle}</p>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500">
          <ArrowLeftRight className="h-4 w-4" />
          <span>{isBn ? "টেক্সচার দেখতে স্লাইডারটি টানুন" : "Drag slider to see finish"}</span>
        </span>
      </div>

      {/* Main Interactive Split Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-7 shadow-sm">
        {/* Left 7 Cols: Interactive Comparison Container */}
        <div className="lg:col-span-7">
          <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleMove(e.touches[0].clientX);
            }}
            className={`relative ${aspectClass} w-full select-none overflow-hidden rounded-2xl cursor-ew-resize shadow-md touch-none focus:outline-none focus:ring-2 focus:ring-[#e91e63] bg-zinc-100`}
            aria-label="Before and After Image Comparison Slider"
            role="slider"
            aria-valuenow={sliderPos}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* 1. After Image (Full Background Layer) */}
            <img
              src={afterImage}
              alt={isBn ? "হালকা ময়েশ্চারাইজড ফিনিশ" : "Hydrated Skin Finish"}
              className={`absolute inset-0 h-full w-full ${fitClass}`}
              draggable={false}
            />

            {/* After Top-Right Pill Badge */}
            <div className="absolute right-3 top-3 z-10 pointer-events-none">
              <span className="rounded-full bg-emerald-600/95 backdrop-blur-xs px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase text-white shadow-md">
                {displayAfterLabel}
              </span>
            </div>

            {/* 2. Before Image (Clipped Overlay Layer using exact zero-distortion clipPath) */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
              }}
            >
              <img
                src={beforeImage}
                alt={isBn ? "রুটিনের পূর্বে" : "Before Routine"}
                className={`absolute inset-0 h-full w-full ${fitClass} filter grayscale-20 contrast-95`}
                draggable={false}
              />
            </div>

            {/* Before Top-Left Pill Badge */}
            <div
              className="absolute left-3 top-3 z-10 pointer-events-none"
              style={{
                opacity: sliderPos < 15 ? sliderPos / 15 : 1,
              }}
            >
              <span className="rounded-full bg-gray-900/90 backdrop-blur-xs px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase text-white shadow-md">
                {displayBeforeLabel}
              </span>
            </div>

            {/* 3. Divider Line & Glowing Handle */}
            <div
              className="absolute inset-y-0 z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Vertical White Line */}
              <div className="absolute inset-y-0 left-[-1.5px] w-0.75 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" />

              {/* Center Floating Handle Thumb */}
              <div className="absolute top-1/2 -left-5 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#e91e63] shadow-xl border-2 border-[#e91e63] transition-transform duration-100 hover:scale-110 active:scale-95">
                <ArrowLeftRight className="h-4 w-4 stroke-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Skincare Routine Explanation & Verified Callout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            {displayEyebrow && (
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#e91e63] block">
                {displayEyebrow}
              </span>
            )}
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-snug sm:leading-tight">
              {displayHeading}
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-normal">
              {displayDescription}
            </p>
          </div>

          {/* 3 Metric Points */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            {displayMetric1 && (
              <div className="flex items-start gap-2.5 text-sm sm:text-base font-semibold text-gray-800 leading-snug">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{displayMetric1}</span>
              </div>
            )}
            {displayMetric2 && (
              <div className="flex items-start gap-2.5 text-sm sm:text-base font-semibold text-gray-800 leading-snug">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{displayMetric2}</span>
              </div>
            )}
            {displayMetric3 && (
              <div className="flex items-start gap-2.5 text-sm sm:text-base font-semibold text-gray-800 leading-snug">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{displayMetric3}</span>
              </div>
            )}
          </div>

          {/* Routine CTA Button */}
          <div className="pt-2">
            <Link
              href={buttonHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e91e63] px-6 py-3.5 text-sm sm:text-base font-black uppercase text-white shadow-md transition-all duration-200 hover:bg-sg-pink-hover hover:shadow-lg active:scale-98"
            >
              <span>{displayButtonText}</span>
              <ChevronRight className="h-4 w-4 stroke-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
