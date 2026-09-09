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

async function inspectAllContent() {
  const tables = ["products", "categories", "brands", "pages", "coupons", "orders", "reviews"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(50);
    console.log(`Table '${t}': ${data?.length || 0} rows ${error ? `(Error: ${error.message})` : ""}`);
    if (data && data.length > 0 && t === "products") {
      console.log("Sample product titles:", data.map(p => p.name || p.title || p.slug));
    }
  }

  // Inspect blog posts in blog_posts_store
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  if (blogStore?.value) {
    console.log("\n=== 12 BLOG POSTS TITLES & SLUGS ===");
    for (const b of blogStore.value) {
      console.log(`- [${b.slug}] ${b.title}`);
    }
  }

  // Inspect CMS pages
  const { data: cmsStore } = await supabase.from("store_settings").select("value").eq("key", "cms_pages_store").single();
  if (cmsStore?.value) {
    console.log("\n=== CMS PAGES TITLES & SLUGS ===");
    for (const p of cmsStore.value) {
      console.log(`- [${p.slug}] ${p.title}`);
    }
  }

  // Inspect authors
  const { data: authorsStore } = await supabase.from("store_settings").select("value").eq("key", "blog_authors_store").single();
  if (authorsStore?.value) {
    console.log("\n=== BLOG AUTHORS ===");
    for (const a of authorsStore.value) {
      console.log(`- ${a.name} | Role: ${a.role} | Bio: ${a.bio}`);
    }
  }
}

inspectAllContent().catch(console.error);
