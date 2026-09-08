import React from "react";

export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export interface ProductJsonLdProps {
  name: string;
  description?: string;
  images?: string[];
  sku?: string;
  brandName?: string;
  price: number;
  salePrice?: number | null;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  url: string;
  ratingValue?: number;
  reviewCount?: number;
  gtin?: string;
}

export function ProductJsonLd({
  name,
  description,
  images = [],
  sku,
  brandName,
  price,
  salePrice,
  currency = "BDT",
  availability = "InStock",
  url,
  ratingValue,
  reviewCount,
  gtin,
}: ProductJsonLdProps) {
  const currentPrice = salePrice ?? price;

  const data: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || name,
    image: images.length > 0 ? images : undefined,
    sku: sku || undefined,
    gtin13: gtin || undefined,
    url,
    brand: brandName
      ? {
          "@type": "Brand",
          name: brandName,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: currentPrice,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        availability === "InStock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Blush & Budget",
      },
    },
  };

  if (ratingValue && reviewCount && reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return <JsonLd data={data} />;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

export interface ArticleJsonLdProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
    jobTitle?: string;
    avatarUrl?: string;
  };
  publisherName?: string;
  publisherLogo?: string;
  url: string;
}

export function ArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  publisherName = "Blush & Budget",
  publisherLogo,
  url,
}: ArticleJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    image: image ? [image] : undefined,
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url,
      jobTitle: author.jobTitle || "Beauty & Skincare Specialist",
      image: author.avatarUrl,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      logo: publisherLogo
        ? {
            "@type": "ImageObject",
            url: publisherLogo,
          }
        : undefined,
    },
  };

  return <JsonLd data={data} />;
}

export interface PersonJsonLdProps {
  name: string;
  jobTitle?: string;
  bio?: string;
  url: string;
  image?: string;
  socialLinks?: string[];
  worksFor?: string;
}

export function PersonJsonLd({
  name,
  jobTitle,
  bio,
  url,
  image,
  socialLinks = [],
  worksFor = "Blush & Budget",
}: PersonJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: jobTitle || "Beauty Editor & Skincare Specialist",
    description: bio,
    url,
    image,
    sameAs: socialLinks.filter(Boolean),
    worksFor: {
      "@type": "Organization",
      name: worksFor,
    },
  };

  return <JsonLd data={data} />;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  if (!items || items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

export function OrganizationJsonLd({
  name = "Blush & Budget",
  url,
  logo,
  contactPhone = "+880 1700-000000",
  contactEmail = "support@example.com",
}: {
  name?: string;
  url: string;
  logo?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: contactPhone,
      contactType: "customer service",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"],
    },
  };

  return <JsonLd data={data} />;
}
