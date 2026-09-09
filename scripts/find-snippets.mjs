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

async function findSnippets() {
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  const posts = blogStore?.value || [];

  for (const post of posts) {
    if (post.slug === "dry-skin-deep-hydration-hyaluronic-acid-guide" || post.slug === "complete-hair-care-routine-silky-strong-hair-bangladesh") {
      console.log(`\n=== SLUG: ${post.slug} ===`);
      const terms = ["ব্যারিয়ার রিপেয়ার", "চুল পড়া বন্ধ", "চুল পড়া বন্ধ"];
      for (const t of terms) {
        if (post.content.includes(t)) {
          const idx = post.content.indexOf(t);
          console.log(`Term '${t}' at ${idx}: "...${post.content.slice(Math.max(0, idx - 40), Math.min(post.content.length, idx + 60))}..."`);
        }
      }
    }
  }
}

findSnippets().catch(console.error);
