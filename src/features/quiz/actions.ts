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

    // Query active in-stock products from Supabase
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
        skin_types,
        skin_concerns,
        routine_step,
        brands (name)
      `)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(30);

    if (error || !allProducts || allProducts.length === 0) {
      return getFallbackRoutine(skinType, concern);
    }

    // Step 1: Find a cleanser / prep product
    const cleanserCandidates = allProducts.filter((p: any) => {
      const name = p.name.toLowerCase();
      const step = (p.routine_step || "").toLowerCase();
      return (
        name.includes("cleanser") ||
        name.includes("wash") ||
        name.includes("foam") ||
        step.includes("cleanse")
      );
    });

    // Step 2: Find treatment / active / essence product matching concern or skinType
    const treatmentCandidates = allProducts.filter((p: any) => {
      const name = p.name.toLowerCase();
      const concerns = Array.isArray(p.skin_concerns) ? p.skin_concerns : [];
      const types = Array.isArray(p.skin_types) ? p.skin_types : [];

      const concernMatch = concerns.some((c: string) =>
        c.toLowerCase().includes(concern.toLowerCase())
      );
      const typeMatch = types.some((t: string) =>
        t.toLowerCase().includes(skinType.toLowerCase())
      );

      return (
        concernMatch ||
        typeMatch ||
        name.includes("serum") ||
        name.includes("essence") ||
        name.includes("mucin") ||
        name.includes("treatment")
      );
    });

    // Step 3: Find sunscreen or moisturizer
    const protectCandidates = allProducts.filter((p: any) => {
      const name = p.name.toLowerCase();
      return (
        name.includes("sunscreen") ||
        name.includes("sun") ||
        name.includes("cream") ||
        name.includes("moisturizer") ||
        name.includes("gel")
      );
    });

    const chosenCleanser = cleanserCandidates[0] || allProducts[0];
    const chosenTreatment =
      treatmentCandidates.find((p) => p.id !== chosenCleanser.id) ||
      allProducts.find((p) => p.id !== chosenCleanser.id) ||
      allProducts[0];
    const chosenProtect =
      protectCandidates.find(
        (p) => p.id !== chosenCleanser.id && p.id !== chosenTreatment.id
      ) ||
      allProducts.find(
        (p) => p.id !== chosenCleanser.id && p.id !== chosenTreatment.id
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

    if (chosenTreatment) {
      matchedList.push({
        id: chosenTreatment.id,
        name: chosenTreatment.name,
        slug: chosenTreatment.slug,
        regular_price: chosenTreatment.regular_price,
        sale_price: chosenTreatment.sale_price,
        image_url: chosenTreatment.og_image_url || null,
        brand_name: (chosenTreatment.brands as any)?.name || null,
        step_label: "Step 2: Essence & Serum",
        step_description: `Lightweight formula that provides daily hydration and helps create a smooth, even-looking complexion.`,
        country: chosenTreatment.country || "Korea / UK",
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
