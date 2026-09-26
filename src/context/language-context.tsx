"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  type Language,
  translations,
  toBengaliNumber,
} from "@/lib/i18n/translations";
import { formatPrice } from "@/lib/utils";

export interface LocalizationConfig {
  default_language: "bn" | "en";
  enable_language_switcher: boolean;
  show_homepage_language_bar: boolean;
}

export const DEFAULT_LOCALIZATION_CONFIG: LocalizationConfig = {
  default_language: "en",
  enable_language_switcher: false,
  show_homepage_language_bar: false,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isSwitcherEnabled: boolean;
  showHomepageBar: boolean;
  defaultLanguage: Language;
  t: <N extends keyof (typeof translations)["en"]>(
    namespace: N,
    key: keyof (typeof translations)["en"][N]
  ) => string;
  toBn: (val: string | number) => string;
  formatPriceBn: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode;
  initialConfig?: LocalizationConfig;
}) {
  const config = initialConfig || DEFAULT_LOCALIZATION_CONFIG;
  const configuredDefault = config.default_language || "en";
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguageState("en");
    setMounted(true);
    try {
      localStorage.setItem("ecom_lang", "en");
    } catch {}
  }, []);

  // Synchronize document attributes and font classes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = "en";
      document.documentElement.classList.remove("lang-bn");
      document.documentElement.classList.add("lang-en");
    }
  }, []);

  const setLanguage = useCallback((_lang: Language) => {
    // English locked
  }, []);

  const toggleLanguage = useCallback(() => {
    // English locked
  }, []);

  const t = useCallback(
    <N extends keyof (typeof translations)["en"]>(
      namespace: N,
      key: keyof (typeof translations)["en"][N]
    ): string => {
      const currentDict = translations.en;
      const section = currentDict[namespace] as Record<string, string>;
      if (section && typeof section[key as string] === "string") {
        return section[key as string];
      }
      return String(key);
    },
    []
  );

  const toBn = useCallback(
    (val: string | number) => {
      return String(val);
    },
    []
  );

  const formatPriceBn = useCallback(
    (amount: number) => {
      return formatPrice(amount);
    },
    []
  );

  return (
    <LanguageContext.Provider
      value={{
        language: "en",
        setLanguage,
        toggleLanguage,
        isSwitcherEnabled: false,
        showHomepageBar: false,
        defaultLanguage: "en",
        t,
        toBn,
        formatPriceBn,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider during SSR/hydration
    return {
      language: "bn" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      isSwitcherEnabled: true,
      showHomepageBar: true,
      defaultLanguage: "bn" as Language,
      t: <N extends keyof (typeof translations)["bn"]>(
        namespace: N,
        key: keyof (typeof translations)["bn"][N]
      ): string => {
        const section = translations.bn[namespace] as Record<string, string>;
        return section?.[key as string] || String(key);
      },
      toBn: (val: string | number) => toBengaliNumber(val),
      formatPriceBn: (amount: number) => `৳${toBengaliNumber(amount.toLocaleString("en-IN"))}`,
    };
  }
  return context;
}
