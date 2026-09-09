import { notFound } from "next/navigation";
import { getCMSPageBySlug } from "@/features/pages/actions";
import { RichArticleRenderer } from "@/components/blog/rich-article-renderer";
import { CmsPageClient } from "./cms-page-client";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCMSPageBySlug(slug);
  const baseUrl = getBaseUrl() || "https://blushbudget.com";
  if (!page) return { title: "Page Not Found" };

  const title = page.seo_title || `${page.title} — Blush & Budget`;
  const description = page.seo_description || page.title;
  const canonicalUrl = `${baseUrl}/page/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Blush & Budget",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCMSPageBySlug(slug);
  const baseUrl = getBaseUrl() || "https://blushbudget.com";

  if (!page) {
    notFound();
  }

  const lastUpdated = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString("bn-BD", {
        month: "long",
        year: "numeric",
      })
    : "সেপ্টেম্বর ২০২৬";

  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}` },
    { name: page.title, url: `${baseUrl}/page/${page.slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
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
    </>
  );
}

