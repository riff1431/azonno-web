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
  "cure", "heal", "treat", "treatment", "disease", "inflammation", "inflammatory",
  "eczema", "psoriasis", "rosacea", "dermatitis", "acne", "pimple", "breakout",
  "suffer", "damaged skin", "repair", "barrier repair", "clinical", "clinically",
  "doctor", "dermatologist", "medical", "therapeutic", "hair loss", "alopecia",
  "wrinkle", "anti-aging", "permanent", "miracle", "secret cure", "100%", "7 days"
];

async function deepAudit() {
  const findings = [];

  // 1. Audit Products
  const { data: products } = await supabase.from("products").select("*");
  for (const p of products || []) {
    const fields = {
      name: p.name || p.title,
      short_description: p.short_description,
      description: p.description,
      usage: p.usage_instructions,
      ingredients: p.key_ingredients,
    };
    for (const [field, val] of Object.entries(fields)) {
      if (!val) continue;
      const str = String(val);
      for (const term of RISKY_TERMS) {
        const regex = new RegExp(`\\b${term}\\b`, "i");
        if (regex.test(str)) {
          findings.push({
            type: "Product",
            id: p.id,
            slug: p.slug,
            field,
            term,
            snippet: str.slice(Math.max(0, str.toLowerCase().indexOf(term) - 40), Math.min(str.length, str.toLowerCase().indexOf(term) + 60))
          });
        }
      }
    }
  }

  // 2. Audit Blog Posts Store
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  for (const b of blogStore?.value || []) {
    const fields = { title: b.title, excerpt: b.excerpt, content: b.content, meta_description: b.meta_description };
    for (const [field, val] of Object.entries(fields)) {
      if (!val) continue;
      const str = String(val);
      for (const term of RISKY_TERMS) {
        const regex = new RegExp(`\\b${term}\\b`, "i");
        if (regex.test(str)) {
          findings.push({
            type: "Blog Post",
            id: b.id,
            slug: b.slug,
            field,
            term,
            snippet: str.slice(Math.max(0, str.toLowerCase().indexOf(term) - 40), Math.min(str.length, str.toLowerCase().indexOf(term) + 60))
          });
        }
      }
    }
  }

  // 3. Audit CMS Pages Store & pages table
  const { data: cmsStore } = await supabase.from("store_settings").select("value").eq("key", "cms_pages_store").single();
  for (const p of cmsStore?.value || []) {
    const fields = { title: p.title, content: p.content, meta_description: p.meta_description };
    for (const [field, val] of Object.entries(fields)) {
      if (!val) continue;
      const str = String(val);
      for (const term of RISKY_TERMS) {
        const regex = new RegExp(`\\b${term}\\b`, "i");
        if (regex.test(str)) {
          findings.push({
            type: "CMS Page",
            slug: p.slug,
            field,
            term,
            snippet: str.slice(Math.max(0, str.toLowerCase().indexOf(term) - 40), Math.min(str.length, str.toLowerCase().indexOf(term) + 60))
          });
        }
      }
    }
  }

  console.log(`Total Risky Findings Found: ${findings.length}`);
  fs.writeFileSync("scripts/audit-findings.json", JSON.stringify(findings, null, 2));
  console.log("Saved detailed audit findings to scripts/audit-findings.json");
}

deepAudit().catch(console.error);
