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

const BANGLA_RISKY_TERMS = [
  "ব্রণ", "চিকিৎসা", "নিরাময়", "রোগ", "প্রদাহ", "ইনফ্লামেশন", "একজিমা",
  "সোরিয়াসিস", "চর্মরোগ", "ডাক্তার", "থেরাপিউটিক", "স্থায়ী সমাধান",
  "১০০% সমাধান", "ক্ষতিগ্রস্ত ত্বক মেরামত", "ব্যারিয়ার রিপেয়ার", "চুল পড়া বন্ধ",
  "যাদুকরী", "গ্যারান্টিড রেজাল্ট"
];

async function banglaAudit() {
  const findings = [];

  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  for (const b of blogStore?.value || []) {
    const text = `${b.title} ${b.excerpt} ${b.content}`;
    for (const term of BANGLA_RISKY_TERMS) {
      if (text.includes(term)) {
        findings.push({
          type: "Blog Post",
          slug: b.slug,
          term,
          count: (text.match(new RegExp(term, "g")) || []).length
        });
      }
    }
  }

  const { data: cmsStore } = await supabase.from("store_settings").select("value").eq("key", "cms_pages_store").single();
  for (const p of cmsStore?.value || []) {
    const text = `${p.title} ${p.content}`;
    for (const term of BANGLA_RISKY_TERMS) {
      if (text.includes(term)) {
        findings.push({
          type: "CMS Page",
          slug: p.slug,
          term,
          count: (text.match(new RegExp(term, "g")) || []).length
        });
      }
    }
  }

  console.log("=== BANGLA RISK FINDINGS ===");
  console.log(JSON.stringify(findings, null, 2));
}

banglaAudit().catch(console.error);
