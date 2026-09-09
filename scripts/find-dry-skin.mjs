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

async function findDrySkin() {
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  const posts = blogStore?.value || [];
  const p = posts.find(x => x.slug === "dry-skin-deep-hydration-hyaluronic-acid-guide");
  if (p) {
    console.log("Title:", p.title);
    console.log("Excerpt:", p.excerpt);
    console.log("Meta Title:", p.meta_title);
    console.log("Meta Desc:", p.meta_description);
    if (p.excerpt?.includes("ব্যারিয়ার রিপেয়ার")) console.log("Found in excerpt!");
    if (p.title?.includes("ব্যারিয়ার রিপেয়ার")) console.log("Found in title!");
    if (p.content?.includes("ব্যারিয়ার রিপেয়ার")) console.log("Found in content!");
  }
}

findDrySkin().catch(console.error);
