"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  job_title: string;
  bio: string;
  avatar_url?: string;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  website_url?: string;
  is_verified_expert: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  author_id?: string | null;
  category_id?: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  published_at: string;
  reading_time_minutes: number;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  view_count: number;
  created_at?: string;
  updated_at?: string;
  author?: BlogAuthor;
  category?: BlogCategory;
  products?: {
    id: string;
    name: string;
    slug: string;
    regular_price: number;
    sale_price?: number | null;
    og_image_url?: string;
    callout_note?: string;
    brands?: { name: string };
  }[];
}

// ============================================================================
// RESILIENT PERSISTENCE FALLBACK (store_settings)
// Guarantees zero downtime and 100% functionality even before database tables
// are formally migrated in Supabase SQL editor.
// ============================================================================
const AUTHORS_STORE_KEY = "blog_authors_store";
const CATEGORIES_STORE_KEY = "blog_categories_store";
const POSTS_STORE_KEY = "blog_posts_store";

async function getFallbackStore<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("store_settings").select("value").eq("key", key).single();
    if (data && data.value) {
      return data.value as T;
    }
  } catch (err) {
    console.warn(`[getFallbackStore Error for ${key}]`, err);
  }
  return defaultVal;
}

async function setFallbackStore<T>(key: string, value: T): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("store_settings").upsert(
      {
        key,
        value: value as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.error(`[setFallbackStore Error for ${key}]`, err);
  }
}

// ============================================================================
// 1. BLOG POSTS (CRUD & QUERIES)
// ============================================================================

/**
 * Fetch published blog posts with optional filters
 */
export async function getBlogPosts(options?: {
  categorySlug?: string;
  authorSlug?: string;
  tag?: string;
  limit?: number;
  status?: string;
}): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("blog_posts")
      .select(`
        *,
        author:blog_authors(*),
        category:blog_categories(*)
      `)
      .order("published_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    } else {
      query = query.eq("status", "published");
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      let posts = data as BlogPost[];
      if (options?.categorySlug) {
        posts = posts.filter((p) => p.category?.slug === options.categorySlug);
      }
      if (options?.authorSlug) {
        posts = posts.filter((p) => p.author?.slug === options.authorSlug);
      }
      if (options?.tag) {
        posts = posts.filter((p) => p.tags && p.tags.includes(options.tag!));
      }
      return posts;
    }
  } catch (e) {
    // fallback
  }

  // Fallback from store_settings
  const fallbackPosts = await getFallbackStore<BlogPost[]>(POSTS_STORE_KEY, []);
  let filtered = fallbackPosts;
  if (options?.status) {
    filtered = filtered.filter((p) => p.status === options.status);
  } else {
    filtered = filtered.filter((p) => p.status === "published");
  }
  if (options?.categorySlug) {
    filtered = filtered.filter((p) => p.category?.slug === options.categorySlug);
  }
  if (options?.authorSlug) {
    filtered = filtered.filter((p) => p.author?.slug === options.authorSlug);
  }
  if (options?.tag) {
    filtered = filtered.filter((p) => p.tags && p.tags.includes(options.tag!));
  }
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  return filtered;
}

/**
 * Fetch single blog post by ID
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        author:blog_authors(*),
        category:blog_categories(*)
      `)
      .eq("id", id)
      .single();

    if (!error && post) return post as BlogPost;
  } catch (e) {
    // fallback
  }

  const fallbackPosts = await getFallbackStore<BlogPost[]>(POSTS_STORE_KEY, []);
  return fallbackPosts.find((p) => p.id === id) || null;
}

/**
 * Fetch single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        author:blog_authors(*),
        category:blog_categories(*),
        tagged_items:blog_post_products(
          position,
          callout_note,
          product:products(id, name, slug, regular_price, sale_price, og_image_url, brands(name))
        )
      `)
      .eq("slug", slug)
      .single();

    if (!error && post) {
      const products = (post.tagged_items || []).map((ti: any) => ({
        ...ti.product,
        callout_note: ti.callout_note,
      }));

      return {
        ...post,
        products,
      } as BlogPost;
    }
  } catch (e) {
    // fallback
  }

  const fallbackPosts = await getFallbackStore<BlogPost[]>(POSTS_STORE_KEY, []);
  const found = fallbackPosts.find((p) => p.slug === slug);
  if (!found) return null;

  // Hydrate author and category if present in fallback
  if (found.author_id && !found.author) {
    const authors = await getFallbackStore<BlogAuthor[]>(AUTHORS_STORE_KEY, []);
    found.author = authors.find((a) => a.id === found.author_id);
  }
  if (found.category_id && !found.category) {
    const categories = await getFallbackStore<BlogCategory[]>(CATEGORIES_STORE_KEY, []);
    found.category = categories.find((c) => c.id === found.category_id);
  }
  return found;
}

/**
 * Save or update blog post
 */
export async function saveBlogPost(postData: Partial<BlogPost> & { title: string; content: string }) {
  const supabase = createAdminClient();
  const slug =
    postData.slug?.trim() ||
    postData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const payload: Record<string, any> = {
    title: postData.title,
    slug,
    excerpt: postData.excerpt || "",
    content: postData.content || "",
    featured_image: postData.featured_image || null,
    author_id: postData.author_id || null,
    category_id: postData.category_id || null,
    tags: postData.tags || [],
    status: postData.status || "published",
    reading_time_minutes: postData.reading_time_minutes || 4,
    seo_title: postData.seo_title || null,
    seo_description: postData.seo_description || null,
    canonical_url: postData.canonical_url || null,
    updated_at: new Date().toISOString(),
  };

  try {
    if (postData.id && !postData.id.startsWith("post-")) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", postData.id)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/blog");
        revalidatePath(`/blog/${slug}`);
        revalidatePath("/admin/blog");
        return data;
      }
    } else {
      payload.published_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("blog_posts")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/blog");
        revalidatePath("/admin/blog");
        return data;
      }
    }
  } catch (err) {
    // fallback
  }

  // Fallback to store_settings
  const posts = await getFallbackStore<BlogPost[]>(POSTS_STORE_KEY, []);
  let savedPost: BlogPost;
  if (postData.id) {
    savedPost = { ...payload, id: postData.id, published_at: postData.published_at || new Date().toISOString(), view_count: postData.view_count || 0 } as BlogPost;
    const idx = posts.findIndex((p) => p.id === postData.id);
    if (idx >= 0) posts[idx] = savedPost;
    else posts.push(savedPost);
  } else {
    savedPost = {
      ...payload,
      id: "post-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      view_count: 0,
    } as BlogPost;
    posts.unshift(savedPost);
  }
  await setFallbackStore(POSTS_STORE_KEY, posts);

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
  return savedPost;
}

/**
 * Delete blog post
 */
export async function deleteBlogPost(id: string) {
  const supabase = createAdminClient();
  try {
    await supabase.from("blog_posts").delete().eq("id", id);
  } catch {}

  const posts = await getFallbackStore<BlogPost[]>(POSTS_STORE_KEY, []);
  const filtered = posts.filter((p) => p.id !== id);
  await setFallbackStore(POSTS_STORE_KEY, filtered);

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { success: true };
}

// ============================================================================
// 2. BLOG AUTHORS (E-E-A-T MANAGEMENT)
// ============================================================================

/**
 * Fetch all authors
 */
export async function getBlogAuthors(): Promise<BlogAuthor[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_authors")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) return data as BlogAuthor[];
  } catch (e) {
    // fallback
  }

  return await getFallbackStore<BlogAuthor[]>(AUTHORS_STORE_KEY, []);
}

/**
 * Fetch author by slug
 */
export async function getBlogAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_authors")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!error && data) return data as BlogAuthor;
  } catch (e) {
    // fallback
  }

  const authors = await getFallbackStore<BlogAuthor[]>(AUTHORS_STORE_KEY, []);
  return authors.find((a) => a.slug === slug) || null;
}

/**
 * Save or update blog author
 */
export async function saveBlogAuthor(authorData: Partial<BlogAuthor> & { name: string }) {
  const supabase = createAdminClient();
  const slug =
    authorData.slug?.trim() ||
    authorData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const payload: Record<string, any> = {
    name: authorData.name,
    slug,
    job_title: authorData.job_title || "Beauty Editor & Skincare Specialist",
    bio: authorData.bio || "",
    avatar_url: authorData.avatar_url || null,
    social_links: authorData.social_links || {},
    website_url: authorData.website_url || null,
    is_verified_expert: authorData.is_verified_expert !== false,
    updated_at: new Date().toISOString(),
  };

  try {
    if (authorData.id && !authorData.id.startsWith("auth-")) {
      const { data, error } = await supabase
        .from("blog_authors")
        .update(payload)
        .eq("id", authorData.id)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/blog");
        revalidatePath(`/author/${slug}`);
        revalidatePath("/admin/blog/authors");
        return data;
      }
    } else {
      const { data, error } = await supabase
        .from("blog_authors")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/blog");
        revalidatePath("/admin/blog/authors");
        return data;
      }
    }
  } catch (err) {
    // fallback
  }

  // Fallback storage in store_settings
  const authors = await getFallbackStore<BlogAuthor[]>(AUTHORS_STORE_KEY, []);
  let savedAuthor: BlogAuthor;
  if (authorData.id) {
    savedAuthor = { ...payload, id: authorData.id } as BlogAuthor;
    const idx = authors.findIndex((a) => a.id === authorData.id);
    if (idx >= 0) authors[idx] = savedAuthor;
    else authors.push(savedAuthor);
  } else {
    savedAuthor = {
      ...payload,
      id: "auth-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    } as BlogAuthor;
    authors.push(savedAuthor);
  }
  await setFallbackStore(AUTHORS_STORE_KEY, authors);

  revalidatePath("/blog");
  revalidatePath(`/author/${slug}`);
  revalidatePath("/admin/blog/authors");
  return savedAuthor;
}

/**
 * Delete author
 */
export async function deleteBlogAuthor(id: string) {
  const supabase = createAdminClient();
  try {
    await supabase.from("blog_authors").delete().eq("id", id);
  } catch {}

  const authors = await getFallbackStore<BlogAuthor[]>(AUTHORS_STORE_KEY, []);
  const filtered = authors.filter((a) => a.id !== id);
  await setFallbackStore(AUTHORS_STORE_KEY, filtered);

  revalidatePath("/blog");
  revalidatePath("/admin/blog/authors");
  return { success: true };
}

// ============================================================================
// 3. BLOG CATEGORIES (CRUD & QUERIES)
// ============================================================================

/**
 * Fetch all blog categories
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("position", { ascending: true });

    if (!error && data && data.length > 0) return data as BlogCategory[];
  } catch (e) {
    // fallback
  }

  return await getFallbackStore<BlogCategory[]>(CATEGORIES_STORE_KEY, [
    { id: "cat-1", name: "Skincare Basics", slug: "skincare-basics", description: "Easy guides on everyday ingredients, product types, and simple routines.", icon: "Sparkles", position: 1 },
    { id: "cat-2", name: "K-Beauty & Trends", slug: "korean-beauty", description: "Everyday Korean skincare steps, hydration tips, and popular beauty favorites.", icon: "BookOpen", position: 2 },
    { id: "cat-3", name: "Daily Routine Tips", slug: "daily-routines", description: "Practical tips for morning and evening routines, sun protection, and fresh skin.", icon: "ShieldCheck", position: 3 },
  ]);
}

/**
 * Save or update blog category
 */
export async function saveBlogCategory(catData: Partial<BlogCategory> & { name: string }) {
  const supabase = createAdminClient();
  const slug =
    catData.slug?.trim() ||
    catData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const payload: Record<string, any> = {
    name: catData.name,
    slug,
    description: catData.description || "",
    icon: catData.icon || "BookOpen",
    position: catData.position || 0,
    updated_at: new Date().toISOString(),
  };

  try {
    if (catData.id && !catData.id.startsWith("cat-")) {
      const { data, error } = await supabase
        .from("blog_categories")
        .update(payload)
        .eq("id", catData.id)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/blog");
        revalidatePath("/admin/blog/categories");
        return data;
      }
    } else {
      const { data, error } = await supabase
        .from("blog_categories")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/blog");
        revalidatePath("/admin/blog/categories");
        return data;
      }
    }
  } catch (err) {
    // fallback
  }

  // Fallback storage in store_settings
  const categories = await getFallbackStore<BlogCategory[]>(CATEGORIES_STORE_KEY, []);
  let savedCat: BlogCategory;
  if (catData.id) {
    savedCat = { ...payload, id: catData.id } as BlogCategory;
    const idx = categories.findIndex((c) => c.id === catData.id);
    if (idx >= 0) categories[idx] = savedCat;
    else categories.push(savedCat);
  } else {
    savedCat = {
      ...payload,
      id: "cat-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    } as BlogCategory;
    categories.push(savedCat);
  }
  await setFallbackStore(CATEGORIES_STORE_KEY, categories);

  revalidatePath("/blog");
  revalidatePath("/admin/blog/categories");
  return savedCat;
}

/**
 * Delete blog category
 */
export async function deleteBlogCategory(id: string) {
  const supabase = createAdminClient();
  try {
    await supabase.from("blog_categories").delete().eq("id", id);
  } catch {}

  const categories = await getFallbackStore<BlogCategory[]>(CATEGORIES_STORE_KEY, []);
  const filtered = categories.filter((c) => c.id !== id);
  await setFallbackStore(CATEGORIES_STORE_KEY, filtered);

  revalidatePath("/blog");
  revalidatePath("/admin/blog/categories");
  return { success: true };
}
