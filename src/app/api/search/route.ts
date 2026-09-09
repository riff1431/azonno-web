import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BEAUTY_INGREDIENTS = [
  { name: "Niacinamide (Vitamin B3)", slug: "niacinamide", match: ["niacinamide", "vitamin b3", "b3"] },
  { name: "Salicylic Acid (BHA)", slug: "salicylic_acid", match: ["salicylic", "bha"] },
  { name: "Hyaluronic Acid", slug: "hyaluronic_acid", match: ["hyaluronic", "ha", "sodium hyaluronate"] },
  { name: "Centella Asiatica (Cica)", slug: "centella", match: ["centella", "cica", "madecassoside"] },
  { name: "Vitamin C (Brightening)", slug: "vitamin_c", match: ["vitamin c", "ascorbic", "ascorbyl"] },
  { name: "Retinol / Retinoids", slug: "retinol", match: ["retinol", "retinoid", "retinal"] },
  { name: "Snail Mucin", slug: "snail_mucin", match: ["snail", "mucin"] },
  { name: "AHA (Glycolic / Lactic Acid)", slug: "aha", match: ["aha", "glycolic", "lactic"] },
  { name: "Ceramides", slug: "ceramides", match: ["ceramide", "ceramides"] },
  { name: "Tea Tree", slug: "tea_tree", match: ["tea tree", "melaleuca"] },
  { name: "Alpha Arbutin", slug: "alpha_arbutin", match: ["arbutin", "alpha arbutin"] },
  { name: "Peptides", slug: "peptides", match: ["peptide", "peptides"] },
  { name: "Panax Ginseng", slug: "ginseng", match: ["ginseng", "panax"] },
  { name: "Heartleaf", slug: "heartleaf", match: ["heartleaf", "houttuynia"] },
  { name: "Propolis & Honey", slug: "propolis", match: ["propolis", "honey"] },
  { name: "Rice Extract", slug: "rice", match: ["rice"] },
  { name: "Azelaic Acid", slug: "azelaic_acid", match: ["azelaic"] },
];

const BEAUTY_CONCERNS = [
  { name: "Clear Skin & Blemish Care", slug: "acne", match: ["blemish", "acne", "pimple", "breakout", "oil", "clarif"] },
  { name: "Brightening & Even Tone", slug: "dark_spots", match: ["brighten", "dark spot", "even tone", "sun spot", "glow", "dull", "tone"] },
  { name: "Smoothing & Firming Care", slug: "anti_aging", match: ["smooth", "firming", "elasticity", "youthful", "lines", "plump"] },
  { name: "Hydration & Moisture", slug: "dry_skin", match: ["dry", "hydration", "dehydrat", "moisture", "water", "nourish"] },
  { name: "Pore Care & Oil Balance", slug: "oil_control", match: ["pore", "oil", "sebum", "blackhead", "whitehead", "matte"] },
  { name: "Barrier Care & Soothing", slug: "barrier_repair", match: ["barrier", "care", "sensitive", "soothing", "calming", "redness", "gentle"] },
  { name: "Sun Protection (SPF)", slug: "sun_protection", match: ["sun", "sunscreen", "spf", "uv", "sunblock", "protect"] },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() || "";
  const query = rawQuery.replace(/^#/, "").trim().toLowerCase();

  if (!query) {
    return NextResponse.json({
      products: [],
      categories: [],
      brands: [],
      ingredients: [],
      concerns: [],
    });
  }

  const supabase = await createClient();

  // Search Products (matching name or sku)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, sku, regular_price, sale_price, og_image_url, brands(name)")
    .eq("status", "active")
    .is("deleted_at", null)
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(6);

  // Search Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("status", "active")
    .ilike("name", `%${query}%`)
    .limit(4);

  // Search Brands
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("status", "active")
    .ilike("name", `%${query}%`)
    .limit(4);

  // Search Tags
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, slug")
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .limit(4);

  // Match Beauty Actives/Ingredients
  const matchedIngredients = BEAUTY_INGREDIENTS.filter((item) =>
    item.match.some((m) => m.includes(query) || query.includes(m))
  ).slice(0, 3);

  // Match Beauty Concerns
  const matchedConcerns = BEAUTY_CONCERNS.filter((item) =>
    item.match.some((m) => m.includes(query) || query.includes(m))
  ).slice(0, 3);

  return NextResponse.json({
    products: products || [],
    categories: categories || [],
    brands: brands || [],
    tags: tags || [],
    ingredients: matchedIngredients,
    concerns: matchedConcerns,
  });
}
