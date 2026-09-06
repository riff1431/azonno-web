"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, ArrowLeft, Package, FileText,
  DollarSign, Ruler, Image as ImageIcon, Search,
  Box, Layers, Upload, Trash2, Plus, Check, Sparkles, Tag, Truck
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { generateSlug, cn } from "@/lib/utils";
import { createProduct, updateProduct, getProducts, getNextProductSerial } from "@/features/products/actions";
import { getCategories } from "@/features/categories/actions";
import { getBrands } from "@/features/brands/actions";
import { getAttributes } from "@/features/attributes/actions";
import { getProductComboConfig, saveProductComboConfig } from "@/features/products/combo-actions";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { ImageUploadDropzone } from "@/components/shared/image-upload-dropzone";

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
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedSku, setSuggestedSku] = useState<number | null>(null);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; parent_id: string | null }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [availableAttributes, setAvailableAttributes] = useState<AttributeOption[]>([]);

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    initialData?.og_image_url ? [initialData.og_image_url as string] : []
  );

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

  const [form, setForm] = useState({
    name: (initialData?.name as string) ?? "",
    slug: (initialData?.slug as string) ?? "",
    sku: (initialData?.sku as string) ?? "",
    barcode: (initialData?.barcode as string) ?? "",
    product_type: (initialData?.product_type as string) ?? "simple",
    brand_id: (initialData?.brand_id as string) ?? "",
    status: (initialData?.status as string) ?? "draft",
    is_featured: (initialData?.is_featured as boolean) ?? false,
    selectedCategories: [] as string[],
    tags: "" as string,
    // Content
    short_description: (initialData?.short_description as string) ?? "",
    description: (initialData?.description as string) ?? "",
    benefits: (initialData?.benefits as string) ?? "",
    usage: (initialData?.usage as string) ?? "",
    ingredients_specifications: (initialData?.ingredients_specifications as string) ?? "",
    country: (initialData?.country as string) ?? (initialData?.origin_country as string) ?? "",
    warranty: (initialData?.warranty as string) ?? "",
    // Beauty & Skin Taxonomy
    skin_type: (initialData?.skin_type as string[]) ?? [],
    skin_concern: (initialData?.skin_concern as string[]) ?? [],
    key_actives: (initialData?.key_actives as string[]) ?? [],
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
    // Physical
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
    og_image_url: (initialData?.og_image_url as string) ?? "",
    is_indexed: (initialData?.is_indexed as boolean) ?? true,
    // Inventory
    initial_stock: 0,
  });

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
      const baseSku = form.sku || (suggestedSku ? String(suggestedSku) : `VAR-${idx + 1}`);
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
      authenticity_verified: form.authenticity_verified,
      // Pricing
      cost_price: form.cost_price || null,
      regular_price: form.regular_price || 0,
      sale_price: form.sale_price || null,
      sale_start: form.sale_start || null,
      sale_end: form.sale_end || null,
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
        })
      : await createProduct({
          product: productData,
          category_ids: form.selectedCategories,
          tag_names: tagNames,
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
    { id: "basic", label: "Basic Info", icon: Package },
    { id: "beauty", label: "Skin & Beauty Specs", icon: Sparkles },
    { id: "content", label: "Content", icon: FileText },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "combo", label: "Combo Bundles", icon: Sparkles },
    ...(form.product_type === "variable"
      ? [{ id: "variants", label: "Variants", icon: Layers }]
      : []),
    { id: "physical", label: "Physical", icon: Ruler },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "seo", label: "SEO", icon: Search },
    { id: "inventory", label: "Inventory", icon: Box },
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
              {isEditing ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-xs text-text-secondary">
              {form.product_type === "variable" ? "Configuring Variable Product" : "Configuring Simple Product"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? "Update" : "Create"}
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
              <h2 className="text-lg font-semibold text-text">Basic Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-text">Product ID / SKU</Label>
                    {!isEditing && suggestedSku && (
                      <span className="text-xs font-semibold text-[#e91e63] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md">
                        Auto Serial: #{suggestedSku}
                      </span>
                    )}
                  </div>
                  <Input
                    value={form.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    placeholder={suggestedSku ? `e.g. ${suggestedSku} (Auto serial #${suggestedSku} if empty)` : "e.g. 1, 2, 3... (Auto-assigned if empty)"}
                  />
                  <p className="text-[11px] text-text-muted">
                    Product ID & SKU are identical numbers. Leave empty to automatically publish with dynamic serial {suggestedSku ? `#${suggestedSku}` : "(1, 2, 3...)"}.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input value={form.barcode} onChange={(e) => updateField("barcode", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <select
                    value={form.product_type}
                    onChange={(e) => updateField("product_type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  >
                    <option value="simple">Simple Product</option>
                    <option value="variable">Variable Product (with Variants)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <select
                    value={form.brand_id}
                    onChange={(e) => updateField("brand_id", e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— No brand —</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="skincare, essence, k-beauty" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} className="rounded border-border h-4 w-4 text-[#e91e63] accent-[#e91e63]" />
                  <span className="text-sm text-text font-medium">Feature on Homepage</span>
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
                      <h4 className="text-sm font-bold text-gray-900">Free Delivery (ফ্রি ডেলিভারি)</h4>
                      {form.is_free_shipping && (
                        <span className="rounded bg-[#e91e63] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                          ফ্রি ডেলিভারি Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      When enabled, this product will display the solid pink &quot;ফ্রি ডেলিভারি&quot; badge on storefront product cards and highlight free nationwide delivery.
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
                  <h2 className="text-base font-bold text-gray-900">Beauty & Cosmetics Taxonomy Specs</h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure smart filtering attributes, routine recommendations, authenticity batch codes, and origin provenance.
                </p>
              </div>

              {/* Skin Types (Multi-select) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Suitable Skin Types (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {["Oily", "Dry", "Combination", "Sensitive", "Normal", "All Skin Types"].map((type) => {
                    const active = form.skin_type.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSkinType(type)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border",
                          active
                            ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {active && <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skin Concerns (Multi-select) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Target Skin Concerns (Filterable in Catalog)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Acne & Blemishes",
                    "Brightening & Pigmentation",
                    "Anti-Aging & Wrinkles",
                    "Dryness & Hydration",
                    "Pore Minimizing",
                    "Redness & Rosacea",
                    "Sun Protection",
                    "Dark Circles",
                    "Oil Control",
                    "Barrier Repair",
                  ].map((concern) => {
                    const active = form.skin_concern.includes(concern);
                    return (
                      <button
                        key={concern}
                        type="button"
                        onClick={() => toggleSkinConcern(concern)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold transition-all border",
                          active
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {active && <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {concern}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Actives (Multi-select + Input) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Key Active Ingredients</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Niacinamide",
                    "Hyaluronic Acid",
                    "Salicylic Acid (BHA)",
                    "Glycolic Acid (AHA)",
                    "Vitamin C",
                    "Retinol",
                    "Centella Asiatica (Cica)",
                    "Snail Secretion Filtrate",
                    "Ceramides",
                    "Zinc PCA",
                    "Alpha Arbutin",
                    "Tea Tree",
                    "Peptides",
                    "Mugwort",
                    "Galactomyces",
                    "Tranexamic Acid",
                  ].map((active) => {
                    const isSelected = form.key_actives.includes(active);
                    return (
                      <button
                        key={active}
                        type="button"
                        onClick={() => toggleKeyActive(active)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold transition-all border",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {isSelected && <Check className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {active}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provenance & Routine Step Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Country of Origin / Sourcing Provenance</Label>
                  <select
                    value={form.origin_country}
                    onChange={(e) => updateField("origin_country", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    <option value="South Korea">South Korea (K-Beauty)</option>
                    <option value="Japan">Japan (J-Beauty)</option>
                    <option value="United Kingdom">United Kingdom (UK)</option>
                    <option value="United States">United States (USA)</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Italy">Italy</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Skincare Routine Step</Label>
                  <select
                    value={form.routine_step}
                    onChange={(e) => updateField("routine_step", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    <option value="">— Select Routine Step —</option>
                    <option value="Cleanser">1. Cleanser (Oil / Foam)</option>
                    <option value="Toner">2. Toner / Mist</option>
                    <option value="Essence & Serum">3. Essence / Serum / Ampoule</option>
                    <option value="Moisturizer & Cream">4. Moisturizer / Emulsion / Cream</option>
                    <option value="Sunscreen / SPF">5. Sunscreen / SPF</option>
                    <option value="Eye Cream">Eye Care / Eye Cream</option>
                    <option value="Mask & Exfoliator">Mask / Scrub / Peeling</option>
                    <option value="Treatment">Targeted Treatment / Spot Care</option>
                    <option value="Lip Care">Lip Balm / Lip Mask</option>
                    <option value="Makeup & Cushion">Makeup / Cushion / Foundation</option>
                  </select>
                </div>
              </div>

              {/* Batch Code & Expiry Date */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Batch Code (For Customer Authenticity Verification)</Label>
                  <Input
                    value={form.batch_number}
                    onChange={(e) => updateField("batch_number", e.target.value)}
                    placeholder="e.g. LOT202408A"
                  />
                  <p className="text-[11px] text-gray-400">
                    Displayed in the product page Authenticity Verification badge.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Expiry Date (PAO / Shelf Life)</Label>
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => updateField("expiry_date", e.target.value)}
                  />
                  <p className="text-[11px] text-gray-400">
                    Helps track inventory shelf-life and display freshness seals to customers.
                  </p>
                </div>
              </div>

              {/* Authenticity Guarantee Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-pink-50/60 border border-pink-200 p-4">
                <div>
                  <h4 className="text-xs font-bold text-pink-950">100% Authentic Guaranteed Seal</h4>
                  <p className="text-[11px] text-pink-700">
                    Show verified authentic importer badge and direct brand provenance on storefront.
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
                <h2 className="text-base font-bold text-gray-900">Product Content & Rich Media</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Format headings, bullet lists, numbered lists, insert images, links, and switch to raw HTML mode anytime.
                </p>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Short Description (Overview)</Label>
                <textarea
                  value={form.short_description}
                  onChange={(e) => updateField("short_description", e.target.value)}
                  rows={2}
                  placeholder="Non-oily 24hr hydration gel with Hyaluronic Acid & Vitamin E."
                  className="w-full rounded-xl border px-3 py-2 text-xs font-medium resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/10"
                />
              </div>

              {/* Full Description with Rich Editor & HTML Mode */}
              <RichTextEditor
                label="Full Description"
                value={form.description}
                onChange={(val) => updateField("description", val)}
                placeholder="Write detailed product story, clinical formulation, texture details..."
                minHeight="220px"
              />

              {/* Benefits with Rich Editor & HTML Mode */}
              <RichTextEditor
                label="Benefits (Key Advantages & Results)"
                value={form.benefits}
                onChange={(val) => updateField("benefits", val)}
                placeholder="• 72hr Intense hydration barrier&#10;• Non-sticky glass skin glow&#10;• Dermatologically tested"
                minHeight="160px"
              />

              {/* How to Use with Rich Editor & HTML Mode */}
              <RichTextEditor
                label="How to Use (Application Routine)"
                value={form.usage}
                onChange={(val) => updateField("usage", val)}
                placeholder="1. Cleanse face with lukewarm water&#10;2. Apply 2-3 pumps evenly&#10;3. Gently massage in upward circular motions"
                minHeight="140px"
              />

              {/* Ingredients / Specifications with Rich Editor & HTML Mode */}
              <RichTextEditor
                label="Ingredients / Specifications"
                value={form.ingredients_specifications}
                onChange={(val) => updateField("ingredients_specifications", val)}
                placeholder="Aqua/Water, Hyaluronic Acid, Niacinamide (5%), Glycerin, Vitamin E, Centella Asiatica Extract..."
                minHeight="140px"
              />

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Country of Origin</Label>
                  <Input value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder="e.g. South Korea" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Warranty / Authenticity</Label>
                  <Input value={form.warranty} onChange={(e) => updateField("warranty", e.target.value)} placeholder="e.g. 100% Authentic Guaranteed" />
                </div>
              </div>
            </div>
          )}

          {/* 3. Pricing */}
          {activeTab === "pricing" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">Base Pricing</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Cost Price (৳)</Label>
                  <Input type="number" step="0.01" min="0" value={form.cost_price || ""} onChange={(e) => updateField("cost_price", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Regular Price (৳) *</Label>
                  <Input type="number" step="0.01" min="0" value={form.regular_price || ""} onChange={(e) => updateField("regular_price", parseFloat(e.target.value) || 0)} required />
                </div>
                <div className="space-y-2">
                  <Label>Sale Price (৳)</Label>
                  <Input type="number" step="0.01" min="0" value={form.sale_price || ""} onChange={(e) => updateField("sale_price", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              {form.regular_price > 0 && form.sale_price > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600 shrink-0" />
                  <span>
                    <strong>Discount:</strong> {Math.round((1 - form.sale_price / form.regular_price) * 100)}% off
                    (saving ৳{(form.regular_price - form.sale_price).toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Variants Generator (Variable Products Only) */}
          {activeTab === "variants" && form.product_type === "variable" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text">Product Variants Generator</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Choose attributes and values to generate variant combinations automatically.
                </p>
              </div>

              {/* Attributes & Value Pickers */}
              <div className="space-y-4 rounded-lg border border-border p-4 bg-surface-secondary/40">
                <Label className="font-semibold text-text">1. Select Attributes to Use</Label>
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
                    <Label className="font-semibold text-text">2. Choose Values for Each Attribute</Label>
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
                  Generate Combinations Matrix
                </Button>
              </div>

              {/* Generated Variants Table */}
              {generatedVariants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-text">
                      Generated Variants ({generatedVariants.length})
                    </h3>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-secondary text-text-muted border-b border-border">
                        <tr>
                          <th className="p-2.5">Variant</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Regular Price (৳)</th>
                          <th className="p-2.5">Sale Price (৳)</th>
                          <th className="p-2.5">Status</th>
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
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
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

          {/* 5. Physical Specs */}
          {activeTab === "physical" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">Physical Dimensions</h2>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.001" min="0" value={form.weight || ""} onChange={(e) => updateField("weight", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Length (cm)</Label>
                  <Input type="number" step="0.01" min="0" value={form.length || ""} onChange={(e) => updateField("length", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Width (cm)</Label>
                  <Input type="number" step="0.01" min="0" value={form.width || ""} onChange={(e) => updateField("width", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" step="0.01" min="0" value={form.height || ""} onChange={(e) => updateField("height", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <Label>Shipping Class & Delivery Option</Label>
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
                      <p className="text-xs font-bold text-gray-900">Standard Shipping</p>
                      <p className="text-[11px] text-gray-500">Regular shipping rates apply</p>
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
                        <p className="text-xs font-bold text-gray-900">Free Delivery</p>
                        <span className="rounded bg-[#e91e63] px-1.5 py-0.2 text-[9px] font-black uppercase text-white">
                          ফ্রি
                        </span>
                      </div>
                      <p className="text-[11px] text-[#e91e63] font-medium">Free nationwide shipping badge</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Media Tab with Direct Cloudinary Upload */}
          {activeTab === "media" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-text">Product Images & Gallery</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Upload images directly to Cloudinary. The first image will be used as the featured product image.
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
                    <p className="text-xs font-bold text-[#e91e63]">Uploading &amp; Optimizing Product Images...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-[#e91e63]">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      <span className="text-[#e91e63] underline">Click to upload</span> or drag and drop product photos
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, WebP or SVG up to 15MB each (multi-select supported)</p>
                  </div>
                )}
              </div>

              {/* Gallery Grid */}
              {galleryImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Photos ({galleryImages.length})</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {galleryImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-surface-secondary"
                      >
                        <img src={url} alt="Product" className="h-full w-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                            Featured
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. SEO Tab */}
          {activeTab === "seo" && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-text">Search Engine Optimization</h2>
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input value={form.seo_title} onChange={(e) => updateField("seo_title", e.target.value)} maxLength={70} />
                <p className="text-xs text-text-muted">{form.seo_title.length}/70</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
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
                label="Social Share / OG Image"
                description="Custom preview image for Facebook, Instagram, and Twitter link shares"
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
              <h2 className="text-lg font-semibold text-text">Initial Inventory</h2>
              <div className="space-y-2">
                <Label>Initial Stock (on-hand units)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.initial_stock || ""}
                  onChange={(e) => updateField("initial_stock", parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-text-muted">
                  Sets initial available stock. Ongoing changes should be made in the Inventory Manager.
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
                    <Sparkles className="h-5 w-5 text-[#e91e63]" /> Frequently Bought Together (Combo Bundles)
                  </h2>
                  <p className="text-xs text-text-muted">
                    Configure complementary cross-sell products and exclusive combo discounts or free shipping for this item.
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
                  Enable Combo on Storefront
                </label>
              </div>

              {comboConfig.enabled && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Section Title */}
                    <div className="space-y-2">
                      <Label>Section Title</Label>
                      <Input
                        value={comboConfig.title}
                        onChange={(e) => setComboConfig((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Frequently Bought Together"
                      />
                    </div>

                    {/* Badge Text */}
                    <div className="space-y-2">
                      <Label>Highlight Badge Text</Label>
                      <Input
                        value={comboConfig.badge_text}
                        onChange={(e) => setComboConfig((prev) => ({ ...prev, badge_text: e.target.value }))}
                        placeholder="Combo Special • Save 15%"
                      />
                    </div>
                  </div>

                  {/* Offer Type & Value */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                    <div className="space-y-2">
                      <Label>Offer Type</Label>
                      <select
                        value={comboConfig.discount_type}
                        onChange={(e) =>
                          setComboConfig((prev) => ({
                            ...prev,
                            discount_type: e.target.value as any,
                            badge_text:
                              e.target.value === "free_shipping"
                                ? "Free Shipping Combo"
                                : prev.badge_text,
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
                      >
                        <option value="percentage">Percentage Discount (%)</option>
                        <option value="fixed">Fixed BDT Discount (৳)</option>
                        <option value="free_shipping">Free Nationwide Shipping (৳0)</option>
                      </select>
                    </div>

                    {comboConfig.discount_type !== "free_shipping" && (
                      <div className="space-y-2">
                        <Label>
                          {comboConfig.discount_type === "percentage" ? "Discount Percentage (%)" : "Discount Amount (৳)"}
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
                      <span className="font-bold text-text">Combo Benefit:</span>
                      <span>
                        {comboConfig.discount_type === "percentage" && `${comboConfig.discount_value}% off when buying bundle.`}
                        {comboConfig.discount_type === "fixed" && `৳${comboConfig.discount_value} flat savings on bundle.`}
                        {comboConfig.discount_type === "free_shipping" && "Delivery fee is 100% waived on combo checkout."}
                      </span>
                    </div>
                  </div>

                  {/* Complementary Products Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">
                        Select Complementary Bundle Items ({comboConfig.bundle_product_ids.length}/3 selected)
                      </Label>
                      <span className="text-xs text-text-muted">
                        Pick 1 to 3 items (or leave empty for smart auto-recommendations)
                      </span>
                    </div>

                    <Input
                      placeholder="Search catalog products..."
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
            <h2 className="text-lg font-semibold text-text">Categories</h2>
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
            <h2 className="text-lg font-semibold text-text">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="font-medium text-text capitalize">{form.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Type</span>
                <span className="font-medium text-text capitalize">{form.product_type}</span>
              </div>
              {form.regular_price > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Price</span>
                  <span className="font-medium text-text">৳{form.regular_price}</span>
                </div>
              )}
              {form.product_type === "variable" && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Variants</span>
                  <span className="font-medium text-primary-600">{generatedVariants.length} generated</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="text-text-muted">Delivery</span>
                {form.is_free_shipping ? (
                  <span className="font-bold text-xs text-[#e91e63] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    Free Delivery
                  </span>
                ) : (
                  <span className="font-medium text-text text-xs">Standard</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
