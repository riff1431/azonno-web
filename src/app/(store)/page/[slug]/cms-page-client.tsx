"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { useLanguage } from "@/context/language-context";

interface CmsPageClientProps {
  slug: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function CmsPageClient({
  title,
  subtitle,
  lastUpdated,
  children,
}: CmsPageClientProps) {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-[70vh] bg-surface-secondary/40 py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-text-muted hover:text-text mb-2 sm:mb-4">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {language === "bn" ? "হোমে ফিরে যান" : "Back to Home"}
          </Button>
        </Link>

        {/* Page Header */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-card space-y-3 sm:space-y-4">
          <span className="inline-block rounded-full bg-primary-50 text-primary-700 px-3.5 py-1 text-xs sm:text-sm font-bold uppercase border border-primary-200">
            {language === "bn" ? "অফিসিয়াল পলিসি ও তথ্য" : "Official Policy & Information"}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-text tracking-tight leading-snug">{title}</h1>
          <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed">{subtitle}</p>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-text-muted pt-2 border-t border-border/60">
            <Clock className="h-4 w-4" />
            <span>{language === "bn" ? "সর্বশেষ সংস্করণ: " : "Last reviewed: "}{lastUpdated}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}
