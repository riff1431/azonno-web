import { notFound } from "next/navigation";
import { getBlogPosts, getBlogCategories } from "@/features/blog/actions";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl } from "@/lib/utils";
import { isModuleEnabled } from "@/lib/settings/config-service";
import { BlogListingClient } from "./blog-listing-client";

export const metadata = {
  title: "Beauty & Skincare Journal — Expert Advice & Guides | Blush & Budget",
  description:
    "Expert skincare advice, K-Beauty routine breakdowns, and active ingredient guides curated for Bangladeshi climate by Blush & Budget.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const enabled = await isModuleEnabled("blog");
  if (!enabled) {
    notFound();
  }

  const { category, tag } = await searchParams;
  const [posts, categories] = await Promise.all([
    getBlogPosts({ categorySlug: category, tag }),
    getBlogCategories(),
  ]);

  const baseUrl = getBaseUrl();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${baseUrl}` },
          { name: "Beauty Journal", url: `${baseUrl}/blog` },
        ]}
      />
      <BlogListingClient
        posts={posts as any}
        categories={categories as any}
        activeCategory={category}
      />
    </>
  );
}

