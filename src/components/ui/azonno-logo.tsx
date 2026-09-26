import React from "react";
import Link from "next/link";

interface AzonnoLogoProps {
  className?: string;
  variant?: "full" | "mark" | "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
  withTagline?: boolean;
}

export function AzonnoLogo({
  className = "",
  variant = "full",
  size = "md",
  withTagline = true,
}: AzonnoLogoProps) {
  const heightClasses = {
    sm: "h-7",
    md: "h-9 sm:h-10",
    lg: "h-11 sm:h-12",
    xl: "h-14 sm:h-16",
  };

  const isDark = variant === "dark";

  if (variant === "mark") {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/images/azonno-logo-mark.png"
          alt="Azonno Mark"
          className={`${heightClasses[size]} w-auto object-contain`}
          onError={(e) => {
            // Fallback to text badge if image not ready
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <img
        src={isDark ? "/images/azonno-logo-dark.png" : "/images/azonno-logo.png"}
        alt="Azonno — Everything within Reach"
        className={`${heightClasses[size]} w-auto max-w-[220px] object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
        onError={(e) => {
          // Fallback
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
          e.currentTarget.style.display = "none";
        }}
      />

      {/* Fallback Vector Emblem */}
      <div className="hidden items-center gap-1.5">
        <div className="relative flex items-center justify-center bg-[#1D6474] text-white rounded-[14px] font-black w-9 h-9 sm:w-10 sm:h-10 shadow-sm shadow-teal-900/20">
          <span className="text-2xl sm:text-3xl leading-none -mt-1 font-sans font-extrabold tracking-tighter">a</span>
        </div>
        <div className="flex flex-col justify-center">
          <span
            className={`font-sans font-black text-2xl sm:text-3xl tracking-tight leading-none ${
              isDark ? "text-white" : "text-[#0F172A]"
            }`}
          >
            zonno
          </span>
          {withTagline && (
            <span className="text-[10px] sm:text-[11px] font-serif italic text-[#1D6474] font-medium tracking-wide -mt-0.5">
              Everything within Reach
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AzonnoHeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 focus:outline-none group" aria-label="Azonno Homepage">
      <img
        src="/images/azonno-logo.png"
        alt="Azonno"
        className="h-8 sm:h-9 md:h-10 w-auto max-w-[190px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]"
        onError={(e) => {
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="hidden items-center gap-2">
        <div className="relative flex items-center justify-center bg-[#1D6474] text-white rounded-xl font-black w-8 h-8 sm:w-9 sm:h-9 shadow-md shadow-teal-950/20">
          <span className="text-2xl leading-none -mt-0.5 font-sans font-black">a</span>
        </div>
        <div className="flex flex-col">
          <span className="font-sans font-black text-xl sm:text-2xl text-[#0F172A] tracking-tight leading-none">
            zonno
          </span>
          <span className="text-[9px] sm:text-[10px] font-serif italic text-[#1D6474] font-semibold tracking-wide">
            Everything within Reach
          </span>
        </div>
      </div>
    </Link>
  );
}

export function AzonnoLogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/images/azonno-logo-mark.png"
        alt="Azonno"
        className="h-full w-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
