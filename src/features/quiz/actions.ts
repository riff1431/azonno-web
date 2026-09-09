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
  step_label: string;
  step_description: string;
  country: string | null;
}

const SKIN_CONCERN_KEYWORDS: Record<string, string[]> = {
  "Clear Skin & Blemishes": ["clarif", "blemish", "salicylic", "niacinamide", "tea tree", "zinc", "spot", "clean"],
  "Pore Clarifying Care": ["clarif", "blemish", "salicylic", "niacinamide", "tea tree", "zinc", "spot", "clean"],
  "Brightening & Even Tone": ["brighten", "glow", "pigment", "dark spot", "vitamin c", "niacinamide", "arbutin", "radian", "dull", "even tone", "glutathione", "gluta"],
  "Brightening & Radiance": ["brighten", "glow", "pigment", "dark spot", "vitamin c", "niacinamide", "arbutin", "radian", "dull", "even tone", "glutathione", "gluta"],
  "Smoothing & Firming Care": ["firm", "retinol", "collagen", "elastic", "plump", "hyaluronic", "revitalift", "snail", "smooth"],
  "Smooth Texture & Firmness": ["firm", "retinol", "collagen", "elastic", "plump", "hyaluronic", "revitalift", "snail", "smooth"],
  "Hydration & Moisture": ["hydrat", "dry", "moistur", "hyaluronic", "dehydrat", "nourish", "water", "supple", "ceramide", "lotion"],
  "Dryness & Hydration": ["hydrat", "dry", "moistur", "hyaluronic", "dehydrat", "nourish", "water", "supple", "ceramide", "lotion"],
  "Pore & Oil Care": ["pore", "tighten", "sebum", "bha", "clarif", "clean", "facial wash", "cleanser", "zinc"],
  "Pore Refining": ["pore", "tighten", "sebum", "bha", "clarif", "clean", "facial wash", "cleanser", "zinc"],
  "Calming & Soothing Care": ["calm", "sooth", "cica", "centella", "sensitive", "gentle", "comfort", "kind to skin"],
  "Sun Protection": ["sun", "spf", "uv", "sunscreen", "sunblock", "protect", "rice"],
  "Sun Protection (SPF)": ["sun", "spf", "uv", "sunscreen", "sunblock", "protect", "rice"],
  "Oil Control": ["oil", "matte", "shine", "sebum", "greas", "balance", "lightweight", "gel", "non-oily", "soap-free"],
  "Moisture Barrier & Nourishing Care": ["ceramide", "protect", "snail", "mucin", "pro-vitamin", "nourish", "comfort"],
};

const SKIN_TYPE_KEYWORDS: Record<string, string[]> = {
  Oily: ["oily", "sebum", "matte", "oil control", "shine", "gel", "non-oily", "lightweight", "soap-free"],
  Dry: ["dry", "hydrat", "moistur", "nourish", "cream", "lotion", "hyaluronic", "rich"],
  Combination: ["combination", "balance", "hydrat", "lightweight", "gel", "all skin"],
  Sensitive: ["sensitive", "gentle", "sooth", "calm", "cica", "kind to skin", "hypoallergenic", "soap-free", "fragrance-free"],
  Normal: ["normal", "daily", "all skin", "gentle", "everyday"],
  "All Skin Types": ["all skin", "gentle", "daily", "suitable for all", "kind to skin"],
};

function matchesConcern(product: any, concern: string): boolean {
  const text = `${product.name} ${product.description || ""} ${product.short_description || ""} ${product.benefits || ""} ${product.ingredients_specifications || ""}`.toLowerCase();
  const kws = SKIN_CONCERN_KEYWORDS[concern] || [concern.toLowerCase()];
  return kws.some((k) => text.includes(k.toLowerCase()));
}

export async function getMatchedQuizRoutine(
  skinType: string,
  concern: string
): Promise<{
  routineTitle: string;
  routineSubtitle: string;
  products: MatchedProduct[];
}> {
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
      .limit(30);

    if (error || !allProducts || allProducts.length === 0) {
      return getFallbackRoutine(skinType, concern);
    }

    // Step 1: Cleanser
    const cleanserCandidates = allProducts.filter((p) => {
      const text = `${p.name} ${p.short_description || ""} ${p.description || ""}`.toLowerCase();
      return (
        text.includes("cleanser") ||
        text.includes("wash") ||
        text.includes("foam") ||
        text.includes("gel cleanser")
      );
    });

    // Step 2: Serum / Essence
    const serumCandidates = allProducts.filter((p) => {
      const text = `${p.name} ${p.short_description || ""} ${p.description || ""}`.toLowerCase();
      return (
        text.includes("serum") ||
        text.includes("essence") ||
        text.includes("ampoule") ||
        text.includes("niacinamide") ||
        text.includes("snail") ||
        text.includes("hyaluronic")
      );
    });

    // Step 3: Moisturizer / Sunscreen
    const protectCandidates = allProducts.filter((p) => {
      const text = `${p.name} ${p.short_description || ""} ${p.description || ""}`.toLowerCase();
      return (
        text.includes("cream") ||
        text.includes("moisturi") ||
        text.includes("gel cream") ||
        text.includes("sun") ||
        text.includes("spf") ||
        text.includes("lotion")
      );
    });

    const chosenCleanser =
      cleanserCandidates.find((p) =>
        matchesConcern(p, concern)
      ) ||
      cleanserCandidates[0] ||
      allProducts[0];
    const chosenSerum =
      serumCandidates.find(
        (p) => p.id !== chosenCleanser.id && matchesConcern(p, concern)
      ) ||
      serumCandidates.find((p) => p.id !== chosenCleanser.id) ||
      allProducts.find((p) => p.id !== chosenCleanser.id) ||
      allProducts[0];
    const chosenProtect =
      protectCandidates.find(
        (p) => p.id !== chosenCleanser.id && p.id !== chosenSerum.id
      ) ||
      allProducts.find(
        (p) => p.id !== chosenCleanser.id && p.id !== chosenSerum.id
      );

    const matchedList: MatchedProduct[] = [];

    if (chosenCleanser) {
      matchedList.push({
        id: chosenCleanser.id,
        name: chosenCleanser.name,
        slug: chosenCleanser.slug,
        regular_price: chosenCleanser.regular_price,
        sale_price: chosenCleanser.sale_price,
        image_url: chosenCleanser.og_image_url || null,
        brand_name: (chosenCleanser.brands as any)?.name || null,
        step_label: "Step 1: Gentle Cleanser",
        step_description: "Gentle everyday cleanser that washes away dirt and excess oil while leaving skin soft and refreshed.",
        country: chosenCleanser.country || "Korea / UK",
      });
    }

    if (chosenSerum) {
      matchedList.push({
        id: chosenSerum.id,
        name: chosenSerum.name,
        slug: chosenSerum.slug,
        regular_price: chosenSerum.regular_price,
        sale_price: chosenSerum.sale_price,
        image_url: chosenSerum.og_image_url || null,
        brand_name: (chosenSerum.brands as any)?.name || null,
        step_label: "Step 2: Essence & Serum",
        step_description: `Lightweight formula that provides daily hydration and helps create a smooth, even-looking complexion.`,
        country: chosenSerum.country || "Korea / UK",
      });
    }

    if (chosenProtect) {
      matchedList.push({
        id: chosenProtect.id,
        name: chosenProtect.name,
        slug: chosenProtect.slug,
        regular_price: chosenProtect.regular_price,
        sale_price: chosenProtect.sale_price,
        image_url: chosenProtect.og_image_url || null,
        brand_name: (chosenProtect.brands as any)?.name || null,
        step_label: "Step 3: Moisturizer & Protection",
        step_description: "Lightweight, non-greasy moisturizer that locks in hydration for a soft, comfortable finish all day.",
        country: chosenProtect.country || "Korea / UK",
      });
    }

    return {
      routineTitle: `${capitalize(skinType)} Daily Beauty Routine`,
      routineSubtitle: `Simple, effective steps chosen to keep your skin feeling fresh, soft, and balanced throughout the day.`,
      products: matchedList,
    };
  } catch (err) {
    console.error("[getMatchedQuizRoutine Error]:", err);
    return getFallbackRoutine(skinType, concern);
  }
}

function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFallbackRoutine(skinType: string, concern: string) {
  return {
    routineTitle: `Personalized Daily Skincare Routine`,
    routineSubtitle: `A simple, gentle routine to keep skin soft, hydrated, and looking naturally fresh.`,
    products: [
      {
        id: "prod-cerave-cleanser",
        name: "CeraVe Hydrating Facial Cleanser 236ml",
        slug: "cerave-hydrating-facial-cleanser-236ml",
        regular_price: 2100,
        sale_price: 1850,
        image_url: "/product_placeholder.svg",
        brand_name: "CeraVe",
        step_label: "Step 1: Gentle Cleanser",
        step_description: "Gently cleanses and hydrates skin with essential ceramides for a fresh, comfortable feel.",
        country: "United Kingdom",
      },
      {
        id: "prod-snail-96",
        name: "COSRX Advanced Snail 96 Mucin Power Essence",
        slug: "cosrx-advanced-snail-96-mucin-power-essence",
        regular_price: 1500,
        sale_price: 1365,
        image_url: "/product_placeholder.svg",
        brand_name: "COSRX",
        step_label: "Step 2: Core Essence",
        step_description: "Lightweight essence with snail mucin that delivers deep hydration for a smooth, natural-looking glow.",
        country: "South Korea",
      },
    ],
  };
}
