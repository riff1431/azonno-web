import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  User,
  ChevronRight,
  Share2,
  Bookmark,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getBlogPostBySlug, getBlogPosts } from "@/features/blog/actions";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isModuleEnabled } from "@/lib/settings/config-service";
import { BlogPostClient } from "./blog-post-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article Not Found" };

  return {
    title: post.seo_title || `${post.title} | Blush & Budget Beauty Journal`,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
      type: "article",
      publishedTime: post.published_at,
      authors: post.author ? [post.author.name] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const enabled = await isModuleEnabled("blog");
  if (!enabled) {
    notFound();
  }

  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const authorUrl = post.author ? `${baseUrl}/author/${post.author.slug}` : undefined;

  const breadcrumbItems = [
    { name: "Home", url: `${baseUrl}` },
    { name: "Beauty Journal", url: `${baseUrl}/blog` },
  ];
  if (post.category) {
    breadcrumbItems.push({
      name: post.category.name,
      url: `${baseUrl}/blog?category=${post.category.slug}`,
    });
  }
  breadcrumbItems.push({
    name: post.title,
    url: postUrl,
  });

  const relatedPosts = (await getBlogPosts({ limit: 3 })).filter((p) => p.slug !== post.slug);

  // Load shoppable products (custom tagged or top active catalog items)
  let shoppableProducts = post.products || [];
  if (shoppableProducts.length === 0) {
    const supabase = await createClient();
    const { data: fallbackProducts } = await supabase
      .from("products")
      .select("id, name, slug, regular_price, sale_price, og_image_url, brands(name)")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(4);
    if (fallbackProducts) {
      shoppableProducts = fallbackProducts as any;
    }
  }

  return (
    <>
      {/* Schema.org Article & Breadcrumb Structured Data */}
      <ArticleJsonLd
        headline={post.title}
        description={post.excerpt}
        image={post.featured_image}
        datePublished={post.published_at}
        author={{
          name: post.author?.name || "Blush & Budget Editorial Team",
          url: authorUrl,
          jobTitle: post.author?.job_title,
          avatarUrl: post.author?.avatar_url,
        }}
        url={postUrl}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <BlogPostClient
        post={post}
        shoppableProducts={shoppableProducts}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
