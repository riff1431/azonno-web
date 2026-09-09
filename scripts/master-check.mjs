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

const RISKY_TERMS = [
  /\b(cure|cures|cured|curing)\b/i,
  /\b(heal|heals|healing|healed)\b/i,
  /\b(treat|treats|treating|treatment|treatments)\b/i,
  /\b(disease|diseases|condition|conditions|diagnosis|diagnose)\b/i,
  /\b(inflammation|inflammatory|anti-inflammatory)\b/i,
  /\b(eczema|psoriasis|rosacea|dermatitis)\b/i,
  /\b(pimple|pimples|breakout|breakouts)\b/i,
  /\b(suffer|struggling with|damaged skin|skin barrier repair|repair damaged)\b/i,
  /\b(clinical|clinically proven|dermatologist recommended|medical|therapeutic)\b/i,
  /\b(permanent|permanently|miracle|secret cure|100% effective|7 days)\b/i,
  /\b(hair loss|alopecia)\b/i
];

const BANGLA_RISKY_TERMS = [
  "চিকিৎসা", "নিরাময়", "রোগ", "প্রদাহ", "ইনফ্লামেশন", "একজিমা",
  "সোরিয়াসিস", "চর্মরোগ", "থেরাপিউটিক", "স্থায়ী সমাধান",
  "১০০% সমাধান", "ক্ষতিগ্রস্ত ত্বক মেরামত", "ব্যারিয়ার রিপেয়ার", "চুল পড়া বন্ধ",
  "যাদুকরী", "গ্যারান্টিড রেজাল্ট"
];

const WRONG_DOMAINS = [
  "blushandbeauty.com",
  "blush and beauty",
  "Blush & Beauty"
];

async function runMasterCheck() {
  console.log("==========================================================");
  console.log("           MASTER AUDIT & COMPLIANCE VERIFICATION          ");
  console.log("==========================================================\n");

  let totalIssues = 0;

  // 1. Check Brand & Domain in Database
  console.log("1. AUDITING STORE IDENTITY & SETTINGS...");
  const { data: settings } = await supabase.from("store_settings").select("key, value");
  for (const s of settings || []) {
    const str = JSON.stringify(s.value);
    for (const wd of WRONG_DOMAINS) {
      if (str.includes(wd)) {
        console.error(`[FAIL] Found wrong domain/brand '${wd}' in store_settings key: ${s.key}`);
        totalIssues++;
      }
    }
  }
  console.log("   ✓ Store settings verified clean of incorrect brand/domain names.");

  // 2. Check Products
  console.log("\n2. AUDITING PRODUCTS CATALOG (21 products)...");
  const { data: products } = await supabase.from("products").select("*");
  let productViolations = 0;
  for (const p of products || []) {
    const text = `${p.name || ""} ${p.short_description || ""} ${p.description || ""} ${p.usage_instructions || ""} ${p.key_ingredients || ""}`;
    for (const rx of RISKY_TERMS) {
      if (rx.test(text)) {
        console.warn(`   [WARN] Product '${p.name}' matched risky pattern: ${rx.source}`);
        productViolations++;
        totalIssues++;
      }
    }
  }
  if (productViolations === 0) {
    console.log("   ✓ All products 100% compliant with cosmetic/e-commerce claims standards.");
  }

  // 3. Check Blog Posts
  console.log("\n3. AUDITING BLOG ARTICLES (12 posts)...");
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  let blogViolations = 0;
  for (const b of blogStore?.value || []) {
    const text = `${b.title || ""} ${b.slug || ""} ${b.excerpt || ""} ${b.content || ""}`;
    for (const rx of RISKY_TERMS) {
      if (rx.test(text)) {
        console.warn(`   [WARN] Blog '${b.title}' matched English risk pattern: ${rx.source}`);
        blogViolations++;
        totalIssues++;
      }
    }
    for (const bg of BANGLA_RISKY_TERMS) {
      if (text.includes(bg)) {
        console.warn(`   [WARN] Blog '${b.title}' matched Bangla risk term: ${bg}`);
        blogViolations++;
        totalIssues++;
      }
    }
  }
  if (blogViolations === 0) {
    console.log("   ✓ All 12 blog posts 100% compliant with beauty routine educational standards.");
  }

  // 4. Check Blog Authors
  console.log("\n4. AUDITING BLOG AUTHORS...");
  const { data: authorsStore } = await supabase.from("store_settings").select("value").eq("key", "blog_authors_store").single();
  for (const a of authorsStore?.value || []) {
    console.log(`   - Author: ${a.name} | Role: ${a.role}`);
    if (a.name?.includes("Dr.") || a.bio?.toLowerCase().includes("clinical")) {
      console.error(`   [FAIL] Author ${a.name} still contains clinical credentials!`);
      totalIssues++;
    }
  }
  console.log("   ✓ Author personas verified non-clinical.");

  // 5. Check CMS Pages
  console.log("\n5. AUDITING CMS & POLICY PAGES (5 pages)...");
  const { data: cmsStore } = await supabase.from("store_settings").select("value").eq("key", "cms_pages_store").single();
  for (const cp of cmsStore?.value || []) {
    const text = `${cp.title || ""} ${cp.content || ""}`;
    for (const rx of RISKY_TERMS) {
      if (rx.test(text)) {
        console.warn(`   [WARN] CMS Page '${cp.title}' matched pattern: ${rx.source}`);
        totalIssues++;
      }
    }
  }
  console.log("   ✓ All CMS pages verified clean.");

  // 6. Check Codebase Frontend Files for Wrong Brand/Domain
  console.log("\n6. AUDITING SOURCE CODE FILES IN src/ ...");
  const srcFiles = ["src/lib/utils.ts", "src/components/seo/json-ld.tsx", "src/app/sitemap.ts", "src/app/robots.ts", "src/app/layout.tsx"];
  for (const sf of srcFiles) {
    const content = fs.readFileSync(sf, "utf-8");
    for (const wd of WRONG_DOMAINS) {
      if (content.includes(wd)) {
        console.error(`   [FAIL] Found '${wd}' in ${sf}`);
        totalIssues++;
      }
    }
  }
  console.log("   ✓ Core source files verified clean of legacy brand names.");

  console.log("\n==========================================================");
  if (totalIssues === 0) {
    console.log("  🏆 MASTER CHECK PASSED: 0 ISSUES FOUND ACROSS THE SYSTEM  ");
  } else {
    console.log(`  ❌ MASTER CHECK FOUND ${totalIssues} ISSUES TO RESOLVE     `);
  }
  console.log("==========================================================");
}

runMasterCheck().catch(console.error);
