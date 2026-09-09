import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/utils";
import { getBlogPosts } from "@/features/blog/actions";
import { getCMSPages } from "@/features/pages/actions";

export const revalidate = 3600; // Cache and regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl() || "https://blushbudget.com";
  const supabase = createAdminClient();

  // 1. High-Value Indexable Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/quiz`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // 2. Fetch Products
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .or("status.eq.active,status.eq.published")
      .is("deleted_at", null);

    if (products && products.length > 0) {
      productUrls = products.map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: new Date(p.updated_at || Date.now()),
        changeFrequency: "daily",
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch products:", err);
  }

  // 3. Fetch Categories
  let categoryUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("status", "active");

    if (categories && categories.length > 0) {
      categoryUrls = categories.map((c) => ({
        url: `${baseUrl}/categories/${c.slug}`,
        lastModified: new Date(c.updated_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch categories:", err);
  }

  // 4. Fetch Brands
  let brandUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: brands } = await supabase
      .from("brands")
      .select("slug, updated_at")
      .eq("status", "active");

    if (brands && brands.length > 0) {
      brandUrls = brands.map((b) => ({
        url: `${baseUrl}/brands/${b.slug}`,
        lastModified: new Date(b.updated_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch brands:", err);
  }

  // 5. Fetch Blog Posts (Resilient helper with DB + store_settings fallback)
  let postUrls: MetadataRoute.Sitemap = [];
  try {
    const posts = await getBlogPosts({ limit: 100 });
    if (posts && posts.length > 0) {
      postUrls = posts.map((p) => ({
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at || p.published_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch blog posts:", err);
  }

  // 6. Fetch CMS Pages (Resilient helper with DB + store_settings fallback)
  let cmsUrls: MetadataRoute.Sitemap = [];
  try {
    const pages = await getCMSPages();
    if (pages && pages.length > 0) {
      cmsUrls = pages.map((p) => ({
        url: `${baseUrl}/page/${p.slug}`,
        lastModified: new Date(p.updated_at || Date.now()),
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch CMS pages:", err);
  }

  return [
    ...staticRoutes,
    ...productUrls,
    ...categoryUrls,
    ...brandUrls,
    ...postUrls,
    ...cmsUrls,
  ];
}

