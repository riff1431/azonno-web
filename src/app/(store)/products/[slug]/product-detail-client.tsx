"use client";

import { useState, useEffect, useRef } from "react";
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

  // Gallery Images
  const mediaList = product.product_media || [];
  const imageUrls: string[] = [];
  if (product.og_image_url) imageUrls.push(product.og_image_url);
  mediaList.forEach((pm: any) => {
    if (pm.media?.secure_url && !imageUrls.includes(pm.media.secure_url)) {
      imageUrls.push(pm.media.secure_url);
    }
  });

  const [selectedImage, setSelectedImage] = useState<string>(
    imageUrls[0] || ""
  );

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

  const inv = product.inventory as Array<{ available: number }> | null;
  const availableStock = inv && inv.length > 0 ? inv[0].available : 10;
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

  return (
    <div className="space-y-12">
      {/* 1. Main Gallery + Info Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
        {/* Left 5 Cols: Gallery */}
        <div className="lg:col-span-5 space-y-3">
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
            className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-white shadow-xs flex items-center justify-center cursor-zoom-in group select-none touch-none"
          >
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                style={{
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transform: isZoomed ? "scale(2.4)" : "scale(1)",
                  transition: isZoomed
                    ? "transform 0.05s ease-out"
                    : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="h-full w-full object-cover object-center will-change-transform pointer-events-none"
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

          {/* Thumbnails list */}
          {imageUrls.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(url)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition-all p-1 bg-surface-secondary btn-soft-fill",
                    selectedImage === url
                      ? "border-[#e91e63] ring-2 ring-[#e91e63]/20 shadow-xs scale-105"
                      : "border-border hover:border-text-muted opacity-80 hover:opacity-100"
                  )}
                >
                  <img src={url} alt="thumbnail" className="h-full w-full object-contain" />
                </button>
              ))}
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

          {/* Categories, Tags, Skin Concerns & Types Tag Pills */}
          {(() => {
            const prodCats = (product.product_categories || []).map((pc: any) => pc.categories).filter(Boolean);
            const prodTags = (product.product_tags || []).map((pt: any) => pt.tags).filter(Boolean);
            const hasTaxonomies = prodCats.length > 0 || prodTags.length > 0 || skinConcerns.length > 0 || skinTypes.length > 0;
            if (!hasTaxonomies) return null;

            return (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {/* Categories */}
                {prodCats.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[11px] font-bold text-[#e91e63] hover:bg-pink-100 hover:border-pink-300 transition-colors"
                  >
                    <FolderTree className="h-2.5 w-2.5 shrink-0" />
                    <span>{c.name}</span>
                  </Link>
                ))}

                {/* Tags */}
                {prodTags.map((tg: any) => (
                  <Link
                    key={tg.id}
                    href={`/tags/${tg.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-[11px] font-bold text-gray-700 hover:bg-[#e91e63] hover:text-white hover:border-[#e91e63] transition-all shadow-2xs"
                  >
                    <Tag className="h-2.5 w-2.5 shrink-0" />
                    <span>#{tg.name}</span>
                  </Link>
                ))}

                {/* Concerns */}
                {skinConcerns.map((sc: string) => {
                  const label = language === "bn" ? (SKIN_CONCERN_MAP[sc]?.bn || sc) : (SKIN_CONCERN_MAP[sc]?.en || sc);
                  return (
                    <Link
                      key={sc}
                      href={`/products?skin_concern=${encodeURIComponent(sc)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      <Sparkles className="h-2.5 w-2.5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}

                {/* Skin Types */}
                {skinTypes.map((st: string) => {
                  const label = language === "bn" ? (SKIN_TYPE_MAP[st]?.bn || st) : (SKIN_TYPE_MAP[st]?.en || st);
                  return (
                    <Link
                      key={st}
                      href={`/products?skin_type=${encodeURIComponent(st)}`}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Droplets className="h-2.5 w-2.5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })()}

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
                    ? "২,০০০ টাকার অর্ডারে সারা দেশে ফ্রি ডেলিভারি।"
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
              {isOutOfStock ? t("productDetail", "outOfStock") : t("productDetail", "inStock")}
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
              <div className="space-y-4 max-w-3xl">
                {product.description ? (
                  <div
                    className="prose prose-sm prose-pink max-w-full font-medium leading-relaxed [&_img]:rounded-2xl [&_img]:border [&_img]:border-gray-100 [&_img]:my-3 [&_a]:text-[#e91e63] [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p>{product.short_description || "Certified authentic beauty product directly imported from brand manufacturers."}</p>
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
              <div className="space-y-3 max-w-3xl">
                {product.benefits ? (
                  <div
                    className="prose prose-sm prose-pink max-w-full font-medium text-gray-800 leading-relaxed [&_img]:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: product.benefits }}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#e91e63] shrink-0" />
                      <span>Leaves skin feeling soft, comfortable, and well-hydrated.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#e91e63] shrink-0" />
                      <span>Formulated without harsh parabens, synthetic dyes, or drying sulfates.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#e91e63] shrink-0" />
                      <span>Gentle and suitable for everyday skincare routines.</span>
                    </div>
                  </>
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
              <div className="space-y-3 max-w-3xl">
                {product.usage ? (
                  <div
                    className="prose prose-sm prose-pink max-w-full font-medium text-gray-800 leading-relaxed [&_img]:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: product.usage }}
                  />
                ) : (
                  <>
                    <p className="font-bold text-text">Recommended Beauty Routine Step:</p>
                    <p className="text-[#e91e63] font-bold pb-2">
                      {product.routine_step ? `Step: ${product.routine_step}` : "Daily Skincare Routine"}
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>Cleanse skin thoroughly with warm water.</li>
                      <li>Dispense appropriate amount onto fingertips or palms.</li>
                      <li>Gently massage over face and neck in circular upward motions.</li>
                      <li>Follow with sunscreen during daytime.</li>
                    </ol>
                  </>
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
              <div className="space-y-3 max-w-3xl">
                {keyActives.length > 0 && (
                  <div className="space-y-1.5 pb-2">
                    <span className="font-bold text-gray-900 block">Key Ingredients:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {keyActives.map((ka: string) => (
                        <span
                          key={ka}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800"
                        >
                          <Zap className="h-2.5 w-2.5 shrink-0" />
                          <span>{ka}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.ingredients_specifications ? (
                  <div
                    className="prose prose-sm prose-pink max-w-full font-medium text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.ingredients_specifications }}
                  />
                ) : (
                  <>
                    <p className="font-bold text-text">Full Ingredient List (INCI):</p>
                    <p className="font-mono text-xs text-text-muted bg-surface-secondary p-4 rounded-2xl border border-border">
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
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-pink-50/60 border border-pink-200">
                  <ShieldCheck className="h-8 w-8 text-[#e91e63] shrink-0" />
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">
                      {language === "bn" ? "১০০% গ্যারান্টিযুক্ত ব্র্যান্ড অথেন্টিসিটি" : "100% Guaranteed Brand Authenticity"}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {language === "bn"
                        ? `সরাসরি ${ORIGIN_MAP[originCountry]?.bn || originCountry}-এর অথরাইজড প্রস্তুতকারক থেকে আমদানিকৃত। কোনো রেপ্লিকা বা মেয়াদোত্তীর্ণ পণ্যের সুযোগ নেই।`
                        : `Imported directly from authorized manufacturers in ${ORIGIN_MAP[originCountry]?.en || originCountry}. Zero replicas or expired stock guaranteed.`}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-surface-secondary/40 space-y-1">
                    <span className="font-bold text-gray-900 block">{language === "bn" ? "ব্যাচ কোড:" : "Batch Code:"}</span>
                    <span className="font-mono text-gray-700">{product.batch_number || "LOT2024BD01"}</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-surface-secondary/40 space-y-1">
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
              <div className="space-y-3 max-w-3xl">
                <p className="font-bold text-text">
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
                  "w-full flex items-center justify-between gap-3 px-5 sm:px-7 py-4 text-left transition-all duration-200 group select-none",
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
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-extrabold tracking-tight truncate",
                      isOpen ? "text-[#e91e63]" : "text-gray-900 group-hover:text-[#e91e63]"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100/70 text-[#e91e63] border border-pink-200">
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
                <div className="px-5 sm:px-8 pt-3 pb-6 sm:pb-8 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-pink-100/40 bg-white animate-in fade-in-50 duration-200">
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
