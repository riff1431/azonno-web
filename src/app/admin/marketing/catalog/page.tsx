"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Rss,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Video,
  Globe,
  FileCode,
  FileSpreadsheet,
  Download,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";

export default function AdminCatalogFeedsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  const feeds = [
    {
      id: "meta",
      name: "Meta Dynamic Product Catalog (Facebook & Instagram Shop)",
      badge: "Meta Commerce",
      icon: Sparkles,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200",
      xmlUrl: `${origin}/api/feed/meta`,
      csvUrl: `${origin}/api/feed/meta?format=csv`,
      supportedFormats: "RSS 2.0 XML & RFC-4180 CSV",
      status: "Active & Auto-Syncing",
      description:
        "Official Meta Commerce Manager feed format. Powers Advantage+ dynamic catalog ads, multi-product carousel retargeting, and Instagram Shop product tagging.",
      requiredFields: [
        "id (SKU)",
        "title",
        "description",
        "availability (in stock)",
        "condition (new)",
        "price (1200.00 BDT)",
        "sale_price",
        "link",
        "image_link",
        "additional_image_link",
        "brand",
        "google_product_category",
        "fb_product_category",
        "product_type",
        "custom_label_0 (Origin)",
        "custom_label_1 (Featured)",
      ],
    },
    {
      id: "tiktok",
      name: "TikTok Product Catalog Feed (TikTok Shop & Ads Manager)",
      badge: "TikTok Ads",
      icon: Video,
      iconColor: "text-pink-600 bg-pink-50 border-pink-200",
      xmlUrl: `${origin}/api/feed/tiktok`,
      csvUrl: `${origin}/api/feed/tiktok?format=csv`,
      supportedFormats: "RSS 2.0 XML (TikTok Spec) & CSV",
      status: "Active & Auto-Syncing",
      description:
        "Official TikTok Catalog Manager feed format. Powers Video Shopping Ads, Dynamic Showcase Ads (DSA), and product link anchors in TikTok short-form videos.",
      requiredFields: [
        "sku_id",
        "title",
        "description",
        "availability (in_stock)",
        "condition (new)",
        "price (1200.00 BDT)",
        "sale_price",
        "link",
        "image_link",
        "brand",
        "google_product_category",
        "product_type",
        "custom_label_0 (TikTok Showcase)",
        "custom_label_1 (Origin)",
      ],
    },
    {
      id: "google",
      name: "Google Merchant Center Product Feed",
      badge: "Google Merchant",
      icon: Globe,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      xmlUrl: `${origin}/api/feed/google`,
      csvUrl: `${origin}/api/feed/google?format=csv`,
      supportedFormats: "Google Merchant XML (RSS 2.0) & TSV/CSV",
      status: "Active & Auto-Syncing",
      description:
        "Official Google Merchant Center feed format. Powers Google Shopping Ads, Performance Max (PMax) campaigns, and Free Organic Product Listings on Google Search.",
      requiredFields: [
        "g:id (SKU)",
        "g:title",
        "g:description",
        "g:link",
        "g:image_link",
        "g:additional_image_link",
        "g:availability (in stock)",
        "g:price (1200.00 BDT)",
        "g:sale_price",
        "g:brand",
        "g:condition (new)",
        "g:google_product_category",
        "g:product_type",
        "g:identifier_exists (no)",
        "g:mpn (SKU)",
        "g:custom_label_0 (Origin)",
        "g:custom_label_1 (Featured)",
      ],
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-border pb-4 bg-white p-6 rounded-3xl shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
            Omnichannel Data Feeds
          </span>
        </div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Rss className="h-6 w-6 text-primary-600" />
          Omnichannel Product Catalog Feeds
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Real-time auto-syncing XML and CSV feeds strictly formatted according to the latest official documentation of Meta (Facebook/Instagram), TikTok Ads, and Google Merchant Center.
        </p>
      </div>

      {/* Localhost Dynamic Domain Notice */}
      {origin.includes("localhost") || origin.includes("127.0.0.1") ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs shadow-xs">
          <Globe className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Dynamic Domain Auto-Detection Active</p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              You are currently accessing this panel from <strong>localhost:3000</strong>. These feed URLs are 100% dynamic and auto-generated based on your active hostname. When accessed on your live production domain (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">https://yourbrand.com</code>), all XML & CSV feed URLs will automatically switch to your live domain.
            </p>
          </div>
        </div>
      ) : null}

      {/* Feed Cards */}
      <div className="space-y-6">
        {feeds.map((feed) => {
          const Icon = feed.icon;
          return (
            <div
              key={feed.id}
              className="rounded-3xl border border-border bg-white p-6 shadow-card space-y-5 text-xs"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${feed.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text">{feed.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-secondary text-text-secondary border border-border">
                        {feed.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted">Supported: {feed.supportedFormats}</span>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-0.5 text-[10px] font-bold border border-emerald-200 uppercase w-fit">
                  {feed.status}
                </span>
              </div>

              <p className="text-text-secondary leading-relaxed">{feed.description}</p>

              {/* URL Rows: XML and CSV */}
              <div className="space-y-3 pt-1">
                {/* XML Feed Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-[#e91e63]" />
                      Primary XML Feed URL (Auto-Sync)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Recommended for scheduled daily fetch</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-secondary/70 p-2 rounded-xl border border-border">
                    <span className="font-mono text-[11px] text-text-secondary truncate flex-1 select-all">
                      {feed.xmlUrl}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(`${feed.id}-xml`, feed.xmlUrl)}
                      className="text-xs shrink-0 font-bold"
                    >
                      {copiedKey === `${feed.id}-xml` ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy XML URL
                        </>
                      )}
                    </Button>
                    <Link href={feed.xmlUrl} target="_blank">
                      <Button variant="outline" size="sm" className="text-xs shrink-0 font-bold">
                        <ExternalLink className="h-3.5 w-3.5 mr-1 text-primary-600" />
                        View XML
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* CSV Feed Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      CSV Catalog Feed URL / Direct Download
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">RFC-4180 standard comma-separated format</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-secondary/70 p-2 rounded-xl border border-border">
                    <span className="font-mono text-[11px] text-text-secondary truncate flex-1 select-all">
                      {feed.csvUrl}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(`${feed.id}-csv`, feed.csvUrl)}
                      className="text-xs shrink-0 font-bold"
                    >
                      {copiedKey === `${feed.id}-csv` ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy CSV URL
                        </>
                      )}
                    </Button>
                    <Link href={feed.csvUrl} target="_blank" download>
                      <Button variant="outline" size="sm" className="text-xs shrink-0 font-bold">
                        <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Download CSV
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Supported Schema Attributes */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Included Data &amp; Schema Parameters ({feed.requiredFields.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {feed.requiredFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg text-[10px] font-mono"
                    >
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
