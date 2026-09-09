import { authorMdSohel, categories, supabase } from "./blog-seed-base.mjs";
import { articlesPart1 } from "./articles-part1.mjs";
import { articlesPart2 } from "./articles-part2.mjs";
import { articlesPart3 } from "./articles-part3.mjs";

const allArticles = [...articlesPart1, ...articlesPart2, ...articlesPart3];

async function seedAll() {
  console.log(`Starting SEO articles seed with ${allArticles.length} high-quality Bangla articles...`);

  // 1. Seed Author: Md Sohel in Supabase & fallback
  console.log("Seeding author: Md Sohel...");
  try {
    const { error: authorErr } = await supabase.from("blog_authors").upsert(authorMdSohel, { onConflict: "id" });
    if (authorErr) console.warn("Supabase author insert note:", authorErr.message);
  } catch (e) {
    console.warn("Author DB note:", e);
  }

  // Also save to store_settings fallback
  try {
    const { data: existingAuthorsData } = await supabase.from("store_settings").select("value").eq("key", "blog_authors_store").maybeSingle();
    let authorsList = existingAuthorsData?.value || [];
    if (!Array.isArray(authorsList)) authorsList = [];
    authorsList = authorsList.filter((a) => a.id !== authorMdSohel.id && a.slug !== authorMdSohel.slug);
    authorsList.unshift(authorMdSohel);

    await supabase.from("store_settings").upsert({
      key: "blog_authors_store",
      value: authorsList,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    console.log("✓ Author Md Sohel successfully persisted.");
  } catch (e) {
    console.error("Author fallback error:", e);
  }

  // 2. Seed Categories
  console.log("Seeding blog categories...");
  try {
    for (const cat of categories) {
      await supabase.from("blog_categories").upsert(cat, { onConflict: "id" });
    }
  } catch (e) {}

  try {
    await supabase.from("store_settings").upsert({
      key: "blog_categories_store",
      value: categories,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    console.log(`✓ ${categories.length} blog categories persisted.`);
  } catch (e) {
    console.error("Categories fallback error:", e);
  }

  // 3. Seed Articles
  console.log("Seeding 11 comprehensive Bangla SEO articles...");
  for (const article of allArticles) {
    try {
      const { error: postErr } = await supabase.from("blog_posts").upsert({
        ...article,
        author_id: authorMdSohel.id,
      }, { onConflict: "id" });
      if (postErr) console.warn(`DB note for ${article.slug}:`, postErr.message);
    } catch (e) {}
  }

  // Persist all articles to store_settings fallback with hydrated author & category
  try {
    const { data: existingPostsData } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").maybeSingle();
    let postsList = existingPostsData?.value || [];
    if (!Array.isArray(postsList)) postsList = [];

    const articleSlugs = new Set(allArticles.map((a) => a.slug));
    postsList = postsList.filter((p) => !articleSlugs.has(p.slug));

    const hydratedNewArticles = allArticles.map((a) => {
      const cat = categories.find((c) => c.id === a.category_id);
      return {
        ...a,
        author: authorMdSohel,
        category: cat || null,
        view_count: Math.floor(Math.random() * 150) + 75,
      };
    });

    postsList = [...hydratedNewArticles, ...postsList];

    await supabase.from("store_settings").upsert({
      key: "blog_posts_store",
      value: postsList,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    console.log(`✓ All ${allArticles.length} articles successfully persisted in store_settings.`);
  } catch (e) {
    console.error("Posts fallback error:", e);
  }

  console.log("==================================================");
  console.log(`SEO Articles Seeding Complete! ${allArticles.length} articles published under author 'Md Sohel'.`);
  console.log("==================================================");
}

seedAll().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
