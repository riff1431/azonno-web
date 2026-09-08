import { createClient } from "@/lib/supabase/server";
import { ProductsListingClient } from "./products-listing-client";
import { type ProductCardData } from "@/components/storefront/product-card";
import { getStoreFeatureSettings } from "@/features/settings/feature-settings-actions";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Authentic Skincare & Beauty Catalogue — Blush & Budget",
  description:
    "Explore 100% genuine skincare, cosmetics, sunscreens, and K-Beauty bestsellers imported from authorized distributors.",
};

export const BEAUTY_TYPE_SYNONYMS: Record<string, string[]> = {
  lotion: ["lotion", "cream", "moisturi", "gel", "body wash", "shower gel", "care", "hydrat"],
  moisturizer: ["moisturi", "cream", "gel", "hydrat", "lotion", "hydra"],
  cleanser: ["cleanse", "cleanser", "facewash", "face wash", "wash", "scrub", "gel", "foam"],
  wash: ["wash", "shower gel", "cleanser", "body wash", "soap", "foam"],
  serum: ["serum", "essence", "ampoule", "mucin", "concentrate", "hyaluronic", "niacinamide"],
  sunscreen: ["sunscreen", "sun cream", "sunblock", "spf", "sun", "uv"],
  toner: ["toner", "mist", "essence", "water"],
  oil: ["oil", "serum", "hair oil", "elixir"],
  shampoo: ["shampoo", "cleanser", "scalp", "wash"],
  conditioner: ["conditioner", "hair mask", "mask", "treatment", "cream"],
  scalp: ["scalp", "scrub", "anti-dandruff", "dandruff", "tea tree"],
  styling: ["styling", "color", "gel", "spray", "wax"],
  scrub: ["scrub", "exfoliat", "peel", "polish"],
  "hand-foot": ["hand", "foot", "feet", "cream", "lotion", "care"],
  diaper: ["diaper", "rash", "baby", "care"],
  maternity: ["maternity", "mom", "stretch", "oil", "care"],
  foundation: ["foundation", "bb cream", "cc cream", "cushion", "concealer"],
  lipstick: ["lipstick", "lip tint", "lip balm", "lip gloss", "lip"],
  eyeliner: ["eyeliner", "kajal", "eye liner", "kohl"],
  eyes: ["eyeshadow", "mascara", "eye", "liner", "brow", "lash"],
  powder: ["powder", "setting spray", "compact", "loose powder", "matte"],
  blush: ["blush", "highlighter", "bronzer", "glow", "palette", "cheek"],
  women: ["women", "perfume", "edp", "edt", "floral", "mist"],
  men: ["men", "cologne", "edt", "fresh", "aftershave"],
  mist: ["mist", "spray", "body mist", "fragrance"],
  attar: ["attar", "oil", "perfume oil", "oud", "concentrated"],
  combo: ["combo", "set", "bundle", "pack", "kit"],
  jewellery: ["jewellery", "jewelry", "ring", "necklace", "earring"],
  undergarments: ["undergarment", "innerwear", "bra", "panty", "shapewear", "cotton"],
};

export const TYPE_NAME_MAP: Record<string, { en: string; bn: string }> = {
  lotion: { en: "Lotion & Creams", bn: "লোশন ও ক্রিম" },
  moisturizer: { en: "Moisturizer & Hydration", bn: "ময়েশ্চারাইজার" },
  cleanser: { en: "Cleanser & Facewash", bn: "ক্লিনজার ও ফেসওয়াশ" },
  wash: { en: "Body Wash & Shower Gel", bn: "বডি ওয়াশ ও শাওয়ার জেল" },
  serum: { en: "Serum & Essence", bn: "সিরাম ও এসেন্স" },
  sunscreen: { en: "Sunscreen & SPF", bn: "সানস্ক্রিন (SPF)" },
  toner: { en: "Toner & Mist", bn: "ট্যোনার ও মিস্ট" },
  oil: { en: "Hair Oil & Serum", bn: "হেয়ার অয়েল" },
  shampoo: { en: "Shampoo & Scalp Care", bn: "শ্যাম্পু" },
  conditioner: { en: "Conditioner & Mask", bn: "কন্ডিশনার" },
  scalp: { en: "Scalp Scrub", bn: "স্ক্যাল্প স্ক্রাব" },
  styling: { en: "Hair Styling", bn: "হেয়ার স্টাইলিং" },
  scrub: { en: "Body Scrub", bn: "বডি স্ক্রাব" },
  "hand-foot": { en: "Hand & Foot Care", bn: "হ্যান্ড ও ফুট কেয়ার" },
  diaper: { en: "Diaper Care", bn: "ডায়াপার কেয়ার" },
  maternity: { en: "Mom Care", bn: "মম কেয়ার" },
  foundation: { en: "Foundation & BB Cream", bn: "ফাউন্ডেশন" },
  lipstick: { en: "Lipstick & Lip Tint", bn: "লিপস্টিক" },
  eyeliner: { en: "Eyeliner & Kajal", bn: "আইলাইনার" },
  eyes: { en: "Eyeshadow & Mascara", bn: "আইশ্যাডো ও মাশকারা" },
  powder: { en: "Setting Powder & Spray", bn: "পাউডার ও স্প্রে" },
  blush: { en: "Blush & Highlighter", bn: "ব্লাশ ও হাইলাইটার" },
  women: { en: "Women's Fragrance", bn: "পারফিউম" },
  men: { en: "Men's Cologne", bn: "মেনস কোলন" },
  mist: { en: "Body Mist", bn: "বডি মিস্ট" },
  attar: { en: "Attar & Perfume Oil", bn: "আতর ও অয়েল" },
};

export const SKIN_CONCERN_KEYWORDS: Record<string, string[]> = {
  "Acne & Blemishes": ["acne", "blemish", "pimple", "breakout", "salicylic", "niacinamide", "tea tree", "zinc", "spot", "clarif"],
  "Brightening & Pigmentation": ["brighten", "glow", "pigment", "dark spot", "vitamin c", "niacinamide", "arbutin", "radian", "dull", "even tone", "glutathione", "gluta"],
  "Anti-Aging & Wrinkles": ["aging", "wrinkle", "fine line", "firm", "retinol", "collagen", "elastic", "plump", "hyaluronic", "revitalift", "snail"],
  "Dryness & Hydration": ["hydrat", "dry", "moistur", "hyaluronic", "dehydrat", "nourish", "water", "supple", "ceramide", "lotion"],
  "Pore Minimizing": ["pore", "tighten", "sebum", "bha", "clarif", "clean", "facial wash", "cleanser", "zinc"],
  "Redness & Rosacea": ["redness", "calm", "sooth", "cica", "centella", "sensitive", "irritat", "gentle", "comfort", "kind to skin"],
  "Sun Protection": ["sun", "spf", "uv", "sunscreen", "sunblock", "protect", "rice"],
  "Oil Control": ["oil", "matte", "shine", "sebum", "greas", "balance", "lightweight", "gel", "non-oily", "soap-free"],
  "Barrier Repair": ["barrier", "ceramide", "repair", "protect", "strengthen", "snail", "mucin", "recover", "pro-vitamin"],
};

export const SKIN_TYPE_KEYWORDS: Record<string, string[]> = {
  Oily: ["oily", "sebum", "matte", "oil control", "shine", "gel", "non-oily", "lightweight", "soap-free"],
  Dry: ["dry", "hydrat", "moistur", "nourish", "cream", "lotion", "hyaluronic", "rich"],
  Combination: ["combination", "balance", "hydrat", "lightweight", "gel", "all skin"],
  Sensitive: ["sensitive", "gentle", "sooth", "calm", "cica", "kind to skin", "hypoallergenic", "soap-free", "fragrance-free"],
  Normal: ["normal", "daily", "all skin", "gentle", "everyday"],
  "All Skin Types": ["all skin", "gentle", "daily", "suitable for all", "kind to skin"],
};

export const KEY_ACTIVES_KEYWORDS: Record<string, string[]> = {
  Niacinamide: ["niacinamide", "vitamin b3"],
  "Hyaluronic Acid": ["hyaluronic", "hyaluron", "hydra"],
  "Salicylic Acid (BHA)": ["salicylic", "bha"],
  "Glycolic Acid (AHA)": ["glycolic", "aha"],
  "Vitamin C": ["vitamin c", "ascorbic", "gluta-boost-c"],
  Retinol: ["retinol", "retinoid"],
  "Centella Asiatica (Cica)": ["centella", "cica", "madecassoside"],
  "Snail Secretion Filtrate": ["snail", "mucin"],
  Ceramides: ["ceramide", "ceramides"],
  "Tea Tree": ["tea tree", "melaleuca"],
  "Alpha Arbutin": ["arbutin", "alpha arbutin"],
};

function mapProductToCard(p: any): ProductCardData {
  const inv = p.inventory as Array<{ available: number }> | null;
  const isAvailable = inv ? inv.some((i) => i.available > 0) : true;
  const brandData = (Array.isArray(p.brands) ? p.brands[0] : p.brands) as { name: string } | null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || null,
    regular_price: p.regular_price,
    sale_price: p.sale_price,
    image_url: p.og_image_url || null,
    brand_name: brandData?.name || null,
    origin_country: p.country || "South Korea",
    country: p.country || "South Korea",
    is_in_stock: isAvailable,
    rating: 5.0,
    review_count: 14,
    is_free_shipping: p.shipping_class === "free_shipping",
    shipping_class: p.shipping_class || null,
  };
}

export default async function ProductsListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    type?: string;
    subcategory?: string;
    discount?: string;
    brand?: string;
    tag?: string;
    tags?: string;
    sort?: string;
    search?: string;
    min_price?: string;
    max_price?: string;
    skin_type?: string;
    skin_concern?: string;
    key_actives?: string;
    origin?: string;
    in_stock?: string;
  }>;
}) {
  const {
    category,
    type,
    subcategory,
    discount,
    brand,
    tag,
    tags: tagsParam,
    sort,
    search,
    min_price,
    max_price,
    skin_type,
    skin_concern,
    key_actives,
    origin,
    in_stock,
  } = await searchParams;

  const supabase = await createClient();
  const featureSettings = await getStoreFeatureSettings();

  // Fetch Categories, Brands & Tags for filters
  const [{ data: categories }, { data: brands }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, parent_id").eq("status", "active"),
    supabase.from("brands").select("id, name, slug").eq("status", "active"),
    supabase.from("tags").select("id, name, slug").order("name"),
  ]);

  // Dynamic Product Query Builder function
  const buildProductQuery = (includeTypeFilter = true) => {
    let q = supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        sku,
        regular_price,
        sale_price,
        og_image_url,
        country,
        shipping_class,
        brands (name),
        inventory (available)
      `)
      .eq("status", "active")
      .is("deleted_at", null);

    // 1. Search Query
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      const searchLower = cleanSearch.toLowerCase();

      const matchingBrandIds = (brands || [])
        .filter((b) => b.name.toLowerCase().includes(searchLower) || b.slug.toLowerCase().includes(searchLower))
        .map((b) => b.id);

      const matchingCategoryIds = (categories || [])
        .filter((c) => c.name.toLowerCase().includes(searchLower) || c.slug.toLowerCase().includes(searchLower))
        .map((c) => c.id);

      let searchProductIds: string[] = [];
      const orConditions = [
        `name.ilike.%${cleanSearch}%`,
        `slug.ilike.%${cleanSearch}%`,
        `sku.ilike.%${cleanSearch}%`,
        `country.ilike.%${cleanSearch}%`,
      ];

      if (matchingBrandIds.length > 0) {
        orConditions.push(`brand_id.in.(${matchingBrandIds.join(",")})`);
      }

      q = q.or(orConditions.join(","));
    }

    // 2. Category Filter
    if (category) {
      const cleanCat = category.replace(/-/g, "").toLowerCase();
      const selectedCat = categories?.find(
        (c) =>
          c.slug === category ||
          c.slug.replace(/-/g, "").toLowerCase() === cleanCat ||
          c.name.toLowerCase() === category.toLowerCase()
      );

      if (selectedCat) {
        const childCatIds = (categories || [])
          .filter((c) => c.parent_id === selectedCat.id)
          .map((c) => c.id);
        const allTargetCatIds = [selectedCat.id, ...childCatIds];

        // Query product_categories junction table
        return {
          query: q,
          targetCatIds: allTargetCatIds,
          selectedCat,
        };
      } else {
        // Keyword fallback for category
        const catWord = category.replace(/-/g, " ").trim();
        q = q.or(`name.ilike.%${catWord}%,description.ilike.%${catWord}%,short_description.ilike.%${catWord}%,slug.ilike.%${category}%`);
      }
    }

    // 2.5. Product Type / Subcategory Filter (with smart synonyms)
    const activeType = (type || subcategory)?.trim().toLowerCase();
    if (includeTypeFilter && activeType) {
      const synonyms = BEAUTY_TYPE_SYNONYMS[activeType] || [activeType];
      const typeOrList: string[] = [];
      synonyms.forEach((syn) => {
        typeOrList.push(`name.ilike.%${syn}%`);
        typeOrList.push(`description.ilike.%${syn}%`);
        typeOrList.push(`short_description.ilike.%${syn}%`);
        typeOrList.push(`slug.ilike.%${syn}%`);
      });
      q = q.or(typeOrList.join(","));
    }

    // 2.6. Discount Filter
    if (discount === "true" || discount === "1") {
      q = q.not("sale_price", "is", null);
    }

    // 3. Brand Filter
    if (brand) {
      const cleanBrand = brand.replace(/-/g, "").toLowerCase();
      const selectedBrand = brands?.find(
        (b) =>
          b.slug === brand ||
          b.slug.replace(/-/g, "").toLowerCase() === cleanBrand ||
          b.name.toLowerCase() === brand.toLowerCase()
      );
      if (selectedBrand) {
        q = q.or(`brand_id.eq.${selectedBrand.id},name.ilike.%${selectedBrand.name}%`);
      } else {
        q = q.or(`name.ilike.%${brand}%,slug.ilike.%${brand}%`);
      }
    }

    // 4. Tag Filter
    const activeTag = tag || tagsParam;
    if (activeTag) {
      const cleanTag = activeTag.replace(/-/g, "").toLowerCase();
      const selectedTag = tags?.find(
        (t) =>
          t.slug === activeTag ||
          t.slug.replace(/-/g, "").toLowerCase() === cleanTag ||
          t.name.toLowerCase() === activeTag.toLowerCase()
      );
      if (selectedTag) {
        q = q.or(`name.ilike.%${selectedTag.name}%,slug.ilike.%${selectedTag.slug}%`);
      }
    }

    // 5. Origin
    if (origin) {
      let cleanOrigin = origin.trim();
      if (cleanOrigin.toLowerCase() === "korea") cleanOrigin = "South Korea";
      if (cleanOrigin.toLowerCase() === "uk") cleanOrigin = "United Kingdom";
      if (cleanOrigin.toLowerCase() === "usa") cleanOrigin = "United States";
      q = q.ilike("country", `%${cleanOrigin}%`);
    }

    // 6. Beauty Taxonomy Filters (Intelligent Domain-Aware Keyword Matching)
    if (skin_type) {
      const typeWords = SKIN_TYPE_KEYWORDS[skin_type] || [skin_type];
      const orList: string[] = [];
      typeWords.forEach((kw) => {
        orList.push(`name.ilike.%${kw}%`);
        orList.push(`description.ilike.%${kw}%`);
        orList.push(`benefits.ilike.%${kw}%`);
        orList.push(`short_description.ilike.%${kw}%`);
      });
      q = q.or(orList.join(","));
    }

    if (skin_concern) {
      const concernWords = SKIN_CONCERN_KEYWORDS[skin_concern] || [skin_concern];
      const orList: string[] = [];
      concernWords.forEach((kw) => {
        orList.push(`name.ilike.%${kw}%`);
        orList.push(`description.ilike.%${kw}%`);
        orList.push(`benefits.ilike.%${kw}%`);
        orList.push(`short_description.ilike.%${kw}%`);
      });
      q = q.or(orList.join(","));
    }

    if (key_actives) {
      const activeWords = KEY_ACTIVES_KEYWORDS[key_actives] || [key_actives];
      const orList: string[] = [];
      activeWords.forEach((kw) => {
        orList.push(`name.ilike.%${kw}%`);
        orList.push(`description.ilike.%${kw}%`);
        orList.push(`ingredients_specifications.ilike.%${kw}%`);
        orList.push(`short_description.ilike.%${kw}%`);
      });
      q = q.or(orList.join(","));
    }
    if (min_price) {
      q = q.gte("regular_price", Number(min_price));
    }
    if (max_price) {
      q = q.lte("regular_price", Number(max_price));
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        q = q.order("regular_price", { ascending: true });
        break;
      case "price_desc":
        q = q.order("regular_price", { ascending: false });
        break;
      case "popular":
        q = q.order("regular_price", { ascending: false });
        break;
      case "rating":
      case "newest":
      default:
        q = q.order("created_at", { ascending: false });
        break;
    }

    return { query: q };
  };

  // Execute primary query
  const primaryBuilder = buildProductQuery(true);
  let mainQuery = primaryBuilder.query;

  // Handle junction table product IDs if category matched
  if (primaryBuilder.targetCatIds && primaryBuilder.targetCatIds.length > 0) {
    const { data: catProds } = await supabase
      .from("product_categories")
      .select("product_id")
      .in("category_id", primaryBuilder.targetCatIds);

    const junctionProductIds = (catProds || []).map((p) => p.product_id);
    if (junctionProductIds.length > 0) {
      mainQuery = mainQuery.in("id", junctionProductIds);
    } else if (primaryBuilder.selectedCat) {
      mainQuery = mainQuery.or(`name.ilike.%${primaryBuilder.selectedCat.name}%,slug.ilike.%${primaryBuilder.selectedCat.slug}%`);
    }
  }

  let { data: products } = await mainQuery;
  let isFallbackApplied = false;

  // Dynamic Fallback 1: If user specified type=lotion in a category (e.g. body-care) and exact type filter yielded 0,
  // dynamically fall back to showing all category products so user doesn't hit a blank page!
  const activeTypeParam = (type || subcategory)?.trim().toLowerCase();
  if ((!products || products.length === 0) && activeTypeParam && category) {
    const categoryFallbackBuilder = buildProductQuery(false);
    let fallbackQuery = categoryFallbackBuilder.query;

    if (categoryFallbackBuilder.targetCatIds && categoryFallbackBuilder.targetCatIds.length > 0) {
      const { data: catProds } = await supabase
        .from("product_categories")
        .select("product_id")
        .in("category_id", categoryFallbackBuilder.targetCatIds);
      const junctionIds = (catProds || []).map((p) => p.product_id);
      if (junctionIds.length > 0) {
        fallbackQuery = fallbackQuery.in("id", junctionIds);
      }
    }

    const { data: catFallbackProds } = await fallbackQuery;
    if (catFallbackProds && catFallbackProds.length > 0) {
      products = catFallbackProds;
      isFallbackApplied = true;
    }
  }

  // Dynamic Fallback 2: If everything is 0 (e.g. empty new category like makeup/mom-baby/jewellery),
  // fetch top authentic bestsellers to suggest below the empty note
  let fallbackPopularProducts: ProductCardData[] = [];
  if (!products || products.length === 0) {
    const { data: popProds } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        sku,
        regular_price,
        sale_price,
        og_image_url,
        country,
        shipping_class,
        brands (name),
        inventory (available)
      `)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6);

    if (popProds && popProds.length > 0) {
      fallbackPopularProducts = popProds.map(mapProductToCard);
    }
  }

  const productCardItems: ProductCardData[] = (products || [])
    .map(mapProductToCard)
    .filter((p) => {
      if (in_stock === "true" || in_stock === "1") {
        return p.is_in_stock;
      }
      return true;
    });

  const activeCategoryName = categories?.find((c) => c.slug === category)?.name || category;
  const activeBrandName = brands?.find((b) => b.slug === brand)?.name || brand;
  const activeTagName = tags?.find((t) => t.slug === (tag || tagsParam) || t.name === (tag || tagsParam))?.name || (tag || tagsParam);

  const activeTypeName = activeTypeParam
    ? TYPE_NAME_MAP[activeTypeParam]?.en || (activeTypeParam.charAt(0).toUpperCase() + activeTypeParam.slice(1))
    : null;

  return (
    <div className="container-main py-4 sm:py-6 space-y-5">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <Link href="/products" className="hover:text-text transition-colors">
          Catalog
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3 text-zinc-400" />
            <span className="text-text font-bold">{activeCategoryName}</span>
          </>
        )}
        {activeTypeName && (
          <>
            <ChevronRight className="h-3 w-3 text-zinc-400" />
            <span className="text-text font-bold">{activeTypeName}</span>
          </>
        )}
      </nav>

      {/* Header Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-text">
          {search
            ? `Search Results for "${search}"`
            : category && activeTypeName
            ? `${activeCategoryName}: ${activeTypeName}`
            : category
            ? `Category: ${activeCategoryName}`
            : brand
            ? `Brand: ${activeBrandName}`
            : activeTagName
            ? `Tag: #${activeTagName}`
            : skin_concern
            ? `Concern: ${skin_concern}`
            : discount === "true" || discount === "1"
            ? "Special Deals & Discounts"
            : "All Authentic Skincare & Cosmetics"}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Certified 100% genuine skincare &amp; cosmetics imported directly from authorized brands.
        </p>
      </div>

      {/* Main Listing Component */}
      <ProductsListingClient
        products={productCardItems}
        fallbackProducts={fallbackPopularProducts}
        isFallbackApplied={isFallbackApplied}
        categories={categories || []}
        brands={brands || []}
        tags={tags || []}
        currentCategory={category}
        currentType={activeTypeParam}
        currentSubcategory={subcategory}
        currentDiscount={discount === "true" || discount === "1"}
        currentBrand={brand}
        currentTag={tag || tagsParam}
        currentSort={sort}
        currentSearch={search}
        currentMinPrice={min_price}
        currentMaxPrice={max_price}
        currentSkinType={skin_type}
        currentSkinConcern={skin_concern}
        currentKeyActive={key_actives}
        currentOrigin={origin}
        currentInStock={in_stock === "true" || in_stock === "1"}
        enableBeautyFilters={featureSettings.enable_beauty_filters}
      />
    </div>
  );
}

