import { notFound } from "next/navigation";
import { getCMSPageBySlug } from "@/features/pages/actions";
import { RichArticleRenderer } from "@/components/blog/rich-article-renderer";
import { CmsPageClient } from "./cms-page-client";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCMSPageBySlug(slug);
  const baseUrl = getBaseUrl();
  if (!page) return { title: "Page Not Found" };

  const title = page.seo_title || `${page.title} — Azonno`;
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
      siteName: "Azonno",
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
  const baseUrl = getBaseUrl();

  if (!page) {
    notFound();
  }

  const lastUpdated = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString("bn-BD", {
        month: "long",
        year: "numeric",
      })
    : " 2026";

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
        subtitle={page.seo_description || " Policy  "}
        lastUpdated={lastUpdated}
      >
        <div className="space-y-6">
          <RichArticleRenderer content={page.content} />
        </div>
      </CmsPageClient>
    </>
  );
}

