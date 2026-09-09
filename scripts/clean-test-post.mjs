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

async function cleanBreakouts() {
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  const posts = blogStore?.value || [];

  for (let p of posts) {
    if (p.slug === "test-blog-post-for-ecommerce-website-blush-and-budget") {
      p.content = p.content
        .replace(/breakouts/gi, "excess shine")
        .replace(/breakout/gi, "blemish")
        .replace(/pimple/gi, "blemish");
    }
  }

  await supabase
    .from("store_settings")
    .upsert({ key: "blog_posts_store", value: posts }, { onConflict: "key" });

  console.log("✓ Successfully replaced breakouts with beauty/blemish terminology.");
}

cleanBreakouts().catch(console.error);
