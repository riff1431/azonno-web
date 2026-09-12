"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  Check,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  ZoomIn,
  Maximize2,
  X,
  Globe,
  Droplets,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  FileText,
  BookOpen,
  FlaskConical,
  MessageSquare,
  Tag,
  FolderTree,
} from "lucide-react";
import { formatPrice, cn, getShortProductId } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { triggerMicroRipple } from "@/lib/ui-effects";
import { ProductReviewsQA } from "@/components/storefront/product-reviews-qa";
import { FrequentlyBoughtTogether } from "@/components/storefront/frequently-bought-together";
import {
  trackViewItem,
  trackAddToCart as trackGA4AddToCart,
  trackAddToWishlist as trackGA4AddToWishlist,
} from "@/lib/analytics/datalayer";
import { type StoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import { useLanguage } from "@/context/language-context";

const SKIN_CONCERN_MAP: Record<string, { en: string; bn: string }> = {
  "Clear Skin & Blemishes": { en: "Clear Skin & Blemishes", bn: "পরিষ্কার ত্বক ও দাগহীন ভাব" },
  "Acne & Blemishes": { en: "Clear Skin & Blemishes", bn: "পরিষ্কার ত্বক ও দাগহীন ভাব" },
  "Brightening & Even Tone": { en: "Brightening & Even Tone", bn: "উজ্জ্বলতা ও সমান স্কিন টোন" },
  "Brightening & Pigmentation": { en: "Brightening & Even Tone", bn: "উজ্জ্বলতা ও সমান স্কিন টোন" },
  "Smooth Lines & Firmness": { en: "Smooth Lines & Firmness", bn: "কোমল ও টানটান অনুভূতি" },
  "Anti-Aging & Wrinkles": { en: "Smooth Lines & Firmness", bn: "কোমল ও টানটান অনুভূতি" },
  "Hydration & Moisture": { en: "Hydration & Moisture", bn: "আর্দ্রতা ও হাইড্রেশন" },
  "Dryness & Hydration": { en: "Hydration & Moisture", bn: "আর্দ্রতা ও হাইড্রেশন" },
  "Pore & Oil Care": { en: "Pore & Oil Care", bn: "পোর ও অতিরিক্ত তেল নিয়ন্ত্রণ" },
  "Pore Minimizing": { en: "Pore & Oil Care", bn: "পোর ও অতিরিক্ত তেল নিয়ন্ত্রণ" },
  "Redness & Soothing": { en: "Redness & Soothing", bn: "লালচে ভাব ও প্রশান্তিদায়ক যত্ন" },
  "Redness & Rosacea": { en: "Redness & Soothing", bn: "লালচে ভাব ও প্রশান্তিদায়ক যত্ন" },
  "Sun Protection": { en: "Sun Protection (SPF)", bn: "রোদে সুরক্ষা (SPF)" },
  "Dark Circles & Eye Care": { en: "Dark Circles & Eye Care", bn: "চোখের নিচের যত্ন" },
  "Oil Control": { en: "Oil Control", bn: "তেল নিয়ন্ত্রণ ও ফ্রেশ লুক" },
  "Barrier Care": { en: "Barrier Care", bn: "স্কিন ব্যারিয়ার কেয়ার" },
  "Barrier Repair": { en: "Barrier Care", bn: "স্কিন ব্যারিয়ার কেয়ার" },
};

const SKIN_TYPE_MAP: Record<string, { en: string; bn: string }> = {
  "Oily": { en: "Oily", bn: "তৈলাক্ত ত্বক" },
  "Dry": { en: "Dry", bn: "শুষ্ক ত্বক" },
  "Combination": { en: "Combination", bn: "কম্বিনেশন / মিশ্র ত্বক" },
  "Sensitive": { en: "Sensitive", bn: "সেনসিটিভ ত্বক" },
  "Normal": { en: "Normal", bn: "স্বাভাবিক ত্বক" },
  "All Skin Types": { en: "All Skin Types", bn: "সকল ধরণের ত্বক" },
};

const ORIGIN_MAP: Record<string, { en: string; bn: string }> = {
  "South Korea": { en: "South Korea (K-Beauty)", bn: "দক্ষিণ কোরিয়া (কে-বিউটি)" },
  "Japan": { en: "Japan (J-Beauty)", bn: "জাপান (জে-বিউটি)" },
  "United Kingdom": { en: "United Kingdom (UK)", bn: "যুক্তরাজ্য (UK)" },
  "United States": { en: "United States (USA)", bn: "যুক্তরাষ্ট্র (USA)" },
  "France": { en: "France", bn: "ফ্রান্স" },
  "Germany": { en: "Germany", bn: "জার্মানি" },
  "Thailand": { en: "Thailand", bn: "থাইল্যান্ড" },
  "Bangladesh": { en: "Bangladesh", bn: "বাংলাদেশ" },
  "India": { en: "India", bn: "ভারত" },
};

interface ProductDetailClientProps {
  product: any;
  relatedProducts: any[];
  bundleData?: any;
  featureSettings?: StoreFeatureSettings;
  initialReviewsCount?: number;
  initialAverageRating?: number;
}

export function ProductDetailClient({
  product,
  relatedProducts,
  bundleData,
  featureSettings,
  initialReviewsCount = 0,
  initialAverageRating = 0,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { language, t, toBn, formatPriceBn } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [copied, setCopied] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const inWishlist = isWishlisted(product.id);
  const [reviewsCount, setReviewsCount] = useState(initialReviewsCount);
  const [averageRating, setAverageRating] = useState(initialAverageRating);

  // Fake live viewer counting simulation for social proof & FOMO
  const [liveViewers, setLiveViewers] = useState(16);

  useEffect(() => {
    // Generate a consistent starting point based on product id
    const seed = product?.id
      ? product.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : 16;
    const initialViewers = 14 + (seed % 15); // e.g. 14 to 28
    setLiveViewers(initialViewers);

    // Gently fluctuate every 6-8 seconds
    const interval = setInterval(() => {
      setLiveViewers((prev) => {
        const delta = Math.random() > 0.45 ? (Math.random() > 0.5 ? 1 : 2) : (Math.random() > 0.5 ? -1 : -2);
        const next = prev + delta;
        return Math.min(38, Math.max(12, next));
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [product?.id]);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true, // First section opened by default as requested
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.product_variants?.[0] || null
  );

  const effectivePrice = selectedVariant?.sale_price
    ? Number(selectedVariant.sale_price)
    : selectedVariant?.regular_price
    ? Number(selectedVariant.regular_price)
    : product.sale_price ?? product.regular_price;

  const categoryName =
    product.product_categories?.[0]?.categories?.name || product.categories?.name || undefined;

  const lastTrackedProductKey = useRef<string | null>(null);

  // Track view_item event on initial render or variant switch (single fire per key)
  useEffect(() => {
    if (product) {
      const trackingKey = `${product.id}_${selectedVariant?.id || "base"}_${effectivePrice}`;
      if (lastTrackedProductKey.current === trackingKey) return;
      lastTrackedProductKey.current = trackingKey;

      trackViewItem({
        item_id: getShortProductId(product),
        item_name: product.name,
        item_brand: product.brands?.name || undefined,
        item_category: categoryName,
        item_variant: selectedVariant?.title || selectedVariant?.name || undefined,
        price: effectivePrice,
        quantity: 1,
      });
    }
  }, [product.id, selectedVariant?.id, effectivePrice, categoryName]);

  // Gallery Images - Extract strictly from this product's own media and featured image
  const sortedMediaList = useMemo(() => {
    const list = Array.isArray(product.product_media) ? [...product.product_media] : [];
    return list.sort((a, b) => {
      if (a.is_featured) return -1;
      if (b.is_featured) return 1;
      return (a.position || 0) - (b.position || 0);
    });
  }, [product.product_media]);

  const imageUrls: string[] = useMemo(() => {
    const urls: string[] = [];
    if (product.og_image_url) {
      urls.push(product.og_image_url);
    }
    sortedMediaList.forEach((pm: any) => {
      const u = pm.media?.secure_url || pm.secure_url;
      if (u && typeof u === "string" && !urls.includes(u)) {
        urls.push(u);
      }
    });
    return urls;
  }, [product.og_image_url, sortedMediaList]);

  const [selectedImage, setSelectedImage] = useState<string>(
    imageUrls[0] || ""
  );

  useEffect(() => {
    if (imageUrls.length > 0 && (!selectedImage || !imageUrls.includes(selectedImage))) {
      setSelectedImage(imageUrls[0]);
    }
  }, [imageUrls, selectedImage]);

  // Zoom State
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Sticky Mobile Floating CTA intersection observer / scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (buyBoxRef.current) {
        const rect = buyBoxRef.current.getBoundingClientRect();
        // Show floating bar when main buy box has scrolled out of view
        if (rect.bottom < 80) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPosition({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsZoomed(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.touches[0];
      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
      setZoomPosition({ x, y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.touches[0];
      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
      setZoomPosition({ x, y });
    }
  };

  const handleTouchEnd = () => {
    setIsZoomed(false);
  };

  const discountPercent =
    product.sale_price && product.regular_price > product.sale_price
      ? Math.round(
          ((product.regular_price - product.sale_price) / product.regular_price) * 100
        )
      : 0;

  const inv = product.inventory;
  const availableStock = Array.isArray(inv)
    ? (inv.length > 0 ? Number(inv[0]?.available ?? 0) : 0)
    : inv && typeof inv === "object" && "available" in inv
    ? Number((inv as any).available ?? 0)
    : 0;
  const isOutOfStock = availableStock <= 0;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCart = () => {
    trackGA4AddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: product.brands?.name || undefined,
          item_category: categoryName,
          item_variant: selectedVariant?.title || selectedVariant?.name || undefined,
          price: effectivePrice,
          quantity,
        },
      ],
      effectivePrice * quantity
    );

    addItem(
      {
        id: selectedVariant?.id ? `${product.id}-${selectedVariant.id}` : product.id,
        product_id: product.id,
        variant_id: selectedVariant?.id || null,
        sku: getShortProductId(product),
        variant_label: selectedVariant?.title || selectedVariant?.name || null,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        regular_price: selectedVariant?.regular_price || product.regular_price,
        image_url: selectedImage || product.og_image_url || null,
        brand_name: product.brands?.name || null,
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    trackGA4AddToCart(
      [
        {
          item_id: getShortProductId(product),
          item_name: product.name,
          item_brand: product.brands?.name || undefined,
          item_category: categoryName,
          item_variant: selectedVariant?.title || selectedVariant?.name || undefined,
          price: effectivePrice,
          quantity,
        },
      ],
      effectivePrice * quantity
    );

    addItem(
      {
        id: selectedVariant?.id ? `${product.id}-${selectedVariant.id}` : product.id,
        product_id: product.id,
        variant_id: selectedVariant?.id || null,
        sku: getShortProductId(product),
        variant_label: selectedVariant?.title || selectedVariant?.name || null,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        regular_price: selectedVariant?.regular_price || product.regular_price,
        image_url: selectedImage || product.og_image_url || null,
        brand_name: product.brands?.name || null,
      },
      quantity
    );
    router.push("/checkout");
  };

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    triggerMicroRipple(e, true);

    if (!inWishlist) {
      trackGA4AddToWishlist(
        [
          {
            item_id: getShortProductId(product),
            item_name: product.name,
            item_brand: product.brands?.name || undefined,
            item_category: categoryName,
            item_variant: selectedVariant?.title || selectedVariant?.name || undefined,
            price: effectivePrice,
            quantity: 1,
          },
        ],
        effectivePrice
      );
    }

    toggleWishlist({
      id: product.id,
      name: product.name,
      slug: product.slug,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      image_url: product.og_image_url || null,
      brand_name: product.brands?.name || null,
    });
  };

  const skinTypes = product.skin_type || [];
  const skinConcerns = product.skin_concern || [];
  const keyActives = product.key_actives || [];
  const originCountry = product.origin_country || product.country || "South Korea";

  const productTags = useMemo(() => {
    if (Array.isArray(product.product_tags)) {
      return product.product_tags
        .map((pt: any) => (pt?.tags ? pt.tags : pt))
        .filter(Boolean);
    }
    if (Array.isArray(product.tags)) {
      return product.tags.filter(Boolean);
    }
    return [];
  }, [product.product_tags, product.tags]);

  return (
    <div className="space-y-12">
      {/* 1. Main Gallery + Info Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
        {/* Left 5 Cols: Gallery */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Photo Box with Luxury Precision Magnifier Zoom */}
          <div
            ref={imageContainerRef}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={() => setIsZoomed(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsModalOpen(true)}
            className="relative mx-auto w-full max-w-[420px] aspect-square overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-xs flex items-center justify-center cursor-zoom-in group select-none touch-none p-4"
          >
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                style={{
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transform: isZoomed ? "scale(2.2)" : "scale(1)",
                  transition: isZoomed
                    ? "transform 0.05s ease-out"
                    : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="h-full w-full object-contain object-center will-change-transform pointer-events-none"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <ShoppingBag className="h-16 w-16 stroke-1" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-3.5 top-3.5 flex flex-col gap-1.5 z-10 pointer-events-none">
              {discountPercent > 0 && (
                <span className="rounded-full bg-[#e91e63] px-3 py-1 text-xs font-black text-white shadow-sm">
                  -{toBn(discountPercent)}% {t("product", "off")}
                </span>
              )}
              {product.authenticity_verified !== false && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> {t("footer", "authenticTitle")}
                </span>
              )}
              {originCountry && (
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {language === "bn" ? (ORIGIN_MAP[originCountry]?.bn || originCountry) : (ORIGIN_MAP[originCountry]?.en || originCountry)}
                </span>
              )}
            </div>

            {/* Top Right Action Row */}
            <div className="absolute right-3.5 top-3.5 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                aria-label="Enlarge image"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-xs transition-all hover:bg-white hover:scale-110 active:scale-90 text-gray-700"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleWishlistClick}
                aria-label="Add to wishlist"
                className="ripple-container flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-xs transition-all hover:bg-white hover:scale-110 active:scale-90"
              >
                <Heart
                  className={cn(
                    "h-4.5 w-4.5 transition-colors",
                    inWishlist ? "fill-[#e91e63] text-[#e91e63]" : "text-zinc-600"
                  )}
                />
              </button>
            </div>

            {/* Left / Right Quick Carousel Chevrons */}
            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currIdx = imageUrls.indexOf(selectedImage);
                    const prevIdx = (currIdx - 1 + imageUrls.length) % imageUrls.length;
                    setSelectedImage(imageUrls[prevIdx]);
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-xs text-gray-700 hover:bg-white hover:text-[#e91e63] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currIdx = imageUrls.indexOf(selectedImage);
                    const nextIdx = (currIdx + 1) % imageUrls.length;
                    setSelectedImage(imageUrls[nextIdx]);
                  }}
                  aria-label="Next photo"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-xs text-gray-700 hover:bg-white hover:text-[#e91e63] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Photo Counter Badge */}
            {imageUrls.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white shadow-xs pointer-events-none flex items-center gap-1 z-10">
                <Layers className="h-3 w-3 text-pink-300" />
                <span>
                  {toBn(imageUrls.indexOf(selectedImage) + 1)} / {toBn(imageUrls.length)}
                </span>
              </div>
            )}
          </div>

          {/* Full Screen HD Lightbox Modal */}
          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in-0 duration-200"
              onClick={() => setIsModalOpen(false)}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2.5 rounded-full transition-all"
                aria-label="Close image preview"
              >
                <X className="h-6 w-6" />
              </button>
              <div
                className="max-w-4xl max-h-[90vh] w-full p-2 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                />
              </div>
            </div>
          )}

          {/* Thumbnails Gallery Strip (Red-Boxed Space) */}
          {imageUrls.length > 1 && (
            <div className="mx-auto w-full max-w-[420px] pt-1 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#e91e63]" />
                  {language === "bn" ? "প্রোডাক্ট ফটো গ্যালারি" : "Product Gallery"} ({toBn(imageUrls.length)})
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                  {language === "bn" ? "ছবি নির্বাচন করতে ক্লিক করুন" : "Click to switch photo"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 py-1">
                {imageUrls.map((url, idx) => {
                  const isSelected = selectedImage === url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(url)}
                      className={cn(
                        "relative aspect-square w-full overflow-hidden rounded-2xl border-2 transition-all p-1.5 bg-white shadow-2xs group cursor-pointer flex items-center justify-center",
                        isSelected
                          ? "border-[#e91e63] ring-2 ring-[#e91e63]/30 shadow-md scale-105"
                          : "border-gray-200 hover:border-pink-300 opacity-75 hover:opacity-100"
                      )}
                    >
                      <img
                        src={url}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                      {isSelected && (
                        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-[#e91e63] ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Product Details & Conversion Hierarchy */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Brand & Title */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {product.brands && (
                <Link
                  href={`/products?brand=${product.brands.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#e91e63] hover:text-sg-pink-hover transition-colors"
                >
                  <span>{product.brands.name}</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-600">
                {language === "bn" ? "প্রোডাক্ট আইডি / এসকেইউ:" : "ID / SKU:"} #{toBn(getShortProductId(product))}
              </span>
              {product.volume_ml && (
                <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 border border-pink-200 px-2 py-0.5 text-[11px] font-extrabold text-[#e91e63]">
                  🧴 {product.volume_ml}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-black text-text leading-tight">
              {product.name}
            </h1>

            {/* Rating and Share Bar */}
            <div className="mt-2.5 flex items-center justify-between border-b border-border pb-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOpenAccordions((prev) => ({ ...prev, reviews: true }));
                  const reviewsEl = document.getElementById("accordion-item-reviews");
                  if (reviewsEl) {
                    reviewsEl.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-85 transition-opacity group"
              >
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        reviewsCount > 0 && star <= Math.round(averageRating)
                          ? "fill-current text-amber-400"
                          : "text-zinc-300 fill-none"
                      )}
                    />
                  ))}
                </div>
                {reviewsCount > 0 ? (
                  <>
                    <span className="font-bold text-text">{toBn(averageRating.toFixed(1))}</span>
                    <span className="text-text-muted font-medium group-hover:text-[#e91e63] group-hover:underline transition-colors">
                      {language === "bn"
                        ? `(${toBn(reviewsCount)} টি ভেরিফাইড বায়ার রিভিউ)`
                        : `(${reviewsCount} Verified Buyer ${reviewsCount === 1 ? "Review" : "Reviews"})`}
                    </span>
                  </>
                ) : (
                  <span className="text-text-muted font-medium group-hover:text-[#e91e63] group-hover:underline transition-colors">
                    {language === "bn"
                      ? "(এখনো কোনো রিভিউ নেই — প্রথম রিভিউ দিন)"
                      : "(No reviews yet — be the first to review)"}
                  </span>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text rounded-lg px-2.5 py-1 hover:bg-surface-secondary transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{language === "bn" ? "লিংক কপি হয়েছে" : "Link Copied"}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>{language === "bn" ? "শেয়ার" : "Share"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Fake Live View Counting & Social Proof */}
            <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-amber-500/10 via-pink-500/10 to-rose-500/5 border border-amber-300/40 px-3.5 py-2 text-xs shadow-2xs">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span className="text-gray-800 font-bold flex items-center gap-1.5 flex-wrap">
                <span className="text-base leading-none">🔥</span>
                <strong className="text-gray-950 font-black text-sm tracking-tight">
                  {toBn(liveViewers)}
                </strong>
                <span className="text-gray-700 font-semibold">
                  {language === "bn"
                    ? "জন ক্রেতা এখন এই পণ্যটি দেখছেন"
                    : "people are currently looking at this product"}
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Highlight Card */}
          <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4 space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-text">
                {formatPriceBn(effectivePrice)}
              </span>
              {product.regular_price > effectivePrice && (
                <>
                  <span className="text-sm font-semibold text-text-muted line-through">
                    {formatPriceBn(product.regular_price)}
                  </span>
                  <span className="rounded-lg bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 text-xs font-extrabold text-accent-700">
                    {language === "bn"
                      ? `সাশ্রয় ${formatPriceBn(product.regular_price - effectivePrice)}`
                      : `You Save ${formatPrice(product.regular_price - effectivePrice)}`}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              {product.shipping_class === "free_shipping" ? (
                <span className="font-bold text-[#e91e63] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-[#e91e63]" />
                  {language === "bn"
                    ? "এই পণ্যে সারা দেশে ফ্রি ডেলিভারি!"
                    : "Free Nationwide Delivery on this product!"}
                </span>
              ) : (
                <span>
                  {language === "bn"
                    ? "২,৫০০ টাকার অর্ডারে সারা দেশে ফ্রি ডেলিভারি।"
                    : "Free Delivery available on orders over ৳2,500."}
                </span>
              )}
            </div>
          </div>

          {/* Shade & Variant Selector with Interactive Color Swatches */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-text">
                  {language === "bn" ? "শেড / সাইজ নির্বাচন করুন:" : "Select Shade / Size:"}
                </span>
                {selectedVariant && (
                  <span className="text-xs font-bold text-pink-600">
                    {selectedVariant.title || selectedVariant.name}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.product_variants.map((variant: any) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const colorHex = variant.color_hex || variant.shade_color_hex;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all btn-soft-fill",
                        isSelected
                          ? "border-[#e91e63] bg-pink-50 text-[#e91e63] shadow-xs ring-2 ring-pink-200"
                          : "border-border bg-white text-text-secondary hover:border-text-muted hover:bg-gray-50"
                      )}
                    >
                      {colorHex && (
                        <span
                          className="h-4 w-4 rounded-full border border-black/20 shadow-2xs shrink-0"
                          style={{ backgroundColor: colorHex }}
                        />
                      )}
                      <span>{variant.title || variant.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability Status */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-muted font-medium">
              {language === "bn" ? "লভ্যতা:" : "Availability:"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold",
                isOutOfStock
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              )}
            >
              <Check className="h-3 w-3" />
              {isOutOfStock
                ? t("productDetail", "outOfStock")
                : `${t("productDetail", "inStock")} (${toBn(availableStock)} ${language === "bn" ? "টি স্টকে আছে" : "in stock"})`}
            </span>
          </div>

          {/* Main Buy Box Container */}
          <div ref={buyBoxRef} className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center h-11 rounded-xl border border-border bg-surface-secondary/80">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="h-full px-3.5 text-text hover:bg-white rounded-l-xl transition-colors disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-extrabold text-text">
                  {toBn(quantity)}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock}
                  className="h-full px-3.5 text-text hover:bg-white rounded-r-xl transition-colors disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Primary Add to Bag Button */}
              <Button
                disabled={isOutOfStock}
                onClick={(e) => {
                  triggerMicroRipple(e);
                  handleAddToCart();
                }}
                className={cn(
                  "ripple-container flex-1 h-11 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95",
                  justAdded
                    ? "bg-emerald-600! hover:bg-emerald-700 text-white"
                    : "btn-add-to-cart"
                )}
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5 animate-in zoom-in-50" />
                    {language === "bn" ? "কার্ট-এ যোগ হয়েছে!" : "Added to Bag!"}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-1.5" />
                    {t("productDetail", "addToCart")} ({toBn(quantity)})
                  </>
                )}
              </Button>
            </div>

            {/* Instant Buy Now (Cash on Delivery) Button */}
            <Button
              disabled={isOutOfStock}
              onClick={(e) => {
                triggerMicroRipple(e);
                handleBuyNow();
              }}
              className="ripple-container w-full h-11 rounded-xl font-extrabold text-xs sm:text-sm bg-accent-500 hover:bg-accent-600 text-white shadow-md transition-all active:scale-95 hover:shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)]"
            >
              {t("productDetail", "orderNow")}
            </Button>
          </div>

          {/* Authenticity & Batch Code Verification Card */}
          {featureSettings?.enable_authenticity_verification !== false && (
            <div className="rounded-2xl border border-pink-200 bg-linear-to-r from-pink-50/50 to-purple-50/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#e91e63]" />
                  <span className="text-xs font-black text-pink-950 uppercase tracking-wider">
                    {language === "bn" ? "১০০% অরিজিনাল ও অথেন্টিসিটি গ্যারান্টি" : "Authenticity & Provenance Guarantee"}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {language === "bn" ? "ভেরিফাইড খাঁটি" : "Verified Genuine"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="rounded-xl bg-white p-2 border border-pink-100 shadow-2xs">
                  <span className="text-gray-400 font-medium block">{language === "bn" ? "উৎস দেশ:" : "Origin:"}</span>
                  <span className="font-bold text-gray-900">
                    {language === "bn" ? (ORIGIN_MAP[originCountry]?.bn || originCountry) : (ORIGIN_MAP[originCountry]?.en || originCountry)}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-2 border border-pink-100 shadow-2xs">
                  <span className="text-gray-400 font-medium block">{language === "bn" ? "ব্যাচ কোড:" : "Batch Code:"}</span>
                  <span className="font-mono font-bold text-gray-900">
                    {product.batch_number || "LOT2024BD01"}
                  </span>
                </div>
                <div className="rounded-xl bg-white p-2 border border-pink-100 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-gray-400 font-medium block">{language === "bn" ? "মেয়াদ:" : "Shelf Freshness:"}</span>
                  <span className="font-bold text-emerald-700">
                    {product.expiry_date ? `Exp: ${product.expiry_date}` : (language === "bn" ? "২৪ মাস ফ্রেশ গ্যারান্টি" : "24M Fresh Guarantee")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery & Returns Trust Badges */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface-secondary/50 p-3.5 text-center text-xs">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-4.5 w-4.5 text-[#e91e63]" />
              <span className="font-bold text-text text-[11px]">{t("footer", "authenticTitle")}</span>
              <span className="text-[10px] text-text-muted">{language === "bn" ? "সরাসরি আমদানিকৃত" : "Direct Importer"}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-4.5 w-4.5 text-[#e91e63]" />
              <span className="font-bold text-text text-[11px]">{t("footer", "deliveryTitle")}</span>
              <span className="text-[10px] text-text-muted">Steadfast &amp; Pathao</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-4.5 w-4.5 text-[#e91e63]" />
              <span className="font-bold text-text text-[11px]">{t("footer", "returnTitle")}</span>
              <span className="text-[10px] text-text-muted">{language === "bn" ? "সহজ এক্সচেঞ্জ" : "Easy Wallet Refund"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Frequently Bought Together (Combo Bundle Section) */}
      {featureSettings?.enable_combo_bundle_section !== false && (
        <FrequentlyBoughtTogether bundleData={bundleData} />
      )}

      {/* 3. Structured Information - Responsive Accordion */}
      <div className="rounded-3xl border border-gray-200/90 bg-white shadow-xs overflow-hidden divide-y divide-gray-100">
        {[
          {
            id: "description",
            label: t("productDetail", "tabDescription"),
            icon: FileText,
            badge: null,
            content: (
              <div className="space-y-4 max-w-4xl">
                {product.description ? (
                  <div
                    className="prose prose-base sm:prose-lg prose-pink max-w-full text-base sm:text-[17px] font-normal text-gray-800 leading-relaxed sm:leading-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-gray-100 [&_img]:my-4 [&_a]:text-[#e91e63] [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-base sm:text-[17px] text-gray-700 leading-relaxed">
                    {product.short_description || "Certified authentic beauty product directly imported from brand manufacturers."}
                  </p>
                )}
              </div>
            ),
          },
          {
            id: "benefits",
            label: t("productDetail", "tabBenefits"),
            icon: Sparkles,
            badge: null,
            content: (
              <div className="space-y-4 max-w-4xl">
                {product.benefits ? (
                  <div
                    className="prose prose-base sm:prose-lg prose-pink max-w-full text-base sm:text-[17px] font-normal text-gray-800 leading-relaxed sm:leading-8 [&_img]:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: product.benefits }}
                  />
                ) : (
                  <div className="space-y-3 text-base sm:text-[17px] text-gray-800 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-5 w-5 text-[#e91e63] shrink-0 mt-0.5" />
                      <span>Leaves skin feeling soft, comfortable, and well-hydrated.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-5 w-5 text-[#e91e63] shrink-0 mt-0.5" />
                      <span>Formulated without harsh parabens, synthetic dyes, or drying sulfates.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-5 w-5 text-[#e91e63] shrink-0 mt-0.5" />
                      <span>Gentle and suitable for everyday skincare routines.</span>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "usage",
            label: t("productDetail", "tabUsage"),
            icon: BookOpen,
            badge: null,
            content: (
              <div className="space-y-4 max-w-4xl">
                {product.usage ? (
                  <div
                    className="prose prose-base sm:prose-lg prose-pink max-w-full text-base sm:text-[17px] font-normal text-gray-800 leading-relaxed sm:leading-8 [&_img]:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: product.usage }}
                  />
                ) : (
                  <div className="space-y-3 text-base sm:text-[17px] text-gray-800 leading-relaxed">
                    <p className="font-bold text-gray-900 text-lg">Recommended Beauty Routine Step:</p>
                    <p className="text-[#e91e63] font-bold text-base pb-2">
                      {product.routine_step ? `Step: ${product.routine_step}` : "Daily Skincare Routine"}
                    </p>
                    <ol className="list-decimal list-inside space-y-2.5 pl-1 text-gray-700">
                      <li>Cleanse skin thoroughly with warm water.</li>
                      <li>Dispense appropriate amount onto fingertips or palms.</li>
                      <li>Gently massage over face and neck in circular upward motions.</li>
                      <li>Follow with sunscreen during daytime.</li>
                    </ol>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "ingredients",
            label: t("productDetail", "tabIngredients"),
            icon: FlaskConical,
            badge: keyActives.length > 0 ? `${keyActives.length} Actives` : null,
            content: (
              <div className="space-y-4 max-w-4xl text-base sm:text-[17px]">
                {keyActives.length > 0 && (
                  <div className="space-y-2 pb-2">
                    <span className="font-bold text-gray-900 text-base sm:text-lg block">Key Ingredients:</span>
                    <div className="flex flex-wrap gap-2">
                      {keyActives.map((ka: string) => (
                        <span
                          key={ka}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-800"
                        >
                          <Zap className="h-3.5 w-3.5 shrink-0" />
                          <span>{ka}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.ingredients_specifications ? (
                  <div
                    className="prose prose-base sm:prose-lg prose-pink max-w-full text-base sm:text-[17px] font-normal text-gray-800 leading-relaxed sm:leading-8"
                    dangerouslySetInnerHTML={{ __html: product.ingredients_specifications }}
                  />
                ) : (
                  <>
                    <p className="font-bold text-gray-900 text-base sm:text-lg">Full Ingredient List (INCI):</p>
                    <p className="font-mono text-xs sm:text-sm text-gray-600 bg-surface-secondary p-4 rounded-2xl border border-border leading-relaxed">
                      Aqua/Water/Eau, Glycerin, Niacinamide, Hyaluronic Acid, Centella Asiatica Extract, Tocopheryl Acetate (Vitamin E), Panthenol (Pro-Vitamin B5), Phenoxyethanol, Ethylhexylglycerin.
                    </p>
                  </>
                )}
              </div>
            ),
          },
          {
            id: "authenticity",
            label: t("productDetail", "tabAuthenticity"),
            icon: ShieldCheck,
            badge: language === "bn" ? "১০০% খাঁটি" : "100% Genuine",
            content: (
              <div className="space-y-4 max-w-4xl">
                <div className="flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl bg-pink-50/60 border border-pink-200">
                  <ShieldCheck className="h-9 w-9 text-[#e91e63] shrink-0" />
                  <div>
                    <h4 className="font-black text-gray-900 text-base sm:text-lg">
                      {language === "bn" ? "১০০% গ্যারান্টিযুক্ত ব্র্যান্ড অথেন্টিসিটি" : "100% Guaranteed Brand Authenticity"}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-0.5">
                      {language === "bn"
                        ? `সরাসরি ${ORIGIN_MAP[originCountry]?.bn || originCountry}-এর অথরাইজড প্রস্তুতকারক থেকে আমদানিকৃত। কোনো রেপ্লিকা বা মেয়াদোত্তীর্ণ পণ্যের সুযোগ নেই।`
                        : `Imported directly from authorized manufacturers in ${ORIGIN_MAP[originCountry]?.en || originCountry}. Zero replicas or expired stock guaranteed.`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-sm sm:text-base">
                  <div className="p-4 rounded-xl border border-gray-200 bg-surface-secondary/40 space-y-1">
                    <span className="font-bold text-gray-900 block">{language === "bn" ? "ব্যাচ কোড:" : "Batch Code:"}</span>
                    <span className="font-mono text-gray-700 font-semibold">{product.batch_number || "LOT2024BD01"}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-surface-secondary/40 space-y-1">
                    <span className="font-bold text-gray-900 block">{language === "bn" ? "মেয়াদ:" : "Freshness Shelf-Life:"}</span>
                    <span className="text-emerald-700 font-bold">
                      {product.expiry_date ? `Exp: ${product.expiry_date}` : (language === "bn" ? "খোলার পর ২৪ মাস ব্যবহারযোগ্য" : "24 Months After Opening (PAO)")}
                    </span>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "warranty",
            label: language === "bn" ? "ডেলিভারি ও রিটার্ন" : "Delivery & Returns",
            icon: Truck,
            badge: null,
            content: (
              <div className="space-y-3.5 max-w-4xl text-base sm:text-[17px] text-gray-800 leading-relaxed">
                <p className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === "bn" ? "সারা দেশে ডেলিভারি ও রিটার্ন পলিসি:" : "Nationwide Shipping & Returns Policy:"}
                </p>
                <p>
                  {language === "bn"
                    ? "• ঢাকার ভেতরে: দ্রুততম কুরিয়ারে ২৪–৪৮ ঘণ্টার মধ্যে ডেলিভারি।"
                    : "• Inside Dhaka: Delivered within 24–48 hours via fast courier (Steadfast / Pathao)."}
                </p>
                <p>
                  {language === "bn"
                    ? "• ঢাকার বাইরে: ৩-৫ কার্যদিবসে সারা দেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা।"
                    : "• Outside Dhaka: Delivered in 2–4 business days with Cash on Delivery available nationwide."}
                </p>
                <p>
                  {language === "bn"
                    ? "• ৭ দিনের সহজ রিটার্ন: পণ্য অক্ষত ও সিলযুক্ত অবস্থায় ৭ দিনের মধ্যে সহজ এক্সচেঞ্জ ও রিটার্ন।"
                    : "• 7-Day Return Guarantee: Returns accepted if package is unopened and intact."}
                </p>
              </div>
            ),
          },
          {
            id: "reviews",
            label: language === "bn" ? "রিভিউ ও প্রশ্নোত্তর" : "Customer Reviews & Q&A",
            icon: MessageSquare,
            badge: null,
            content: <ProductReviewsQA productId={product.id} />,
          },
        ].map((item) => {
          const isOpen = !!openAccordions[item.id];
          const Icon = item.icon;

          return (
            <div key={item.id} id={`accordion-item-${item.id}`} className="transition-colors">
              <button
                type="button"
                onClick={() => toggleAccordion(item.id)}
                aria-expanded={isOpen}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-5 sm:px-7 py-4.5 text-left transition-all duration-200 group select-none",
                  isOpen
                    ? "bg-pink-50/20 text-[#e91e63]"
                    : "bg-white hover:bg-gray-50/70 text-gray-900"
                )}
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                      isOpen
                        ? "bg-[#e91e63] text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 group-hover:bg-pink-100/60 group-hover:text-[#e91e63]"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span
                    className={cn(
                      "text-sm sm:text-base font-extrabold tracking-tight truncate",
                      isOpen ? "text-[#e91e63]" : "text-gray-900 group-hover:text-[#e91e63]"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100/70 text-[#e91e63] border border-pink-200">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center transition-transform duration-200",
                      isOpen
                        ? "bg-pink-100 text-[#e91e63] rotate-180"
                        : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-700"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-8 pt-4 pb-6 sm:pb-8 text-base text-text-secondary leading-relaxed border-t border-pink-100/40 bg-white animate-in fade-in-50 duration-200">
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3.5 Beauty Taxonomy, Key Specs & Product Tags Section */}
      {((skinTypes && skinTypes.length > 0) ||
        (skinConcerns && skinConcerns.length > 0) ||
        (keyActives && keyActives.length > 0) ||
        product.routine_step ||
        (productTags && productTags.length > 0)) && (
        <div className="rounded-3xl border border-pink-100 bg-linear-to-b from-pink-50/40 via-white to-purple-50/20 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-pink-100/80 pb-3">
            <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#e91e63]" />
              {language === "bn"
                ? "বিউটি স্পেসিফিকেশন ও প্রোডাক্ট ট্যাগস"
                : "Beauty Taxonomy Specs & Tags"}
            </h3>
            <span className="text-[11px] font-bold text-gray-400">
              {language === "bn" ? "পণ্য খুঁজতে ট্যাগ এ ক্লিক করুন" : "Click to explore similar products"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Skin Types */}
            {skinTypes && skinTypes.length > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                  <Droplets className="h-3.5 w-3.5 text-blue-600" />
                  <span>{language === "bn" ? "স্কিন টাইপ / উপযোগী ত্বক" : "Target Skin Types"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skinTypes.map((st: string) => (
                    <Link
                      key={st}
                      href={`/products?skin_type=${encodeURIComponent(st)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                    >
                      <span>💧</span>
                      <span>{st}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Concerns */}
            {skinConcerns && skinConcerns.length > 0 && (
              <div className="rounded-2xl border border-purple-100 bg-white/90 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-extrabold text-purple-900 text-xs uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>{language === "bn" ? "স্কিন কনসার্ন / ত্বকের সমস্যা সমাধান" : "Skin Concerns & Benefits"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skinConcerns.map((sc: string) => (
                    <Link
                      key={sc}
                      href={`/products?skin_concern=${encodeURIComponent(sc)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-800 hover:bg-purple-600 hover:text-white transition-all shadow-2xs"
                    >
                      <span>🎯</span>
                      <span>{sc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Key Active Ingredients */}
            {keyActives && keyActives.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-900 text-xs uppercase tracking-wider">
                  <Zap className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{language === "bn" ? "মূল উপাদান ও অ্যাক্টিভস" : "Key Active Ingredients"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {keyActives.map((ka: string) => (
                    <Link
                      key={ka}
                      href={`/products?key_actives=${encodeURIComponent(ka)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
                    >
                      <span>⚡</span>
                      <span>{ka}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Routine Step & Country Details */}
            {(product.routine_step || originCountry) && (
              <div className="rounded-2xl border border-pink-100 bg-white/90 p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-extrabold text-pink-900 text-xs uppercase tracking-wider">
                  <Tag className="h-3.5 w-3.5 text-[#e91e63]" />
                  <span>{language === "bn" ? "স্কিনকেয়ার রুটিন ও অরিজিন" : "Routine Step & Origin"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.routine_step && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs font-bold text-[#e91e63]">
                      <span>✨</span>
                      <span>{language === "bn" ? `ধাপ: ${product.routine_step}` : `Step: ${product.routine_step}`}</span>
                    </span>
                  )}
                  {originCountry && (
                    <Link
                      href={`/products?origin=${encodeURIComponent(originCountry)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-bold text-gray-800 hover:bg-gray-900 hover:text-white transition-all"
                    >
                      <span>🌍</span>
                      <span>{language === "bn" ? (ORIGIN_MAP[originCountry]?.bn || originCountry) : (ORIGIN_MAP[originCountry]?.en || originCountry)}</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Tags */}
          {productTags && productTags.length > 0 && (
            <div className="pt-2 border-t border-pink-100/60">
              <div className="flex items-center gap-1.5 mb-2.5 font-extrabold text-gray-800 text-xs uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5 text-[#e91e63]" />
                <span>{language === "bn" ? "প্রোডাক্ট ট্যাগস (#Tags)" : "Related Product Tags"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {productTags.map((tag: any) => (
                  <Link
                    key={tag.id || tag.slug || tag.name}
                    href={`/products?tag=${encodeURIComponent(tag.slug || tag.name)}`}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100/80 border border-gray-200 hover:border-[#e91e63] hover:bg-pink-50 hover:text-[#e91e63] px-3 py-1 text-xs font-bold text-gray-700 transition-all shadow-2xs"
                  >
                    <span className="text-[#e91e63] font-black">#</span>
                    <span>{tag.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="space-y-5 pt-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-text">
              {language === "bn" ? "আপনার আরও পছন্দ হতে পারে" : "You May Also Love"}
            </h3>
            <Link
              href="/products"
              className="text-xs font-extrabold text-[#e91e63] hover:underline"
            >
              {t("home", "viewAll")} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {relatedProducts.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Sticky Floating Mobile Purchase Bar (Slide up when scrolled past buy box) */}
      {featureSettings?.enable_sticky_mobile_cta !== false && showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border p-3 lg:hidden shadow-[0_-8px_25px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-gray-50">
              <img
                src={selectedImage || product.og_image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-text truncate">{product.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-pink-600">
                  {formatPriceBn(effectivePrice)}
                </span>
                {selectedVariant && (
                  <span className="text-[10px] font-bold text-gray-500 truncate">
                    ({selectedVariant.title || selectedVariant.name})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                size="sm"
                className="rounded-xl h-10 px-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-extrabold active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </Button>

              <Button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                size="sm"
                className="rounded-xl h-10 px-4 bg-[#e91e63] hover:bg-sg-pink-hover text-white text-xs font-black shadow-md active:scale-95"
              >
                {t("product", "buyNow")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
