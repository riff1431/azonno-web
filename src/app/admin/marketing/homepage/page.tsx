"use client";

import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Flame,
  Tag,
  Type,
  Layout,
  ExternalLink,
  Sparkles,
  Loader2,
  Layers,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Search,
  ArrowLeftRight,
  UserCheck,
  FileText,
  Banknote,
  HelpCircle,
  PanelBottom,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { HomepageImageField } from "@/components/admin/marketing/homepage-image-field";
import {
  getHomepageConfig,
  saveHomepageConfig,
} from "@/features/marketing/homepage-actions";

import {
  getCheckoutSettings,
  saveCheckoutSettings,
} from "@/features/settings/actions";
import {
  type HomepageFullConfig,
  type ImageBannerItem,
  DEFAULT_HOMEPAGE_CONFIG,
} from "@/features/marketing/homepage-types";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";
import { HomepageSeoFaqEditor } from "@/components/admin/marketing/homepage-seo-faq-editor";
import { HomepageFooterEditor } from "@/components/admin/marketing/homepage-footer-editor";

export default function AdminHomepageManagerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "deals"
    | "topBrands"
    | "hero"
    | "strip"
    | "limitedOffers"
    | "categories"
    | "beforeAfter"
    | "trending"
    | "trust"
    | "seoFaq"
    | "footer"
    | "campaignPills"
    | "header"
    | "customerRules"
  >("deals");

  const [config, setConfig] = useState<HomepageFullConfig | null>(null);
  const [checkoutSettings, setCheckoutSettings] = useState<any>({
    guest_checkout_enabled: true,
    allow_customer_registration: true,
    require_phone: true,
    require_email: false,
    order_notes_enabled: true,
    show_location_hierarchy: true,
    min_order_amount: 0,
    cod_max_amount: 20000,
  });

  useEffect(() => {
    Promise.all([getHomepageConfig(), getCheckoutSettings()]).then(([data, checkoutData]) => {
      const merged: HomepageFullConfig = {
        ...DEFAULT_HOMEPAGE_CONFIG,
        ...(data || {}),
        headerConfig: {
          ...DEFAULT_HOMEPAGE_CONFIG.headerConfig,
          ...(data?.headerConfig || {}),
        },
        faqSection: {
          ...DEFAULT_HOMEPAGE_CONFIG.faqSection!,
          ...(data?.faqSection || {}),
          faqs: data?.faqSection?.faqs?.length ? data.faqSection.faqs : DEFAULT_HOMEPAGE_CONFIG.faqSection!.faqs,
        },
        footerConfig: {
          ...DEFAULT_HOMEPAGE_CONFIG.footerConfig!,
          ...(data?.footerConfig || {}),
          categoryLinks:
            data?.footerConfig?.categoryLinks?.length
              ? data.footerConfig.categoryLinks
              : DEFAULT_HOMEPAGE_CONFIG.footerConfig!.categoryLinks,
          customerCareLinks:
            data?.footerConfig?.customerCareLinks?.length
              ? data.footerConfig.customerCareLinks
              : DEFAULT_HOMEPAGE_CONFIG.footerConfig!.customerCareLinks,
        },
      };
      setConfig(merged);
      if (checkoutData && Object.keys(checkoutData).length > 0) {
        setCheckoutSettings({
          guest_checkout_enabled: checkoutData.guest_checkout_enabled ?? true,
          allow_customer_registration: checkoutData.allow_customer_registration ?? true,
          require_phone: checkoutData.require_phone ?? true,
          require_email: checkoutData.require_email ?? false,
          order_notes_enabled: checkoutData.order_notes_enabled ?? true,
          show_location_hierarchy: checkoutData.show_location_hierarchy !== false,
          min_order_amount: Number(checkoutData.min_order_amount || 0),
          cod_max_amount: Number(checkoutData.cod_max_amount || 20000),
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSavedSuccess(false);

    const [res, resCheck] = await Promise.all([
      saveHomepageConfig(config),
      saveCheckoutSettings(checkoutSettings),
    ]);
    setSaving(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } else {
      alert("Failed to save: " + res.message);
    }
  };

  const updateBannerList = (
    key: "heroSlides" | "dealsYouCannotMiss" | "topBrandsAndOffers",
    index: number,
    field: keyof ImageBannerItem,
    value: string
  ) => {
    if (!config) return;
    const list = [...config[key]];
    list[index] = { ...list[index], [field]: value };
    setConfig({ ...config, [key]: list });
  };

  const addBannerItem = (
    key: "heroSlides" | "dealsYouCannotMiss" | "topBrandsAndOffers"
  ) => {
    if (!config) return;
    const newItem: ImageBannerItem = {
      id: `${key}-${Date.now()}`,
      title: "New Promotional Banner",
      href: "/products?discount=true",
      image: "/banners/deal_mega_offers.jpg",
    };
    setConfig({ ...config, [key]: [...config[key], newItem] });
  };

  const removeBannerItem = (
    key: "heroSlides" | "dealsYouCannotMiss" | "topBrandsAndOffers",
    index: number
  ) => {
    if (!config) return;
    if (config[key].length <= 1) {
      alert("You must keep at least 1 banner in this section.");
      return;
    }
    const list = config[key].filter((_, i) => i !== index);
    setConfig({ ...config, [key]: list });
  };

  if (loading || !config) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D6474]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Storefront Section Control Center</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            100% real-time control over all storefront sections, banners, campaign pills, mega-menus, and trust pillars.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              <ExternalLink className="h-3.5 w-3.5 mr-1 text-[#1D6474]" />
              View Live Site
            </Button>
          </a>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-[#1D6474] hover:bg-[#164E63] text-white font-black text-xs rounded-xl shadow-md"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            {saving ? "Publishing..." : "Publish to Live Site"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>All sections published live! Changes are active immediately across mobile, tablet, and desktop.</span>
        </div>
      )}

      {/* Responsive Filter Tabs (Wrapped Pills) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
        {[
          { id: "deals", label: "Deals You Cannot Miss", icon: Flame },
          { id: "topBrands", label: "Top Brands & Offers", icon: Tag },
          { id: "hero", label: "Hero Carousel Slides", icon: ImageIcon },
          { id: "strip", label: "Pond's Strip Banner", icon: Layers },
          { id: "limitedOffers", label: "Limited Time (BOGO)", icon: Sparkles },
          { id: "categories", label: "Square Categories (10%)", icon: Layout },
          { id: "beforeAfter", label: "Before/After Beauty Tech", icon: ArrowLeftRight },
          { id: "trending", label: "Trending Products Header", icon: ShoppingBag },
          { id: "trust", label: "Trust Pillars", icon: ShieldCheck },
          { id: "seoFaq", label: "SEO Guide & FAQs", icon: HelpCircle },
          { id: "footer", label: "Footer & Contact", icon: PanelBottom },
          { id: "campaignPills", label: "Header Campaign Badges", icon: Sliders },
          { id: "header", label: "Header, Logo & Mega Menu", icon: Type },
          { id: "customerRules", label: "Customer Login & Checkout Rules", icon: UserCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-[#1D6474] text-white shadow-xs scale-102"
                  : "bg-gray-50 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. DEALS YOU CANNOT MISS */}
        {activeTab === "deals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">
                  DEALS YOU CANNOT MISS ({config.dealsYouCannotMiss?.length || 0} Banners)
                </h2>
                <p className="text-xs text-text-secondary">
                  Manage the 4 square image deal posters (2x2 on mobile, 4-column on desktop).
                </p>
              </div>
              <Button
                type="button"
                onClick={() => addBannerItem("dealsYouCannotMiss")}
                size="sm"
                variant="outline"
                className="text-xs font-bold border-[#1D6474] text-[#1D6474] hover:bg-teal-50/60"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Deal Banner
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.dealsYouCannotMiss?.map((deal, idx) => (
                <div key={deal.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-black uppercase text-[#1D6474]">Deal Card #{idx + 1}</span>
                    <button type="button" onClick={() => removeBannerItem("dealsYouCannotMiss", idx)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={deal.title}
                      onChange={(e) => updateBannerList("dealsYouCannotMiss", idx, "title", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination URL Link</label>
                    <input
                      type="text"
                      value={deal.href}
                      onChange={(e) => updateBannerList("dealsYouCannotMiss", idx, "href", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <HomepageImageField
                      label="Deal Poster Image"
                      recommendedSize="600 × 600 px"
                      aspectRatioLabel="1:1 Square"
                      value={deal.image}
                      onChange={(url) => updateBannerList("dealsYouCannotMiss", idx, "image", url)}
                      folder="deals"
                      previewHeightClass="h-12 w-12"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. TOP BRANDS & OFFERS */}
        {activeTab === "topBrands" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">
                  TOP BRANDS & OFFERS ({config.topBrandsAndOffers?.length || 0} Banners)
                </h2>
                <p className="text-xs text-text-secondary">
                  Manage brand campaign banner posters (Trimmer, Skino, Vatika, Glow, The Ordinary, Soft Skin).
                </p>
              </div>
              <Button
                type="button"
                onClick={() => addBannerItem("topBrandsAndOffers")}
                size="sm"
                variant="outline"
                className="text-xs font-bold border-[#1D6474] text-[#1D6474] hover:bg-teal-50/60"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Brand Promo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
              {config.topBrandsAndOffers?.map((brand, idx) => (
                <div key={brand.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-black uppercase text-[#1D6474]">Brand Promo #{idx + 1}</span>
                    <button type="button" onClick={() => removeBannerItem("topBrandsAndOffers", idx)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={brand.title}
                      onChange={(e) => updateBannerList("topBrandsAndOffers", idx, "title", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination URL Link</label>
                    <input
                      type="text"
                      value={brand.href}
                      onChange={(e) => updateBannerList("topBrandsAndOffers", idx, "href", e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <HomepageImageField
                      label="Promo Banner Image"
                      recommendedSize="800 × 450 px"
                      aspectRatioLabel="16:9 Banner"
                      value={brand.image}
                      onChange={(url) => updateBannerList("topBrandsAndOffers", idx, "image", url)}
                      folder="brands"
                      previewHeightClass="h-12 w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. HERO SLIDES */}
        {activeTab === "hero" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">
                  Hero Carousel Banner Slides ({config.heroSlides?.length || 0})
                </h2>
                <p className="text-xs text-text-secondary">
                  Wide banners rotating at the top of the homepage with uncropped dynamic scaling.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => addBannerItem("heroSlides")}
                size="sm"
                variant="outline"
                className="text-xs font-bold border-[#1D6474] text-[#1D6474] hover:bg-teal-50/60"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Hero Slide
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {config.heroSlides?.map((slide, idx) => (
                <div key={slide.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-black uppercase text-[#1D6474]">Hero Slide #{idx + 1}</span>
                    <button type="button" onClick={() => removeBannerItem("heroSlides", idx)} className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Slide Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => updateBannerList("heroSlides", idx, "title", e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination Link</label>
                      <input
                        type="text"
                        value={slide.href}
                        onChange={(e) => updateBannerList("heroSlides", idx, "href", e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <HomepageImageField
                        label="Hero Banner Image"
                        recommendedSize="1920 × 550 px"
                        aspectRatioLabel="Wide Landscape Banner"
                        value={slide.image}
                        onChange={(url) => updateBannerList("heroSlides", idx, "image", url)}
                        folder="hero"
                        previewHeightClass="h-12 w-32"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. STRIP BANNER */}
        {activeTab === "strip" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-text border-b border-gray-100 pb-2">
              Promotional Strip Banner (Pond&apos;s Miracle Me)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={config.stripBanner?.title || ""}
                  onChange={(e) => setConfig({ ...config, stripBanner: { ...config.stripBanner, title: e.target.value } })}
                  className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination Link</label>
                <input
                  type="text"
                  value={config.stripBanner?.href || ""}
                  onChange={(e) => setConfig({ ...config, stripBanner: { ...config.stripBanner, href: e.target.value } })}
                  className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <HomepageImageField
                  label="Promotional Strip Banner Image"
                  recommendedSize="1920 × 250 px"
                  aspectRatioLabel="Horizontal Strip Banner"
                  value={config.stripBanner?.image || ""}
                  onChange={(url) => setConfig({ ...config, stripBanner: { ...config.stripBanner, image: url } })}
                  folder="strip"
                  previewHeightClass="h-12 w-36"
                />
              </div>
            </div>
          </div>
        )}


        {/* 5. LIMITED TIME OFFERS */}
        {activeTab === "limitedOffers" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-text">LIMITED TIME OFFERS (BOGO, COMBO, OFFERS, CLEARANCE)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.limitedTimeOffers?.map((card, idx) => (
                <div key={card.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <span className="text-xs font-black uppercase text-[#1D6474]">Offer Card #{idx + 1}: {card.mainText}</span>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Top Ribbon Text</label>
                    <input
                      type="text"
                      value={card.ribbonText}
                      onChange={(e) => {
                        const list = [...config.limitedTimeOffers];
                        list[idx] = { ...list[idx], ribbonText: e.target.value };
                        setConfig({ ...config, limitedTimeOffers: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Main Big Typography</label>
                    <input
                      type="text"
                      value={card.mainText}
                      onChange={(e) => {
                        const list = [...config.limitedTimeOffers];
                        list[idx] = { ...list[idx], mainText: e.target.value };
                        setConfig({ ...config, limitedTimeOffers: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-black uppercase text-[#1D6474] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination Link</label>
                    <input
                      type="text"
                      value={card.href}
                      onChange={(e) => {
                        const list = [...config.limitedTimeOffers];
                        list[idx] = { ...list[idx], href: e.target.value };
                        setConfig({ ...config, limitedTimeOffers: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-text">SHOP BEAUTY PRODUCTS BY CATEGORY (Square Cards with 10% Border)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
              {config.shopByCategories?.map((cat, idx) => (
                <div key={cat.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <span className="text-xs font-black uppercase text-[#1D6474]">Category #{idx + 1}: {cat.name}</span>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Category Display Name</label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const list = [...config.shopByCategories];
                        list[idx] = { ...list[idx], name: e.target.value };
                        setConfig({ ...config, shopByCategories: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Category Slug</label>
                    <input
                      type="text"
                      value={cat.slug}
                      onChange={(e) => {
                        const list = [...config.shopByCategories];
                        list[idx] = { ...list[idx], slug: e.target.value };
                        setConfig({ ...config, shopByCategories: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <HomepageImageField
                      label="Category Artwork Image"
                      recommendedSize="400 × 400 px"
                      aspectRatioLabel="1:1 Square"
                      value={cat.image || ""}
                      onChange={(url) => {
                        const list = [...config.shopByCategories];
                        list[idx] = { ...list[idx], image: url };
                        setConfig({ ...config, shopByCategories: list });
                      }}
                      folder="categories"
                      previewHeightClass="h-10 w-10"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6.5. BEFORE / AFTER BEAUTY TECH SLIDER */}
        {activeTab === "beforeAfter" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-[#1D6474]" />
                    Before & After Interactive Beauty Comparison Slider
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure the split comparison photos, transformation badges, routine heading, 3 metric points, and shop CTA button.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none bg-teal-50/60 px-3 py-1.5 rounded-xl border border-teal-200">
                  <input
                    type="checkbox"
                    checked={config.beforeAfterSection?.enabled !== false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded accent-[#1D6474]"
                  />
                  <span className="text-xs font-bold text-[#1D6474]">Show On Storefront</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={config.beforeAfterSection?.title ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={config.beforeAfterSection?.subtitle ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          subtitle: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* Photo Sizing & Framing Controls */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-teal-50/60/40 p-4 border border-teal-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 mb-1">
                      Photo Focus & Fit (Prevents Zoom & Cropping)
                    </label>
                    <select
                      value={config.beforeAfterSection?.imageFit || "top"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          beforeAfterSection: {
                            ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                            imageFit: e.target.value as any,
                          },
                        })
                      }
                      className="w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="top">Focus on Face / Top (Recommended for Skincare Photos)</option>
                      <option value="cover">Center Fill (Standard Cover)</option>
                      <option value="contain">Contain (Full Uncropped Photo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-800 mb-1">
                      Comparison Card Aspect Ratio
                    </label>
                    <select
                      value={config.beforeAfterSection?.aspectRatio || "4/3"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          beforeAfterSection: {
                            ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                            aspectRatio: e.target.value as any,
                          },
                        })
                      }
                      className="w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="4/3">4:3 Natural Face Ratio (Recommended)</option>
                      <option value="16/10">16:10 Landscape Ratio</option>
                      <option value="1/1">1:1 Square Ratio</option>
                      <option value="auto">Auto Height</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-teal-100/80">
                    <div className="rounded-lg bg-white/80 p-2.5 border border-teal-100 text-[11px] text-gray-700 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-[#164E63]">
                        <span>Exact Recommended Dimensions & Alignment Blueprint:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600 font-medium">
                        <li><strong>Optimal Resolution:</strong> <code className="bg-teal-50/60 px-1 py-0.5 rounded text-[#164E63] font-bold">1200 × 900 px</code> (Standard 4:3 Aspect Ratio).</li>
                        <li><strong>Alternative Square:</strong> <code className="bg-teal-50/60 px-1 py-0.5 rounded text-[#164E63] font-bold">1000 × 1000 px</code> (1:1 Ratio).</li>
                        <li><strong>Facial Eye Line:</strong> Position the model&apos;s eyes approximately <strong>30% from the top</strong> of the canvas.</li>
                        <li><strong>Left & Right Match:</strong> Ensure the model&apos;s face size, angle, and center coordinates are <strong>100% identical</strong> in both Before & After photos.</li>
                      </ul>
                    </div>
                  </div>
                </div>

              {/* Before & After Visual Photo Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* 1. BEFORE PHOTO CARD */}
                <div className="rounded-2xl border-2 border-gray-200 bg-gray-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-700" />
                      Before Photo Card
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Day 1</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Before Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g. DAY 1 • DULL & DEHYDRATED"
                      value={config.beforeAfterSection?.beforeLabel ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          beforeAfterSection: {
                            ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                            beforeLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <HomepageImageField
                      label="Before Photo Image"
                      recommendedSize="1200 × 900 px"
                      aspectRatioLabel="4:3 Skincare Ratio"
                      placeholder="e.g. /banners/before_skin.jpg"
                      value={config.beforeAfterSection?.beforeImage ?? ""}
                      onChange={(url) =>
                        setConfig({
                          ...config,
                          beforeAfterSection: {
                            ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                            beforeImage: url,
                          },
                        })
                      }
                      folder="before-after"
                      previewHeightClass="h-12 w-16"
                    />
                  </div>

                  {/* Large Before Preview */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                    {config.beforeAfterSection?.beforeImage ? (
                      <img
                        src={config.beforeAfterSection.beforeImage}
                        alt="Before Preview"
                        className={`h-full w-full ${config.beforeAfterSection?.imageFit === "contain" ? "object-contain bg-zinc-950/5" : config.beforeAfterSection?.imageFit === "cover" ? "object-cover object-center" : "object-cover object-top"}`}
                      />
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[11px]">No Before Image set</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded-full bg-gray-900/85 px-2.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                      {config.beforeAfterSection?.beforeLabel || "DAY 1"}
                    </span>
                  </div>
                </div>

                {/* 2. AFTER PHOTO CARD */}
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      After Photo Card
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Day 7</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">After Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g. DAY 7 • RADIANT GLASS SKIN"
                      value={config.beforeAfterSection?.afterLabel ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          beforeAfterSection: {
                            ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                            afterLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <HomepageImageField
                      label="After Photo Image"
                      recommendedSize="1200 × 900 px"
                      aspectRatioLabel="4:3 Skincare Ratio"
                      placeholder="e.g. /banners/after_skin.jpg"
                      value={config.beforeAfterSection?.afterImage ?? ""}
                      onChange={(url) =>
                        setConfig({
                          ...config,
                          beforeAfterSection: {
                            ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                            afterImage: url,
                          },
                        })
                      }
                      folder="before-after"
                      previewHeightClass="h-12 w-16"
                    />
                  </div>

                  {/* Large After Preview */}
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-emerald-200 bg-white flex items-center justify-center">
                    {config.beforeAfterSection?.afterImage ? (
                      <img
                        src={config.beforeAfterSection.afterImage}
                        alt="After Preview"
                        className={`h-full w-full ${config.beforeAfterSection?.imageFit === "contain" ? "object-contain bg-zinc-950/5" : config.beforeAfterSection?.imageFit === "cover" ? "object-cover object-center" : "object-cover object-top"}`}
                      />
                    ) : (
                      <div className="text-center p-4 text-emerald-400">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[11px]">No After Image set</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                      {config.beforeAfterSection?.afterLabel || "DAY 7"}
                    </span>
                  </div>
                </div>
              </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Eyebrow Small Badge</label>
                  <input
                    type="text"
                    value={config.beforeAfterSection?.eyebrowBadge ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          eyebrowBadge: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-black uppercase text-[#1D6474] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Story Heading</label>
                  <input
                    type="text"
                    value={config.beforeAfterSection?.heading ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          heading: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Story Description</label>
                  <textarea
                    rows={2}
                    value={config.beforeAfterSection?.description ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          description: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                {/* 3 Metric Highlights */}
                <div className="sm:col-span-2 space-y-2 pt-1 border-t border-gray-100">
                  <label className="block text-[11px] font-bold text-gray-700">3 Metric Verification Points</label>
                  <input
                    type="text"
                    placeholder="Metric 1"
                    value={config.beforeAfterSection?.metric1 ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          metric1: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Metric 2"
                    value={config.beforeAfterSection?.metric2 ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          metric2: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Metric 3"
                    value={config.beforeAfterSection?.metric3 ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          metric3: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={config.beforeAfterSection?.buttonText ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          buttonText: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-black uppercase text-[#1D6474] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">CTA Destination URL</label>
                  <input
                    type="text"
                    value={config.beforeAfterSection?.buttonHref ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        beforeAfterSection: {
                          ...(config.beforeAfterSection || DEFAULT_HOMEPAGE_CONFIG.beforeAfterSection!),
                          buttonHref: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. TRENDING PRODUCTS & PRODUCT CARDS CONTROLS */}
        {activeTab === "trending" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text border-b border-gray-100 pb-2">
                Trending Products Showcase Section Header
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={config.trendingTitle || ""}
                    onChange={(e) => setConfig({ ...config, trendingTitle: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={config.trendingSubtitle || ""}
                    onChange={(e) => setConfig({ ...config, trendingSubtitle: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">View All Button Text</label>
                  <input
                    type="text"
                    value={config.trendingViewAllText || ""}
                    onChange={(e) => setConfig({ ...config, trendingViewAllText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Card Elements Control */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-text border-b border-gray-100 pb-2">
                Product Cards Visual Elements & Actions Control
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Free Shipping Strip Text</label>
                  <input
                    type="text"
                    value={config.cardSettings?.freeShippingText || "FREE SHIPPING"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          freeShippingText: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-black uppercase text-[#1D6474] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Add to Cart Button Label</label>
                  <input
                    type="text"
                    value={config.cardSettings?.addToCartText || "ADD TO CART"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          addToCartText: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Order Now Button Label</label>
                  <input
                    type="text"
                    value={config.cardSettings?.orderNowText || "ORDER NOW"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          orderNowText: e.target.value,
                        } as any,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-[#1D6474] focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cardSettings?.showDiscountBadge ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          showDiscountBadge: e.target.checked,
                        } as any,
                      })
                    }
                    className="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474]"
                  />
                  <span>Discount Badges</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cardSettings?.showWishlistButton ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          showWishlistButton: e.target.checked,
                        } as any,
                      })
                    }
                    className="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474]"
                  />
                  <span>Wishlist Heart</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cardSettings?.showFreeShippingStrip ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          showFreeShippingStrip: e.target.checked,
                        } as any,
                      })
                    }
                    className="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474]"
                  />
                  <span>Free Shipping Strip</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cardSettings?.showRating ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          showRating: e.target.checked,
                        } as any,
                      })
                    }
                    className="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474]"
                  />
                  <span>Star Rating</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cardSettings?.showSizeBadge ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cardSettings: {
                          ...(config.cardSettings || {}),
                          showSizeBadge: e.target.checked,
                        } as any,
                      })
                    }
                    className="h-4 w-4 rounded text-[#1D6474] focus:ring-[#1D6474]"
                  />
                  <span>Size/Volume Pill</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 8. TRUST PILLARS */}
        {activeTab === "trust" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1D6474]" /> Trust Pillars & Value Propositions (4 Strip Cards)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure the title, subtitle, icon, or custom image logo for each of the 4 storefront trust badges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.trustPillars?.map((tp, idx) => (
                <div key={tp.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <span className="text-xs font-black uppercase text-[#1D6474]">Pillar #{idx + 1}: {tp.title}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={tp.title}
                        onChange={(e) => {
                          const list = [...config.trustPillars];
                          list[idx] = { ...list[idx], title: e.target.value };
                          setConfig({ ...config, trustPillars: list });
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={tp.subtitle}
                        onChange={(e) => {
                          const list = [...config.trustPillars];
                          list[idx] = { ...list[idx], subtitle: e.target.value };
                          setConfig({ ...config, trustPillars: list });
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Predefined Icon</label>
                      <select
                        value={tp.iconName || "shield"}
                        onChange={(e) => {
                          const list = [...config.trustPillars];
                          list[idx] = { ...list[idx], iconName: e.target.value };
                          setConfig({ ...config, trustPillars: list });
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="shield">Shield (100% Authentic)</option>
                        <option value="truck">Truck (Fast Delivery)</option>
                        <option value="zap">Zap (Express / COD)</option>
                        <option value="clock">Clock (24/7 Support)</option>
                        <option value="rotate">Rotate (Easy 7-Day Returns)</option>
                      </select>
                    </div>

                    <div>
                      <HomepageImageField
                        label="Custom Icon / Image (Optional)"
                        recommendedSize="120 × 120 px"
                        aspectRatioLabel="1:1 Transparent PNG/SVG"
                        placeholder="e.g. /banners/icon.png"
                        value={tp.imageUrl ?? ""}
                        onChange={(url) => {
                          const list = [...config.trustPillars];
                          list[idx] = { ...list[idx], imageUrl: url };
                          setConfig({ ...config, trustPillars: list });
                        }}
                        folder="trust"
                        previewHeightClass="h-8 w-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. CAMPAIGN PILLS */}
        {activeTab === "campaignPills" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-text">Header Campaign Badges (Subnavigation Pills)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.campaignPills?.map((pill, idx) => (
                <div key={pill.id || idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                  <span className="text-xs font-black uppercase text-[#1D6474]">Badge #{idx + 1}: {pill.label}</span>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Pill Text</label>
                    <input
                      type="text"
                      value={pill.label}
                      onChange={(e) => {
                        const list = [...config.campaignPills];
                        list[idx] = { ...list[idx], label: e.target.value };
                        setConfig({ ...config, campaignPills: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-black uppercase focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Destination URL</label>
                    <input
                      type="text"
                      value={pill.href}
                      onChange={(e) => {
                        const list = [...config.campaignPills];
                        list[idx] = { ...list[idx], href: e.target.value };
                        setConfig({ ...config, campaignPills: list });
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. HEADER, LOGO & MEGA-MENU SETTINGS */}
        {activeTab === "header" && (
          <div className="space-y-8">
            {/* Section 1: Desktop Header Logo & Branding */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Type className="h-4 w-4 text-[#1D6474]" /> 1. Desktop Header Logo & Branding
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Controls the logo on desktop screens. When an image URL is provided, the image is displayed and text is hidden.
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal-50/60/70 border border-teal-100 px-3 py-1.5 text-[11px] font-semibold text-[#164E63]">
                  <span>Recommended: 400×90px to 500×100px (4:1 ratio, transparent PNG/SVG). Desktop displays at 44px height.</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Desktop Brand Text (Shown when NO image is set)</label>
                  <input
                    type="text"
                    placeholder="e.g. Azonno"
                    value={config.headerConfig?.logoText ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          logoText: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-black tracking-wider focus:outline-none"
                  />
                </div>

                <div>
                  <HomepageImageField
                    label="Desktop Header Logo Image"
                    recommendedSize="400 × 90 px"
                    aspectRatioLabel="4:1 to 5:1 Transparent PNG/SVG"
                    placeholder="e.g. /logos/brand-logo.png"
                    value={config.headerConfig?.logoImageUrl ?? ""}
                    onChange={(url) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          logoImageUrl: url,
                        },
                      })
                    }
                    folder="logos"
                    previewHeightClass="h-9 w-28"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Logo Target Link</label>
                  <input
                    type="text"
                    placeholder="/"
                    value={config.headerConfig?.logoLink ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          logoLink: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 1B: Mobile Header Logo & Branding (Mobile Top Bar) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Layout className="h-4 w-4 text-[#1D6474]" /> 2. Mobile Top Header Logo (Mobile Screen Bar)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Controls the logo on the mobile top navigation bar. When set, displays image and hides text. Leave blank to default to Desktop Logo.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Mobile Brand Text (Optional - defaults to Desktop)</label>
                  <input
                    type="text"
                    placeholder="e.g. Azonno (defaults to Desktop Brand Text)"
                    value={config.headerConfig?.mobileLogoText ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          mobileLogoText: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-black tracking-wider focus:outline-none"
                  />
                </div>

                <div>
                  <HomepageImageField
                    label="Mobile Top Bar Logo (Optional)"
                    recommendedSize="280 × 70 px"
                    aspectRatioLabel="4:1 Transparent PNG/SVG"
                    placeholder="e.g. /banners/mobile-logo.png"
                    value={config.headerConfig?.mobileLogoImageUrl ?? ""}
                    onChange={(url) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          mobileLogoImageUrl: url,
                        },
                      })
                    }
                    folder="logos"
                    previewHeightClass="h-8 w-24"
                  />
                </div>
              </div>
            </div>

            {/* Section 1C: Mobile Menu Drawer Logo (mmenu) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#1D6474]" /> 3. Mobile Menu Drawer Logo (mmenu Top Header)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Controls the logo inside the slide-over mobile category drawer menu. When set, displays image and hides text.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Drawer Brand Text (Optional - defaults to Header)</label>
                  <input
                    type="text"
                    placeholder="e.g. Azonno (defaults to Header text)"
                    value={config.headerConfig?.drawerLogoText ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          drawerLogoText: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2 text-xs font-black tracking-wider focus:outline-none"
                  />
                </div>

                <div>
                  <HomepageImageField
                    label="Mobile Menu Drawer Logo (Optional)"
                    recommendedSize="280 × 70 px"
                    aspectRatioLabel="4:1 Transparent PNG/SVG"
                    placeholder="e.g. /banners/drawer-logo.png"
                    value={config.headerConfig?.drawerLogoImageUrl ?? ""}
                    onChange={(url) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          drawerLogoImageUrl: url,
                        },
                      })
                    }
                    folder="logos"
                    previewHeightClass="h-8 w-24"
                  />
                </div>
              </div>
            </div>

            {/* Section 1D: Admin Dashboard Sidebar Logo */}
            <div className="rounded-2xl border-2 border-[#1D6474]/20 bg-linear-to-br from-pink-50 to-white p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1D6474]/10">
                  <ShieldCheck className="h-5 w-5 text-[#1D6474]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    4. Admin Dashboard Sidebar Logo
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Logo displayed in the <strong>Admin Panel sidebar</strong> — separate from the storefront logo. Recommended: transparent PNG or SVG, min 280×70px.
                    If left empty, the storefront header logo is used as fallback.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <div className="sm:col-span-2">
                  <HomepageImageField
                    label="Admin Sidebar Logo Image"
                    recommendedSize="280 × 70 px"
                    aspectRatioLabel="4:1 Transparent PNG/SVG (white or light logo recommended)"
                    placeholder="e.g. /logos/admin-logo-white.png"
                    value={config.headerConfig?.adminLogoImageUrl ?? ""}
                    onChange={(url) =>
                      setConfig({
                        ...config,
                        headerConfig: {
                          ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                          adminLogoImageUrl: url,
                        },
                      })
                    }
                    folder="logos"
                    previewHeightClass="h-10 w-32"
                  />
                </div>
              </div>

              {config.headerConfig?.adminLogoImageUrl && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">Preview in dark sidebar:</span>
                  <img
                    src={config.headerConfig.adminLogoImageUrl}
                    alt="Admin logo preview"
                    className="h-8 max-w-40 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Search Bar Animated Cycling Terms */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#1D6474]" /> Search Bar Animated Placeholder Keywords
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comma-separated list of search queries that cycle with typing animation in the header search pill.
                </p>
              </div>

              <textarea
                rows={2}
                value={(config.headerConfig?.searchPlaceholders || DEFAULT_HOMEPAGE_CONFIG.headerConfig.searchPlaceholders).join(", ")}
                onChange={(e) => {
                  const items = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                  setConfig({
                    ...config,
                    headerConfig: {
                      ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                      searchPlaceholders: items,
                    },
                  });
                }}
                className="w-full rounded-xl border p-3 text-xs font-medium focus:outline-none"
              />
            </div>

            {/* Section 3: Hoverable Mega-Menu Categories & Subcategories */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#1D6474]" /> Main Navigation & Hoverable Mega-Menus
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure the categories shown in the header navigation and the rich mega menu dropdown with subcategories, popular brands, and promo banner that opens when customers hover over each category.
                </p>
              </div>

              <div className="space-y-6">
                {(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories).map((cat, catIdx) => (
                  <div key={cat.id || catIdx} className="rounded-2xl border border-gray-200 p-5 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D6474] text-[11px] font-black text-white">
                          {catIdx + 1}
                        </span>
                        <h4 className="text-sm font-black text-gray-900">{cat.name} Mega-Menu</h4>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">{cat.slug}</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Nav Tab Label</label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                            newCats[catIdx] = { ...newCats[catIdx], name: e.target.value };
                            setConfig({
                              ...config,
                              headerConfig: {
                                ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                navCategories: newCats,
                              },
                            });
                          }}
                          className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Destination URL</label>
                        <input
                          type="text"
                          value={cat.href}
                          onChange={(e) => {
                            const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                            newCats[catIdx] = { ...newCats[catIdx], href: e.target.value };
                            setConfig({
                              ...config,
                              headerConfig: {
                                ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                navCategories: newCats,
                              },
                            });
                          }}
                          className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Subcategories Editor */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-gray-700">
                        Subcategory Items (Columns 1 & 2 in Mega Menu)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.subcategories.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                            <input
                              type="text"
                              value={sub.name}
                              placeholder="Name"
                              onChange={(e) => {
                                const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                                const newSubs = [...newCats[catIdx].subcategories];
                                newSubs[subIdx] = { ...newSubs[subIdx], name: e.target.value };
                                newCats[catIdx] = { ...newCats[catIdx], subcategories: newSubs };
                                setConfig({
                                  ...config,
                                  headerConfig: {
                                    ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                    navCategories: newCats,
                                  },
                                });
                              }}
                              className="w-1/2 rounded-lg border px-2 py-1 text-[11px] font-semibold focus:outline-none"
                            />
                            <input
                              type="text"
                              value={sub.href}
                              placeholder="Link URL"
                              onChange={(e) => {
                                const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                                const newSubs = [...newCats[catIdx].subcategories];
                                newSubs[subIdx] = { ...newSubs[subIdx], href: e.target.value };
                                newCats[catIdx] = { ...newCats[catIdx], subcategories: newSubs };
                                setConfig({
                                  ...config,
                                  headerConfig: {
                                    ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                    navCategories: newCats,
                                  },
                                });
                              }}
                              className="w-1/2 rounded-lg border px-2 py-1 text-[11px] font-mono focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Featured Brands */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        Popular Brands (Column 3 in Mega Menu - comma separated)
                      </label>
                      <input
                        type="text"
                        value={(cat.featuredBrands || []).join(", ")}
                        onChange={(e) => {
                          const brands = e.target.value.split(",").map((b) => b.trim()).filter(Boolean);
                          const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                          newCats[catIdx] = { ...newCats[catIdx], featuredBrands: brands };
                          setConfig({
                            ...config,
                            headerConfig: {
                              ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                              navCategories: newCats,
                            },
                          });
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Promo Banner */}
                    <div className="space-y-2 border-t border-gray-200 pt-3">
                      <label className="block text-[11px] font-bold text-gray-700">
                        Mega Menu Promo Banner (Column 4)
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Promo Title (e.g. FLAT 25% OFF)"
                          value={cat.promoBanner?.title || ""}
                          onChange={(e) => {
                            const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                            newCats[catIdx] = {
                              ...newCats[catIdx],
                              promoBanner: {
                                ...(newCats[catIdx].promoBanner || { subtitle: "", image: "", href: "" }),
                                title: e.target.value,
                              },
                            };
                            setConfig({
                              ...config,
                              headerConfig: {
                                ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                navCategories: newCats,
                              },
                            });
                          }}
                          className="rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Target URL (e.g. /products?brand=ponds)"
                          value={cat.promoBanner?.href || ""}
                          onChange={(e) => {
                            const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                            newCats[catIdx] = {
                              ...newCats[catIdx],
                              promoBanner: {
                                ...(newCats[catIdx].promoBanner || { title: "", subtitle: "", image: "" }),
                                href: e.target.value,
                              },
                            };
                            setConfig({
                              ...config,
                              headerConfig: {
                                ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                navCategories: newCats,
                              },
                            });
                          }}
                          className="rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                        <div className="sm:col-span-2">
                          <HomepageImageField
                            label="Promo Banner Poster Image"
                            recommendedSize="400 × 500 px"
                            aspectRatioLabel="4:5 Portrait Card"
                            placeholder="e.g. /banners/megamenu_promo.jpg"
                            value={cat.promoBanner?.image || ""}
                            onChange={(url) => {
                              const newCats = [...(config.headerConfig?.navCategories || DEFAULT_HOMEPAGE_CONFIG.headerConfig.navCategories)];
                              newCats[catIdx] = {
                                ...newCats[catIdx],
                                promoBanner: {
                                  ...(newCats[catIdx].promoBanner || { title: "", subtitle: "", href: "" }),
                                  image: url,
                                },
                              };
                              setConfig({
                                ...config,
                                headerConfig: {
                                  ...(config.headerConfig || DEFAULT_HOMEPAGE_CONFIG.headerConfig),
                                  navCategories: newCats,
                                },
                              });
                            }}
                            folder="megamenu"
                            previewHeightClass="h-14 w-12"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Top Announcement Bar & Notice */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#1D6474]" /> Top Utility Announcement Bar & Helpline
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage the top announcement strip and customer hotline.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={config.announcementBadgeText ?? ""}
                    onChange={(e) => setConfig({ ...config, announcementBadgeText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-[#1D6474] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Free Nationwide Delivery Threshold (৳)</label>
                  <input
                    type="number"
                    value={config.freeDeliveryThreshold ?? 2000}
                    onChange={(e) => setConfig({ ...config, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Announcement Message Text</label>
                  <input
                    type="text"
                    value={config.announcementText ?? ""}
                    onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Routine Finder Label</label>
                  <input
                    type="text"
                    value={config.routineFinderText ?? ""}
                    onChange={(e) => setConfig({ ...config, routineFinderText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-[#1D6474] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Routine Finder Destination URL</label>
                  <input
                    type="text"
                    value={config.routineFinderHref ?? ""}
                    onChange={(e) => setConfig({ ...config, routineFinderHref: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Track Order Label</label>
                  <input
                    type="text"
                    value={config.trackOrderText ?? ""}
                    onChange={(e) => setConfig({ ...config, trackOrderText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Authentic Guarantee Text</label>
                  <input
                    type="text"
                    value={config.authenticGuaranteeText ?? ""}
                    onChange={(e) => setConfig({ ...config, authenticGuaranteeText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Hotline Support Phone</label>
                  <input
                    type="text"
                    value={config.supportPhone ?? ""}
                    onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Footer Branding, Description & Copyright */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Type className="h-4 w-4 text-[#1D6474]" /> 4. Footer Logo, Branding & Bio (Footer Section)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Controls the logo, brand name text, about summary, and copyright line displayed in the dark footer.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Footer Brand Text (Shown when NO image is set)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Azonno (defaults to header logo text)"
                    value={config.footerBrandText ?? ""}
                    onChange={(e) => setConfig({ ...config, footerBrandText: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <HomepageImageField
                    label="Footer Brand Logo Image (Optional)"
                    recommendedSize="320 × 80 px"
                    aspectRatioLabel="4:1 Transparent PNG/SVG"
                    placeholder="e.g. /banners/footer-logo.png"
                    value={config.footerLogoImageUrl ?? ""}
                    onChange={(url) => setConfig({ ...config, footerLogoImageUrl: url })}
                    folder="logos"
                    previewHeightClass="h-8 w-24"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Footer About Bio Summary Text
                  </label>
                  <textarea
                    rows={2}
                    value={config.footerAboutText ?? ""}
                    onChange={(e) => setConfig({ ...config, footerAboutText: e.target.value })}
                    className="w-full rounded-xl border p-3 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Footer Copyright Notice
                  </label>
                  <input
                    type="text"
                    value={config.footerCopyright ?? ""}
                    onChange={(e) => setConfig({ ...config, footerCopyright: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-xs font-medium text-gray-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. CUSTOMER LOGIN, REGISTRATION & ORDER PLACEMENT RULES */}
        {activeTab === "customerRules" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#1D6474]" /> Customer Login & Registration Requirements
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Control whether customers are forced to create an account / login to order, or permitted to checkout as guests.
                </p>
              </div>

              <div className="space-y-3">
                {/* Guest Checkout Toggle */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                      Allow Guest Checkout (No Login Required)
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      When ON, customers can place orders with 1-click without creating a password. When OFF, customers MUST log in or register before checking out.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkoutSettings.guest_checkout_enabled}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, guest_checkout_enabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#1D6474] accent-[#1D6474]"
                  />
                </label>

                {/* Public Registration Toggle */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                      Allow New Customer Signups / Registrations
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Enable or disable the public Sign Up form for new visitor registrations.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkoutSettings.allow_customer_registration}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, allow_customer_registration: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#1D6474] accent-[#1D6474]"
                  />
                </label>
              </div>
            </div>

            {/* Customer Checkout Form Rules */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#1D6474]" /> Customer Checkout Fields & Validation Rules
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customize mandatory customer contact inputs and special delivery instructions.
                </p>
              </div>

              <div className="space-y-3">
                {/* Mandatory Phone */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                      Require Valid Bangladesh Mobile Number (Mandatory)
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Enforces valid 11-digit mobile format (01XXXXXXXXX) during checkout for courier dispatch.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkoutSettings.require_phone}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, require_phone: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#1D6474] accent-[#1D6474]"
                  />
                </label>

                {/* Mandatory Email */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                      Require Customer Email Address
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      When OFF, email is optional for fast 1-click mobile checkouts. When ON, email is mandatory.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkoutSettings.require_email}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, require_email: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#1D6474] accent-[#1D6474]"
                  />
                </label>

                {/* Order Notes */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                      Allow Customer Order Delivery Instructions
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Displays special delivery notes input field during checkout (e.g. &quot;Call before arriving&quot;).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkoutSettings.order_notes_enabled}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, order_notes_enabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#1D6474] accent-[#1D6474]"
                  />
                </label>

                {/* Division, District, Thana Dropdowns Control */}
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <span className="font-bold text-gray-900 text-xs sm:text-sm block flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#1D6474]" />
                      Show Division, District &amp; Thana (, , ) Selectors
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      When enabled, customers pick Division, District, and Thana from dropdown lists during checkout. When disabled, customers only choose Inside/Outside Dhaka and enter their complete street address.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkoutSettings.show_location_hierarchy}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, show_location_hierarchy: e.target.checked })
                    }
                    className="h-5 w-5 rounded border-gray-300 text-[#1D6474] accent-[#1D6474]"
                  />
                </label>
              </div>
            </div>

            {/* Order Spending Limits & Thresholds */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-[#1D6474]" /> Order Spending Limits & Thresholds (BDT)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set minimum cart subtotal required to place an order and maximum limit for Cash on Delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Minimum Cart Subtotal to Place Order (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={checkoutSettings.min_order_amount}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, min_order_amount: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Customers must have at least this amount to place an order (Set to 0 for no minimum).
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Maximum Cash on Delivery Limit per Order (৳)
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={checkoutSettings.cod_max_amount}
                    onChange={(e) =>
                      setCheckoutSettings({ ...checkoutSettings, cod_max_amount: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Orders above this amount require advance online prepayment.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 13. SEO & HUMANIZED FAQ SECTION */}
        {activeTab === "seoFaq" && (
          <HomepageSeoFaqEditor config={config} onChange={setConfig} />
        )}

        {/* 14. FOOTER & CONTACT CONTROLS */}
        {activeTab === "footer" && (
          <HomepageFooterEditor config={config} onChange={setConfig} />
        )}

        {/* Floating Save Button */}
        <div className="sticky bottom-4 z-20 flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[#1D6474] hover:bg-[#164E63] text-white font-extrabold text-sm px-8 py-3.5 shadow-xl transition-all active:scale-95"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Publishing Changes..." : "Save & Publish All Sections"}
          </Button>
        </div>
      </form>
    </div>
  );
}
