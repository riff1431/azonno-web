"use server";

import { createClient } from "@/lib/supabase/server";

export interface MatchedProduct {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  sale_price: number | null;
  image_url: string | null;
  brand_name: string | null;
  step_key: string;
  step_label: string;
  step_description: string;
  country: string | null;
  match_score?: number;
  match_reasons?: string[];
  alternatives?: MatchedProduct[];
}

export interface QuizInput {
  skinType: string;
  concerns: string[];
  categories?: string[];
  specifications?: string[];
  budgetRange?: string;
}

export interface QuizRoutineResult {
  routineTitle: string;
  routineSubtitle: string;
  skinType: string;
  concernsSummary: string;
  totalSteps: number;
  products: MatchedProduct[];
}

const STEP_DEFINITIONS: Record<
  string,
  { labelBn: string; labelEn: string; descBn: string; descEn: string; keywords: string[] }
> = {
  cleanser: {
    labelBn: "Step 1:  ",
    labelEn: "Step 1: Gentle Cleanser",
    descBn: "Cotton Clean   ,   Apparel   Cotton  ।",
    descEn: "Gently washes away impurities and excess sebum without stripping essential skin barrier moisture.",
    keywords: ["cleanser", "wash", "foam", "face wash", "gel cleanser", "micellar", "cleansing"],
  },
  toner: {
    labelBn: " 2: items  / ",
    labelEn: "Step 2: Hydrating Toner & Mist",
    descBn: "Cotton     and  Oxford Shirt   ।",
    descEn: "Preps and balances skin pH while delivering deep initial hydration for better serum absorption.",
    keywords: ["toner", "mist", "facial water", "skin refiner", "balancing water", "essence toner"],
  },
  serum: {
    labelBn: " 3:  items Oxford Shirt  ",
    labelEn: "Step 3: Nourishing Beauty Serum & Essence",
    descBn: "   for  Active items  Cotton  ।",
    descEn: "Potent botanical and nutrient-rich actives delivering deep nourishment for a smooth, radiant glow.",
    keywords: ["serum", "ampoule", "essence", "booster", "concentrate", "elixir", "treatment"],
  },
  moisturizer: {
    labelBn: " 4:    ",
    labelEn: "Step 4: Barrier Moisturizer",
    descBn: "Cotton         ।",
    descEn: "Locks in hydration and strengthens the natural protective lipid barrier for long-lasting comfort.",
    keywords: ["cream", "moisturizer", "moisturising", "gel cream", "water gel", "lotion", "emulsion", "barrier cream", "cica cream"],
  },
  sunscreen: {
    labelBn: " 5: Panjabi ( )",
    labelEn: "Step 5: Sunscreen (SPF Protection)",
    descBn: "    from Cotton       ।",
    descEn: "Essential daily broad-spectrum SPF to shield skin against UVA/UVB rays and keep skin youthful.",
    keywords: ["sun", "spf", "sunscreen", "sunblock", "uv", "sun relief", "water fit", "sun cream"],
  },
  eye_care: {
    labelBn: " 6:   (  )",
    labelEn: "Step 6: Revitalizing Eye Care",
    descBn: "          ।",
    descEn: "Nourishes the delicate eye contour to reduce the appearance of tiredness and puffiness.",
    keywords: ["eye", "under eye", "eye cream", "eye serum", "eye patch"],
  },
  lip_care: {
    labelBn: " 7: items  ",
    labelEn: "Step 7: Hydrating Lip Care",
    descBn: "       ।",
    descEn: "Restores soft, supple texture and deeply nourishes dry lips.",
    keywords: ["lip", "lip balm", "lip mask", "lip glow", "lip butter", "lip care"],
  },
  exfoliator: {
    labelBn: " 8:    ( 1-2 )",
    labelEn: "Step 8: Gentle Skin Refresher (1-2x Weekly)",
    descBn: "Cotton      Clean  Texture  ।",
    descEn: "Unclogs surface build-up and refreshes skin for a refined, luminous glow.",
    keywords: ["peeling", "scrub", "exfoliat", "bha", "aha", "glycolic", "salicylic 2%", "peel"],
  },
};

const CONCERN_KEYWORDS: Record<string, string[]> = {
  acne: ["salicylic", "niacinamide", "tea tree", "zinc", "spot", "clarif", "blemish", "acne", "centella", "cica", "heartleaf"],
  brightening: ["vitamin c", "niacinamide", "arbutin", "alpha arbutin", "brighten", "glow", "pigment", "dark spot", "glutathione", "radian", "dull", "even tone", "rice", "galactomyces", "tranexamic"],
  pigmentation: ["vitamin c", "niacinamide", "arbutin", "alpha arbutin", "dark spot", "pigment", "melasma", "discoloration", "tranexamic"],
  hydration: ["hyaluronic", "hydrat", "water", "moistur", "ceramide", "dry", "panthenol", "glycerin", "snail", "supple", "nourish"],
  pores: ["pore", "tighten", "sebum", "bha", "salicylic", "clay", "oil control", "matte", "blackhead"],
  aging: ["retinol", "collagen", "peptide", "firm", "elastic", "wrinkle", "anti-aging", "smooth", "revitalift", "bakuchiol"],
  soothing: ["cica", "centella", "calm", "sooth", "sensitive", "redness", "aloe", "panthenol", "kind to skin", "heartleaf", "comfort"],
  barrier: ["ceramide", "barrier", "panthenol", "snail mucin", "pro-vitamin", "lipid", "repair", "comfort"],
};

const CONCERN_FRIENDLY_LABELS: Record<string, string> = {
  acne: "Clarifying & Clear Look",
  brightening: "Radiant Glass Glow",
  pigmentation: "Even Skin Tone",
  hydration: "Deep Moisture Boost",
  pores: "Smooth Pore Refining",
  aging: "Youthful Elasticity",
  soothing: "Calming Skin Comfort",
  barrier: "Moisture Barrier Support",
};

const SKIN_TYPE_KEYWORDS: Record<string, string[]> = {
  oily: ["oily", "sebum", "matte", "oil control", "shine", "gel", "non-oily", "lightweight", "soap-free", "water-based"],
  dry: ["dry", "hydrat", "moistur", "nourish", "cream", "lotion", "hyaluronic", "rich", "ceramide", "intensive"],
  combo: ["combination", "balance", "hydrat", "lightweight", "gel", "all skin", "daily"],
  sensitive: ["sensitive", "gentle", "sooth", "calm", "cica", "kind to skin", "hypoallergenic", "soap-free", "fragrance-free", "mild"],
  normal: ["normal", "daily", "all skin", "gentle", "everyday", "healthy"],
};

const K_BEAUTY_BRANDS = [
  "cosrx",
  "beauty of joseon",
  "anua",
  "skin1004",
  "round lab",
  "laneige",
  "some by mi",
  "haruharu",
  "mixsoon",
  "axis-y",
  "torriden",
  "i'm from",
  "dr. jart",
  "innisfree",
  "etude",
  "purito",
  "isntree",
  "pyunkang yul",
  "tiam",
];

const UK_EUROPE_BRANDS = [
  "cerave",
  "the ordinary",
  "simple",
  "neutrogena",
  "inkey list",
  "la roche-posay",
  "cetaphil",
  "garnier",
  "bioderma",
  "l'oreal",
  "aveeno",
];

function scoreProduct(
  product: any,
  stepKey: string,
  skinType: string,
  concerns: string[],
  specifications: string[],
  budgetRange?: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const text = `${product.name} ${product.description || ""} ${product.short_description || ""} ${product.benefits || ""} ${product.ingredients_specifications || ""} ${(product.brands as any)?.name || ""}`.toLowerCase();
  const brandLower = ((product.brands as any)?.name || "").toLowerCase();
  const countryLower = (product.country || "").toLowerCase();

  // 1. Category step keyword match (+30 pts)
  const stepDef = STEP_DEFINITIONS[stepKey];
  if (stepDef) {
    const matchesStep = stepDef.keywords.some((k) => text.includes(k.toLowerCase()));
    if (matchesStep) {
      score += 30;
    }
  }

  // 2. Skin Type match (+20 pts)
  const skinKeywords = SKIN_TYPE_KEYWORDS[skinType] || [];
  const matchedSkinKw = skinKeywords.find((k) => text.includes(k.toLowerCase()));
  if (matchedSkinKw) {
    score += 20;
    reasons.push(`Tailored for ${skinType} skin`);
  }

  // 3. Concerns match (+15 pts per concern)
  concerns.forEach((concernKey) => {
    const kws = CONCERN_KEYWORDS[concernKey] || [];
    const matchedKw = kws.find((k) => text.includes(k.toLowerCase()));
    if (matchedKw) {
      score += 15;
      reasons.push(CONCERN_FRIENDLY_LABELS[concernKey] || `Targeted ${concernKey} care`);
    }
  });

  // 4. Specifications match (+15 pts each)
  specifications.forEach((spec) => {
    if (spec === "k_beauty") {
      if (countryLower.includes("korea") || K_BEAUTY_BRANDS.some((b) => brandLower.includes(b))) {
        score += 18;
        reasons.push("Authentic K-Beauty");
      }
    } else if (spec === "uk_eu") {
      if (countryLower.includes("uk") || countryLower.includes("united kingdom") || countryLower.includes("france") || countryLower.includes("germany") || UK_EUROPE_BRANDS.some((b) => brandLower.includes(b))) {
        score += 18;
        reasons.push("UK / EU Formulation");
      }
    } else if (spec === "fragrance_free") {
      if (text.includes("fragrance-free") || text.includes("unscented") || text.includes("sensitive") || text.includes("kind to skin")) {
        score += 15;
        reasons.push("Fragrance-Free / Mild");
      }
    } else if (spec === "vegan_cruelty_free") {
      if (text.includes("vegan") || text.includes("cruelty-free") || text.includes("clean")) {
        score += 15;
        reasons.push("Cruelty-Free / Clean");
      }
    }
  });

  // 5. Budget preference
  const price = product.sale_price || product.regular_price || 0;
  if (budgetRange === "budget") {
    if (price <= 1900) score += 10;
  } else if (budgetRange === "mid") {
    if (price >= 1500 && price <= 3500) score += 10;
  } else if (budgetRange === "luxury") {
    if (price >= 2500) score += 10;
  }

  return { score, reasons };
}

export async function getMatchedQuizRoutine(
  skinType: string,
  concern: string | string[],
  categories?: string[],
  specifications?: string[],
  budgetRange?: string
): Promise<QuizRoutineResult> {
  const concernsList = Array.isArray(concern) ? concern : [concern || "hydration"];
  const targetCategories =
    categories && categories.length > 0
      ? categories
      : ["cleanser", "serum", "moisturizer", "sunscreen"];
  const targetSpecs = specifications || [];

  try {
    const supabase = await createClient();

    const { data: allProducts, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        regular_price,
        sale_price,
        og_image_url,
        country,
        description,
        short_description,
        benefits,
        ingredients_specifications,
        brands (name)
      `)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(60);

    if (error || !allProducts || allProducts.length === 0) {
      return getFallbackRoutine(skinType, concernsList, targetCategories);
    }

    const matchedProducts: MatchedProduct[] = [];
    const usedProductIds = new Set<string>();

    for (const stepKey of targetCategories) {
      const stepDef = STEP_DEFINITIONS[stepKey];
      if (!stepDef) continue;

      // Filter products matching this category step
      const stepCandidates = allProducts
        .map((p) => {
          const { score, reasons } = scoreProduct(
            p,
            stepKey,
            skinType,
            concernsList,
            targetSpecs,
            budgetRange
          );
          return { product: p, score, reasons };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      // Pick top unused candidate
      const bestCandidate =
        stepCandidates.find((c) => !usedProductIds.has(c.product.id)) ||
        stepCandidates[0] ||
        null;

      if (bestCandidate) {
        usedProductIds.add(bestCandidate.product.id);

        // Find alternatives for this step
        const alternatives: MatchedProduct[] = stepCandidates
          .filter((c) => c.product.id !== bestCandidate.product.id)
          .slice(0, 2)
          .map((c) => ({
            id: c.product.id,
            name: c.product.name,
            slug: c.product.slug,
            regular_price: c.product.regular_price,
            sale_price: c.product.sale_price,
            image_url: c.product.og_image_url || null,
            brand_name: (c.product.brands as any)?.name || null,
            step_key: stepKey,
            step_label: stepDef.labelEn,
            step_description: stepDef.descEn,
            country: c.product.country || "Korea / UK",
            match_score: c.score,
            match_reasons: c.reasons,
          }));

        matchedProducts.push({
          id: bestCandidate.product.id,
          name: bestCandidate.product.name,
          slug: bestCandidate.product.slug,
          regular_price: bestCandidate.product.regular_price,
          sale_price: bestCandidate.product.sale_price,
          image_url: bestCandidate.product.og_image_url || null,
          brand_name: (bestCandidate.product.brands as any)?.name || null,
          step_key: stepKey,
          step_label: stepDef.labelEn,
          step_description: stepDef.descEn,
          country: bestCandidate.product.country || "Korea / UK",
          match_score: bestCandidate.score,
          match_reasons: bestCandidate.reasons,
          alternatives,
        });
      }
    }

    if (matchedProducts.length === 0) {
      return getFallbackRoutine(skinType, concernsList, targetCategories);
    }

    const concernsText = concernsList
      .map((c) => capitalize(c.replace(/_/g, " ")))
      .join(" & ");

    return {
      routineTitle: `${capitalize(skinType)} Skin — ${concernsText || "Daily"} Care Routine`,
      routineSubtitle: `Personalized ${matchedProducts.length}-step regimen customized for your skin profile, preferences, and daily goals.`,
      skinType: capitalize(skinType),
      concernsSummary: concernsText,
      totalSteps: matchedProducts.length,
      products: matchedProducts,
    };
  } catch (err) {
    console.error("[getMatchedQuizRoutine Error]:", err);
    return getFallbackRoutine(skinType, concernsList, targetCategories);
  }
}

function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFallbackRoutine(
  skinType: string,
  concerns: string[],
  categories: string[]
): QuizRoutineResult {
  const fallbackPool: Record<string, MatchedProduct> = {
    cleanser: {
      id: "prod-cerave-cleanser",
      name: "CeraVe Hydrating Facial Cleanser 236ml",
      slug: "cerave-hydrating-facial-cleanser-236ml",
      regular_price: 2100,
      sale_price: 1850,
      image_url: "/product_placeholder.svg",
      brand_name: "CeraVe",
      step_key: "cleanser",
      step_label: "Step 1: Gentle Cleanser",
      step_description: "Gently cleanses and hydrates skin with 3 essential ceramides without stripping the moisture barrier.",
      country: "United Kingdom",
    },
    toner: {
      id: "prod-anua-toner",
      name: "Anua Heartleaf 77% Soothing Toner 250ml",
      slug: "anua-heartleaf-77-soothing-toner-250ml",
      regular_price: 1950,
      sale_price: 1750,
      image_url: "/product_placeholder.svg",
      brand_name: "Anua",
      step_key: "toner",
      step_label: "Step 2: Hydrating Toner",
      step_description: "Deeply calms irritated skin, regulates oil-water balance, and prepares skin for deeper hydration.",
      country: "South Korea",
    },
    serum: {
      id: "prod-snail-96",
      name: "COSRX Advanced Snail 96 Mucin Power Essence 100ml",
      slug: "cosrx-advanced-snail-96-mucin-power-essence-100ml",
      regular_price: 1650,
      sale_price: 1450,
      image_url: "/product_placeholder.svg",
      brand_name: "COSRX",
      step_key: "serum",
      step_label: "Step 3: Core Essence & Serum",
      step_description: "Enriched with 96% snail secretion filtrate to repair skin texture and deliver radiant elasticity.",
      country: "South Korea",
    },
    moisturizer: {
      id: "prod-boj-red-bean",
      name: "Beauty of Joseon Red Bean Water Gel 100ml",
      slug: "beauty-of-joseon-red-bean-water-gel-100ml",
      regular_price: 1850,
      sale_price: 1600,
      image_url: "/product_placeholder.svg",
      brand_name: "Beauty of Joseon",
      step_key: "moisturizer",
      step_label: "Step 4: Barrier Moisturizer",
      step_description: "Lightweight, refreshing water gel moisturizer that hydrates without any sticky or greasy feeling.",
      country: "South Korea",
    },
    sunscreen: {
      id: "prod-boj-sunscreen",
      name: "Beauty of Joseon Relief Sun : Rice + Probiotics SPF50+ 50ml",
      slug: "beauty-of-joseon-relief-sun-rice-probiotics-spf50-50ml",
      regular_price: 1650,
      sale_price: 1450,
      image_url: "/product_placeholder.svg",
      brand_name: "Beauty of Joseon",
      step_key: "sunscreen",
      step_label: "Step 5: Sunscreen (SPF50+ PA++++)",
      step_description: "Organic chemical sunscreen that applies gently on skin with zero white cast and skin-calming ingredients.",
      country: "South Korea",
    },
  };

  const selectedList = categories
    .map((catKey) => fallbackPool[catKey])
    .filter(Boolean);

  return {
    routineTitle: `${capitalize(skinType)} Daily Personalized Routine`,
    routineSubtitle: `Tailored skincare steps matching your skin profile and preferences.`,
    skinType: capitalize(skinType),
    concernsSummary: concerns.join(", "),
    totalSteps: selectedList.length,
    products: selectedList,
  };
}
