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

async function cleanExcerpt() {
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  const posts = blogStore?.value || [];
  const p = posts.find(x => x.slug === "dry-skin-deep-hydration-hyaluronic-acid-guide");
  if (p) {
    p.excerpt = "মুখ ধোয়ার পর ত্বক টানটান, খসখসে ও মলিন লাগে? জানুন হায়ালুরোনিক অ্যাসিডের সঠিক ব্যবহার, ডিপ ময়েশ্চারাইজিং টেকনিক এবং শুষ্ক ত্বককে কোমল ও প্লাম্পি রাখার প্র্যাকটিক্যাল গাইড।";
  }

  await supabase
    .from("store_settings")
    .upsert({ key: "blog_posts_store", value: posts }, { onConflict: "key" });

  console.log("✓ Successfully cleaned dry skin excerpt.");
}

cleanExcerpt().catch(console.error);
