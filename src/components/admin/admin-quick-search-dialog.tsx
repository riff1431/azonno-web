"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, CornerDownLeft, Truck } from "lucide-react";
import { adminNavItems } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAdminLang } from "@/lib/admin-lang-context";

interface AdminQuickSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminQuickSearchDialog({ isOpen, onClose }: AdminQuickSearchDialogProps) {
  const router = useRouter();
  const { t } = useAdminLang();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all navigable items
  const allNavItems = React.useMemo(() => {
    const list: { title: string; parent?: string; href: string }[] = [];
    for (const item of adminNavItems) {
      if ("children" in item && item.children) {
        for (const child of item.children) {
          list.push({ title: child.title, parent: item.title, href: child.href });
        }
      } else if ("href" in item && item.href) {
        list.push({ title: item.title, href: item.href });
      }
    }
    return list;
  }, []);

  const filteredItems = React.useMemo(() => {
    const list: { title: string; parent?: string; href: string; isBDCourier?: boolean }[] = [];
    const cleanDigits = query.replace(/\D/g, "");
    if (cleanDigits.length >= 5) {
      list.push({
        title: `Check BDCourier Multi-Courier Records for "${cleanDigits}"`,
        parent: "BDCourier Live Hub",
        href: `/admin/orders/fraud?phone=${cleanDigits}&tab=lookup`,
        isBDCourier: true,
      });
    }

    if (!query.trim()) return allNavItems.slice(0, 8);
    const q = query.toLowerCase();
    const matches = allNavItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.parent && item.parent.toLowerCase().includes(q)) ||
        item.href.toLowerCase().includes(q)
    ).slice(0, 10);

    return [...list, ...matches];
  }, [allNavItems, query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        onClose();
        router.push(filteredItems[selectedIndex].href);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-16 sm:p-4 sm:pt-28 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 bg-gray-50/50 shrink-0">
          <Search className="h-5 w-5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t("search_input_placeholder")}
            className="w-full bg-transparent text-sm text-text placeholder:text-text-muted outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-text-muted hover:text-text p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-text-muted border border-border hover:bg-surface-secondary shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 flex-1 max-h-80">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              {t("search_empty")} &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                    selectedIndex === idx
                      ? "bg-primary-50 text-primary-900 font-medium"
                      : "text-text hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {(item as any).isBDCourier ? (
                      <span className="p-1 rounded-lg bg-violet-100 text-violet-700 shrink-0">
                        <Truck className="h-4 w-4" />
                      </span>
                    ) : null}
                    {item.parent && (
                      <span className="text-xs text-text-muted font-normal shrink-0">
                        {item.parent} /
                      </span>
                    )}
                    <span className={cn("truncate", (item as any).isBDCourier && "font-bold text-violet-900")}>
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                    <span className="hidden sm:inline font-mono text-[11px] text-text-muted/70">{item.href}</span>
                    {selectedIndex === idx && <CornerDownLeft className="h-3.5 w-3.5 text-primary-600" />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-border bg-gray-50 px-4 py-2 text-[11px] text-text-muted shrink-0">
          <span>↑↓ {t("press_arrows")}</span>
          <span>↵ {t("press_enter")}</span>
        </div>
      </div>
    </div>
  );
}
