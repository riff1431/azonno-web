import { notFound } from "next/navigation";
import { getCMSPageBySlug, getCMSPages } from "@/features/pages/actions";
import { RichArticleRenderer } from "@/components/blog/rich-article-renderer";
import { CmsPageClient } from "./cms-page-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCMSPageBySlug(slug);
  if (!page) return { title: "Page Not Found" };

  return {
    title: page.seo_title || `${page.title} — Blush & Budget`,
    description: page.seo_description || page.title,
  };
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCMSPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const lastUpdated = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString("bn-BD", {
        month: "long",
        year: "numeric",
      })
    : "সেপ্টেম্বর ২০২৬";

  return (
    <CmsPageClient
      slug={page.slug}
      title={page.title}
      subtitle={page.seo_description || "অফিসিয়াল পলিসি ও তথ্য"}
      lastUpdated={lastUpdated}
    >
      <div className="space-y-6">
        <RichArticleRenderer content={page.content} />
      </div>
    </CmsPageClient>
  );
}
