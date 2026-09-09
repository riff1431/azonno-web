"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, ArrowLeft, Package, FileText,
  DollarSign, Ruler, Image as ImageIcon, Search,
  Box, Layers, Upload, Trash2, Plus, Check, X, Sparkles, Tag, Truck,
  AlertTriangle, AlertCircle, ShieldCheck, Clock, Calendar, Eye,
  Star, ChevronLeft, ChevronRight, Beaker, Scale
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { generateSlug, cn, formatShortProductId } from "@/lib/utils";
import {
  createProduct,
  updateProduct,
  getProducts,
  getNextProductSerial,
  getCustomTaxonomyOptions,
  saveCustomTaxonomyOption,
  deleteCustomTaxonomyOption,
} from "@/features/products/actions";
import { getCategories } from "@/features/categories/actions";
import { getBrands } from "@/features/brands/actions";
import { getAttributes } from "@/features/attributes/actions";
import { getProductComboConfig, saveProductComboConfig } from "@/features/products/combo-actions";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";
import { useAdminLang } from "@/lib/admin-lang-context";
import { ProductPreviewModal } from "./product-preview-modal";

function parseInitialArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const SKIN_TYPES_DATA = [
  { value: "Oily", en: "Oily", bn: "তৈলাক্ত ত্বক (Oily)" },
  { value: "Dry", en: "Dry", bn: "শুষ্ক ত্বক (Dry)" },
  { value: "Combination", en: "Combination", bn: "কম্বিনেশন / মিশ্র ত্বক" },
  { value: "Sensitive", en: "Sensitive", bn: "সেনসিটিভ ত্বক (Sensitive)" },
  { value: "Normal", en: "Normal", bn: "স্বাভাবিক ত্বক (Normal)" },
  { value: "All Skin Types", en: "All Skin Types", bn: "সকল ধরণের ত্বক (All Skin)" },
];

const SKIN_CONCERNS_DATA = [
  { value: "Clear Skin & Blemishes", en: "Clear Skin & Blemishes", bn: "পরিষ্কার ত্বক ও দাগহীন ভাব" },
  { value: "Brightening & Even Tone", en: "Brightening & Even Tone", bn: "উজ্জ্বলতা ও সমান স্কিন টোন" },
  { value: "Smooth Lines & Firmness", en: "Smooth Lines & Firmness", bn: "কোমল ও টানটান অনুভূতি" },
  { value: "Hydration & Moisture", en: "Hydration & Moisture", bn: "আর্দ্রতা ও হাইড্রেশন (Hydration)" },
  { value: "Pore & Oil Care", en: "Pore & Oil Care", bn: "পোর ও অতিরিক্ত তেল নিয়ন্ত্রণ" },
  { value: "Redness & Soothing", en: "Redness & Soothing", bn: "লালচে ভাব ও প্রশান্তিদায়ক যত্ন" },
  { value: "Sun Protection", en: "Sun Protection", bn: "রোদে সুরক্ষা (Sun Protection / SPF)" },
  { value: "Dark Circles & Eye Care", en: "Dark Circles & Eye Care", bn: "চোখের নিচের যত্ন (Eye Care)" },
  { value: "Oil Control", en: "Oil Control", bn: "তেল নিয়ন্ত্রণ ও ফ্রেশ লুক" },
  { value: "Barrier Care", en: "Barrier Care", bn: "স্কিন ব্যারিয়ার কেয়ার (Barrier Care)" },
];

const ROUTINE_STEPS_DATA = [
  { value: "", en: "— Select Routine Step —", bn: "— রুটিনের ধাপ বেছে নিন —" },
  { value: "Cleanser", en: "1. Cleanser (Oil / Foam)", bn: "১. ক্লিনজার (Cleanser - Oil/Foam)" },
  { value: "Toner", en: "2. Toner / Mist", bn: "২. টোনার / মিস্ট (Toner / Mist)" },
  { value: "Essence & Serum", en: "3. Essence / Serum / Ampoule", bn: "৩. এসেন্স / সিরাম / অ্যাম্পুল (Serum)" },
  { value: "Moisturizer & Cream", en: "4. Moisturizer / Emulsion / Cream", bn: "৪. ময়েশ্চারাইজার / ক্রিম (Moisturizer)" },
  { value: "Sunscreen / SPF", en: "5. Sunscreen / SPF", bn: "৫. সানস্ক্রিন / এসপিএফ (Sunscreen)" },
  { value: "Eye Cream", en: "Eye Care / Eye Cream", bn: "আই কেয়ার / আই ক্রিম (Eye Cream)" },
  { value: "Mask & Exfoliator", en: "Mask / Scrub / Peeling", bn: "ফেস মাস্ক / স্ক্রাব (Mask & Scrub)" },
  { value: "Treatment", en: "Targeted Serum / Spot Care", bn: "টার্গেটেড সিরাম / স্পট কেয়ার (Spot Care)" },
  { value: "Lip Care", en: "Lip Balm / Lip Mask", bn: "লিপ কেয়ার / লিপ বাম (Lip Care)" },
  { value: "Makeup & Cushion", en: "Makeup / Cushion / Foundation", bn: "মেকআপ / কুশন / ফাউন্ডেশন (Makeup)" },
];

const ORIGINS_DATA = [
  { value: "South Korea", en: "South Korea (K-Beauty)", bn: "দক্ষিণ কোরিয়া / কে-বিউটি (K-Beauty)" },
  { value: "Japan", en: "Japan (J-Beauty)", bn: "জাপান / জে-বিউটি (J-Beauty)" },
  { value: "United Kingdom", en: "United Kingdom (UK)", bn: "যুক্তরাজ্য (UK)" },
  { value: "United States", en: "United States (USA)", bn: "যুক্তরাষ্ট্র (USA)" },
  { value: "France", en: "France", bn: "ফ্রান্স (France)" },
  { value: "Germany", en: "Germany", bn: "জার্মানি (Germany)" },
  { value: "Thailand", en: "Thailand", bn: "থাইল্যান্ড (Thailand)" },
  { value: "Bangladesh", en: "Bangladesh", bn: "বাংলাদেশ (Bangladesh)" },
  { value: "India", en: "India", bn: "ভারত (India)" },
  { value: "Canada", en: "Canada", bn: "কানাডা (Canada)" },
  { value: "Australia", en: "Australia", bn: "অস্ট্রেলিয়া (Australia)" },
  { value: "Italy", en: "Italy", bn: "ইতালি (Italy)" },
];

const KEY_ACTIVES_DATA = [
  { value: "Niacinamide", en: "Niacinamide", bn: "নিয়াসিনামাইড (Niacinamide)" },
  { value: "Hyaluronic Acid", en: "Hyaluronic Acid", bn: "হায়ালুরোনিক অ্যাসিড (Hyaluronic Acid)" },
  { value: "Salicylic Acid (BHA)", en: "Salicylic Acid (BHA)", bn: "স্যালিসিলিক অ্যাসিড (BHA)" },
  { value: "Glycolic Acid (AHA)", en: "Glycolic Acid (AHA)", bn: "গ্লাইকোলিক অ্যাসিড (AHA)" },
  { value: "Vitamin C", en: "Vitamin C", bn: "ভিটামিন সি (Vitamin C)" },
  { value: "Retinol", en: "Retinol", bn: "রেটিনল (Retinol)" },
  { value: "Centella Asiatica (Cica)", en: "Centella Asiatica (Cica)", bn: "সিকা / সেন্টেলা (Centella / Cica)" },
  { value: "Snail Secretion Filtrate", en: "Snail Secretion Filtrate", bn: "স্নেইল মিউসিন (Snail Mucin)" },
  { value: "Ceramides", en: "Ceramides", bn: "সেরামাইডস (Ceramides)" },
  { value: "Zinc PCA", en: "Zinc PCA", bn: "জিংক পিসিএ (Zinc PCA)" },
  { value: "Alpha Arbutin", en: "Alpha Arbutin", bn: "আলফা আরবুটিন (Alpha Arbutin)" },
  { value: "Tea Tree", en: "Tea Tree", bn: "টি ট্রি (Tea Tree)" },
  { value: "Peptides", en: "Peptides", bn: "পেপটাইডস (Peptides)" },
  { value: "Mugwort", en: "Mugwort", bn: "মাগওয়ার্ট (Mugwort)" },
  { value: "Galactomyces", en: "Galactomyces", bn: "গ্যালাক্টোমাইসিস (Galactomyces)" },
  { value: "Tranexamic Acid", en: "Tranexamic Acid", bn: "ট্রানেক্সামিক অ্যাসিড (Tranexamic Acid)" },
];

interface AttributeOption {
  id: string;
  name: string;
  type: string;
  attribute_values: Array<{
    id: string;
    value: string;
    color_hex: string | null;
  }>;
}

interface VariantItem {
  id?: string;
  sku: string;
  regular_price: number;
  sale_price: number;
  cost_price: number;
  weight: number;
  status: "active" | "inactive";
  attribute_value_ids: string[];
  attribute_labels: string[];
}

export default function ProductForm({ initialData }: { initialData?: Record<string, unknown> }) {
  const router = useRouter();
  const { lang, t } = useAdminLang();
  const isBn = lang === "bn";
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedSku, setSuggestedSku] = useState<number | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; parent_id: string | null }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [availableAttributes, setAvailableAttributes] = useState<AttributeOption[]>([]);

  // Extract initial gallery images from initialData relations & product_media
  const initialGalleryImages: string[] = useMemo(() => {
    if (!initialData) return [];
    const list: string[] = [];
    if (Array.isArray(initialData.product_media)) {
      const sorted = [...(initialData.product_media as any[])].sort((a, b) => {
        if (a.is_featured) return -1;
        if (b.is_featured) return 1;
        return (a.position || 0) - (b.position || 0);
      });
      sorted.forEach((pm: any) => {
        const url = pm.media?.secure_url || pm.secure_url;
        if (url && typeof url === "string" && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    if (initialData.og_image_url && typeof initialData.og_image_url === "string") {
      if (!list.includes(initialData.og_image_url)) {
        list.unshift(initialData.og_image_url);
      }
    }
    return list;
  }, [initialData]);

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>(initialGalleryImages);

  // Variant generator state
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [selectedValuesByAttr, setSelectedValuesByAttr] = useState<Record<string, string[]>>({});
  const [generatedVariants, setGeneratedVariants] = useState<VariantItem[]>([]);

  // Frequently Bought Together Combo Bundle State
  const [catalogProducts, setCatalogProducts] = useState<Array<{ id: string; name: string; regular_price: number; sale_price?: number | null; og_image_url?: string | null }>>([]);
  const [bundleSearch, setBundleSearch] = useState("");
  const [comboConfig, setComboConfig] = useState({
    enabled: true,
    title: "Frequently Bought Together",
    discount_type: "percentage" as "percentage" | "fixed" | "free_shipping",
    discount_value: 10,
    bundle_product_ids: [] as string[],
    badge_text: "Combo Special • Save 10%",
  });

  // Extract initial categories from initialData relations
  const initialCategoryIds: string[] = useMemo(() => {
    if (!initialData) return [];
    if (Array.isArray(initialData.product_categories)) {
      return (initialData.product_categories as any[])
        .map((pc: any) => pc.category_id || pc.categories?.id)
        .filter(Boolean);
    }
    if (initialData.category_id) return [String(initialData.category_id)];
    return [];
  }, [initialData]);

  // Extract initial tags from initialData relations
  const initialTagsString: string = useMemo(() => {
    if (!initialData) return "";
    if (Array.isArray(initialData.product_tags)) {
      return (initialData.product_tags as any[])
        .map((pt: any) => pt.tags?.name || pt.name)
        .filter(Boolean)
        .join(", ");
    }
    if (Array.isArray(initialData.tags)) {
      return (initialData.tags as string[]).join(", ");
    }
    if (typeof initialData.tags === "string") return initialData.tags;
    return "";
  }, [initialData]);

  const initialStockValue = useMemo(() => {
    if (!initialData) return 0;
    if (Array.isArray(initialData.inventory) && (initialData.inventory as any[]).length > 0) {
      return (initialData.inventory as any[])[0]?.on_hand ?? 0;
    }
    if (initialData.inventory && typeof (initialData.inventory as any).on_hand === "number") {
      return (initialData.inventory as any).on_hand;
    }
    return 0;
  }, [initialData]);

  const [form, setForm] = useState({
    name: (initialData?.name as string) ?? "",
    slug: (initialData?.slug as string) ?? "",
    sku: (initialData?.sku as string) ?? "",
    barcode: (initialData?.barcode as string) ?? "",
    product_type: (initialData?.product_type as string) ?? "simple",
    brand_id: (initialData?.brand_id as string) ?? "",
    status: (initialData?.status as string) ?? "draft",
    is_featured: (initialData?.is_featured as boolean) ?? false,
    selectedCategories: initialCategoryIds,
    tags: initialTagsString,
    // Content
    short_description: (initialData?.short_description as string) ?? "",
    description: (initialData?.description as string) ?? "",
    benefits: (initialData?.benefits as string) ?? "",
    usage: (initialData?.usage as string) ?? "",
    ingredients_specifications: (initialData?.ingredients_specifications as string) ?? "",
    country: (initialData?.country as string) ?? (initialData?.origin_country as string) ?? "",
    warranty: (initialData?.warranty as string) ?? "",
    // Beauty & Skin Taxonomy
    skin_type: parseInitialArray(initialData?.skin_type),
    skin_concern: parseInitialArray(initialData?.skin_concern),
    key_actives: parseInitialArray(initialData?.key_actives),
    origin_country: (initialData?.origin_country as string) ?? (initialData?.country as string) ?? "South Korea",
    routine_step: (initialData?.routine_step as string) ?? "",
    batch_number: (initialData?.batch_number as string) ?? "",
    expiry_date: (initialData?.expiry_date as string) ?? "",
    authenticity_verified: (initialData?.authenticity_verified as boolean) ?? true,
    // Pricing
    cost_price: (initialData?.cost_price as number) ?? 0,
    regular_price: (initialData?.regular_price as number) ?? 0,
    sale_price: (initialData?.sale_price as number) ?? 0,
    sale_start: (initialData?.sale_start as string) ?? "",
    sale_end: (initialData?.sale_end as string) ?? "",
    // Physical & Packaging (ml / g)
    volume_ml: (initialData?.volume_ml as string) ?? (initialData?.net_weight as string) ?? "",
    weight: (initialData?.weight as number) ?? 0,
    length: (initialData?.length as number) ?? 0,
    width: (initialData?.width as number) ?? 0,
    height: (initialData?.height as number) ?? 0,
    shipping_class: (initialData?.shipping_class as string) ?? "",
    is_free_shipping: (initialData?.shipping_class === "free_shipping" || (initialData?.is_free_shipping as boolean)) ?? false,
    // SEO
    seo_title: (initialData?.seo_title as string) ?? "",
    seo_description: (initialData?.seo_description as string) ?? "",
    canonical_override: (initialData?.canonical_override as string) ?? "",
    og_image_url: (initialData?.og_image_url as string) ?? initialGalleryImages[0] ?? "",
    is_indexed: (initialData?.is_indexed as boolean) ?? true,
    // Inventory
    initial_stock: initialStockValue,
  });

  // Extract initial custom items from initialData not in predefined lists
  const initialCustomSkinTypes = useMemo(() => {
    const predefined = new Set(SKIN_TYPES_DATA.map((d) => d.value.toLowerCase()));
    const raw = parseInitialArray(initialData?.skin_type);
    return raw.filter((v) => v && !predefined.has(v.toLowerCase()));
  }, [initialData]);

  const initialCustomSkinConcerns = useMemo(() => {
    const predefined = new Set(SKIN_CONCERNS_DATA.map((d) => d.value.toLowerCase()));
    const raw = parseInitialArray(initialData?.skin_concern);
    return raw.filter((v) => v && !predefined.has(v.toLowerCase()));
  }, [initialData]);

  const initialCustomKeyActives = useMemo(() => {
    const predefined = new Set(KEY_ACTIVES_DATA.map((d) => d.value.toLowerCase()));
    const raw = parseInitialArray(initialData?.key_actives);
    return raw.filter((v) => v && !predefined.has(v.toLowerCase()));
  }, [initialData]);

  // Dynamic custom taxonomy states
  const [customSkinTypes, setCustomSkinTypes] = useState<string[]>(initialCustomSkinTypes);
  const [customSkinConcerns, setCustomSkinConcerns] = useState<string[]>(initialCustomSkinConcerns);
  const [customKeyActives, setCustomKeyActives] = useState<string[]>(initialCustomKeyActives);

  // Input states for inline adding
  const [showAddSkinType, setShowAddSkinType] = useState(false);
  const [newSkinTypeInput, setNewSkinTypeInput] = useState("");

  const [showAddSkinConcern, setShowAddSkinConcern] = useState(false);
  const [newSkinConcernInput, setNewSkinConcernInput] = useState("");

  const [showAddKeyActive, setShowAddKeyActive] = useState(false);
  const [newKeyActiveInput, setNewKeyActiveInput] = useState("");

  // Dynamic Batch & Expiry Date Alert Computation
  const expiryAlertInfo = useMemo(() => {
    if (!form.expiry_date) return null;
    const expDate = new Date(form.expiry_date);
    if (isNaN(expDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = +(diffDays / 30.4).toFixed(1);

    if (diffDays < 0) {
      return {
        type: "expired" as const,
        days: Math.abs(diffDays),
        title: isBn ? "মেয়াদোত্তীর্ণ ব্যাচ সতর্কতা (Expired)" : "Expired Cosmetic Batch Alert",
        description: isBn
          ? `এই বিউটি প্রডাক্ট ব্যাচের মেয়াদ ${Math.abs(diffDays)} দিন আগে (${form.expiry_date}) শেষ হয়ে গেছে। গ্রাহকদের সুরক্ষার জন্য এটি বিক্রির তালিকা থেকে অবিলম্বে সরিয়ে ফেলুন বা ডিস্ট্রিবিউটরকে ফেরত দিন।`
          : `This cosmetic batch expired ${Math.abs(diffDays)} day(s) ago (${form.expiry_date}). Do not sell expired skincare items — quarantine or return to distributor immediately.`,
        badgeColor: "bg-red-100 text-red-800 border-red-200",
        containerColor: "bg-red-50/90 border-red-200 text-red-900",
      };
    } else if (diffDays <= 90) {
      return {
        type: "critical" as const,
        days: diffDays,
        months: diffMonths,
        title: isBn ? "জরুরি সতর্কতা: মেয়াদ ৩ মাসের কম বাকি" : "Critical Expiry Alert (< 3 Months Remaining)",
        description: isBn
          ? `মেয়াদ শেষ হতে মাত্র ${diffDays} দিন (${diffMonths} মাস) বাকি রয়েছে। অবিক্রিত পণ্যের ক্ষতি এড়াতে এটি ফ্ল্যাশ সেল বা কম্বো অফারে দ্রুত বিক্রি করুন।`
          : `Expires in ${diffDays} days (${diffMonths} months). Skincare batches nearing 3 months should be placed on clearance sale or promotional bundle to avoid unsold losses.`,
        badgeColor: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
        containerColor: "bg-rose-50/90 border-rose-200 text-rose-950",
      };
    } else if (diffDays <= 180) {
      return {
        type: "warning" as const,
        days: diffDays,
        months: diffMonths,
        title: isBn ? "মেয়াদ সতর্কতা: ৩-৬ মাস সময় বাকি" : "Approaching Expiry Warning (3–6 Months Remaining)",
        description: isBn
          ? `মেয়াদ শেষ হতে প্রায় ${diffMonths} মাস (${diffDays} দিন) বাকি। স্বাভাবিক বিক্রির জন্য ভালো সময়, তবে নিয়মিত স্টক মনিটর করা ভালো।`
          : `Expires in ${diffDays} days (~${diffMonths} months). Good shelf-life for normal turnover, but recommended to monitor velocity before the 90-day critical cutoff.`,
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
        containerColor: "bg-amber-50/80 border-amber-200 text-amber-950",
      };
    } else {
      return {
        type: "fresh" as const,
        days: diffDays,
        months: diffMonths,
        title: isBn ? "সম্পূর্ণ ফ্রেশ ও নিরাপদ ব্যাচ (> ৬ মাস)" : "Optimal Fresh Shelf-Life (> 6 Months)",
        description: isBn
          ? `ব্যাচটির পর্যাপ্ত মেয়াদ রয়েছে (${diffMonths} মাস / ${diffDays} দিন বাকি)। স্টোরফ্রন্টে প্রদর্শনের জন্য এটি সম্পূর্ণ নিরাপদ ও পারফেক্ট।`
          : `Batch has ${diffMonths} months (${diffDays} days) of fresh shelf-life remaining. Safe for storefront display and standard marketing.`,
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
        containerColor: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
      };
    }
  }, [form.expiry_date, isBn]);

  useEffect(() => {
    Promise.all([getCategories(), getBrands(), getAttributes(), getProducts()]).then(([cats, brs, attrs, prods]) => {
      setCategories(cats as Array<{ id: string; name: string; parent_id: string | null }>);
      setBrands(brs as Array<{ id: string; name: string }>);
      setAvailableAttributes(attrs as unknown as AttributeOption[]);
      if (prods) {
        setCatalogProducts(
          (prods as any[])
            .filter((p) => p.id !== initialData?.id)
            .map((p) => ({
              id: p.id,
              name: p.name,
              regular_price: p.regular_price,
              sale_price: p.sale_price,
              og_image_url: p.og_image_url,
            }))
        );
      }
    });

    getCustomTaxonomyOptions().then((opts) => {
      if (opts.skin_types.length > 0) {
        setCustomSkinTypes((prev) => [...new Set([...prev, ...opts.skin_types])]);
      }
      if (opts.skin_concerns.length > 0) {
        setCustomSkinConcerns((prev) => [...new Set([...prev, ...opts.skin_concerns])]);
      }
      if (opts.key_actives.length > 0) {
        setCustomKeyActives((prev) => [...new Set([...prev, ...opts.key_actives])]);
      }
    }).catch(() => {});

    if (!isEditing) {
      getNextProductSerial()
        .then((serial) => setSuggestedSku(serial))
        .catch(() => {});
    }

    if (initialData?.id) {
      getProductComboConfig(initialData.id as string).then((cfg) => {
        if (cfg) {
          setComboConfig({
            enabled: cfg.enabled ?? true,
            title: cfg.title || "Frequently Bought Together",
            discount_type: cfg.discount_type || "percentage",
            discount_value: cfg.discount_value ?? 10,
            bundle_product_ids: cfg.bundle_product_ids || [],
            badge_text: cfg.badge_text || "Combo Special • Save 10%",
          });
        }
      });
    }
  }, [initialData?.id, isEditing]);

  const toggleBundleProduct = (id: string) => {
    setComboConfig((prev) => ({
      ...prev,
      bundle_product_ids: prev.bundle_product_ids.includes(id)
        ? prev.bundle_product_ids.filter((pId) => pId !== id)
        : prev.bundle_product_ids.length < 3
        ? [...prev.bundle_product_ids, id]
        : prev.bundle_product_ids,
    }));
  };

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "name" && !isEditing) {
      setForm((prev) => ({ ...prev, slug: generateSlug(value as string) }));
    }
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(id)
        ? prev.selectedCategories.filter((c) => c !== id)
        : [...prev.selectedCategories, id],
    }));
  };

  const toggleSkinType = (item: string) => {
    setForm((prev) => {
      const exists = prev.skin_type.includes(item);
      return {
        ...prev,
        skin_type: exists ? prev.skin_type.filter((t) => t !== item) : [...prev.skin_type, item],
      };
    });
  };

  const toggleSkinConcern = (item: string) => {
    setForm((prev) => {
      const exists = prev.skin_concern.includes(item);
      return {
        ...prev,
        skin_concern: exists ? prev.skin_concern.filter((c) => c !== item) : [...prev.skin_concern, item],
      };
    });
  };

  const toggleKeyActive = (item: string) => {
    setForm((prev) => {
      const exists = prev.key_actives.includes(item);
      return {
        ...prev,
        key_actives: exists ? prev.key_actives.filter((a) => a !== item) : [...prev.key_actives, item],
      };
    });
  };

  // Add Custom Handlers
  const handleAddCustomSkinType = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const val = newSkinTypeInput.trim();
    if (!val) return;
    
    if (!customSkinTypes.some((item) => item.toLowerCase() === val.toLowerCase()) &&
        !SKIN_TYPES_DATA.some((item) => item.value.toLowerCase() === val.toLowerCase())) {
      setCustomSkinTypes((prev) => [...prev, val]);
      saveCustomTaxonomyOption("skin_type", val).catch(() => {});
    }
    
    if (!form.skin_type.includes(val)) {
      setForm((prev) => ({ ...prev, skin_type: [...prev.skin_type, val] }));
    }
    setNewSkinTypeInput("");
    setShowAddSkinType(false);
  };

  const handleRemoveCustomSkinType = (val: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomSkinTypes((prev) => prev.filter((item) => item !== val));
    setForm((prev) => ({ ...prev, skin_type: prev.skin_type.filter((item) => item !== val) }));
    deleteCustomTaxonomyOption("skin_type", val).catch(() => {});
  };

  const handleAddCustomSkinConcern = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const val = newSkinConcernInput.trim();
    if (!val) return;

    if (!customSkinConcerns.some((item) => item.toLowerCase() === val.toLowerCase()) &&
        !SKIN_CONCERNS_DATA.some((item) => item.value.toLowerCase() === val.toLowerCase())) {
      setCustomSkinConcerns((prev) => [...prev, val]);
      saveCustomTaxonomyOption("skin_concern", val).catch(() => {});
    }

    if (!form.skin_concern.includes(val)) {
      setForm((prev) => ({ ...prev, skin_concern: [...prev.skin_concern, val] }));
    }
    setNewSkinConcernInput("");
    setShowAddSkinConcern(false);
  };

  const handleRemoveCustomSkinConcern = (val: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomSkinConcerns((prev) => prev.filter((item) => item !== val));
    setForm((prev) => ({ ...prev, skin_concern: prev.skin_concern.filter((item) => item !== val) }));
    deleteCustomTaxonomyOption("skin_concern", val).catch(() => {});
  };

  const handleAddCustomKeyActive = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const val = newKeyActiveInput.trim();
    if (!val) return;

    if (!customKeyActives.some((item) => item.toLowerCase() === val.toLowerCase()) &&
        !KEY_ACTIVES_DATA.some((item) => item.value.toLowerCase() === val.toLowerCase())) {
      setCustomKeyActives((prev) => [...prev, val]);
      saveCustomTaxonomyOption("key_actives", val).catch(() => {});
    }

    if (!form.key_actives.includes(val)) {
      setForm((prev) => ({ ...prev, key_actives: [...prev.key_actives, val] }));
    }
    setNewKeyActiveInput("");
    setShowAddKeyActive(false);
  };

  const handleRemoveCustomKeyActive = (val: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomKeyActives((prev) => prev.filter((item) => item !== val));
    setForm((prev) => ({ ...prev, key_actives: prev.key_actives.filter((item) => item !== val) }));
    deleteCustomTaxonomyOption("key_actives", val).catch(() => {});
  };

  // Upload images (handles both input change and drag & drop)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);

  const uploadFilesList = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || data.error || !data.url) {
          throw new Error(data.error || "Image upload failed");
        }

        setGalleryImages((prev) => {
          const next = [...prev, data.url];
          if (!form.og_image_url) {
            updateField("og_image_url", data.url);
          }
          return next;
        });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFilesList(e.target.files);
    }
  };

  const removeImage = (url: string) => {
    setGalleryImages((prev) => {
      const next = prev.filter((img) => img !== url);
      if (form.og_image_url === url) {
        updateField("og_image_url", next[0] || "");
      }
      return next;
    });
  };

  const setFeaturedImage = (url: string) => {
    updateField("og_image_url", url);
    setGalleryImages((prev) => {
      if (!prev.includes(url)) return [url, ...prev];
      return [url, ...prev.filter((img) => img !== url)];
    });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    setGalleryImages((prev) => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      if (targetIndex === 0 || index === 0) {
        updateField("og_image_url", copy[0]);
      }
      return copy;
    });
  };

  // Toggle attribute selection for variants
  const toggleAttribute = (attrId: string) => {
    setSelectedAttrIds((prev) =>
      prev.includes(attrId) ? prev.filter((id) => id !== attrId) : [...prev, attrId]
    );
  };

  // Toggle attribute value selection
  const toggleAttrValue = (attrId: string, valId: string) => {
    setSelectedValuesByAttr((prev) => {
      const current = prev[attrId] || [];
      const updated = current.includes(valId)
        ? current.filter((id) => id !== valId)
        : [...current, valId];
      return { ...prev, [attrId]: updated };
    });
  };

  // Generate Cartesian Product of selected attribute values
  const generateVariantCombinations = () => {
    const activeAttrs = availableAttributes.filter((a) =>
      selectedAttrIds.includes(a.id) && (selectedValuesByAttr[a.id] || []).length > 0
    );

    if (activeAttrs.length === 0) {
      alert("Please select at least one attribute and value.");
      return;
    }

    const valueArrays = activeAttrs.map((attr) => {
      const chosenValueIds = selectedValuesByAttr[attr.id] || [];
      return attr.attribute_values.filter((v) => chosenValueIds.includes(v.id));
    });

    const cartesian = (arrays: any[][]): any[][] => {
      return arrays.reduce<any[][]>(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]]
      );
    };

    const combinations = cartesian(valueArrays);

    const newVariants: VariantItem[] = combinations.map((combo, idx) => {
      const items = Array.isArray(combo) ? combo : [combo];
      const valueIds = items.map((i: any) => i.id);
      const labels = items.map((i: any) => i.value);
      const skuSuffix = labels.map((l: string) => l.toUpperCase().replace(/\s+/g, "")).join("-");
      const baseSku = form.sku || (suggestedSku ? formatShortProductId(suggestedSku) : `VAR-${idx + 1}`);
      return {
        sku: `${baseSku}-${skuSuffix}`,
        regular_price: form.regular_price || 0,
        sale_price: form.sale_price || 0,
        cost_price: form.cost_price || 0,
        weight: form.weight || 0,
        status: "active",
        attribute_value_ids: valueIds,
        attribute_labels: labels,
      };
    });

    setGeneratedVariants(newVariants);
  };

  const updateVariantRow = (index: number, key: keyof VariantItem, val: any) => {
    setGeneratedVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: val } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required");
      return;
    }
    setLoading(true);
    setError("");

    const productData = {
      name: form.name,
      slug: form.slug,
      sku: form.sku || null,
      barcode: form.barcode || null,
      product_type: form.product_type,
      brand_id: form.brand_id || null,
      status: form.status,
      is_featured: form.is_featured,
      short_description: form.short_description || null,
      description: form.description || null,
      benefits: form.benefits || null,
      usage: form.usage || null,
      ingredients_specifications: form.ingredients_specifications || null,
      country: form.origin_country || form.country || null,
      origin_country: form.origin_country || form.country || null,
      warranty: form.warranty || null,
      // Beauty Taxonomy
      skin_type: form.skin_type.length > 0 ? form.skin_type : null,
      skin_concern: form.skin_concern.length > 0 ? form.skin_concern : null,
      key_actives: form.key_actives.length > 0 ? form.key_actives : null,
      routine_step: form.routine_step || null,
      batch_number: form.batch_number || null,
      expiry_date: form.expiry_date || null,
      // Note: authenticity_verified is displayed client-side only; not a DB column yet

      // Pricing
      cost_price: form.cost_price || null,
      regular_price: form.regular_price || 0,
      sale_price: form.sale_price || null,
      sale_start: form.sale_start || null,
      sale_end: form.sale_end || null,
      volume_ml: form.volume_ml || null,
      weight: form.weight || null,
      length: form.length || null,
      width: form.width || null,
      height: form.height || null,
      shipping_class: form.is_free_shipping ? "free_shipping" : (form.shipping_class && form.shipping_class !== "free_shipping" ? form.shipping_class : null),
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      canonical_override: form.canonical_override || null,
      og_image_url: form.og_image_url || galleryImages[0] || null,
      is_indexed: form.is_indexed,
    };

    const tagNames = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const variantsPayload =
      form.product_type === "variable" && generatedVariants.length > 0
        ? generatedVariants.map((v) => ({
            sku: v.sku,
            regular_price: v.regular_price,
            sale_price: v.sale_price || undefined,
            cost_price: v.cost_price || undefined,
            weight: v.weight || undefined,
            status: v.status,
            attribute_value_ids: v.attribute_value_ids,
          }))
        : undefined;

    const result = isEditing
      ? await updateProduct(initialData!.id as string, {
          product: productData,
          category_ids: form.selectedCategories,
          tag_names: tagNames,
          media_urls: galleryImages,
          featured_image_url: form.og_image_url || galleryImages[0] || undefined,
          variants: variantsPayload,
          initial_stock: form.initial_stock,
        })
      : await createProduct({
          product: productData,
          category_ids: form.selectedCategories,
          tag_names: tagNames,
          media_urls: galleryImages,
          featured_image_url: form.og_image_url || galleryImages[0] || undefined,
          variants: variantsPayload,
          initial_stock: form.initial_stock,
        });

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to save product");
      setLoading(false);
      return;
    }

    // Save Frequently Bought Together Combo Config
    const targetId = isEditing ? (initialData!.id as string) : (result as any).data?.id;
    if (targetId) {
      await saveProductComboConfig({
        product_id: targetId,
        enabled: comboConfig.enabled,
        title: comboConfig.title,
        discount_type: comboConfig.discount_type,
        discount_value: Number(comboConfig.discount_value) || 0,
        bundle_product_ids: comboConfig.bundle_product_ids,
        badge_text: comboConfig.badge_text,
      });
    }

    router.push("/admin/products");
    router.refresh();
  };

  const dynamicTabs = [
    { id: "basic", label: isBn ? "প্রাথমিক তথ্য" : "Basic Info", icon: Package },
    { id: "beauty", label: isBn ? "স্কিন ও বিউটি স্পেক্স" : "Skin & Beauty Specs", icon: Sparkles },
    { id: "content", label: isBn ? "পণ্যের বিবরণ" : "Content", icon: FileText },
    { id: "pricing", label: isBn ? "মূল্য ও ছাড়" : "Pricing", icon: DollarSign },
    { id: "combo", label: isBn ? "কম্বো বান্ডেল" : "Combo Bundles", icon: Sparkles },
    ...(form.product_type === "variable"
      ? [{ id: "variants", label: isBn ? "ভ্যারিয়েন্টসমূহ" : "Variants", icon: Layers }]
      : []),
    { id: "physical", label: isBn ? "ওজন ও সাইজ" : "Physical", icon: Ruler },
    { id: "media", label: isBn ? "ছবি ও মিডিয়া" : "Media", icon: ImageIcon },
    { id: "seo", label: isBn ? "এসইও (SEO)" : "SEO", icon: Search },
    { id: "inventory", label: isBn ? "ইনভেন্টরি" : "Inventory", icon: Box },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text">
              {isEditing ? (isBn ? "পণ্য সম্পাদনা করুন" : "Edit Product") : (isBn ? "নতুন পণ্য তৈরি করুন" : "Create Product")}
            </h1>
            <p className="text-xs text-text-secondary">
              {form.product_type === "variable"
                ? (isBn ? "ভ্যারিয়েবল পণ্য কনফিগারেশন" : "Configuring Variable Product")
                : (isBn ? "সাধারণ পণ্য কনফিগারেশন" : "Configuring Simple Product")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewModalOpen(true)}
            className="flex items-center gap-1.5 border-pink-200 text-[#e91e63] hover:bg-pink-50 hover:text-[#e91e63] font-bold text-xs"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{isBn ? "লাইভ প্রিভিউ" : "Live Preview"}</span>
          </Button>

          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
          >
            <option value="draft">{isBn ? "ড্রাফট" : "Draft"}</option>
            <option value="active">{isBn ? "সক্রিয়" : "Active"}</option>
            <option value="archived">{isBn ? "আর্কাইভ" : "Archived"}</option>
          </select>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? (isBn ? "আপডেট করুন" : "Update") : (isBn ? "তৈরি করুন" : "Create")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-secondary p-1">
        {dynamicTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-white text-text shadow-card"
                  : "text-text-muted hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Info */}
          {activeTab === "basic" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">{isBn ? "প্রাথমিক তথ্য" : "Basic Information"}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isBn ? "পণ্যের নাম *" : "Product Name *"}</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{isBn ? "স্লাগ (Slug) *" : "Slug *"}</Label>
                  <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-text">{isBn ? "প্রোডাক্ট আইডি / এসকেইউ (SKU)" : "Product ID / SKU"}</Label>
                    {!isEditing && suggestedSku && (
                      <span className="text-xs font-semibold text-[#e91e63] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md">
                        {isBn ? `অটো সিরিয়াল: #${formatShortProductId(suggestedSku)}` : `Auto Serial: #${formatShortProductId(suggestedSku)}`}
                      </span>
                    )}
                  </div>
                  <Input
                    value={form.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    placeholder={
                      suggestedSku
                        ? (isBn ? `যেমন: ${formatShortProductId(suggestedSku)} (ফাঁকা রাখলে অটো সিরিয়াল #${formatShortProductId(suggestedSku)})` : `e.g. ${formatShortProductId(suggestedSku)} (Auto serial #${formatShortProductId(suggestedSku)} if empty)`)
                        : (isBn ? "যেমন: 0001, 0002... (ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে)" : "e.g. 0001, 0002... (Auto-assigned if empty)")
                    }
                  />
                  <p className="text-[11px] text-text-muted">
                    {isBn
                      ? `প্রোডাক্ট আইডি ও এসকেইউ একই নম্বর। ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে সিরিয়াল ${suggestedSku ? `#${formatShortProductId(suggestedSku)}` : "(0001, 0002, ...)"} হিসেবে প্রকাশিত হবে।`
                      : `Product ID & SKU are identical numbers. Leave empty to automatically publish with dynamic serial ${suggestedSku ? `#${formatShortProductId(suggestedSku)}` : "(0001, 0002, ...)"}.`}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{isBn ? "বারকোড" : "Barcode"}</Label>
                  <Input value={form.barcode} onChange={(e) => updateField("barcode", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isBn ? "পণ্যের ধরণ" : "Product Type"}</Label>
                  <select
                    value={form.product_type}
                    onChange={(e) => updateField("product_type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="simple">{isBn ? "সাধারণ পণ্য (Simple Product)" : "Simple Product"}</option>
                    <option value="variable">{isBn ? "ভ্যারিয়েবল পণ্য (Variable Product)" : "Variable Product (with Variants)"}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{isBn ? "ব্র্যান্ড" : "Brand"}</Label>
                  <select
                    value={form.brand_id}
                    onChange={(e) => updateField("brand_id", e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="">{isBn ? "— কোনো ব্র্যান্ড নেই —" : "— No brand —"}</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isBn ? "ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)" : "Tags (comma separated)"}</Label>
                <Input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder={isBn ? "স্কিনকেয়ার, সিরাম, কে-বিউটি" : "skincare, essence, k-beauty"} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} className="rounded border-border h-4 w-4 text-[#e91e63] accent-[#e91e63]" />
                  <span className="text-sm text-text font-medium">{isBn ? "হোমপেজে ফিচার্ড হিসেবে দেখান" : "Feature on Homepage"}</span>
                </label>
              </div>

              {/* Free Delivery Control Card */}
              <div className="flex items-center justify-between rounded-2xl bg-pink-50/70 border border-pink-200 p-4 transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#e91e63]">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{isBn ? "ফ্রি ডেলিভারি (Free Delivery)" : "Free Delivery"}</h4>
                      {form.is_free_shipping && (
                        <span className="rounded bg-[#e91e63] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                          {isBn ? "ফ্রি ডেলিভারি সক্রিয়" : "ফ্রি ডেলিভারি Active"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isBn
                        ? "চালু করা থাকলে স্টোরফ্রন্টের প্রোডাক্ট কার্ডে পিঙ্ক কালারের 'ফ্রি ডেলিভারি' ব্যাজ প্রদর্শিত হবে এবং সারাদেশে ফ্রি শিপিং প্রযোজ্য হবে।"
                        : "When enabled, this product will display the solid pink 'ফ্রি ডেলিভারি' badge on storefront product cards and highlight free nationwide delivery."}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={form.is_free_shipping}
                    onChange={(e) => updateField("is_free_shipping", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e91e63]"></div>
                </label>
              </div>
            </div>
          )}

          {/* 1.5 Beauty & Skin Taxonomy Specs */}
          {activeTab === "beauty" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                  <h2 className="text-base font-bold text-gray-900">
                    {isBn ? "স্কিন ও বিউটি স্পেসিফিকেশন" : "Beauty & Cosmetics Taxonomy Specs"}
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isBn
                    ? "স্মার্ট ফিল্টারিং বৈশিষ্ট্য, ত্বকের ধরণ ও সমস্যা, মূল উপাদান, ব্যাচ কোড এবং সোর্সিং কান্ট্রি কনফিগার করুন।"
                    : "Configure smart filtering attributes, routine recommendations, authenticity batch codes, and origin provenance."}
                </p>
              </div>

              {/* Skin Types (Multi-select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "কোন ধরণের ত্বকের জন্য উপযোগী (প্রযোজ্য সবগুলো সিলেক্ট করুন)" : "Suitable Skin Types (Select all that apply)"}
                  </Label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {form.skin_type.length} {isBn ? "টি নির্বাচিত" : "selected"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {SKIN_TYPES_DATA.map((item) => {
                    const active = form.skin_type.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleSkinType(item.value)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border cursor-pointer",
                          active
                            ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {active && <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {isBn ? item.bn : item.en}
                      </button>
                    );
                  })}

                  {/* Custom Added Skin Types */}
                  {customSkinTypes.map((customVal) => {
                    const active = form.skin_type.includes(customVal);
                    return (
                      <div
                        key={customVal}
                        onClick={() => toggleSkinType(customVal)}
                        className={cn(
                          "group inline-flex items-center gap-1.5 rounded-full pl-3.5 pr-2 py-1.5 text-xs font-bold transition-all border cursor-pointer",
                          active
                            ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                            : "bg-pink-50/50 text-pink-900 border-pink-200 hover:border-pink-300"
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5 -mt-0.5" />}
                        <span>{customVal}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCustomSkinType(customVal, e)}
                          className={cn(
                            "rounded-full p-0.5 hover:bg-black/10 transition-colors",
                            active ? "text-white/80 hover:text-white" : "text-pink-600 hover:text-pink-900"
                          )}
                          title={isBn ? "মুছে ফেলুন" : "Remove"}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Inline Add Custom Skin Type */}
                  {showAddSkinType ? (
                    <div className="inline-flex items-center gap-1 bg-pink-50 border-2 border-pink-500 rounded-full px-2.5 py-0.5 shadow-2xs animate-in zoom-in-95">
                      <input
                        type="text"
                        value={newSkinTypeInput}
                        onChange={(e) => setNewSkinTypeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddCustomSkinType(e);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAddSkinType(false);
                            setNewSkinTypeInput("");
                          }
                        }}
                        placeholder={isBn ? "যেমন: Blemish-Prone..." : "e.g. Blemish-Prone..."}
                        autoFocus
                        className="bg-transparent text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none px-1 py-0.5 w-28 sm:w-36"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddCustomSkinType(e);
                        }}
                        className="rounded-full bg-pink-600 text-white p-1 hover:bg-pink-700 transition-colors cursor-pointer"
                        title={isBn ? "যোগ করুন" : "Add"}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAddSkinType(false);
                          setNewSkinTypeInput("");
                        }}
                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                        title={isBn ? "বাতিল" : "Cancel"}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddSkinType(true);
                      }}
                      className="rounded-full border border-dashed border-pink-400 bg-pink-50/60 px-3 py-1.5 text-xs font-bold text-pink-700 hover:bg-pink-100/80 hover:border-pink-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isBn ? "কাস্টম স্কিন টাইপ যোগ করুন" : "+ Add Custom"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Skin Concerns (Multi-select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "টার্গেট স্কিন সমস্যা (ক্যাটালগে ফিল্টার করার জন্য)" : "Target Skin Concerns (Filterable in Catalog)"}
                  </Label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {form.skin_concern.length} {isBn ? "টি নির্বাচিত" : "selected"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {SKIN_CONCERNS_DATA.map((concern) => {
                    const active = form.skin_concern.includes(concern.value);
                    return (
                      <button
                        key={concern.value}
                        type="button"
                        onClick={() => toggleSkinConcern(concern.value)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer",
                          active
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {active && <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {isBn ? concern.bn : concern.en}
                      </button>
                    );
                  })}

                  {/* Custom Added Skin Concerns */}
                  {customSkinConcerns.map((customVal) => {
                    const active = form.skin_concern.includes(customVal);
                    return (
                      <div
                        key={customVal}
                        onClick={() => toggleSkinConcern(customVal)}
                        className={cn(
                          "group inline-flex items-center gap-1.5 rounded-full pl-3.5 pr-2 py-1.5 text-xs font-bold transition-all border cursor-pointer",
                          active
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-purple-50/50 text-purple-900 border-purple-200 hover:border-purple-300"
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5 -mt-0.5" />}
                        <span>{customVal}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCustomSkinConcern(customVal, e)}
                          className={cn(
                            "rounded-full p-0.5 hover:bg-black/10 transition-colors",
                            active ? "text-white/80 hover:text-white" : "text-purple-600 hover:text-purple-900"
                          )}
                          title={isBn ? "মুছে ফেলুন" : "Remove"}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Inline Add Custom Skin Concern */}
                  {showAddSkinConcern ? (
                    <div className="inline-flex items-center gap-1 bg-purple-50 border-2 border-purple-500 rounded-full px-2.5 py-0.5 shadow-2xs animate-in zoom-in-95">
                      <input
                        type="text"
                        value={newSkinConcernInput}
                        onChange={(e) => setNewSkinConcernInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddCustomSkinConcern(e);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAddSkinConcern(false);
                            setNewSkinConcernInput("");
                          }
                        }}
                        placeholder={isBn ? "যেমন: Hyperpigmentation..." : "e.g. Hyperpigmentation..."}
                        autoFocus
                        className="bg-transparent text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none px-1 py-0.5 w-32 sm:w-44"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddCustomSkinConcern(e);
                        }}
                        className="rounded-full bg-purple-600 text-white p-1 hover:bg-purple-700 transition-colors cursor-pointer"
                        title={isBn ? "যোগ করুন" : "Add"}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAddSkinConcern(false);
                          setNewSkinConcernInput("");
                        }}
                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                        title={isBn ? "বাতিল" : "Cancel"}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddSkinConcern(true);
                      }}
                      className="rounded-full border border-dashed border-purple-400 bg-purple-50/60 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100/80 hover:border-purple-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isBn ? "কাস্টম সমস্যা যোগ করুন" : "+ Add Custom"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Key Actives (Multi-select + Input) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "মূল সক্রিয় উপাদানসমূহ (Key Active Ingredients)" : "Key Active Ingredients"}
                  </Label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {form.key_actives.length} {isBn ? "টি নির্বাচিত" : "selected"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {KEY_ACTIVES_DATA.map((active) => {
                    const isSelected = form.key_actives.includes(active.value);
                    return (
                      <button
                        key={active.value}
                        type="button"
                        onClick={() => toggleKeyActive(active.value)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {isSelected && <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {isBn ? active.bn : active.en}
                      </button>
                    );
                  })}

                  {/* Custom Added Key Actives */}
                  {customKeyActives.map((customVal) => {
                    const isSelected = form.key_actives.includes(customVal);
                    return (
                      <div
                        key={customVal}
                        onClick={() => toggleKeyActive(customVal)}
                        className={cn(
                          "group inline-flex items-center gap-1.5 rounded-full pl-3.5 pr-2 py-1.5 text-xs font-bold transition-all border cursor-pointer",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-emerald-50/50 text-emerald-900 border-emerald-200 hover:border-emerald-300"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 -mt-0.5" />}
                        <span>{customVal}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCustomKeyActive(customVal, e)}
                          className={cn(
                            "rounded-full p-0.5 hover:bg-black/10 transition-colors",
                            isSelected ? "text-white/80 hover:text-white" : "text-emerald-600 hover:text-emerald-900"
                          )}
                          title={isBn ? "মুছে ফেলুন" : "Remove"}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Inline Add Custom Key Active */}
                  {showAddKeyActive ? (
                    <div className="inline-flex items-center gap-1 bg-emerald-50 border-2 border-emerald-500 rounded-full px-2.5 py-0.5 shadow-2xs animate-in zoom-in-95">
                      <input
                        type="text"
                        value={newKeyActiveInput}
                        onChange={(e) => setNewKeyActiveInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddCustomKeyActive(e);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAddKeyActive(false);
                            setNewKeyActiveInput("");
                          }
                        }}
                        placeholder={isBn ? "যেমন: Bakuchiol..." : "e.g. Bakuchiol..."}
                        autoFocus
                        className="bg-transparent text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none px-1 py-0.5 w-28 sm:w-36"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddCustomKeyActive(e);
                        }}
                        className="rounded-full bg-emerald-600 text-white p-1 hover:bg-emerald-700 transition-colors cursor-pointer"
                        title={isBn ? "যোগ করুন" : "Add"}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAddKeyActive(false);
                          setNewKeyActiveInput("");
                        }}
                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                        title={isBn ? "বাতিল" : "Cancel"}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddKeyActive(true);
                      }}
                      className="rounded-full border border-dashed border-emerald-400 bg-emerald-50/60 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100/80 hover:border-emerald-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isBn ? "কাস্টম উপাদান যোগ করুন" : "+ Add Custom"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Provenance & Routine Step Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "উৎপাদনকারী দেশ / সোর্সিং দেশ" : "Country of Origin / Sourcing Provenance"}
                  </Label>
                  <select
                    value={form.origin_country}
                    onChange={(e) => updateField("origin_country", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    {ORIGINS_DATA.map((item) => (
                      <option key={item.value} value={item.value}>
                        {isBn ? item.bn : item.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "স্কিনকেয়ার রুটিন ধাপ" : "Skincare Routine Step"}
                  </Label>
                  <select
                    value={form.routine_step}
                    onChange={(e) => updateField("routine_step", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    {ROUTINE_STEPS_DATA.map((item) => (
                      <option key={item.value} value={item.value}>
                        {isBn ? item.bn : item.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Code & Expiry Date */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "ব্যাচ কোড (অরিজিনাল পণ্য যাচাইয়ের জন্য)" : "Batch Code (For Customer Authenticity Verification)"}
                  </Label>
                  <Input
                    value={form.batch_number}
                    onChange={(e) => updateField("batch_number", e.target.value)}
                    placeholder={isBn ? "যেমন: LOT202408A" : "e.g. LOT202408A"}
                  />
                  <p className="text-[11px] text-gray-400">
                    {isBn
                      ? "প্রোডাক্ট পেজে আসল পণ্য ভেরিফিকেশন ব্যাজে প্রদর্শিত হবে।"
                      : "Displayed in the product page Authenticity Verification badge."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "মেয়াদ উত্তীর্ণের তারিখ (PAO / Shelf Life)" : "Expiry Date (PAO / Shelf Life)"}
                  </Label>
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => updateField("expiry_date", e.target.value)}
                  />
                  <p className="text-[11px] text-gray-400">
                    {isBn
                      ? "পণ্যের মেয়াদ ট্র্যাক করতে এবং গ্রাহকদের ফ্রেশনেস সীল দেখাতে সাহায্য করে।"
                      : "Helps track inventory shelf-life and display freshness seals to customers."}
                  </p>
                </div>
              </div>

              {/* Dynamic Real-Time Expiry Status Banner */}
              {expiryAlertInfo && (
                <div className={`rounded-2xl border p-4 transition-all ${expiryAlertInfo.containerColor}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {expiryAlertInfo.type === "expired" && <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />}
                      {expiryAlertInfo.type === "critical" && <AlertCircle className="h-5 w-5 text-rose-600" />}
                      {expiryAlertInfo.type === "warning" && <Clock className="h-5 w-5 text-amber-600" />}
                      {expiryAlertInfo.type === "fresh" && <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-black">{expiryAlertInfo.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${expiryAlertInfo.badgeColor}`}>
                          {expiryAlertInfo.type === "expired"
                            ? (isBn ? `${expiryAlertInfo.days} দিন আগে মেয়াদ শেষ` : `${expiryAlertInfo.days} days past expiry`)
                            : (isBn ? `${expiryAlertInfo.days} দিন বাকি (~${expiryAlertInfo.months} মাস)` : `${expiryAlertInfo.days} days left (~${expiryAlertInfo.months} mos)`)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{expiryAlertInfo.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Authenticity Guarantee Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-pink-50/60 border border-pink-200 p-4">
                <div>
                  <h4 className="text-xs font-bold text-pink-950">
                    {isBn ? "১০০% আসল পণ্যের নিশ্চয়তা সীল" : "100% Authentic Guaranteed Seal"}
                  </h4>
                  <p className="text-[11px] text-pink-700">
                    {isBn
                      ? "স্টোরফ্রন্টে ভেরিফাইড আসল আমদানিকারক ও সরাসরি ব্র্যান্ড সোর্সিং ব্যাজ প্রদর্শন করুন।"
                      : "Show verified authentic importer badge and direct brand provenance on storefront."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.authenticity_verified}
                    onChange={(e) => updateField("authenticity_verified", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* 2. Content */}
          {activeTab === "content" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900">
                  {isBn ? "পণ্যের বিবরণ ও বিস্তারিত তথ্য" : "Product Content & Rich Media"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isBn
                    ? "হেডিং, বুলেট লিস্ট, নাম্বার লিস্ট, ছবি, লিঙ্ক যুক্ত করুন এবং যেকোনো সময় সরাসরি HTML মোডে এডিট করুন।"
                    : "Format headings, bullet lists, numbered lists, insert images, links, and switch to raw HTML mode anytime."}
                </p>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  {isBn ? "সংক্ষিপ্ত বিবরণ (ওভারভিউ)" : "Short Description (Overview)"}
                </Label>
                <textarea
                  value={form.short_description}
                  onChange={(e) => updateField("short_description", e.target.value)}
                  rows={2}
                  placeholder={
                    isBn
                      ? "হায়ালুরোনিক অ্যাসিড ও ভিটামিন ই সমৃদ্ধ ২৪ ঘণ্টা নন-গ্রিজি ময়েশ্চারাইজিং জেল..."
                      : "Non-oily 24hr hydration gel with Hyaluronic Acid & Vitamin E."
                  }
                  className="w-full rounded-xl border px-3 py-2 text-xs font-medium resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/10"
                />
              </div>

              {/* Full Description with Rich Editor & HTML Mode */}
              <RichTextEditor
                label={isBn ? "সম্পূর্ণ বিস্তারিত বিবরণ" : "Full Description"}
                value={form.description}
                onChange={(val) => updateField("description", val)}
                placeholder={
                  isBn
                    ? "পণ্যের বিস্তারিত বর্ণনা, ক্লিনিক্যাল ফর্মুলেশন, টেক্সচার ও ব্যবহারের সুবিধা লিখুন..."
                    : "Write detailed product story, clinical formulation, texture details..."
                }
                minHeight="220px"
              />

              {/* Benefits with Rich Editor & HTML Mode */}
              <RichTextEditor
                label={isBn ? "উপকারিতা (মূল সুবিধা ও কার্যকারিতা)" : "Benefits (Key Advantages & Results)"}
                value={form.benefits}
                onChange={(val) => updateField("benefits", val)}
                placeholder={
                  isBn
                    ? "• গভীর ময়েশ্চারাইজিং ব্যারিয়ার ও কোমল ত্বক\n• নন-স্টিকি গ্লাস স্কিন গ্লো\n• প্রতিদিনের ব্যবহারের জন্য নিরাপদ ও কোমল"
                    : "• Deep hydration barrier & soft skin feel\n• Non-sticky glass skin natural glow\n• Gentle & evaluated for everyday skincare"
                }
                minHeight="160px"
              />

              {/* How to Use with Rich Editor & HTML Mode */}
              <RichTextEditor
                label={isBn ? "ব্যবহারবিধি (কীভাবে ব্যবহার করবেন)" : "How to Use (Application Routine)"}
                value={form.usage}
                onChange={(val) => updateField("usage", val)}
                placeholder={
                  isBn
                    ? "১. হালকা গরম পানি দিয়ে মুখ ধুয়ে নিন\n২. ২-৩ ফোঁটা সিরাম পুরো মুখে সমানভাবে লাগান\n৩. হালকা হাতে ওপরের দিকে ম্যাসাজ করে শুষে নিতে দিন"
                    : "1. Cleanse face with lukewarm water\n2. Apply 2-3 pumps evenly\n3. Gently massage in upward circular motions"
                }
                minHeight="140px"
              />

              {/* Ingredients / Specifications with Rich Editor & HTML Mode */}
              <RichTextEditor
                label={isBn ? "উপাদানসমূহ / স্পেসিফিকেশন" : "Ingredients / Specifications"}
                value={form.ingredients_specifications}
                onChange={(val) => updateField("ingredients_specifications", val)}
                placeholder={
                  isBn
                    ? "একুয়া/ওয়াটার, হায়ালুরোনিক অ্যাসিড, নিয়াসিনামাইড (৫%), গ্লিসারিন, ভিটামিন ই, সেন্টেলা নির্যাস..."
                    : "Aqua/Water, Hyaluronic Acid, Niacinamide (5%), Glycerin, Vitamin E, Centella Asiatica Extract..."
                }
                minHeight="140px"
              />

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "উৎপাদনকারী দেশ" : "Country of Origin"}
                  </Label>
                  <Input value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder={isBn ? "যেমন: দক্ষিণ কোরিয়া" : "e.g. South Korea"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "ওয়ারেন্টি / অথেন্টিসিটি" : "Warranty / Authenticity"}
                  </Label>
                  <Input value={form.warranty} onChange={(e) => updateField("warranty", e.target.value)} placeholder={isBn ? "যেমন: ১০০% আসল পণ্যের গ্যারান্টি" : "e.g. 100% Authentic Guaranteed"} />
                </div>
              </div>
            </div>
          )}

          {/* 3. Pricing */}
          {activeTab === "pricing" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">{isBn ? "মূল্য নির্ধারণ" : "Base Pricing"}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{isBn ? "ক্রয় মূল্য (৳)" : "Cost Price (৳)"}</Label>
                  <Input type="number" step="0.01" min="0" value={form.cost_price || ""} onChange={(e) => updateField("cost_price", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>{isBn ? "নিয়মিত মূল্য (৳) *" : "Regular Price (৳) *"}</Label>
                  <Input type="number" step="0.01" min="0" value={form.regular_price || ""} onChange={(e) => updateField("regular_price", parseFloat(e.target.value) || 0)} required />
                </div>
                <div className="space-y-2">
                  <Label>{isBn ? "অফার মূল্য (৳)" : "Sale Price (৳)"}</Label>
                  <Input type="number" step="0.01" min="0" value={form.sale_price || ""} onChange={(e) => updateField("sale_price", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              {form.regular_price > 0 && form.sale_price > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600 shrink-0" />
                  <span>
                    <strong>{isBn ? "ছাড়:" : "Discount:"}</strong> {Math.round((1 - form.sale_price / form.regular_price) * 100)}% {isBn ? "ছাড়" : "off"}
                    {" "}({isBn ? "সাশ্রয়" : "saving"} ৳{(form.regular_price - form.sale_price).toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Variants Generator (Variable Products Only) */}
          {activeTab === "variants" && form.product_type === "variable" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text">{isBn ? "ভ্যারিয়েন্ট জেনারেটর" : "Product Variants Generator"}</h2>
                <p className="text-xs text-text-secondary mt-1">
                  {isBn
                    ? "অ্যাট্রিবিউট এবং মান নির্বাচন করে স্বয়ংক্রিয়ভাবে বিভিন্ন ভ্যারিয়েন্ট তৈরি করুন।"
                    : "Choose attributes and values to generate variant combinations automatically."}
                </p>
              </div>

              {/* Attributes & Value Pickers */}
              <div className="space-y-4 rounded-lg border border-border p-4 bg-surface-secondary/40">
                <Label className="font-semibold text-text">{isBn ? "১. প্রয়োজনীয় অ্যাট্রিবিউট সিলেক্ট করুন" : "1. Select Attributes to Use"}</Label>
                <div className="flex flex-wrap gap-2">
                  {availableAttributes.map((attr) => (
                    <Button
                      key={attr.id}
                      type="button"
                      size="sm"
                      variant={selectedAttrIds.includes(attr.id) ? "default" : "outline"}
                      onClick={() => toggleAttribute(attr.id)}
                    >
                      {selectedAttrIds.includes(attr.id) && <Check className="h-3.5 w-3.5 mr-1" />}
                      {attr.name}
                    </Button>
                  ))}
                </div>

                {selectedAttrIds.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <Label className="font-semibold text-text">{isBn ? "২. প্রতিটি অ্যাট্রিবিউটের মান (Values) বেছে নিন" : "2. Choose Values for Each Attribute"}</Label>
                    {availableAttributes
                      .filter((a) => selectedAttrIds.includes(a.id))
                      .map((attr) => (
                        <div key={attr.id} className="space-y-1.5">
                          <span className="text-xs font-bold text-text uppercase">{attr.name}:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {attr.attribute_values.map((v) => {
                              const isChecked = (selectedValuesByAttr[attr.id] || []).includes(v.id);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => toggleAttrValue(attr.id, v.id)}
                                  className={cn(
                                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors border",
                                    isChecked
                                      ? "bg-primary-600 text-white border-primary-600 font-semibold"
                                      : "bg-white text-text-secondary border-border hover:border-text-muted"
                                  )}
                                >
                                  {v.color_hex && (
                                    <span
                                      className="h-2.5 w-2.5 rounded-full border border-black/20"
                                      style={{ backgroundColor: v.color_hex }}
                                    />
                                  )}
                                  {v.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={generateVariantCombinations}
                  className="mt-2"
                >
                  <Layers className="h-4 w-4 mr-1.5" />
                  {isBn ? "কম্বিনেশন ম্যাট্রিক্স তৈরি করুন" : "Generate Combinations Matrix"}
                </Button>
              </div>

              {/* Generated Variants Table */}
              {generatedVariants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-text">
                      {isBn ? `তৈরিকৃত ভ্যারিয়েন্টসমূহ (${generatedVariants.length})` : `Generated Variants (${generatedVariants.length})`}
                    </h3>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-secondary text-text-muted border-b border-border">
                        <tr>
                          <th className="p-2.5">{isBn ? "ভ্যারিয়েন্ট" : "Variant"}</th>
                          <th className="p-2.5">{isBn ? "এসকেইউ (SKU)" : "SKU"}</th>
                          <th className="p-2.5">{isBn ? "নিয়মিত মূল্য (৳)" : "Regular Price (৳)"}</th>
                          <th className="p-2.5">{isBn ? "অফার মূল্য (৳)" : "Sale Price (৳)"}</th>
                          <th className="p-2.5">{isBn ? "অবস্থা" : "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {generatedVariants.map((variant, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium text-text whitespace-nowrap">
                              {variant.attribute_labels.join(" / ")}
                            </td>
                            <td className="p-2.5">
                              <Input
                                value={variant.sku}
                                onChange={(e) => updateVariantRow(idx, "sku", e.target.value)}
                                className="h-7 text-xs w-32"
                              />
                            </td>
                            <td className="p-2.5">
                              <Input
                                type="number"
                                value={variant.regular_price}
                                onChange={(e) => updateVariantRow(idx, "regular_price", parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs w-24"
                              />
                            </td>
                            <td className="p-2.5">
                              <Input
                                type="number"
                                value={variant.sale_price}
                                onChange={(e) => updateVariantRow(idx, "sale_price", parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs w-24"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={variant.status}
                                onChange={(e) => updateVariantRow(idx, "status", e.target.value)}
                                className="rounded border border-border h-7 text-xs px-1"
                              >
                                <option value="active">{isBn ? "সক্রিয়" : "Active"}</option>
                                <option value="inactive">{isBn ? "নিষ্ক্রিয়" : "Inactive"}</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Physical Specs & Net Volume (ml / g) */}
          {activeTab === "physical" && (
            <div className="space-y-5">
              {/* Net Volume / Beauty Size Card */}
              <div className="rounded-xl border border-pink-200/80 bg-linear-to-r from-pink-50/40 via-white to-purple-50/30 p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-[#e91e63]">
                      <Beaker className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-950">
                        {isBn ? "নেট ভলিউম ও সাইজ (ml / g)" : "Net Volume & Size (ml / g)"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {isBn
                          ? "কসমেটিকস ও স্কিনকেয়ার পণ্যের নেট পরিমাণ নির্ধারণ করুন (যেমন: 30 ml, 50 ml, 100 ml, 50 g)"
                          : "Configure the net cosmetic volume or weight for storefront badge & specs"}
                      </p>
                    </div>
                  </div>
                  {form.volume_ml && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 border border-pink-300 px-3 py-1 text-xs font-black text-[#e91e63] shadow-2xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      {form.volume_ml}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">
                    {isBn ? "নেট ভলিউম / সাইজ লিখুন বা বাছাই করুন" : "Enter or Select Net Volume (ml / g)"}
                  </Label>
                  <div className="relative max-w-md">
                    <Input
                      value={form.volume_ml}
                      onChange={(e) => updateField("volume_ml", e.target.value)}
                      placeholder={isBn ? "যেমন: 30 ml, 50 ml, 100 ml বা 50 g" : "e.g. 30 ml, 50 ml, 100 ml or 50 g"}
                      className="pr-12 text-sm font-semibold text-gray-900 border-pink-200 focus:border-[#e91e63] focus:ring-pink-200"
                    />
                    {form.volume_ml && (
                      <button
                        type="button"
                        onClick={() => updateField("volume_ml", "")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Popular Cosmetics Quick-Select Pills */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {isBn ? "জনপ্রিয় ভলিউম ও সাইজ প্রিসেট (এক ক্লিকে বাছাই):" : "Popular Volume Presets (One-click):"}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: "15 ml", val: "15 ml", estKg: 0.04 },
                      { label: "30 ml", val: "30 ml", estKg: 0.06 },
                      { label: "50 ml", val: "50 ml", estKg: 0.09 },
                      { label: "60 ml", val: "60 ml", estKg: 0.10 },
                      { label: "100 ml", val: "100 ml", estKg: 0.15 },
                      { label: "120 ml", val: "120 ml", estKg: 0.18 },
                      { label: "150 ml", val: "150 ml", estKg: 0.22 },
                      { label: "200 ml", val: "200 ml", estKg: 0.28 },
                      { label: "250 ml", val: "250 ml", estKg: 0.35 },
                      { label: "300 ml", val: "300 ml", estKg: 0.40 },
                      { label: "400 ml", val: "400 ml", estKg: 0.50 },
                      { label: "500 ml", val: "500 ml", estKg: 0.60 },
                      { label: "1000 ml (1L)", val: "1000 ml", estKg: 1.15 },
                      { label: "30 g", val: "30 g", estKg: 0.05 },
                      { label: "50 g", val: "50 g", estKg: 0.08 },
                      { label: "100 g", val: "100 g", estKg: 0.14 },
                      { label: "1 Pc", val: "1 pc", estKg: 0.05 },
                    ].map((preset) => {
                      const isSelected = form.volume_ml.toLowerCase().trim() === preset.val.toLowerCase().trim() ||
                        form.volume_ml.toLowerCase().trim() === preset.label.toLowerCase().trim();
                      return (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            updateField("volume_ml", preset.val);
                            if (!form.weight || form.weight === 0) {
                              updateField("weight", preset.estKg);
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-2xs",
                            isSelected
                              ? "bg-[#e91e63] text-white ring-2 ring-pink-300 ring-offset-1 scale-105"
                              : "bg-white border border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50/60"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Weight & Shipping Dimensions Card */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
                <div className="flex items-center gap-2.5 pb-1 border-b border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text">
                      {isBn ? "শিপিং ওজন ও প্যাকেজ মাপ" : "Shipping Weight & Dimensions"}
                    </h2>
                    <p className="text-xs text-text-secondary">
                      {isBn
                        ? "কুরিয়ার বিলিং (পাঠাও / স্টেডফাস্ট) এর জন্য মোট ওজন ও বক্স সাইজ"
                        : "Used for Steadfast & Pathao courier weight tiers and shipping calculation"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800">
                      {isBn ? "কুরিয়ার গ্রস ওজন (Weight in kg)" : "Gross Shipping Weight (kg)"}
                    </Label>
                    {form.weight > 0 && (
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        ≈ {(form.weight * 1000).toFixed(0)} grams
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.weight || ""}
                    onChange={(e) => updateField("weight", parseFloat(e.target.value) || 0)}
                    placeholder="0.100"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      { label: "50g (0.05 kg)", val: 0.05 },
                      { label: "100g (0.10 kg)", val: 0.10 },
                      { label: "150g (0.15 kg)", val: 0.15 },
                      { label: "250g (0.25 kg)", val: 0.25 },
                      { label: "500g (0.50 kg)", val: 0.50 },
                      { label: "1 kg (1.00 kg)", val: 1.00 },
                    ].map((wPreset) => (
                      <button
                        key={wPreset.val}
                        type="button"
                        onClick={() => updateField("weight", wPreset.val)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                          form.weight === wPreset.val
                            ? "border-pink-400 bg-pink-50 text-[#e91e63] font-bold"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {wPreset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-700">{isBn ? "দৈর্ঘ্য (সেমি)" : "Length (cm)"}</Label>
                    <Input type="number" step="0.01" min="0" value={form.length || ""} onChange={(e) => updateField("length", parseFloat(e.target.value) || 0)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-700">{isBn ? "প্রস্থ (সেমি)" : "Width (cm)"}</Label>
                    <Input type="number" step="0.01" min="0" value={form.width || ""} onChange={(e) => updateField("width", parseFloat(e.target.value) || 0)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-700">{isBn ? "উচ্চতা (সেমি)" : "Height (cm)"}</Label>
                    <Input type="number" step="0.01" min="0" value={form.height || ""} onChange={(e) => updateField("height", parseFloat(e.target.value) || 0)} placeholder="0" />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <Label className="text-xs font-bold text-gray-800">{isBn ? "শিপিং ক্লাস ও ডেলিভারি অপশন" : "Shipping Class & Delivery Option"}</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => updateField("is_free_shipping", false)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                        !form.is_free_shipping
                          ? "border-[#e91e63] bg-pink-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                        <Box className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{isBn ? "সাধারণ শিপিং" : "Standard Shipping"}</p>
                        <p className="text-[11px] text-gray-500">{isBn ? "স্বাভাবিক ডেলিভারি চার্জ প্রযোজ্য" : "Regular shipping rates apply"}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField("is_free_shipping", true)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                        form.is_free_shipping
                          ? "border-[#e91e63] bg-pink-50/70 shadow-xs ring-1 ring-[#e91e63]"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-[#e91e63]">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900">{isBn ? "ফ্রি ডেলিভারি" : "Free Delivery"}</p>
                          <span className="rounded bg-[#e91e63] px-1.5 py-0.2 text-[9px] font-black uppercase text-white">
                            {isBn ? "ফ্রি" : "FREE"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#e91e63] font-medium">{isBn ? "সারা দেশে ফ্রি ডেলিভারি ব্যাজ" : "Free nationwide shipping badge"}</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Media Tab with Direct Cloudinary Upload */}
          {activeTab === "media" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-text">{isBn ? "পণ্যের ছবি ও গ্যালারি" : "Product Images & Gallery"}</h2>
                <p className="text-xs text-text-secondary mt-1">
                  {isBn
                    ? "ক্লাউডিনারিতে সরাসরি ছবি আপলোড করুন। প্রথম ছবিটি মূল ফিচার্ড ছবি হিসেবে ব্যবহৃত হবে।"
                    : "Upload images directly to Cloudinary. The first image will be used as the featured product image."}
                </p>
              </div>

              {/* Upload Box */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                multiple
                accept="image/*"
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingGallery(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingGallery(false);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingGallery(false);
                  if (e.dataTransfer.files) {
                    await uploadFilesList(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                  isDraggingGallery
                    ? "border-[#e91e63] bg-pink-50/70 scale-[0.99] shadow-sm"
                    : "border-primary-200 bg-primary-50/40 hover:bg-primary-50"
                )}
              >
                {uploadingMedia ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
                    <p className="text-xs font-bold text-[#e91e63]">{isBn ? "ছবি আপলোড ও অপ্টিমাইজ করা হচ্ছে..." : "Uploading & Optimizing Product Images..."}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-[#e91e63]">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      <span className="text-[#e91e63] underline">{isBn ? "আপলোড করতে ক্লিক করুন" : "Click to upload"}</span> {isBn ? "অথবা ছবি টেনে এনে ড্রপ করুন" : "or drag and drop product photos"}
                    </p>
                    <p className="text-xs text-gray-500">{isBn ? "JPG, PNG, WebP বা SVG সর্বোচ্চ ১৫MB প্রতি ছবি (একাধিক ছবি সাপোর্ট করে)" : "JPG, PNG, WebP or SVG up to 15MB each (multi-select supported)"}</p>
                  </div>
                )}
              </div>

              {/* Gallery Grid */}
              {galleryImages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-xs font-bold text-gray-800">
                      {isBn
                        ? `আপলোডকৃত ছবিসমূহ (${galleryImages.length} টি)`
                        : `Uploaded Product Photos (${galleryImages.length})`}
                    </Label>
                    <span className="text-[11px] text-gray-500">
                      {isBn
                        ? "যেকোনো ছবিকে মূল ফিচার্ড ছবি করতে 'ফিচার্ড করুন' বাটনে ক্লিক করুন"
                        : "Click 'Set as Featured' on any photo to designate it as the primary product image"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galleryImages.map((url, idx) => {
                      const isFeatured = (form.og_image_url ? url === form.og_image_url : idx === 0);
                      return (
                        <div
                          key={`${url}-${idx}`}
                          className={cn(
                            "group relative flex flex-col rounded-2xl border overflow-hidden bg-white shadow-xs transition-all",
                            isFeatured
                              ? "border-pink-500 ring-2 ring-pink-500/20 shadow-md"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          {/* Image Box */}
                          <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                            <img
                              src={url}
                              alt={`Product photo ${idx + 1}`}
                              className="h-full w-full object-contain rounded-lg transition-transform group-hover:scale-105"
                            />

                            {/* Featured Badge */}
                            {isFeatured && (
                              <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                                <Star className="h-3 w-3 fill-white" />
                                {isBn ? "ফিচার্ড ছবি" : "Featured Photo"}
                              </span>
                            )}

                            {/* Position Order Number */}
                            <span className="absolute bottom-2 left-2 z-10 rounded-md bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white">
                              #{idx + 1}
                            </span>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(url);
                              }}
                              title={isBn ? "ছবি মুছুন" : "Remove photo"}
                              className="absolute top-2 right-2 z-10 rounded-full bg-red-600 p-1.5 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Action Footer */}
                          <div className="flex items-center justify-between p-2 bg-gray-50/80 border-t border-gray-100 gap-1">
                            {/* Reorder Buttons */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, "left")}
                                title={isBn ? "বামে সরান" : "Move left"}
                                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === galleryImages.length - 1}
                                onClick={() => moveImage(idx, "right")}
                                title={isBn ? "ডানে সরান" : "Move right"}
                                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Set As Featured Button */}
                            {!isFeatured ? (
                              <button
                                type="button"
                                onClick={() => setFeaturedImage(url)}
                                className="flex items-center gap-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#e91e63] px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Star className="h-3 w-3" />
                                <span>{isBn ? "ফিচার্ড করুন" : "Set Featured"}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-pink-600 px-1 flex items-center gap-1">
                                <Check className="h-3 w-3" /> {isBn ? "মূল ছবি" : "Primary"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. SEO Tab */}
          {activeTab === "seo" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">{isBn ? "সার্চ ইঞ্জিন অপটিমাইজেশন (SEO)" : "Search Engine Optimization"}</h2>
              <div className="space-y-2">
                <Label>{isBn ? "এসইও টাইটেল (SEO Title)" : "SEO Title"}</Label>
                <Input value={form.seo_title} onChange={(e) => updateField("seo_title", e.target.value)} maxLength={70} />
                <p className="text-xs text-text-muted">{form.seo_title.length}/70</p>
              </div>
              <div className="space-y-2">
                <Label>{isBn ? "মেটা ডেসক্রিপশন (Meta Description)" : "Meta Description"}</Label>
                <textarea
                  value={form.seo_description}
                  onChange={(e) => updateField("seo_description", e.target.value)}
                  rows={3}
                  maxLength={160}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="text-xs text-text-muted">{form.seo_description.length}/160</p>
              </div>
              <ImageUploadDropzone
                label={isBn ? "সোশ্যাল শেয়ার / ওজি ইমেজ (OG Image)" : "Social Share / OG Image"}
                description={isBn ? "ফেসবুক, ইনস্টাগ্রাম এবং অন্যান্য মাধ্যমে শেয়ারের জন্য কাস্টম প্রিভিউ ছবি" : "Custom preview image for Facebook, Instagram, and Twitter link shares"}
                value={form.og_image_url}
                onChange={(url) => updateField("og_image_url", url)}
                folder="products"
                previewShape="banner"
              />
            </div>
          )}

          {/* 8. Inventory Tab */}
          {activeTab === "inventory" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">{isBn ? "প্রাথমিক স্টক ও ইনভেন্টরি" : "Initial Inventory"}</h2>
              <div className="space-y-2">
                <Label>{isBn ? "প্রাথমিক স্টক (মজুত ইউনিট সংখ্যা)" : "Initial Stock (on-hand units)"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.initial_stock || ""}
                  onChange={(e) => updateField("initial_stock", parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-text-muted">
                  {isBn
                    ? "প্রাথমিক মজুত সংখ্যা নির্ধারণ করে। পরবর্তীতে ইনভেন্টরি ম্যানেজার থেকে স্টক আপডেট করা যাবে।"
                    : "Sets initial available stock. Ongoing changes should be made in the Inventory Manager."}
                </p>
              </div>
            </div>
          )}

          {/* 9. Frequently Bought Together (Combo Bundles) Tab */}
          {activeTab === "combo" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#e91e63]" /> {isBn ? "একসাথে প্রায়ই কেনা পণ্য (কম্বো বান্ডেল)" : "Frequently Bought Together (Combo Bundles)"}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {isBn
                      ? "এই পণ্যের সাথে কম্বো ডিসকাউন্ট বা ফ্রি ডেলিভারি অফার সহ ক্রস-সেল পণ্য কনফিগার করুন।"
                      : "Configure complementary cross-sell products and exclusive combo discounts or free shipping for this item."}
                  </p>
                </div>

                {/* Enable / Disable Toggle */}
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={comboConfig.enabled}
                    onChange={(e) => setComboConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 rounded text-[#e91e63] accent-[#e91e63] focus:ring-[#e91e63]"
                  />
                  {isBn ? "স্টোরফ্রন্টে কম্বো সক্রিয় করুন" : "Enable Combo on Storefront"}
                </label>
              </div>

              {comboConfig.enabled && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section Title */}
                    <div className="space-y-2">
                      <Label>{isBn ? "সেকশন টাইটেল" : "Section Title"}</Label>
                      <Input
                        value={comboConfig.title}
                        onChange={(e) => setComboConfig((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder={isBn ? "একসাথে প্রায়ই কেনা পণ্য" : "Frequently Bought Together"}
                      />
                    </div>

                    {/* Badge Text */}
                    <div className="space-y-2">
                      <Label>{isBn ? "হাইলাইট ব্যাজ টেক্সট" : "Highlight Badge Text"}</Label>
                      <Input
                        value={comboConfig.badge_text}
                        onChange={(e) => setComboConfig((prev) => ({ ...prev, badge_text: e.target.value }))}
                        placeholder={isBn ? "কম্বো অফার • ১৫% ছাড়" : "Combo Special • Save 15%"}
                      />
                    </div>
                  </div>

                  {/* Offer Type & Value */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                    <div className="space-y-2">
                      <Label>{isBn ? "অফারের ধরণ" : "Offer Type"}</Label>
                      <select
                        value={comboConfig.discount_type}
                        onChange={(e) =>
                          setComboConfig((prev) => ({
                            ...prev,
                            discount_type: e.target.value as any,
                            badge_text:
                              e.target.value === "free_shipping"
                                ? (isBn ? "ফ্রি শিপিং কম্বো" : "Free Shipping Combo")
                                : prev.badge_text,
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
                      >
                        <option value="percentage">{isBn ? "শতাংশ ছাড় (%)" : "Percentage Discount (%)"}</option>
                        <option value="fixed">{isBn ? "নির্দিষ্ট টাকা ছাড় (৳)" : "Fixed BDT Discount (৳)"}</option>
                        <option value="free_shipping">{isBn ? "সারাদেশে ফ্রি ডেলিভারি (৳০)" : "Free Nationwide Shipping (৳0)"}</option>
                      </select>
                    </div>

                    {comboConfig.discount_type !== "free_shipping" && (
                      <div className="space-y-2">
                        <Label>
                          {comboConfig.discount_type === "percentage"
                            ? (isBn ? "ছাড়ের শতকরা হার (%)" : "Discount Percentage (%)")
                            : (isBn ? "ছাড়ের পরিমাণ (৳)" : "Discount Amount (৳)")}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max={comboConfig.discount_type === "percentage" ? 90 : 5000}
                          value={comboConfig.discount_value}
                          onChange={(e) =>
                            setComboConfig((prev) => ({
                              ...prev,
                              discount_value: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-1 text-xs text-gray-600 flex flex-col justify-center">
                      <span className="font-bold text-text">{isBn ? "কম্বোর সুবিধা:" : "Combo Benefit:"}</span>
                      <span>
                        {comboConfig.discount_type === "percentage" &&
                          (isBn ? `বান্ডেল কেনার সময় ${comboConfig.discount_value}% ছাড় পাওয়া যাবে।` : `${comboConfig.discount_value}% off when buying bundle.`)}
                        {comboConfig.discount_type === "fixed" &&
                          (isBn ? `বান্ডেলে মোট ৳${comboConfig.discount_value} সরাসরি সাশ্রয় পাওয়া যাবে।` : `৳${comboConfig.discount_value} flat savings on bundle.`)}
                        {comboConfig.discount_type === "free_shipping" &&
                          (isBn ? "কম্বো অর্ডারে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি।" : "Delivery fee is 100% waived on combo checkout.")}
                      </span>
                    </div>
                  </div>

                  {/* Complementary Products Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">
                        {isBn
                          ? `কম্বো বান্ডেল পণ্য নির্বাচন করুন (${comboConfig.bundle_product_ids.length}/৩ টি নির্বাচিত)`
                          : `Select Complementary Bundle Items (${comboConfig.bundle_product_ids.length}/3 selected)`}
                      </Label>
                      <span className="text-xs text-text-muted">
                        {isBn
                          ? "১ থেকে ৩টি পণ্য বেছে নিন (অথবা খালি রাখলে স্বয়ংক্রিয়ভাবে রিকমেন্ড করবে)"
                          : "Pick 1 to 3 items (or leave empty for smart auto-recommendations)"}
                      </span>
                    </div>

                    <Input
                      placeholder={isBn ? "ক্যাটালগ থেকে পণ্য খুঁজুন..." : "Search catalog products..."}
                      value={bundleSearch}
                      onChange={(e) => setBundleSearch(e.target.value)}
                      className="max-w-md"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1 border border-border rounded-xl bg-surface-secondary/20">
                      {catalogProducts
                        .filter((p) => p.name.toLowerCase().includes(bundleSearch.toLowerCase()))
                        .map((prod) => {
                          const isPicked = comboConfig.bundle_product_ids.includes(prod.id);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => toggleBundleProduct(prod.id)}
                              className={cn(
                                "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                isPicked
                                  ? "border-[#e91e63] bg-pink-50/70 shadow-xs"
                                  : "border-border bg-white hover:bg-surface-secondary/60"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isPicked}
                                onChange={() => {}}
                                className="h-4 w-4 rounded text-[#e91e63] accent-[#e91e63]"
                              />
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                {prod.og_image_url ? (
                                  <img src={prod.og_image_url} alt={prod.name} className="h-full w-full object-contain" />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                                <p className="text-[11px] font-mono font-bold text-[#e91e63]">
                                  ৳{prod.sale_price ?? prod.regular_price}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-3">
            <h2 className="text-lg font-semibold text-text">{isBn ? "ক্যাটাগরি" : "Categories"}</h2>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-surface-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-3">
            <h2 className="text-lg font-semibold text-text">{isBn ? "সারসংক্ষেপ" : "Summary"}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">{isBn ? "অবস্থা" : "Status"}</span>
                <span className="font-medium text-text capitalize">
                  {form.status === "active"
                    ? (isBn ? "সক্রিয়" : "Active")
                    : form.status === "archived"
                    ? (isBn ? "আর্কাইভ" : "Archived")
                    : (isBn ? "ড্রাফট" : "Draft")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{isBn ? "ধরণ" : "Type"}</span>
                <span className="font-medium text-text capitalize">
                  {form.product_type === "variable"
                    ? (isBn ? "ভ্যারিয়েবল" : "Variable")
                    : (isBn ? "সাধারণ" : "Simple")}
                </span>
              </div>
              {form.regular_price > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{isBn ? "মূল্য" : "Price"}</span>
                  <span className="font-medium text-text">৳{form.regular_price}</span>
                </div>
              )}
              {form.product_type === "variable" && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{isBn ? "ভ্যারিয়েন্ট" : "Variants"}</span>
                  <span className="font-medium text-primary-600">
                    {isBn ? `${generatedVariants.length} টি তৈরি হয়েছে` : `${generatedVariants.length} generated`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="text-text-muted">{isBn ? "ডেলিভারি" : "Delivery"}</span>
                {form.is_free_shipping ? (
                  <span className="font-bold text-xs text-[#e91e63] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    {isBn ? "ফ্রি ডেলিভারি" : "Free Delivery"}
                  </span>
                ) : (
                  <span className="font-medium text-text text-xs">{isBn ? "স্ট্যান্ডার্ড" : "Standard"}</span>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 border-pink-300 text-[#e91e63] hover:bg-pink-50 hover:text-[#e91e63] font-bold text-xs py-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>{isBn ? "লাইভ স্টোরফ্রন্ট প্রিভিউ" : "Live Storefront Preview"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        form={form}
        galleryImages={galleryImages}
        brandName={brands.find((b) => b.id === form.brand_id)?.name}
        categoryNames={categories
          .filter((c) => form.selectedCategories.includes(c.id))
          .map((c) => c.name)}
        variants={generatedVariants}
        comboConfig={comboConfig}
        catalogProducts={catalogProducts}
        onPublish={() => {
          const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (submitBtn) submitBtn.click();
        }}
      />
    </form>
  );
}
