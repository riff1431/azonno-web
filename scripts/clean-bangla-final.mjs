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

async function cleanBanglaFinal() {
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  const posts = blogStore?.value || [];

  for (let post of posts) {
    if (post.slug === "complete-hair-care-routine-silky-strong-hair-bangladesh") {
      post.content = post.content
        .replace(/চুল পড়া বন্ধ/g, "চুল সিল্কি ও উজ্জ্বল")
        .replace(/চুল পড়া বন্ধ/g, "চুল সিল্কি ও উজ্জ্বল")
        .replace(/চুল পড়া/g, "চুলের রুক্ষতা")
        .replace(/চুল পড়া/g, "চুলের রুক্ষতা");
    }
    if (post.slug === "dry-skin-deep-hydration-hyaluronic-acid-guide") {
      post.content = post.content
        .replace(/ব্যারিয়ার রিপেয়ার/g, "ডিপ ময়েশ্চারাইজিং কেয়ার")
        .replace(/স্কিন ব্যারিয়ার/g, "ত্বকের আর্দ্রতা");
    }
  }

  await supabase
    .from("store_settings")
    .upsert({ key: "blog_posts_store", value: posts }, { onConflict: "key" });

  console.log("✓ Final Bangla clean applied.");
}

cleanBanglaFinal().catch(console.error);
