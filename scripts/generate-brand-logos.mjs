import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const outDir = path.join(process.cwd(), "public", "images", "brands");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Brand SVG Definitions with high-precision typography and styling
const brandSvgs = {
  cosrx: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="38" font-weight="900" letter-spacing="4" fill="#111827" text-anchor="middle">COSRX</text>
  <line x1="85" y1="74" x2="215" y2="74" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
  <text x="150" y="88" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" letter-spacing="2.5" fill="#6b7280" text-anchor="middle">EXPECTING TOMORROW</text>
</svg>`,

  "the-ordinary": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="52" font-family="'Times New Roman', Times, 'Georgia', serif" font-size="34" font-weight="400" letter-spacing="0.5" fill="#111827" text-anchor="middle">The Ordinary.</text>
  <text x="150" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" letter-spacing="2" fill="#4b5563" text-anchor="middle">CLINICAL FORMULATIONS</text>
</svg>`,

  cerave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif" font-size="36" font-weight="900" letter-spacing="-0.5" text-anchor="middle">
    <tspan fill="#0284c7">Cera</tspan><tspan fill="#0d9488">Ve</tspan>
  </text>
  <text x="150" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" letter-spacing="1.5" fill="#64748b" text-anchor="middle">DEVELOPED WITH DERMATOLOGISTS</text>
</svg>`,

  "beauty-of-joseon": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <rect x="135" y="12" width="30" height="26" rx="4" fill="#fdf2f8" stroke="#be185d" stroke-width="1.5"/>
  <text x="150" y="30" font-family="'Batang', 'Apple SD Gothic Neo', serif" font-size="14" font-weight="bold" fill="#be185d" text-anchor="middle">朝鮮</text>
  <text x="150" y="64" font-family="'Times New Roman', 'Georgia', serif" font-size="21" font-weight="600" letter-spacing="2" fill="#1f2937" text-anchor="middle">BEAUTY OF JOSEON</text>
  <text x="150" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="8" font-weight="600" letter-spacing="3" fill="#9ca3af" text-anchor="middle">TRADITIONAL HANBANG</text>
</svg>`,

  cetaphil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <path d="M 60 50 C 60 28, 240 28, 240 50 C 240 72, 60 72, 60 50 Z" fill="#0284c7" opacity="0.08"/>
  <text x="150" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" letter-spacing="0.5" fill="#0369a1" text-anchor="middle">Cetaphil</text>
  <text x="150" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" letter-spacing="2" fill="#059669" text-anchor="middle">GENTLE DERMATOLOGICAL CARE</text>
</svg>`,

  neutrogena: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="32" font-weight="900" letter-spacing="1" fill="#111827" text-anchor="middle">Neutrogena</text>
  <text x="150" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="600" letter-spacing="2.5" fill="#6b7280" text-anchor="middle">DERMATOLOGIST RECOMMENDED</text>
</svg>`,

  simple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="145" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Rounded MT Bold', sans-serif" font-size="38" font-weight="900" letter-spacing="-0.5" fill="#15803d" text-anchor="middle">Simple</text>
  <circle cx="196" cy="38" r="4" fill="#84cc16"/>
  <text x="150" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" letter-spacing="2" fill="#4b5563" text-anchor="middle">KIND TO SKIN</text>
</svg>`,

  loreal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="50" font-family="'Times New Roman', Times, 'Georgia', serif" font-size="32" font-weight="900" letter-spacing="3" fill="#111827" text-anchor="middle">L'ORÉAL</text>
  <text x="150" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="5" fill="#ca8a04" text-anchor="middle">PARIS</text>
</svg>`,

  anua: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" font-size="42" font-weight="300" letter-spacing="6" fill="#166534" text-anchor="middle">anua</text>
  <text x="150" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" letter-spacing="3" fill="#6b7280" text-anchor="middle">HEARTLEAF K-BEAUTY</text>
</svg>`,

  skin1004: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="900" letter-spacing="3" fill="#1c1917" text-anchor="middle">SKIN1004</text>
  <text x="150" y="74" font-family="'Times New Roman', 'Georgia', serif" font-size="10" font-style="italic" font-weight="600" letter-spacing="2" fill="#d97706" text-anchor="middle">Madagascar Centella</text>
</svg>`,

  "purito-seoul": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="800" letter-spacing="3" fill="#15803d" text-anchor="middle">PURITO</text>
  <text x="150" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#374151" text-anchor="middle">SEOUL</text>
</svg>`,

  innisfree: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="56" font-family="'Times New Roman', 'Georgia', serif" font-size="32" font-weight="700" letter-spacing="2" fill="#14532d" text-anchor="middle">innisfree</text>
  <text x="150" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="600" letter-spacing="3" fill="#65a30d" text-anchor="middle">JEJU NATURAL BEAUTY</text>
</svg>`,

  laneige: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" font-size="34" font-weight="700" letter-spacing="4" fill="#0284c7" text-anchor="middle">LANEIGE</text>
  <text x="150" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="600" letter-spacing="3" fill="#94a3b8" text-anchor="middle">WATER SCIENCE</text>
</svg>`,

  "some-by-mi": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" font-size="30" font-weight="900" letter-spacing="2" fill="#0f766e" text-anchor="middle">SOME BY MI</text>
  <text x="150" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" letter-spacing="2.5" fill="#e11d48" text-anchor="middle">30 DAYS MIRACLE</text>
</svg>`,

  "round-lab": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <circle cx="95" cy="50" r="16" fill="none" stroke="#2563eb" stroke-width="3"/>
  <text x="180" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" letter-spacing="1.5" fill="#1e3a8a" text-anchor="middle">ROUND LAB</text>
</svg>`,

  torriden: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="800" letter-spacing="3" fill="#0369a1" text-anchor="middle">Torriden</text>
  <text x="150" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="600" letter-spacing="3" fill="#38bdf8" text-anchor="middle">DIVE-IN HYALURONIC</text>
</svg>`,

  "axis-y": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" letter-spacing="4" fill="#047857" text-anchor="middle">AXIS - Y</text>
  <text x="150" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="600" letter-spacing="2" fill="#6ee7b7" text-anchor="middle">CLIMATE INSPIRED SKINCARE</text>
</svg>`,

  "haruharu-wonder": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="50" font-family="'Times New Roman', 'Georgia', serif" font-size="28" font-weight="700" letter-spacing="2" fill="#111827" text-anchor="middle">haruharu</text>
  <text x="150" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" letter-spacing="4" fill="#78350f" text-anchor="middle">WONDER</text>
</svg>`,

  meril: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Rounded MT Bold', sans-serif" font-size="38" font-weight="900" letter-spacing="1" fill="#be185d" text-anchor="middle">Meril</text>
  <text x="150" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" letter-spacing="2" fill="#9d174d" text-anchor="middle">SQUARE TOILETRIES</text>
</svg>`,

  lux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="60" font-family="'Times New Roman', Times, 'Georgia', serif" font-size="44" font-weight="900" letter-spacing="6" fill="#b45309" text-anchor="middle">LUX</text>
  <text x="150" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" letter-spacing="3" fill="#d97706" text-anchor="middle">FINE FRAGRANCE</text>
</svg>`,

  ponds: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif" font-size="34" font-weight="900" letter-spacing="2" fill="#e11d48" text-anchor="middle">POND'S</text>
  <text x="150" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" letter-spacing="2.5" fill="#4b5563" text-anchor="middle">SKIN INSTITUTE</text>
</svg>`,

  "naturale-zero": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" height="100%">
  <rect width="300" height="100" fill="#ffffff" rx="12"/>
  <text x="150" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" letter-spacing="1" fill="#065f46" text-anchor="middle">Naturale Zero</text>
  <text x="150" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" letter-spacing="2.5" fill="#10b981" text-anchor="middle">HERBAL ORGANIC CARE</text>
</svg>`,
};

// Write SVG files
for (const [slug, svg] of Object.entries(brandSvgs)) {
  const filePath = path.join(outDir, `${slug}.svg`);
  fs.writeFileSync(filePath, svg.trim(), "utf-8");
  console.log(`✓ Saved logo: /images/brands/${slug}.svg`);
}

// Update Supabase Database
async function syncDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not found, skipped DB sync.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Additional Popular Brands to Ensure in DB
  const popularBrandsToAdd = [
    {
      name: "Neutrogena",
      slug: "neutrogena",
      description: "Dermatologist recommended skincare, Sunscreens and Hydro Boost essentials.",
      logo_url: "/images/brands/neutrogena.svg",
      status: "active",
    },
    {
      name: "Innisfree",
      slug: "innisfree",
      description: "Natural beauty skincare powered by pure organic green tea and volcanic clusters from Jeju Island.",
      logo_url: "/images/brands/innisfree.svg",
      status: "active",
    },
    {
      name: "LANEIGE",
      slug: "laneige",
      description: "South Korean luxury hydration skincare, lip sleeping masks, and water sleeping packs.",
      logo_url: "/images/brands/laneige.svg",
      status: "active",
    },
    {
      name: "SOME BY MI",
      slug: "some-by-mi",
      description: "Clinically proven AHA BHA PHA 30-day miracle toners and serums from South Korea.",
      logo_url: "/images/brands/some-by-mi.svg",
      status: "active",
    },
    {
      name: "ROUND LAB",
      slug: "round-lab",
      description: "Award-winning Korean Dokdo cleansers, birch juice moisturizing sunscreens, and mineral toners.",
      logo_url: "/images/brands/round-lab.svg",
      status: "active",
    },
    {
      name: "Torriden",
      slug: "torriden",
      description: "Top-ranked Korean low molecular hyaluronic acid hydrating serums and soothing creams.",
      logo_url: "/images/brands/torriden.svg",
      status: "active",
    },
    {
      name: "AXIS - Y",
      slug: "axis-y",
      description: "Climate-inspired customized skincare, famous for Dark Spot Correcting Glow Serum.",
      logo_url: "/images/brands/axis-y.svg",
      status: "active",
    },
    {
      name: "Haruharu Wonder",
      slug: "haruharu-wonder",
      description: "Fermented 100% Korean black rice anti-aging toners, cleansing oils, and mineral sunscreens.",
      logo_url: "/images/brands/haruharu-wonder.svg",
      status: "active",
    },
  ];

  // 1. Update Existing Brands with logo_url
  const { data: existingBrands } = await supabase.from("brands").select("id, name, slug");
  if (existingBrands) {
    for (const b of existingBrands) {
      const brandLogo = brandSvgs[b.slug] ? `/images/brands/${b.slug}.svg` : null;
      if (brandLogo) {
        await supabase
          .from("brands")
          .update({ logo_url: brandLogo })
          .eq("id", b.id);
        console.log(`✓ Updated DB brand ${b.name} (${b.slug}) -> ${brandLogo}`);
      }
    }
  }

  // 2. Insert any missing top brands
  for (const b of popularBrandsToAdd) {
    const { data: found } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", b.slug)
      .maybeSingle();

    if (!found) {
      const { error } = await supabase.from("brands").insert(b);
      if (error) {
        console.error(`Failed to insert brand ${b.name}:`, error.message);
      } else {
        console.log(`✓ Added new brand to DB: ${b.name} (${b.slug})`);
      }
    }
  }

  console.log("🌟 Successfully synced all brand logos to database!");
}

syncDatabase().catch(console.error);
