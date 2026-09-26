"use client";

import { useLanguage } from "@/context/language-context";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "header-top" | "header-main" | "homepage-pill" | "mobile";
  className?: string;
}

export function LanguageSwitcher({
  variant = "header-top",
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage, isSwitcherEnabled } = useLanguage();

  // If language switcher is disabled by admin, hide completely
  if (!isSwitcherEnabled) {
    return null;
  }

  if (variant === "header-top") {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full bg-white/10 p-0.5 border border-white/20 text-xs",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setLanguage("bn")}
          className={cn(
            "rounded-full px-2.5 py-0.5 font-bold transition-all text-[11px]",
            language === "bn"
              ? "bg-[#1D6474] text-white shadow-xs"
              : "text-zinc-300 hover:text-white"
          )}
          aria-label="EnglishSwitch to English"
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "rounded-full px-2.5 py-0.5 font-bold transition-all text-[11px]",
            language === "en"
              ? "bg-[#1D6474] text-white shadow-xs"
              : "text-zinc-300 hover:text-white"
          )}
          aria-label="Switch to English"
        >
          EN
        </button>
      </div>
    );
  }

  if (variant === "homepage-pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 shadow-xs text-xs font-semibold",
          className
        )}
      >
        <Globe className="h-3.5 w-3.5 text-[#1D6474] shrink-0" />
        <span className="text-gray-500 text-[11px] hidden sm:inline">Language:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLanguage("bn")}
            className={cn(
              "rounded-full px-2.5 py-0.5 transition-all text-xs font-bold",
              language === "bn"
                ? "bg-[#1D6474] text-white shadow-xs"
                : "text-gray-700 hover:text-[#1D6474] hover:bg-teal-50/60"
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={cn(
              "rounded-full px-2.5 py-0.5 transition-all text-xs font-bold",
              language === "en"
                ? "bg-[#1D6474] text-white shadow-xs"
                : "text-gray-700 hover:text-[#1D6474] hover:bg-teal-50/60"
            )}
          >
            English
          </button>
        </div>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl bg-surface-secondary border border-border p-2 text-xs",
          className
        )}
      >
        <div className="flex items-center gap-2 font-medium text-text">
          <Globe className="h-4 w-4 text-[#1D6474]" />
          <span>Language / Language</span>
        </div>
        <div className="flex items-center rounded-lg bg-white p-0.5 border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setLanguage("bn")}
            className={cn(
              "rounded-md px-3 py-1 font-bold transition-all text-xs",
              language === "bn"
                ? "bg-[#1D6474] text-white shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={cn(
              "rounded-md px-3 py-1 font-bold transition-all text-xs",
              language === "en"
                ? "bg-[#1D6474] text-white shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            EN
          </button>
        </div>
      </div>
    );
  }

  // Default header-main
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-gray-100 p-1 border border-gray-200 text-xs",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLanguage("bn")}
        className={cn(
          "rounded-full px-2.5 py-1 font-bold transition-all text-xs",
          language === "bn"
            ? "bg-[#1D6474] text-white shadow-xs"
            : "text-gray-600 hover:text-black"
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={cn(
          "rounded-full px-2.5 py-1 font-bold transition-all text-xs",
          language === "en"
            ? "bg-[#1D6474] text-white shadow-xs"
            : "text-gray-600 hover:text-black"
        )}
      >
        English
      </button>
    </div>
  );
}
