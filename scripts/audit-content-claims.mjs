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

const RISKY_PATTERNS = [
  /\b(cure|cures|cured|curing)\b/i,
  /\b(heal|heals|healing|healed)\b/i,
  /\b(treat|treats|treating|treatment|treatments)\b/i,
  /\b(disease|diseases|condition|conditions|diagnosis|diagnose)\b/i,
  /\b(inflammation|inflammatory|anti-inflammatory)\b/i,
  /\b(eczema|psoriasis|rosacea|dermatitis)\b/i,
  /\b(acne|pimple|pimples|breakout|breakouts|blemish)\b/i,
  /\b(suffer|struggling with|damaged skin|skin barrier repair|repair damaged)\b/i,
  /\b(clinical|clinically proven|doctor|dermatologist recommended|medical|therapeutic)\b/i,
  /\b(permanent|permanently|miracle|secret cure|100% effective)\b/i,
  /\b(hair loss|alopecia|wrinkles|anti-aging)\b/i
];

async function runAudit() {
  console.log("=== RUNNING FULL CONTENT AUDIT FOR BEAUTY POSITIONING COMPLIANCE ===");

  // 1. Audit Products
  const { data: products } = await supabase.from("products").select("id, title, description, short_description, usage_instructions, key_ingredients");
  console.log(`\n--- 1. AUDITING PRODUCTS (${products?.length || 0} total) ---`);
  let productRisks = 0;
  for (const p of products || []) {
    const text = `${p.title || ""} ${p.short_description || ""} ${p.description || ""} ${p.usage_instructions || ""} ${p.key_ingredients || ""}`;
    const matches = RISKY_PATTERNS.filter((r) => r.test(text)).map((r) => r.source);
    if (matches.length > 0) {
      productRisks++;
      console.log(`[RISK - Product] ID: ${p.id} | Title: "${p.title}" | Matched: ${matches.join(", ")}`);
    }
  }
  console.log(`Product audit completed: ${productRisks} products with risky medical/therapeutic/acne wording.`);

  // 2. Audit Blog Posts
  const { data: blogs } = await supabase.from("blog_posts").select("id, title, slug, excerpt, content, meta_description");
  console.log(`\n--- 2. AUDITING BLOG POSTS (${blogs?.length || 0} total) ---`);
  let blogRisks = 0;
  for (const b of blogs || []) {
    const text = `${b.title || ""} ${b.slug || ""} ${b.excerpt || ""} ${b.content || ""} ${b.meta_description || ""}`;
    const matches = RISKY_PATTERNS.filter((r) => r.test(text)).map((r) => r.source);
    if (matches.length > 0) {
      blogRisks++;
      console.log(`[RISK - Blog] ID: ${b.id} | Title: "${b.title}" | Slug: "${b.slug}" | Matched: ${matches.join(", ")}`);
    }
  }
  console.log(`Blog audit completed: ${blogRisks} blog posts with risky wording.`);

  // 3. Audit CMS Pages
  const { data: pages } = await supabase.from("pages").select("id, title, slug, content, meta_description");
  console.log(`\n--- 3. AUDITING CMS PAGES (${pages?.length || 0} total) ---`);
  let pageRisks = 0;
  for (const pg of pages || []) {
    const text = `${pg.title || ""} ${pg.slug || ""} ${pg.content || ""} ${pg.meta_description || ""}`;
    const matches = RISKY_PATTERNS.filter((r) => r.test(text)).map((r) => r.source);
    if (matches.length > 0) {
      pageRisks++;
      console.log(`[RISK - CMS Page] Slug: "${pg.slug}" | Title: "${pg.title}" | Matched: ${matches.join(", ")}`);
    }
  }

  // 4. Audit Categories & Brands
  const { data: categories } = await supabase.from("categories").select("id, name, description");
  for (const c of categories || []) {
    const text = `${c.name || ""} ${c.description || ""}`;
    const matches = RISKY_PATTERNS.filter((r) => r.test(text)).map((r) => r.source);
    if (matches.length > 0) {
      console.log(`[RISK - Category] "${c.name}" | Matched: ${matches.join(", ")}`);
    }
  }

  // 5. Audit Store Settings & SEO Defaults
  const { data: settings } = await supabase.from("store_settings").select("key, value");
  for (const s of settings || []) {
    const text = JSON.stringify(s.value);
    const matches = RISKY_PATTERNS.filter((r) => r.test(text)).map((r) => r.source);
    if (matches.length > 0) {
      console.log(`[RISK - Setting] Key: "${s.key}" | Matched: ${matches.join(", ")}`);
    }
  }
}

runAudit().catch(console.error);
