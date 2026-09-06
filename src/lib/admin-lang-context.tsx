"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type AdminLang, type TranslationKey, createTranslator } from "./admin-i18n";

const STORAGE_KEY = "ecomx_admin_lang";

interface AdminLangContextValue {
  lang: AdminLang;
  setLang: (lang: AdminLang) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const AdminLangContext = createContext<AdminLangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key as string,
});

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>("en");

  // Load persisted preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AdminLang | null;
      if (saved === "en" || saved === "bn") {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = useCallback((newLang: AdminLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string) =>
      createTranslator(lang)(key, fallback),
    [lang]
  );

  return (
    <AdminLangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </AdminLangContext.Provider>
  );
}

/** Hook: use in any admin client component */
export function useAdminLang() {
  return useContext(AdminLangContext);
}
