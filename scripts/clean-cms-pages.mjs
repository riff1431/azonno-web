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

async function cleanCmsPages() {
  console.log("=== PHASE 3: AUDITING & UPDATING CMS PAGES & STORE SETTINGS ===");

  const { data: cmsStore } = await supabase.from("store_settings").select("value").eq("key", "cms_pages_store").single();
  let pages = cmsStore?.value || [];

  for (let p of pages) {
    if (p.content) {
      p.content = p.content
        .replace(/চিকিৎসা/g, "সৌন্দর্য চর্চা")
        .replace(/রোগ/g, "সমস্যা")
        .replace(/প্রদাহ/g, "অস্বস্তি")
        .replace(/ক্ষতিগ্রস্ত স্কিন ব্যারিয়ার/g, "শুষ্ক বা ক্লান্ত ত্বক")
        .replace(/dermatologist/gi, "beauty specialist")
        .replace(/medical/gi, "cosmetic")
        .replace(/clinical/gi, "quality-tested");
    }
  }

  const { error: pageErr } = await supabase
    .from("store_settings")
    .upsert({ key: "cms_pages_store", value: pages }, { onConflict: "key" });

  if (pageErr) {
    console.error("Error updating cms_pages_store:", pageErr);
  } else {
    console.log("✓ Successfully updated cms_pages_store.");
  }

  // Also update SQL pages table
  const { data: sqlPages } = await supabase.from("pages").select("*");
  for (const sp of sqlPages || []) {
    if (sp.content) {
      const cleaned = sp.content
        .replace(/চিকিৎসা/g, "সৌন্দর্য চর্চা")
        .replace(/রোগ/g, "সমস্যা")
        .replace(/প্রদাহ/g, "অস্বস্তি")
        .replace(/dermatologist/gi, "beauty specialist")
        .replace(/medical/gi, "cosmetic");
      await supabase.from("pages").update({ content: cleaned }).eq("id", sp.id);
    }
  }
  console.log("✓ Successfully checked SQL pages table.");

  console.log("=== PHASE 3 COMPLETE ===");
}

cleanCmsPages().catch(console.error);
