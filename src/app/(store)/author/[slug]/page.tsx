import { notFound } from "next/navigation";
import { getBlogAuthorBySlug, getBlogPosts } from "@/features/blog/actions";
import { PersonJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getBaseUrl } from "@/lib/utils";
import { AuthorProfileClient } from "./author-profile-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getBlogAuthorBySlug(slug);
  if (!author) return { title: "Author Not Found" };

  return {
    title: `${author.name} — ${author.job_title} | Azonno Beauty Journal`,
    description: author.bio,
    openGraph: {
      title: author.name,
      description: author.bio,
      images: author.avatar_url ? [author.avatar_url] : [],
    },
  };
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getBlogAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const authorUrl = `${baseUrl}/author/${author.slug}`;
  const authorPosts = await getBlogPosts({ authorSlug: author.slug });

  const breadcrumbs = [
    { name: "Home", url: baseUrl },
    { name: "Editorial Blog", url: `${baseUrl}/blog` },
    { name: author.name, url: authorUrl },
  ];

  const socialLinks = (author.social_links || {}) as Record<string, string | undefined>;

  return (
    <>
      {/* Schema.org JSON-LD Person E-E-A-T */}
      <PersonJsonLd
        name={author.name}
        jobTitle={author.job_title}
        bio={author.bio}
        image={author.avatar_url}
        url={authorUrl}
        socialLinks={Object.values(socialLinks).filter(Boolean) as string[]}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <AuthorProfileClient author={author} authorPosts={authorPosts} />
    </>
  );
}
