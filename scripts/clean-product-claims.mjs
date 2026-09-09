import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanProducts() {
  console.log("=== PHASE 1: CLEANING PRODUCT CLAIMS & NAMES IN SUPABASE ===");

  const { data: products, error } = await supabase.from("products").select("*");
  if (error || !products) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Found ${products.length} products to audit.`);

  const updates = [
    {
      slug: "cosrx-advanced-snail-96-mucin-power-essence-100ml",
      description: "Formulated with 96% snail secretion filtrate to deeply hydrate, enhance natural skin radiance, and leave skin feeling soft, smooth, and refreshed without heaviness.",
      short_description: "Lightweight hydrating essence enriched with 96% snail mucin for a supple, dewy glow."
    },
    {
      slug: "cetaphil-gentle-skin-cleanser-125ml",
      short_description: "Gentle, soap-free daily facial cleanser formulated to respect the skin's natural moisture, leaving it feeling clean, soft, and comfortable.",
      description: "A gentle, non-foaming daily facial wash that effectively cleanses while maintaining essential moisture. Designed for everyday comfort and a fresh, clean finish."
    },
    {
      slug: "naturale-zero-anti-dandruff-herbal-shampoo-200ml",
      name: "Naturale Zero Clarifying Herbal Scalp Shampoo (200ml)",
      short_description: "Formulated with clarifying Tea Tree and Neem botanical extracts to gently cleanse, refresh the scalp, and leave hair feeling soft and light.",
      description: "An invigorating daily herbal shampoo enriched with natural Tea Tree and Neem extracts. Gently removes product buildup, refreshes the scalp, and promotes silky, manageable hair."
    },
    {
      slug: "ponds-hydra-miracle-super-light-gel-100g",
      name: "Pond's Hydra Light Moisturizing Water Gel (100g)",
      short_description: "Non-greasy hydrating water gel with Hyaluronic Acid & Vitamin E for a fresh, dewy finish.",
      description: "Pond's Hydra Light Moisturizing Water Gel absorbs instantly to infuse thirsty skin with lightweight hydration. Powered by Hyaluronic Acid and Vitamin E, it leaves your complexion looking plump, radiant, and smooth without any sticky residue."
    },
    {
      slug: "ponds-miracle-me-brightening-serum-30ml",
      name: "Pond's Spot-Clarity Radiance Serum (30ml)",
      short_description: "Fast-absorbing radiance serum with Vitamin C and Niacinamide for an even-toned, luminous glow.",
      description: "Pond's Spot-Clarity Radiance Serum combines high-potency Vitamin C and Niacinamide in a lightweight, silky texture. Designed for daily use to enhance natural brightness and promote an even-toned, glowing appearance."
    }
  ];

  for (const item of updates) {
    const matched = products.find((p) => p.slug === item.slug);
    if (matched) {
      const updateData = {};
      if (item.name) updateData.name = item.name;
      if (item.short_description) updateData.short_description = item.short_description;
      if (item.description) updateData.description = item.description;

      const { error: updateError } = await supabase.from("products").update(updateData).eq("id", matched.id);
      if (updateError) {
        console.error(`Failed to update ${item.slug}:`, updateError.message);
      } else {
        console.log(`✓ Successfully updated product: ${item.slug}`);
      }
    }
  }

  console.log("=== PHASE 1 COMPLETE ===");
}

cleanProducts().catch(console.error);
